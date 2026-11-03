// 町に いる キャラの テスト: 見えている キャラが 歩きまわる・レンズで 見つけた キャラが 出てくる・話しかける 相手
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/core/rng.js';
import { newGame, receiveWatch } from '../src/logic/game.js';
import { createWild } from '../src/logic/wild.js';
import { ROAMS, SPOTS, TILE, FRIENDS } from '../src/data/map.js';

const setup = () => {
    const g = newGame('naitei');
    receiveWatch(g);
    return { g, wild: createWild(g, createRng(3)) };
};
const run = (g, wild, seconds) => {
    for (let t = 0; t < seconds; t += 0.05) {
        g.playTime += 0.05;
        wild.update(0.05, g.pos);
    }
};

test('見えている キャラが 町に 出て、自分の 場所の 中を 歩きまわる', () => {
    const { g, wild } = setup();
    run(g, wild, 30);
    assert.ok(wild.list.length >= 8, `${wild.list.length} 体`);
    const start = new Map(wild.list.map(c => [c.key, { x: c.x, y: c.y }]));
    run(g, wild, 20);
    let moved = 0;
    for (const c of wild.list) {
        const r = ROAMS.find(z => z.id === c.roam) || FRIENDS.find(z => z.id === c.roam);   // 話せる キャラも 自分の 場所の 中
        const tx = Math.floor(c.x / TILE), ty = Math.floor((c.y - 3) / TILE);
        assert.ok(tx >= r.x0 - 1 && tx <= r.x1 + 1 && ty >= r.y0 - 1 && ty <= r.y1 + 1, `${c.id} は ${r.id} の 中`);
        const s = start.get(c.key);
        if (s && Math.hypot(s.x - c.x, s.y - c.y) > 4) moved++;
    }
    assert.ok(moved >= 3, `動いた ${moved} 体`);
    for (const r of ROAMS) assert.ok(wild.list.filter(c => c.roam === r.id).length <= r.max);
});

test('昼は 夜の キャラが 出ない・夜に なると 出る', () => {
    const { g, wild } = setup();
    run(g, wild, 30);
    assert.ok(!wild.list.some(c => c.id === 'yofukashi'));
    // ヨフカシフクロウは かくれている キャラ (レンズで さがす)
    assert.ok(SPOTS.some(s => s.kinds.some(k => k.id === 'yofukashi')));
});

test('レンズで 見つけた キャラは その場に 出てきて、前に 立つと 話しかけられる', () => {
    const { g, wild } = setup();
    const spot = SPOTS.find(s => s.id === 'kawara');
    const c = wild.reveal(spot, 'ishikoron');
    assert.equal(c.x, spot.x * TILE + 8);
    // 少し はなれていても、向いていれば 話しかけられる
    g.pos = { x: c.x + 4, y: c.y + 22, dir: 'up' };
    assert.equal(wild.facing(g.pos), c);
    // 背中を 向けていたら だめ
    g.pos.dir = 'down';
    assert.equal(wild.facing(g.pos), null);
    // すぐ そばなら 向きは 問わない
    g.pos = { x: c.x, y: c.y + 10, dir: 'down' };
    assert.equal(wild.facing(g.pos), c);
    // 遠いと だめ
    g.pos = { x: c.x, y: c.y + 40, dir: 'up' };
    assert.equal(wild.facing(g.pos), null);
    // 戦ったら いなくなる
    wild.remove(c);
    assert.ok(!wild.list.includes(c));
});

test('こおりくんが 近づくと 歩いている キャラは 立ち止まって こっちを 向く', () => {
    const { g, wild } = setup();
    run(g, wild, 30);
    const c = wild.list.find(x => x.roam);
    g.pos = { x: c.x - 20, y: c.y, dir: 'right' };
    const before = { x: c.x, y: c.y };
    run(g, wild, 3);
    assert.ok(Math.hypot(c.x - before.x, c.y - before.y) < 1, '止まる');
    assert.equal(c.flip, true, 'こおりくんの ほう (左) を 向く');
    assert.equal(wild.facing(g.pos), c);
});

test('戦った キャラの 場所は しばらく 出ない', () => {
    const { g, wild } = setup();
    run(g, wild, 30);
    const c = wild.list.find(x => x.roam === 'kadan');
    assert.ok(c);
    wild.remove(c);
    run(g, wild, 5);
    assert.ok(!wild.list.some(x => x.roam === 'kadan'));
    run(g, wild, 25);
    assert.ok(wild.list.some(x => x.roam === 'kadan'));
});

test('ダンジョンの キャラは こおりくんを 見つけると 追いかけてきて、ぶつかると バトル。町では 追いかけない (2026-11-03)', async () => {
    const { OKU_INFO } = await import('../src/data/map.js');
    const { g, wild } = setup();
    // 奥の エリア (山の 氷穴) の 部屋に こおりくんを 立たせ、その 部屋の キャラを 待つ
    const room = OKU_INFO[0].rooms.find(r => r !== OKU_INFO[0].startRoom && ROAMS.some(z => z.x0 === r.x && z.y0 === r.y));
    g.pos = { x: (room.x + 1) * TILE + 8, y: (room.y + 1) * TILE + 12, dir: 'down' };
    let touched = null;
    for (let t = 0; t < 40 && !touched; t += 0.05) { g.playTime += 0.05; touched = wild.update(0.05, g.pos); }
    assert.ok(touched, 'ぶつかって バトルに なる');
    assert.ok(touched.chasing);
    // しばらくは 追いかけない
    wild.calm(3);
    assert.equal(wild.update(0.05, g.pos), null);
    // 町の キャラは 追いかけない
    const town = setup();
    run(town.g, town.wild, 20);
    const c = town.wild.list.find(x => !x.friendly);
    town.g.pos = { x: c.x + 30, y: c.y, dir: 'left' };
    let hit = null;
    for (let t = 0; t < 5; t += 0.05) { town.g.playTime += 0.05; hit = town.wild.update(0.05, town.g.pos) || hit; }
    assert.equal(hit, null);
});
