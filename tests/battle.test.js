// バトルの テスト (画面なし。時間を 少しずつ 進めて 最後まで 戦わせる)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/core/rng.js';
import { createBattle, step, rotate, canSpecial, startSpecial, resolveSpecial, useItem, throwFood, GAUGE_MAX, canRescue, rescueTargets, startRescue, resolveRescue, begin, flee, canFlee } from '../src/logic/battle.js';
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

test('なかまは 5 つの コマンド (通常攻撃・わざ・さぼり・まもり・術) を 使い、まもると ダメージが 半分', () => {
    const seen = new Set();
    for (let seed = 1; seed <= 20; seed++) {
        const b = createBattle({ allies: [{ id: 'haribaby', lv: 9 }, { id: 'kogame', lv: 9 }, { id: 'kozarappa', lv: 9 }], enemies: [{ id: 'saikoron', lv: 9 }, { id: 'hakupai', lv: 9 }], rng: createRng(seed) });
        run(b, 60);
        for (const e of b.events) {
            if (e.type === 'attack') seen.add('attack');
            if (e.type === 'skill') seen.add(e.cmd);
            if (e.type === 'loaf' || e.type === 'guard') seen.add(e.type);
        }
    }
    assert.deepEqual([...seen].sort(), ['attack', 'guard', 'jutsu', 'loaf', 'waza']);
    // まもり: 同じ 乱数で、まもって いると ダメージが 半分ほど
    const hit = guarding => {
        const b = createBattle({ allies: [{ id: 'kogame', lv: 9 }], enemies: [{ id: 'saikoron', lv: 9 }], rng: createRng(7) });
        b.wheel[0].guarding = guarding;
        b.enemies[0].timer = 99;
        step(b, 0.01);
        return b.events.find(e => e.type === 'damage')?.amount || 0;
    };
    let full = 0, half = 0;
    for (let i = 0; i < 1; i++) { full = hit(false); half = hit(true); }
    if (full && half) assert.ok(half <= Math.ceil(full * 0.6), `まもり ${half} / ふつう ${full}`);
});

test('こおりくんも バトルに 出られる (さぼらない)', () => {
    const b = createBattle({ allies: [{ id: 'koori', lv: 5 }], enemies: [{ id: 'haribaby', lv: 3 }], rng: createRng(2) });
    assert.equal(b.wheel[0].name, 'こおりくん');
    run(b, 120);
    assert.equal(b.outcome, 'win');
    assert.ok(!b.events.some(e => e.type === 'loaf' && e.actor === b.wheel[0].uid));
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

test('道具・おやつは 使う 相手を えらべる。後ろの なかまにも 使える (2026-10-28)', () => {
    const allies = ['haribaby', 'kogame', 'kozarappa', 'ishikoron'].map(id => ({ id, lv: 5 }));
    const b = createBattle({ allies, enemies: [{ id: 'kogame', lv: 3 }, { id: 'donguriko', lv: 3 }], rng: createRng(4) });
    const back = b.wheel[3];
    back.hp = 5;
    b.front()[0].hp = 1;
    assert.ok(useItem(b, 'onigiri', back.uid));
    assert.equal(back.hp, Math.min(back.max, 65), '後ろの なかまが 回復');
    assert.equal(b.front()[0].hp, 1);
    b.itemCooldown = 0;
    back.hp = 0; back.ko = true;
    assert.equal(useItem(b, 'onigiri', back.uid), false, 'たおれた なかまには 使えない');
    const second = b.enemies[1];
    assert.ok(throwFood(b, 'kyuuri', second.uid));
    assert.equal(b.food.target, 'donguriko', '2 体目に 投げた');
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

test('3 章の ボス ダムの ヌシ (Lv17) は 6 体 Lv15 なら だいたい 勝てるが、1 体では 勝てない (2026-10-29)', () => {
    let wins6 = 0, wins1 = 0;
    for (let seed = 1; seed <= 30; seed++) {
        const six = ['koori', 'lunashadow', 'yataiman', 'kogame', 'kozarappa', 'proteingolem'].map(id => ({ id, lv: 15 }));
        const b6 = createBattle({ allies: six, enemies: [{ id: 'himuro', lv: 17 }], rng: createRng(seed), kind: 'boss' });
        run(b6, 400);
        if (b6.outcome === 'win') wins6++;
        const b1 = createBattle({ allies: [{ id: 'koori', lv: 15 }], enemies: [{ id: 'himuro', lv: 17 }], rng: createRng(seed), kind: 'boss' });
        run(b1, 400);
        if (b1.outcome === 'win') wins1++;
    }
    assert.ok(wins6 >= 15, `6 体で 勝った ${wins6}/30`);
    assert.ok(wins1 <= 2, `1 体で 勝った ${wins1}/30`);
});

test('とりつき: なまけたり 味方を 攻めたり する。後ろに 回すと おたすけ できて、成功で 治る (2 章)', () => {
    const allies = ['haribaby', 'kogame', 'kozarappa', 'ishikoron'].map(id => ({ id, lv: 8 }));
    const b = createBattle({ allies, enemies: [{ id: 'wasurekurage', lv: 3 }], rng: createRng(2) });
    b.enemies[0].timer = -999;
    b.enemies[0].hp = b.enemies[0].max = 99999;
    const u = b.front()[0];
    u.status.possess = 25;
    assert.equal(canRescue(b, u.uid), false, '前に いると おたすけ できない');
    // しばらく 動かすと、なまけるか 味方を 攻める
    for (let i = 0; i < 300; i++) step(b, 0.05);
    assert.ok(b.events.some(e => e.type === 'possessed' && e.actor === u.uid), 'とりつかれて 動く');
    u.status.possess = 25;
    rotate(b, 1); b.rotateCooldown = 0; rotate(b, 1); b.rotateCooldown = 0; rotate(b, 1);
    assert.ok(!b.front().includes(u));
    assert.deepEqual(rescueTargets(b).map(x => x.uid), [u.uid]);
    const r = startRescue(b, u.uid);
    assert.ok(b.paused, 'ミニゲームの あいだは 止まる');
    resolveRescue(b, r, false);
    assert.ok(u.status.possess > 0, 'しっぱいでは 治らない');
    assert.equal(canRescue(b, u.uid), false, 'しっぱいの あとは 少し 待つ');
    for (let i = 0; i < 70; i++) step(b, 0.05);
    assert.ok(canRescue(b, u.uid));
    resolveRescue(b, startRescue(b, u.uid), true);
    assert.ok(!u.status.possess, '成功で 治る');
});

test('ロックオン: 味方の 1 体ねらいは ねらった 敵へ。弱点の 光の あいだは ダメージ +20% (設計書 3.2)', async () => {
    const { lockOn, weakActive, WEAK_EVERY, WEAK_TIME } = await import('../src/logic/battle.js');
    const allies = ['haribaby', 'kogame', 'ishikoron'].map(id => ({ id, lv: 8 }));
    const b = createBattle({ allies, enemies: [{ id: 'kogame', lv: 5 }, { id: 'donguriko', lv: 5 }], rng: createRng(3) });
    b.enemies.forEach(e => { e.timer = -999; e.hp = e.max = 99999; });
    const target = b.enemies[1];
    assert.ok(lockOn(b, target.uid));
    assert.equal(b.lock, target.uid);
    for (let i = 0; i < 200; i++) step(b, 0.05);
    const hits = b.events.filter(e => e.type === 'damage' && !e.weak);
    assert.ok(hits.length > 0);
    assert.ok(b.events.filter(e => e.type === 'attack' && e.actor.startsWith('ally')).every(e => e.target === target.uid), '通常攻撃は ねらった 敵へ');
    b.weakT = WEAK_EVERY - WEAK_TIME + 0.1;
    assert.ok(weakActive(b));
    assert.ok(lockOn(b, target.uid) && b.lock === null, 'もう いちどで はずす');
    assert.equal(weakActive(b), false);
});

test('2 章の ボス (影): 右手・左手を こわすと その わざを 使わない。頭は 両手の あと、こわすと チャンスタイム → 部位が もどる (2026-10-28)', async () => {
    const { lockOn, handsBroken } = await import('../src/logic/battle.js');
    const allies = ['haribaby', 'kogame', 'kozarappa', 'ishikoron', 'mizukirin', 'daichouenkin'].map(id => ({ id, lv: 13 }));
    const b = createBattle({ allies, enemies: [{ id: 'kage', lv: 13 }], rng: createRng(7), kind: 'boss' });
    const boss = b.enemies[0];
    assert.ok(boss.max > 1000, `HP が とても 多い (${boss.max})`);
    assert.deepEqual(Object.keys(boss.parts), ['rhand', 'lhand', 'head']);
    boss.hp = boss.max = 999999;
    b.wheel.forEach(u => { if (u) u.hp = u.max = 99999; });
    // 頭を ねらっても 両手が あるうちは こわれない
    lockOn(b, boss.uid, 'head');
    for (let i = 0; i < 200; i++) step(b, 0.05);
    assert.equal(boss.parts.head.hp, boss.parts.head.max);
    assert.ok(b.events.some(e => e.type === 'partGuard'));
    // 手が のこっている うちは 手で ガードされて ダメージが ほとんど 入らない (2026-10-28 ユーザー指定)
    const guarded = b.events.filter(e => e.type === 'damage' && e.target === boss.uid);
    assert.ok(guarded.length && guarded.every(e => e.headGuard), '頭への 攻撃は ガード');
    // 右手 → 左手 の 順に こわす
    lockOn(b, boss.uid, 'rhand');
    for (let i = 0; i < 4000 && !boss.parts.rhand.broken; i++) step(b, 0.05);
    assert.ok(boss.parts.rhand.broken, '右手を こわした');
    assert.equal(b.lockPart, 'lhand', 'つぎは 左手を ねらう');
    b.events.length = 0;
    for (let i = 0; i < 4000 && !boss.parts.lhand.broken; i++) step(b, 0.05);
    assert.ok(handsBroken(boss));
    assert.ok(!b.events.some(e => e.type === 'skill' && e.actor === boss.uid && e.name === '不明の右手' && e.t > b.events.find(x => x.type === 'partBreak').t), '右手を こわした あとは 不明の右手を 使わない');
    assert.equal(b.lockPart, 'head');
    b.events.length = 0;
    for (let i = 0; i < 4000 && !b.chance; i++) step(b, 0.05);
    assert.ok(b.events.filter(e => e.type === 'damage' && e.target === boss.uid).every(e => !e.headGuard), '両手を こわした あとは ガードされない');
    assert.ok(b.chance, '頭を こわすと チャンスタイム');
    const hpBefore = b.wheel.filter(Boolean).map(u => u.hp).join();
    b.events.length = 0;
    for (let i = 0; i < 4000 && b.chance; i++) step(b, 0.05);
    assert.equal(b.events.filter(e => e.type === 'stunned').length, boss.chanceTurns, '決まった 回数 うごけない');
    assert.ok(!b.events.some(e => e.type === 'skill' && e.actor === boss.uid && e.t < b.events.find(x => x.type === 'chanceEnd').t), 'チャンスタイムの あいだは わざを 使わない');
    assert.ok(!boss.parts.rhand.broken && !boss.parts.lhand.broken && !boss.parts.head.broken, 'おわると 部位が もどる');
    assert.ok(hpBefore);
});

test('はじまり: 「たたかう」まで 止まっている・どうぐ / おやつを 使っても 始まる (2026-10-29 ユーザー指定)', () => {
    const mk = () => createBattle({ allies: [{ id: 'kogame', lv: 9 }], enemies: [{ id: 'saikoron', lv: 3 }], rng: createRng(3), intro: true });
    const b = mk();
    run(b, 3);
    assert.equal(b.t, 0);
    assert.ok(begin(b));
    run(b, 1);
    assert.ok(b.t > 0);
    const c = mk();
    c.wheel[0].hp = 10;
    assert.ok(useItem(c, 'onigiri', c.wheel[0].uid));
    assert.equal(c.waiting, false);
    const d = mk();
    assert.ok(throwFood(d, 'onigiri'));
    assert.equal(d.waiting, false);
});

test('にげる: ふつうの バトルは にげられる・ボスと 七不思議は にげられない', () => {
    const wild = createBattle({ allies: [{ id: 'kogame', lv: 9 }], enemies: [{ id: 'saikoron', lv: 3 }], rng: createRng(4), intro: true });
    assert.ok(canFlee(wild) && flee(wild));
    assert.equal(wild.outcome, 'flee');
    const boss = createBattle({ allies: [{ id: 'kogame', lv: 9 }], enemies: [{ id: 'nushi', lv: 8 }], rng: createRng(5), kind: 'boss', intro: true });
    assert.ok(!flee(boss));
    assert.equal(boss.outcome, null);
    assert.ok(boss.events.some(e => e.type === 'noFlee'));
    const mystery = createBattle({ allies: [{ id: 'kogame', lv: 9 }], enemies: [{ id: 'saikoron', lv: 3 }], rng: createRng(6), intro: true });
    mystery.mystery = 'rika';
    assert.ok(!flee(mystery));
    begin(wild);
    assert.ok(!flee(boss) && begin(boss) && !flee(boss), '始まってからは にげられない');
});
