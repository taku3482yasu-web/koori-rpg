// バトルの テスト (画面なし。時間を 少しずつ 進めて 最後まで 戦わせる)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/core/rng.js';
import { createBattle, step, rotate, canSpecial, startSpecial, resolveSpecial, useItem, throwFood, GAUGE_MAX } from '../src/logic/battle.js';
import { NAKAMA_IDS } from '../src/data/nakama.js';

const run = (b, seconds, dt = 1 / 30) => {
    for (let t = 0; t < seconds && !b.outcome; t += dt) step(b, dt);
};

test('最初の なかま 1 体 (Lv5) で、1 章の 野生 (Lv2〜5) に だいたい 勝てる', () => {
    let wins = 0;
    for (let seed = 1; seed <= 200; seed++) {
        const rng = createRng(seed);
        const id = NAKAMA_IDS[seed % 20];
        const b = createBattle({ allies: [{ id: 'daichouenkin', lv: 5 }], enemies: [{ id, lv: 2 + (seed % 4) }], rng });
        run(b, 180);
        assert.ok(b.outcome, `seed ${seed} で 決着が つく`);
        if (b.outcome === 'win') wins++;
    }
    assert.ok(wins >= 150 && wins < 200, `勝った回数 ${wins}/200`);
});

test('3 体 そろうと 野生 1 体には 30 秒 以内に 勝つことが 多い', () => {
    let fast = 0;
    for (let seed = 1; seed <= 100; seed++) {
        const b = createBattle({ allies: [{ id: 'haribaby', lv: 5 }, { id: 'kozarappa', lv: 5 }, { id: 'ishikoron', lv: 5 }], enemies: [{ id: NAKAMA_IDS[seed % 20], lv: 5 }], rng: createRng(seed) });
        run(b, 30);
        if (b.outcome === 'win') fast++;
    }
    assert.ok(fast >= 80, `30 秒で 勝った ${fast}/100`);
});

test('輪を 回すと 前の 3 体が 入れかわる・続けて 回すには 少し 待つ', () => {
    const allies = ['haribaby', 'kogame', 'kozarappa', 'ishikoron', 'mizukirin', 'pekorisu'].map(id => ({ id, lv: 3 }));
    const b = createBattle({ allies, enemies: [{ id: 'donguriko', lv: 3 }], rng: createRng(1) });
    assert.deepEqual(b.front().map(u => u.id), ['haribaby', 'kogame', 'kozarappa']);
    assert.ok(rotate(b, 1));
    assert.deepEqual(b.front().map(u => u.id), ['kogame', 'kozarappa', 'ishikoron']);
    assert.equal(rotate(b, 1), false);
    step(b, 0.5);
    assert.ok(rotate(b, -1));
    assert.deepEqual(b.front().map(u => u.id), ['haribaby', 'kogame', 'kozarappa']);
});

test('必殺技: ゲージが たまると 打てて、打つと ゲージが 0 に なる', () => {
    const b = createBattle({ allies: [{ id: 'haribaby', lv: 5 }], enemies: [{ id: 'kogame', lv: 9 }], rng: createRng(3) });
    assert.equal(canSpecial(b, 0), false);
    b.front()[0].gauge = GAUGE_MAX;
    const u = startSpecial(b, 0);
    assert.ok(u && b.paused);
    const hp = b.enemies[0].hp;
    step(b, 1);   // ミニゲームの あいだは 止まる
    assert.equal(b.enemies[0].hp, hp);
    resolveSpecial(b, u, 1.5);
    assert.equal(u.gauge, 0);
    assert.ok(b.enemies[0].hp < hp);
    assert.ok(b.events.some(e => e.type === 'special' && e.name === 'ハリハリ突進'));
});

test('道具で 回復・続けて 使うには 待つ。食べ物を 投げるのは 1 回だけ', () => {
    const b = createBattle({ allies: [{ id: 'haribaby', lv: 5 }], enemies: [{ id: 'kogame', lv: 3 }], rng: createRng(4) });
    const u = b.front()[0];
    u.hp = 10;
    assert.ok(useItem(b, 'onigiri'));
    assert.equal(u.hp, Math.min(u.max, 70));
    assert.equal(useItem(b, 'onigiri'), false);
    assert.ok(throwFood(b, 'kyuuri'));
    assert.equal(b.food.favorite, true);
    assert.equal(throwFood(b, 'choco'), false);
});

test('前の 3 体が 全員 たおれたら、後ろと 自動で 入れかわる', () => {
    const allies = ['haribaby', 'kogame', 'kozarappa', 'ishikoron', 'mizukirin', 'pekorisu'].map(id => ({ id, lv: 3 }));
    const b = createBattle({ allies, enemies: [{ id: 'donguriko', lv: 3 }], rng: createRng(1) });
    b.front().forEach(u => { u.hp = 0; u.ko = true; });
    run(b, 2.5);
    assert.deepEqual(b.front().map(u => u.id), ['ishikoron', 'mizukirin', 'pekorisu']);
});

test('ボスは 大技の 前に 予告を 出す', () => {
    const allies = ['haribaby', 'kogame', 'kozarappa', 'ishikoron', 'mizukirin', 'pekorisu'].map(id => ({ id, lv: 8 }));
    const b = createBattle({ allies, enemies: [{ id: 'nushi', lv: 8 }], rng: createRng(5), kind: 'boss' });
    run(b, 13);
    const warn = b.events.find(e => e.type === 'telegraph');
    const big = b.events.find(e => e.type === 'special' && e.big);
    assert.ok(warn && big, '予告と 大技');
    assert.ok(big.t - warn.t >= 2.4, '予告から 2.5 秒 あとに 大技');
});

test('ボス (Lv8) は 6 体 (Lv7〜8) なら 勝てるが、1 体では 勝てない', () => {
    let wins6 = 0, wins1 = 0;
    for (let seed = 1; seed <= 40; seed++) {
        const six = ['haribaby', 'kogame', 'kozarappa', 'ishikoron', 'mizukirin', 'daichouenkin'].map(id => ({ id, lv: 7 + (seed % 2) }));
        const b6 = createBattle({ allies: six, enemies: [{ id: 'nushi', lv: 8 }], rng: createRng(seed), kind: 'boss' });
        run(b6, 300);
        if (b6.outcome === 'win') wins6++;
        const b1 = createBattle({ allies: [{ id: 'daichouenkin', lv: 5 }], enemies: [{ id: 'nushi', lv: 8 }], rng: createRng(seed), kind: 'boss' });
        run(b1, 300);
        if (b1.outcome === 'win') wins1++;
    }
    assert.ok(wins6 >= 30, `6 体で 勝った ${wins6}/40`);
    assert.ok(wins1 <= 5, `1 体で 勝った ${wins1}/40`);
});
