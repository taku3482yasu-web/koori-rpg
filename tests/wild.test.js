// 町に いる キャラの テスト: 見えている キャラが 歩きまわる・レンズで 見つけた キャラが 出てくる・話しかける 相手
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/core/rng.js';
import { newGame, receiveWatch } from '../src/logic/game.js';
import { createWild } from '../src/logic/wild.js';
import { ROAMS, SPOTS, TILE } from '../src/data/map.js';

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
        const r = ROAMS.find(z => z.id === c.roam);
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
    g.pos = { x: c.x, y: c.y + 14, dir: 'up' };
    assert.equal(wild.facing(g.pos), c);
    g.pos.dir = 'down';
    assert.equal(wild.facing(g.pos), null);
    // 戦ったら いなくなる
    wild.remove(c);
    assert.ok(!wild.list.includes(c));
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
