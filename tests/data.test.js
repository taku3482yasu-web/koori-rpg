// データの テスト: なかま (石の川 20 体・商店街 20 体)・わざと 術・絵・道具・地図
import test from 'node:test';
import { RECIPES } from '../src/data/fusion.js';
import assert from 'node:assert/strict';
import { NAKAMA, NAKAMA_IDS, BOSSES, ROLES, ELEMENTS, HERO, JUTSU, HEAL_JUTSU, DRAIN_JUTSU, JUTSU_TYPE, idsInArea } from '../src/data/nakama.js';
import { ITEMS } from '../src/data/items.js';
import { LEGACY_ART } from '../src/art/legacy-art.js';
import { NEW_ART } from '../src/art/new-art.js';
import { BACK_ART } from '../src/art/back-art.js';
import { TILES, MAP_W, MAP_H, SPOTS, ROAMS, BUILDINGS, GATES, TOWN_H, FRIENDS, MYSTERIES, SCHOOL_Y0, SCHOOL_IN, SCHOOL_OUT,
    SEALS, YAMA_Y0, YAMA_IN, YAMA_OUT, YAMA_AFTER_BOSS, BLOCK, regionOf, UMI_Y0, UMI_IN, STATION_OUT, UMI_AFTER_BOSS, PEOPLE,
    TERA_Y0, TERA_IN, TERA_AFTER_BOSS, MONS, BUILDINGS as ALL_BUILDINGS } from '../src/data/map.js';

const ART = { ...LEGACY_ART, ...NEW_ART };

const TOWN = idsInArea('ishinokawa'), SHOP = idsInArea('shoutengai');

test('1 章の なかまは 20 体 (ダンジョンから 15 体・新キャラ 5 体)・全員 E ランク', () => {
    assert.equal(TOWN.length, 20);
    assert.equal(TOWN.filter(id => NAKAMA[id].from === '新').length, 5);
    for (const id of TOWN) assert.equal(NAKAMA[id].rank, 'E', id);
    for (const id of NAKAMA_IDS) {
        const n = NAKAMA[id];
        assert.ok(ROLES[n.role], `${id} の 役割`);
        assert.ok(ELEMENTS.includes(n.element), `${id} の 属性`);
        assert.ok(ITEMS[n.favorite], `${id} の 好物`);
        assert.ok(n.special && n.special.effects.length, `${id} の 必殺技`);
        assert.ok(n.desc && n.title && n.line, `${id} の 説明`);
    }
    assert.deepEqual(NAKAMA_IDS.map(id => NAKAMA[id].no), Array.from({ length: NAKAMA_IDS.length }, (_, i) => i + 1));
});

test('商店街の なかまは 20 体 (ダンジョンから)・ランクは E 8・D 10・C 2 (設計書 4.5)', () => {
    assert.equal(SHOP.length, 20);
    const count = r => SHOP.filter(id => NAKAMA[id].rank === r).length;
    assert.deepEqual([count('E'), count('D'), count('C')], [8, 10, 2]);
    // ランクが 高いほど 能力の 合計も 高い (同じ 役割で くらべる)
    const sum = id => Object.values(NAKAMA[id].base).reduce((a, b) => a + b, 0);
    assert.ok(sum('pachinkodaman') > sum('haribaby') && sum('yataiman') > sum('pachinkodaman'));
});

test('バトルの コマンド: 全員に わざ (キャラごと) と 術 (属性ごと。強いほど 名前が 変わる) が ある', () => {
    for (const id of [...NAKAMA_IDS, ...Object.keys(BOSSES)]) {
        const n = NAKAMA[id] || BOSSES[id];
        assert.ok(n.waza && n.waza.name && n.waza.effects.length, `${id} の わざ`);
        const names = JUTSU_TYPE[id] === 'heal' ? HEAL_JUTSU : JUTSU_TYPE[id] === 'drain' ? DRAIN_JUTSU : JUTSU[n.element];
        assert.ok(names.includes(n.jutsu.name), `${id} の 術 ${n.jutsu.name}`);
    }
    // わざは キャラごとに ちがう
    assert.equal(new Set(NAKAMA_IDS.map(id => NAKAMA[id].waza.name)).size, NAKAMA_IDS.length);
    // 術の だんは ランクで 決まる: E・D は 下級・C は 中級 (みずなら 水流の術・ほのおの 中級は 業火の術)
    assert.equal(NAKAMA.kogame.jutsu.name, '水流の術');
    for (const id of NAKAMA_IDS) assert.equal(NAKAMA[id].jutsu.tier, ['E', 'D'].includes(NAKAMA[id].rank) ? 0 : 1, id);
    assert.equal(NAKAMA.yataiman.jutsu.name, '業火の術');
    assert.equal(NAKAMA.gachapon.jutsu.name, '大回復の術');
    assert.ok(HERO.waza && HERO.jutsu && HERO.special);
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

test('地図: 商店街は 石の川タウンの 南。さかいめは 木の 列で、道 (工事中の さく) と 川だけ', () => {
    const row = TILES[TOWN_H - 1];
    const open = [...row].map((c, x) => (['T', 'W'].includes(c) ? null : x)).filter(x => x !== null);
    assert.deepEqual(open, GATES.filter(q => q.y === TOWN_H - 1).flatMap(q => Array.from({ length: q.w }, (_, i) => q.x + i)));
    for (const id of SHOP) assert.ok([...SPOTS, ...ROAMS].some(s => (s.y ?? s.y0) >= TOWN_H && s.kinds.some(k => k.id === id)), `${id} は 商店街に 出る`);
});

test('地図: 小学校の 中は 町と つながって いない。七不思議の 物は ゆかの 上、入り口と マットは 通れる (2 章)', () => {
    assert.ok([...TILES[SCHOOL_Y0 - 1]].every(c => c === 'T'), '町の いちばん 下は 木');
    assert.ok([...TILES[SCHOOL_Y0]].every(c => c === 'X'), '学校の いちばん 上は かべ');
    for (const m of MYSTERIES) {
        assert.ok(['L', 'Y'].includes(TILES[m.y][m.x]), `${m.id} は ゆかの 上`);
        assert.ok(NAKAMA[m.nakama] && NAKAMA[m.nakama].area === 'school', `${m.id} の 正体`);
    }
    assert.equal(TILES[SCHOOL_IN.y][Math.floor(SCHOOL_IN.x)], 'L');
    assert.ok(TILES.join('').includes('M'), 'げた箱の マット');
    assert.ok(SCHOOL_OUT.y < SCHOOL_Y0);
});

test('地図: 山と ダムは 町・学校と つながって いない。封印は 通れる マスの 上、入り口と 出口は 山道 (3 章)', () => {
    assert.ok([...TILES[YAMA_Y0 - 1]].every(c => c === 'X'), '学校の いちばん 下は かべ');
    assert.ok([...TILES[YAMA_Y0]].every(c => c === 'T'), '山の いちばん 上は 木');
    assert.deepEqual(regionOf(YAMA_IN.y), [YAMA_Y0, UMI_Y0]);
    assert.deepEqual(regionOf(YAMA_OUT.y), [0, SCHOOL_Y0]);
    assert.equal(TILES[YAMA_IN.y][Math.floor(YAMA_IN.x)], 'R');
    assert.equal(TILES[YAMA_OUT.y][Math.floor(YAMA_OUT.x)], 'G');
    assert.equal(TILES[YAMA_AFTER_BOSS.y][Math.floor(YAMA_AFTER_BOSS.x)], 'R');
    assert.equal(TILES[0].slice(26, 28), 'UU', '町の 北の はしの 山道');
    for (const m of SEALS) {
        assert.ok(!BLOCK.has(TILES[m.y][m.x]) && TILES[m.y][m.x] !== 'W', `${m.id} は 通れる マスの 上`);
        assert.ok(NAKAMA[m.nakama] && NAKAMA[m.nakama].area === 'yama', `${m.id} を まもる キャラ`);
    }
});

test('地図: 海辺の 町と 海岸どうくつは ほかと つながって いない。駅の 前と ボスの あとの 場所は 通れる (4 章)', () => {
    assert.ok([...TILES[UMI_Y0 - 1]].every(c => c === 'T'), '山の いちばん 下は 木');
    assert.ok([...TILES[UMI_Y0]].every(c => c === 'T'), '海の いちばん 上は 木');
    assert.deepEqual(regionOf(UMI_IN.y), [UMI_Y0, TERA_Y0]);
    assert.deepEqual(regionOf(STATION_OUT.y), [0, SCHOOL_Y0]);
    assert.equal(TILES[UMI_IN.y][UMI_IN.x], 'R');
    assert.equal(TILES[STATION_OUT.y][STATION_OUT.x], 'G');
    assert.equal(TILES[UMI_AFTER_BOSS.y][UMI_AFTER_BOSS.x], 'R');
    for (const id of ['rival4', 'urashima4']) {
        const p = PEOPLE.find(q => q.id === id);
        assert.equal(TILES[p.y][p.x], 'C', `${id} は どうくつの ゆか`);
        assert.equal(TILES[p.y + (p.h || 1)][p.x], 'C', `${id} の 前に 立てる`);
    }
    // ライバルの いる 通路は 1 マスの はば (よこを すりぬけられない)
    const rival = PEOPLE.find(q => q.id === 'rival4');
    assert.ok(BLOCK.has(TILES[rival.y][rival.x - 1]) && BLOCK.has(TILES[rival.y][rival.x + 1]));
    const umi = idsInArea('umi');
    assert.equal(umi.length, 9);
    const count = r => umi.filter(id => NAKAMA[id].rank === r).length;
    assert.deepEqual([count('D'), count('C')], [5, 4]);
});

test('ライバル探検隊: バージョンごとの 3 人に 絵と わざと 術が ある (4 章)', async () => {
    const { RIVALS, RIVAL_TEAMS } = await import('../src/data/nakama.js');
    for (const team of Object.values(RIVAL_TEAMS)) {
        assert.equal(team.members.length, 3);
        assert.ok(team.members.includes(team.leader));
        assert.ok(RIVALS[team.leader].bigMove, 'リーダーは 予告つきの 必殺技');
        for (const id of team.members) {
            const r = RIVALS[id];
            assert.ok(ART[r.art], `${id} の 絵`);
            assert.ok(r.waza.effects.length && r.jutsu && r.special, id);
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

test('全員が どこかに 出る。見えている キャラが 大多数・かくれている キャラは 少し', () => {
    const hidden = new Set([...SPOTS.flatMap(s => s.kinds.map(k => k.id)), ...MYSTERIES.map(m => m.nakama), ...SEALS.map(m => m.nakama), ...MONS.map(m => m.nakama)]);
    const roam = new Set(ROAMS.flatMap(s => s.kinds.map(k => k.id)));
    // 進化で なる キャラ (evo) は 町には 出ない。進化前の キャラが どこかに 出る
    //   2 回 進化する キャラ (ハリーベビー → ハリジェネラル → キングハリー) は いちばん もとの キャラを 見る
    const root = id => (NAKAMA[id].evo ? root(NAKAMA[id].evo) : id);
    //   合体でしか 会えない キャラ (fuse) は 合体の館の レシピで できる
    const fused = new Set(RECIPES.map(r => r.to).filter(c => c.startsWith('n:')).map(c => c.slice(2)));
    for (const id of NAKAMA_IDS) assert.ok(NAKAMA[id].fuse ? fused.has(id) : hidden.has(root(id)) || roam.has(root(id)), `${id} の 出る場所`);
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

test('全員に うしろ姿の 絵が あり、前向きと 同じ 大きさ・色の 文字が 正しい', () => {
    for (const id of NAKAMA_IDS) {
        const front = ART[NAKAMA[id].art];
        const back = BACK_ART[NAKAMA[id].art];
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

test('全員 (こおりくんも) に 必殺技の 動きが あり、コマンドは 4 種類 (毎回 ランダム)', async () => {
    const { SPECIALS, MOTION_TIME, COMMANDS, COMMAND_NAMES } = await import('../src/view/special-fx.js');
    for (const id of [...NAKAMA_IDS, 'koori']) {
        assert.ok(SPECIALS[id], `${id} の 必殺技`);
        assert.ok(MOTION_TIME[SPECIALS[id].motion], `${id} の 動き`);
    }
    assert.deepEqual([...COMMANDS].sort(), ['mash', 'reel', 'spin', 'trace']);
    for (const c of COMMANDS) assert.ok(COMMAND_NAMES[c]);
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

test('回復の術・吸収の術: 合いそうな キャラに ついている', () => {
    for (const [id, type] of Object.entries(JUTSU_TYPE)) {
        assert.ok(NAKAMA[id], id);
        const fx = NAKAMA[id].jutsu.effects[0];
        if (type === 'heal') assert.equal(fx.kind, 'heal', id);
        else assert.ok(fx.kind === 'attack' && fx.drain > 0, id);
    }
    assert.ok(Object.values(JUTSU_TYPE).filter(t => t === 'heal').length >= 4);
    assert.ok(Object.values(JUTSU_TYPE).filter(t => t === 'drain').length >= 4);
});

test('話せる キャラ: 歩く はんいに 通れる マスが あり、くれる 道具が ある', () => {
    for (const f of FRIENDS) {
        assert.ok(NAKAMA[f.kind], f.id);
        assert.ok(f.lines.length, f.id);
        if (f.gift) assert.ok(ITEMS[f.gift.item], f.id);
        let free = 0;
        for (let y = f.y0; y <= f.y1; y++) for (let x = f.x0; x <= f.x1; x++) if (!['T', 'W'].includes(TILES[y][x])) free++;
        assert.ok(free >= 4, `${f.id}: ${free}`);
    }
});

test('地図: ネット寺は ほかと つながって いない。紋の なかまは 通れる マスの 上・3 体とも ネット寺の キャラ (5 章)', () => {
    assert.ok([...TILES[TERA_Y0 - 1]].every(c => ['T', 'W'].includes(c)), '海の いちばん 下は 海');
    assert.ok([...TILES[TERA_Y0]].every(c => c === 'T'), 'お寺の いちばん 上は 木');
    assert.deepEqual(regionOf(TERA_IN.y), [TERA_Y0, TERA_Y0 + 36]);
    assert.equal(TILES[TERA_IN.y][TERA_IN.x], 'K');
    assert.equal(TILES[TERA_AFTER_BOSS.y][TERA_AFTER_BOSS.x], 'K');
    for (const m of MONS) {
        assert.ok(!BLOCK.has(TILES[m.y][m.x]), `${m.id} は 通れる マスの 上`);
        assert.equal(NAKAMA[m.nakama].area, 'tera', m.id);
    }
    const tera = idsInArea('tera');
    assert.equal(tera.length, 11);
    const count = r => tera.filter(id => NAKAMA[id].rank === r).length;
    assert.deepEqual([count('D'), count('C')], [6, 5]);
});

test('進化で なる キャラは 地区の 数に 入らない。ランクは 進化前の 1 つ上', () => {
    for (const id of NAKAMA_IDS.filter(i => NAKAMA[i].evo)) {
        const from = NAKAMA[NAKAMA[id].evo];
        assert.ok(from, id);
        assert.ok(!idsInArea(NAKAMA[id].area).includes(id), id);
        assert.equal('EDCBAS'.indexOf(NAKAMA[id].rank), 'EDCBAS'.indexOf(from.rank) + 1, id);
    }
    assert.equal(idsInArea('ishinokawa').length, 20, '1 章の 20 体は そのまま');
});

test('地図: 忍びの屋敷 (6 章)。庭から ろうかへは 1 マスの 戸口で、ズミタニが ふさぐ。3 人の ボスの 前に 立てる', async () => {
    const { YASHIKI_Y0, YASHIKI_IN } = await import('../src/data/map.js');
    assert.ok([...TILES[YASHIKI_Y0]].every(c => c === 'T'));
    assert.deepEqual(regionOf(YASHIKI_IN.y), [YASHIKI_Y0, YASHIKI_Y0 + 36]);
    assert.equal(TILES[YASHIKI_IN.y][YASHIKI_IN.x], 'K');
    const z = PEOPLE.find(p => p.id === 'zumitani6');
    assert.ok(BLOCK.has(TILES[z.y - 1][z.x - 1]) && BLOCK.has(TILES[z.y - 1][z.x + 1]) && !BLOCK.has(TILES[z.y - 1][z.x]), '戸口は 1 マス');
    for (const id of ['zumitani6', 'onioni6', 'tomooka6']) {
        const p = PEOPLE.find(q => q.id === id);
        assert.ok(!BLOCK.has(TILES[p.y + 1][p.x]), `${id} の 前に 立てる`);
    }
    const ya = idsInArea('yashiki');
    assert.equal(ya.length, 10);
    const count = r => ya.filter(id => NAKAMA[id].rank === r).length;
    assert.deepEqual([count('D'), count('C')], [6, 4]);
});

test('地図の マスの 文字は ぜんぶ 地図の 色と 絵が ある (描きわすれで ピンクに ならない)', async () => {
    const { MINI_COLORS } = await import('../src/view/field-art.js');
    const src = (await import('node:fs')).readFileSync(new URL('../src/view/field-art.js', import.meta.url), 'utf8');
    for (const ch of new Set(TILES.join(''))) {
        assert.ok(MINI_COLORS[ch], `${ch} の 地図の 色`);
        assert.ok(src.includes(`case '${ch}'`), `${ch} の 絵`);
    }
});

test('地図: 月の迷宮 (7 章)。入り口から 月の 鏡の 間の ルナヤまで 歩いて 行ける (行き止まりも ある)', async () => {
    const { MOON_Y0, MOON_IN, MOON_MIRROR, SHIRO_Y0 } = await import('../src/data/map.js');
    assert.ok([...TILES[MOON_Y0]].every(c => c === 'T'));
    assert.deepEqual(regionOf(MOON_IN.y), [MOON_Y0, SHIRO_Y0]);
    assert.ok(BLOCK.has('V'));
    // 駅の 前から 歩ける マスを たどる
    const seen = new Set([`${MOON_IN.x},${MOON_IN.y}`]);
    const q = [[MOON_IN.x, MOON_IN.y]];
    const open = (x, y) => y >= MOON_Y0 && y < SHIRO_Y0 && !BLOCK.has(TILES[y][x]) && !(x === MOON_MIRROR.x && y === MOON_MIRROR.y);
    while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const k = `${x + dx},${y + dy}`;
            if (!seen.has(k) && open(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); }
        }
    }
    const r = PEOPLE.find(p => p.id === 'runaya7');
    assert.ok(seen.has(`${r.x},${r.y + 1}`), 'ルナヤの 前まで 行ける');
    const moon = idsInArea('moon');
    assert.equal(moon.length, 9);
    const count = rk => moon.filter(id => NAKAMA[id].rank === rk).length;
    assert.deepEqual([count('D'), count('C')], [5, 4]);
});

test('地図: 金色のSE城 (8 章)。駅から 大鬼 → 双頭鬼 → 金滅鬼 → おにおにの 前まで、幹部を たおすたびに 進める', async () => {
    const { SHIRO_Y0, SHIRO_IN, PROPS } = await import('../src/data/map.js');
    assert.ok([...TILES[SHIRO_Y0]].every(c => c === 'T'));
    assert.deepEqual(regionOf(SHIRO_IN.y), [SHIRO_Y0, MAP_H]);
    assert.ok(BLOCK.has('k'));
    const order = ['ooni8', 'soutou8', 'kinme8', 'onioni8'].map(id => PEOPLE.find(p => p.id === id));
    // まだ たおして いない 幹部は 通れない。たおした 幹部の 先へ 進める
    const reach = beaten => {
        const stand = order.slice(beaten.length).map(p => `${p.x},${p.y}`);
        const seen = new Set([`${SHIRO_IN.x},${SHIRO_IN.y}`]);
        const q = [[SHIRO_IN.x, SHIRO_IN.y]];
        const open = (x, y) => y >= SHIRO_Y0 && y < MAP_H && !BLOCK.has(TILES[y][x]) && !stand.includes(`${x},${y}`) && !PROPS.some(p => p.x === x && p.y === y);
        while (q.length) {
            const [x, y] = q.shift();
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const k = `${x + dx},${y + dy}`;
                if (!seen.has(k) && open(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); }
            }
        }
        return seen;
    };
    for (let i = 0; i < order.length; i++) {
        const seen = reach(order.slice(0, i));
        assert.ok(seen.has(`${order[i].x},${order[i].y + 1}`), `${order[i].id} の 前まで 行ける`);
        if (i + 1 < order.length) assert.ok(!seen.has(`${order[i + 1].x},${order[i + 1].y + 1}`), `${order[i].id} を たおすまで ${order[i + 1].id} には 行けない`);
    }
    const shiro = idsInArea('shiro');
    assert.equal(shiro.length, 6);
    const count = rk => shiro.filter(id => NAKAMA[id].rank === rk).length;
    assert.deepEqual([count('D'), count('C'), count('B'), count('A')], [3, 1, 1, 1]);
});
