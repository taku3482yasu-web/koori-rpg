// データの テスト: なかま 20 体・絵・道具・地図
import test from 'node:test';
import assert from 'node:assert/strict';
import { NAKAMA, NAKAMA_IDS, BOSSES, ROLES, ELEMENTS } from '../src/data/nakama.js';
import { ITEMS } from '../src/data/items.js';
import { LEGACY_ART } from '../src/art/legacy-art.js';
import { NEW_ART } from '../src/art/new-art.js';
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
