// データの テスト: なかま 20 体・絵・道具・地図
import test from 'node:test';
import assert from 'node:assert/strict';
import { NAKAMA, NAKAMA_IDS, BOSSES, ROLES, ELEMENTS } from '../src/data/nakama.js';
import { ITEMS } from '../src/data/items.js';
import { LEGACY_ART } from '../src/art/legacy-art.js';
import { NEW_ART } from '../src/art/new-art.js';
import { BACK_ART } from '../src/art/back-art.js';
import { TILES, MAP_W, MAP_H, SPOTS, ROAMS, BUILDINGS } from '../src/data/map.js';

const ART = { ...LEGACY_ART, ...NEW_ART };

test('1 章の なかまは 20 体 (ダンジョンから 15 体・新キャラ 5 体)・全員 E ランク', () => {
    assert.equal(NAKAMA_IDS.length, 20);
    assert.equal(NAKAMA_IDS.filter(id => NAKAMA[id].from === '新').length, 5);
    for (const id of NAKAMA_IDS) {
        const n = NAKAMA[id];
        assert.equal(n.rank, 'E', id);
        assert.ok(ROLES[n.role], `${id} の 役割`);
        assert.ok(ELEMENTS.includes(n.element), `${id} の 属性`);
        assert.ok(ITEMS[n.favorite], `${id} の 好物`);
        assert.ok(n.special && n.special.effects.length, `${id} の 必殺技`);
        assert.ok(n.desc && n.title && n.line, `${id} の 説明`);
    }
    assert.deepEqual(NAKAMA_IDS.map(id => NAKAMA[id].no), Array.from({ length: 20 }, (_, i) => i + 1));
});

test('なかま・ボス・人の 絵が そろっていて、行の 長さが 正しい', () => {
    const needed = [...NAKAMA_IDS.map(id => NAKAMA[id].art), ...Object.values(BOSSES).map(b => b.art), 'koori', 'furukawa', 'tomoishi'];
    for (const key of needed) {
        const a = ART[key];
        assert.ok(a, `${key} の 絵`);
        for (const frame of a.frames) {
            assert.equal(frame.length, a.h, `${key} の 高さ`);
            for (const row of frame) {
                assert.equal(row.length, a.w, `${key} の 幅: ${row}`);
                for (const ch of row) assert.ok(ch === '.' || a.palette[ch], `${key} の 色 ${ch}`);
            }
        }
    }
});

test('地図: 大きさ・レンズの 場所は 通れる マス・建物の 入り口は 建物の 下の 列', () => {
    assert.equal(TILES.length, MAP_H);
    TILES.forEach(row => assert.equal(row.length, MAP_W));
    for (const s of SPOTS) {
        assert.ok(!['T', 'W'].includes(TILES[s.y][s.x]), `${s.id} は 通れる マス`);
        for (const k of s.kinds) assert.ok(NAKAMA[k.id], `${s.id} の ${k.id}`);
    }
    for (const b of BUILDINGS) assert.equal(b.door.y, b.y + b.h - 1, `${b.id} の 入り口`);
});

test('20 体 全員が どこかに 出る。見えている キャラが 大多数・かくれている キャラは 少し', () => {
    const hidden = new Set(SPOTS.flatMap(s => s.kinds.map(k => k.id)));
    const roam = new Set(ROAMS.flatMap(s => s.kinds.map(k => k.id)));
    for (const id of NAKAMA_IDS) assert.ok(hidden.has(id) || roam.has(id), `${id} の 出る場所`);
    assert.ok(roam.size > hidden.size, `見えている ${roam.size} 種類・かくれている ${hidden.size} 種類`);
    for (const s of SPOTS) assert.ok(s.cue, `${s.id} の 違和感`);
});

test('歩きまわる 場所には 通れる マスが ある', () => {
    for (const r of ROAMS) {
        let free = 0;
        for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) if (!['T', 'W'].includes(TILES[y][x])) free++;
        assert.ok(free >= 4, `${r.id}: ${free} マス`);
        for (const k of r.kinds) assert.ok(NAKAMA[k.id], `${r.id} の ${k.id}`);
    }
});

test('20 体 全員に うしろ姿の 絵が あり、前向きと 同じ 大きさ・色の 文字が 正しい', () => {
    for (const id of NAKAMA_IDS) {
        const back = BACK_ART[NAKAMA[id].art], front = ART[NAKAMA[id].art];
        assert.ok(back, `${id} の うしろ姿`);
        assert.equal(back.w, front.w, `${id} の 幅`);
        assert.equal(back.frames.length, 2);
        for (const frame of back.frames) {
            assert.equal(frame.length, back.h, `${id} の 高さ`);
            for (const r of frame) {
                assert.equal(r.length, back.w, `${id} の 行: ${r}`);
                for (const ch of r) assert.ok(ch === '.' || back.palette[ch], `${id} の 色 ${ch}`);
            }
        }
        assert.notDeepEqual(back.frames[0], front.frames[0], `${id} は 前向きと ちがう`);
    }
});

test('20 体 全員に 必殺技の コマンドと 動きが あり、コマンドは 4 種類 全部 使う', async () => {
    const { SPECIALS, MOTION_TIME, COMMAND_NAMES } = await import('../src/view/special-fx.js');
    const commands = new Set();
    for (const id of NAKAMA_IDS) {
        const sp = SPECIALS[id];
        assert.ok(sp, `${id} の 必殺技`);
        assert.ok(COMMAND_NAMES[sp.command], `${id} の コマンド ${sp.command}`);
        assert.ok(MOTION_TIME[sp.motion], `${id} の 動き ${sp.motion}`);
        commands.add(sp.command);
    }
    assert.deepEqual([...commands].sort(), ['mash', 'reel', 'spin', 'trace']);
});

test('必殺技の コマンド: 目押しは こおりが そろうと 大成功・れんだは 押した 数で 決まる', async () => {
    const { createCommand } = await import('../src/view/special-fx.js');
    const { createRng } = await import('../src/core/rng.js');
    const idle = { pressed: {}, held: {}, touch: {} };
    // れんだ: 16 回 押すと 大成功
    const m = createCommand('mash', createRng(1));
    for (let i = 0; i < 16; i++) m.update(0.1, { ...idle, pressed: { a: true } });
    m.update(2, idle);
    assert.equal(m.done.mult, 1.5);
    // 目押し: こおりの すぐ 前で 止めると すべって そろう
    const r = createCommand('reel', createRng(1));
    r.reels.forEach(x => { x.speed = 0; x.pos = 5.6; });
    for (let i = 0; i < 3; i++) r.update(0.01, { ...idle, pressed: { a: true } });
    assert.equal(r.done.mult, 1.5);
    // ぐるぐる: ボタンで 上→右→下→左 を 4 回 で 大成功
    const s = createCommand('spin', createRng(1));
    for (let i = 0; i < 4; i++) for (const d of ['up', 'right', 'down', 'left']) s.update(0.01, { ...idle, pressed: { [d]: true } });
    s.update(3, idle);
    assert.equal(s.done.mult, 1.5);
});
