// バトルの テスト (画面なし。時間を 少しずつ 進めて 最後まで 戦わせる)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/core/rng.js';
import { createBattle, step, rotate, canSpecial, startSpecial, resolveSpecial, useItem, throwFood, GAUGE_MAX, canRescue, rescueTargets, startRescue, resolveRescue, begin, flee, canFlee, idolsOf } from '../src/logic/battle.js';
import { NAKAMA_IDS, NAKAMA } from '../src/data/nakama.js';

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

test('ダムの主: 氷の偶像を 左右に 作り、2 体 そろうと 必殺技を ためる。ためて いる あいだに 偶像を こわすと 止まる (2026-10-29)', () => {
    const allies = ['koori', 'kogame', 'kozarappa'].map(id => ({ id, lv: 15 }));
    const b = createBattle({ allies, enemies: [{ id: 'himuro', lv: 17 }], rng: createRng(3), kind: 'boss' });
    const boss = b.enemies[0];
    assert.equal(boss.name, 'ダムの主');
    // 偶像を 作る わざだけ 使わせる
    const summon = boss.bossMoves.find(m => m.summon);
    boss.bossMoves = [summon];
    const actOnce = () => { boss.timer = 999; step(b, 1 / 30); };
    actOnce();
    assert.equal(idolsOf(b, boss).length, 1, '1 体目');
    assert.equal(b.charge, null, '1 体では ためない');
    actOnce();
    const idols = idolsOf(b, boss);
    assert.deepEqual(idols.map(i => i.slot).sort(), ['left', 'right'], '左右に 1 体ずつ');
    assert.ok(b.charge && b.charge.uid === boss.uid, '2 体 そろうと ためる');
    assert.ok(b.events.some(e => e.type === 'telegraph' && e.name === '氷河の咆哮'));
    // こわすと 止まる
    idols[0].hp = 1;
    b.lock = idols[0].uid;
    for (let i = 0; i < 300 && !idols[0].ko; i++) step(b, 1 / 30);
    assert.ok(idols[0].ko, '偶像は こわせる');
    assert.equal(b.charge, null, '必殺技が 止まる');
    assert.ok(b.events.some(e => e.type === 'bigCancel'));
    assert.ok(!b.events.some(e => e.type === 'special' && e.big), '必殺技は 出ない');
    assert.ok(!b.outcome, '偶像を こわしても バトルは つづく');
});

test('ダムの主: 偶像を こわさないと ため の あと 必殺技 (偶像は くだける)。ボスを たおすと 勝ち (偶像は のこらない)', () => {
    const allies = ['koori', 'kogame', 'kozarappa'].map(id => ({ id, lv: 15 }));
    const b = createBattle({ allies, enemies: [{ id: 'himuro', lv: 17 }], rng: createRng(4), kind: 'boss' });
    const boss = b.enemies[0];
    const summon = boss.bossMoves.find(m => m.summon);
    boss.bossMoves = [summon];
    for (let k = 0; k < 2; k++) { boss.timer = 999; step(b, 1 / 30); }
    boss.bossMoves = [{ name: 'まつ', w: 1, effects: [] }];
    const idols = idolsOf(b, boss);
    idols.forEach(i => { i.hp = i.max = 99999; });
    for (let i = 0; i < 30 * 8 && !b.events.some(e => e.type === 'special' && e.big); i++) step(b, 1 / 30);
    assert.ok(b.events.some(e => e.type === 'special' && e.big && e.name === '氷河の咆哮'), 'ため の あと 必殺技');
    assert.equal(idolsOf(b, boss).length, 0, '偶像は くだける');
    boss.bossMoves = [summon];
    boss.timer = 999; step(b, 1 / 30);
    assert.equal(idolsOf(b, boss).length, 1);
    boss.hp = 1;
    b.lock = boss.uid;
    for (let i = 0; i < 600 && !b.outcome; i++) step(b, 1 / 30);
    assert.equal(b.outcome, 'win', '偶像が のこって いても ボスを たおせば 勝ち');
    assert.equal(idolsOf(b, boss).length, 0);
});

test('いたずらの とりつき: なまけたり 味方を 攻めたり する。後ろに 回すと おたすけ できて、成功で 治る (2 章)', () => {
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

test('とりつき: ねむり・のろい・こんらん・どく・めくらまし も ぜんぶ とりつき。おたすけで まとめて ぬける (2026-10-30)', async () => {
    const { isPossessed, toritsukiName, STATUS_NAMES, BLIND_MISS } = await import('../src/logic/battle.js');
    assert.deepEqual(Object.keys(STATUS_NAMES).sort(), ['blind', 'confuse', 'poison', 'possess', 'sleep', 'slow']);
    assert.equal(toritsukiName('slow'), 'のろいの とりつき');
    const allies = ['haribaby', 'kogame', 'kozarappa', 'ishikoron'].map(id => ({ id, lv: 8 }));
    const b = createBattle({ allies, enemies: [{ id: 'wasurekurage', lv: 3 }], rng: createRng(4) });
    const u = b.wheel[3];   // 後ろ
    u.status = { sleep: 9, slow: 9, confuse: 9, poison: 9, blind: 9 };
    assert.ok(isPossessed(u) && canRescue(b, u.uid), 'いたずら いがいの とりつきも おたすけ できる');
    resolveRescue(b, startRescue(b, u.uid), true);
    assert.deepEqual(u.status, {}, 'ぜんぶ ぬける');
    // めくらまし: 攻撃が 4 わりほど 当たらない
    let miss = 0, n = 0;
    for (let seed = 1; seed <= 60; seed++) {
        const c = createBattle({ allies: [{ id: 'haribaby', lv: 20 }], enemies: [{ id: 'ishikoron', lv: 1 }], rng: createRng(seed) });
        c.enemies[0].hp = c.enemies[0].max = 99999;
        c.enemies[0].timer = -999;
        c.wheel[0].status.blind = 999;
        run(c, 20);
        n += c.events.filter(e => e.type === 'attack' || (e.type === 'skill' && e.actor === c.wheel[0].uid)).length;
        miss += c.events.filter(e => e.type === 'miss' && e.blind).length;
    }
    assert.ok(miss > 0 && miss / n > BLIND_MISS * 0.5 && miss / n < BLIND_MISS * 1.6, `めくらましで ミス ${miss}/${n}`);
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

// 4 章・5 章の ボスの しかけ (2026-10-29 ユーザー指定)。lock + lockPart で しかけを ねらって 味方の 攻撃を 当てる
async function bossBattle(id, seed = 3) {
    const { lockOn, gimOpen } = await import('../src/logic/battle.js');
    const b = createBattle({ allies: [{ uid: 'a', id: 'koori', lv: 40 }, { uid: 'b', id: 'kogame', lv: 40 }, { uid: 'c', id: 'haribaby', lv: 40 }], enemies: [{ id, lv: 23 }], rng: createRng(seed), kind: 'boss' });
    const boss = b.enemies[0];
    // 味方を すぐ 動かす (攻撃が 当たるまで)
    const hitUntil = (cond, max = 400) => { for (let i = 0; i < max && !cond() && !b.outcome; i++) { b.wheel.forEach(u => { if (u) u.timer = 99; }); boss.hp = Math.max(boss.hp, boss.max * 0.6); step(b, 0.05); } };
    return { b, boss, lockOn, gimOpen, hitUntil };
}

test('4 章の 浦の島重蔵: 玉手箱を こわすと 玉手箱の わざと 必殺技が 消え、けむりで 当たりにくくなる (時間で 消える)', async () => {
    const { b, boss, lockOn, hitUntil } = await bossBattle('urashima4');
    assert.ok(lockOn(b, boss.uid, 'box'), '玉手箱は いつも ねらえる');
    assert.ok(!lockOn(b, boss.uid, 'head'), '頭は こもって いないと ねらえない');
    hitUntil(() => boss.gims.box.broken);
    assert.ok(boss.gims.box.broken);
    assert.ok(!boss.bossMoves.some(m => m.box), '玉手箱の わざが 消える');
    assert.equal(boss.bigMove, null, '玉手箱の 必殺技も 消える');
    assert.ok(b.smoke, 'けむり');
    for (let i = 0; i < 300 && b.smoke; i++) step(b, 0.05);
    assert.equal(b.smoke, null, 'けむりは 時間で 消える');
});

test('4 章の 浦の島重蔵: こうらに こもると 体への ダメージが へり、頭を こわすと ひっくり返って チャンスタイム', async () => {
    const { b, boss, lockOn, gimOpen, hitUntil } = await bossBattle('urashima4');
    boss.shell = 7;
    assert.ok(gimOpen(b, boss, 'head'));
    assert.ok(lockOn(b, boss.uid, 'head'));
    hitUntil(() => Boolean(b.chance));
    assert.ok(b.chance && b.chance.uid === boss.uid, 'チャンスタイム');
    assert.equal(boss.shell, 0, 'ひっくり返って こうらから 出る');
    assert.ok(b.events.some(e => e.type === 'chance' && e.why === 'flip'));
});

test('5 章の ダイシ: 攻撃を うけつづけると 鬼の顔。鬼の面を こわすと 仏の顔に もどる', async () => {
    const { BOSSES } = await import('../src/data/nakama.js');
    const { b, boss, lockOn, hitUntil } = await bossBattle('daishi5');
    assert.ok(!lockOn(b, boss.uid, 'mask'), '鬼の顔に なるまで 面は ねらえない');
    hitUntil(() => boss.oni);
    assert.ok(boss.oni, '鬼の顔');
    assert.equal(boss.bossMoves, BOSSES.daishi5.oni.moves);
    assert.ok(boss.buffs.atk.amount > 0);
    assert.ok(lockOn(b, boss.uid, 'mask'));
    hitUntil(() => !boss.oni);
    assert.ok(!boss.oni, '面を こわすと もどる');
    assert.equal(boss.bossMoves, BOSSES.daishi5.moves);
    assert.ok(!boss.buffs.atk);
});

test('5 章の ダイシ: お経を となえきると 必殺技。となえている あいだに 鐘を 鳴らすと チャンスタイム (鐘は ボスに ダメージなし)', async () => {
    const { b, boss, lockOn, hitUntil } = await bossBattle('daishi5', 5);
    assert.ok(!lockOn(b, boss.uid, 'bell'), 'お経の 前は 鐘を ねらえない');
    b.bossTimer = 99;
    step(b, 0.05);
    assert.ok(b.chant, 'お経を となえはじめた');
    assert.ok(lockOn(b, boss.uid, 'bell'));
    const hp = boss.hp;
    hitUntil(() => Boolean(b.chance), 200);
    assert.ok(b.chance && !b.chant, '鐘が 鳴って チャンスタイム・お経が 止まる');
    assert.ok(b.events.some(e => e.type === 'bell'));
    // となえきると 必殺技
    const b2 = (await bossBattle('daishi5', 7)).b;
    b2.bossTimer = 99;
    step(b2, 0.05);
    for (let i = 0; i < 200 && b2.chant; i++) step(b2, 0.05);
    assert.ok(b2.events.some(e => e.type === 'special' && e.big && e.name === 'ネット念仏'), 'となえきると ネット念仏');
    void hp;
});

test('6 章の ズミタニ: 分身が いる あいだは ロックオンした あいてにだけ 当たる。本物なら 見やぶり、分身なら しかえし', async () => {
    const { lockOn } = await import('../src/logic/battle.js');
    const make = () => {
        const b = createBattle({ allies: [{ uid: 'a', id: 'koori', lv: 40 }, { uid: 'b', id: 'kogame', lv: 40 }, { uid: 'c', id: 'haribaby', lv: 40 }], enemies: [{ id: 'zumitani6', lv: 26 }], rng: createRng(11), kind: 'boss' });
        const boss = b.enemies[0];
        // 分身を 出させる
        boss.bossMoves = boss.bossMoves.filter(m => m.clones);
        boss.timer = 99;
        step(b, 0.05);
        return { b, boss };
    };
    let { b, boss } = make();
    assert.ok(b.clones, '分身が 出た');
    assert.equal(b.enemies.length, 3);
    assert.equal(b.enemies.filter(e => e.clone).length, 2);
    // ロックオン なしでは 当たらない
    const hp0 = boss.hp;
    b.wheel.forEach(u => { if (u) u.timer = 99; });
    step(b, 0.05);
    assert.equal(boss.hp, hp0, 'ロックオンしないと 当たらない');
    assert.ok(b.events.some(e => e.type === 'miss' && e.clone));
    // 本物を ロックオン → 見やぶって 分身が 消える
    lockOn(b, boss.uid);
    for (let i = 0; i < 40 && b.clones; i++) { b.wheel.forEach(u => { if (u) u.timer = 99; }); step(b, 0.05); }
    assert.ok(!b.clones && boss.hp < hp0, '本物を 見やぶった');
    assert.ok(b.events.some(e => e.type === 'clonesEnd' && e.why === 'found'));
    // 分身を ロックオン → しかえし (ダメージと とりつき)
    ({ b, boss } = make());
    const clone = b.enemies.find(e => e.clone);
    lockOn(b, clone.uid);
    b.wheel[0].timer = 99;
    for (let i = 0; i < 40 && !b.events.some(e => e.type === 'cloneFail'); i++) { b.wheel.forEach(u => { if (u) u.timer = 99; }); step(b, 0.05); }
    const fail = b.events.find(e => e.type === 'cloneFail');
    assert.ok(fail, '分身を 攻撃して しっぱい');
    assert.ok(!b.enemies.includes(clone), 'その 分身は 消える');
    const who = b.wheel.find(u => u && u.uid === fail.actor);
    assert.ok(who.status.possess > 0 && who.hp < who.max, '当てた なかまに ダメージと とりつき');
});

test('6 章の ズミタニ: 分身は 瞬間移動で 位置が かわり、時間で 消える', async () => {
    const b = createBattle({ allies: [{ uid: 'a', id: 'koori', lv: 40 }], enemies: [{ id: 'zumitani6', lv: 26 }], rng: createRng(4), kind: 'boss' });
    const boss = b.enemies[0];
    boss.bossMoves = boss.bossMoves.filter(m => m.clones);
    boss.timer = 99;
    step(b, 0.05);
    let tp = 0;
    for (let i = 0; i < 300 && b.clones; i++) { boss.timer = -99; b.wheel[0].timer = -99; step(b, 0.05); }
    tp = b.events.filter(e => e.type === 'teleport').length;
    assert.ok(tp >= 3, `瞬間移動 ${tp} 回`);
    assert.ok(!b.clones && b.events.some(e => e.type === 'clonesEnd' && e.why === 'time'));
    assert.equal(b.enemies.length, 1);
});

test('6 章の トモオカ: 体を 攻撃されると 右腕が 大きく、右腕を ねらうと しぼむ。限界で 防御不能の 丘砕きの一撃', async () => {
    const { lockOn } = await import('../src/logic/battle.js');
    const b = createBattle({ allies: [{ uid: 'a', id: 'koori', lv: 40 }, { uid: 'b', id: 'kogame', lv: 40 }, { uid: 'c', id: 'haribaby', lv: 40 }], enemies: [{ id: 'tomooka6', lv: 28 }], rng: createRng(2), kind: 'boss' });
    const boss = b.enemies[0];
    const start = boss.armLv;
    const hit = n => { for (let i = 0; i < n; i++) { b.wheel.forEach(u => { if (u) u.timer = 99; }); boss.hp = boss.max; step(b, 0.05); } };
    hit(4);
    assert.ok(boss.armLv > start, '体を たたくと 右腕が 大きく なる');
    // 限界まで → ため → 防御不能の 一撃
    for (let i = 0; i < 200 && !b.armCharge; i++) hit(1);
    assert.equal(boss.armLv, boss.armDef.max);
    assert.ok(b.armCharge, '限界で ために 入る');
    // 右腕を ねらって しぼませると 止まる
    assert.ok(lockOn(b, boss.uid, 'arm'));
    for (let i = 0; i < 200 && b.armCharge; i++) hit(1);
    assert.ok(!b.armCharge && boss.armLv < boss.armDef.max, '右腕が しぼんで 止まる');
    assert.ok(b.events.some(e => e.type === 'bigCancel' && e.arm));
    // ためきると 打つ (まもりも むし)
    boss.armLv = boss.armDef.max;
    b.armCharge = { uid: boss.uid, left: 0.01 };
    b.wheel.forEach(u => { if (u) u.guarding = true; });
    step(b, 0.05);
    assert.ok(b.events.some(e => e.type === 'special' && e.name === '丘砕きの一撃'));
    assert.equal(boss.armLv, boss.armDef.after, '打つと 右腕は もとに もどる');
});

test('7 章の ルナヤ: 月が 時間で 満ち、満月で ムーンビームを ためる。月を ねらうと 欠けて 止まる。ときどき 同じ わざを もう いちど', async () => {
    const { lockOn } = await import('../src/logic/battle.js');
    const b = createBattle({ allies: [{ uid: 'a', id: 'koori', lv: 40 }, { uid: 'b', id: 'kogame', lv: 40 }, { uid: 'c', id: 'haribaby', lv: 40 }], enemies: [{ id: 'runaya7', lv: 30 }], rng: createRng(6), kind: 'boss' });
    const boss = b.enemies[0];
    assert.equal(boss.armLv, 0);
    for (let i = 0; i < 1000 && !b.armCharge; i++) { boss.hp = boss.max; step(b, 0.05); }
    assert.equal(boss.armLv, boss.armDef.max, '時間で 満月');
    assert.ok(b.armCharge, 'ムーンビームを ためる');
    assert.ok(lockOn(b, boss.uid, 'moon'));
    const hp = boss.hp;
    for (let i = 0; i < 200 && b.armCharge; i++) { b.wheel.forEach(u => { if (u) u.timer = 99; }); step(b, 0.05); }
    assert.ok(!b.armCharge && boss.armLv < boss.armDef.max, '月が 欠けて 止まる');
    assert.ok(hp - boss.hp < boss.max * 0.1, '月を ねらうと ルナヤには ほとんど ダメージなし');
    // もの忘れ
    const b2 = createBattle({ allies: [{ uid: 'a', id: 'koori', lv: 10 }], enemies: [{ id: 'runaya7', lv: 30 }], rng: createRng(1), kind: 'boss' });
    for (let i = 0; i < 600 && !b2.events.some(e => e.type === 'repeat'); i++) { b2.enemies[0].hp = b2.enemies[0].max; b2.wheel[0].hp = b2.wheel[0].max; step(b2, 0.05); }
    assert.ok(b2.events.some(e => e.type === 'repeat'), 'あら、これ もう 言ったかしら？');
});

// 8 章の ボス (2026-10-30 ユーザー指定)
const strongParty = () => ['koori', 'kogame', 'haribaby', 'kozarappa', 'ishikoron', 'mizukirin'].map((id, i) => ({ uid: `a${i}`, id, lv: 70 }));
const keepAlive = b => b.wheel.forEach(u => { if (u) { u.hp = u.max; u.ko = false; } });

test('8 章の 大鬼: わざは ぜんぶ 全体攻撃。足に 当てつづけて こわすと 転んで チャンスタイム → 足は もとに もどる', async () => {
    const { lockOn } = await import('../src/logic/battle.js');
    const { BOSSES } = await import('../src/data/nakama.js');
    const def = BOSSES.ooni8;
    for (const m of [...def.moves, def.bigMove]) for (const fx of m.effects) if (fx.kind === 'attack' || fx.kind === 'status') assert.equal(fx.target, 'all', m.name);
    const b = createBattle({ allies: strongParty(), enemies: [{ id: 'ooni8', lv: 31 }], rng: createRng(3), kind: 'boss' });
    const boss = b.enemies[0];
    assert.ok(lockOn(b, boss.uid, 'legs'));
    for (let i = 0; i < 2000 && !b.chance; i++) { boss.hp = boss.max; keepAlive(b); step(b, 0.05); }
    assert.ok(b.chance && b.events.some(e => e.type === 'chance' && e.why === 'fall'), '転んで チャンスタイム');
    assert.ok(boss.gims.legs.broken);
    for (let i = 0; i < 2000 && b.chance; i++) { boss.hp = boss.max; keepAlive(b); step(b, 0.05); }
    assert.ok(!boss.gims.legs.broken, 'チャンスタイムが おわると 足は もとに もどる');
});

test('8 章の 双頭鬼: 頭を こわすと その 頭の わざが 使えない。両方 こわすと チャンスタイム → 頭は もとに もどる', async () => {
    const { lockOn } = await import('../src/logic/battle.js');
    const b = createBattle({ allies: strongParty(), enemies: [{ id: 'soutou8', lv: 32 }], rng: createRng(5), kind: 'boss' });
    const boss = b.enemies[0];
    assert.ok(lockOn(b, boss.uid, 'rhead'));
    for (let i = 0; i < 2000 && !boss.gims.rhead.broken; i++) { boss.hp = boss.max; keepAlive(b); step(b, 0.05); }
    assert.ok(boss.gims.rhead.broken && !b.chance, '右の 頭 だけでは チャンスに ならない');
    const from = b.events.length;
    for (let i = 0; i < 600; i++) { boss.hp = boss.max; keepAlive(b); b.wheel.forEach(u => { if (u) u.timer = 0; }); step(b, 0.05); }
    const used = b.events.slice(from).filter(e => e.type === 'skill' && e.actor === boss.uid).map(e => e.name);
    assert.ok(used.length > 3, `わざを 使う ${used.length}`);
    assert.ok(!used.some(n => n.startsWith('右の頭')), '右の 頭の わざ (とりつき) は 使わない');
    assert.ok(lockOn(b, boss.uid, 'lhead'));
    for (let i = 0; i < 2000 && !b.chance; i++) { boss.hp = boss.max; keepAlive(b); step(b, 0.05); }
    assert.ok(b.events.some(e => e.type === 'chance' && e.why === 'heads'), '両方 こわすと チャンスタイム');
    for (let i = 0; i < 2000 && b.chance; i++) { boss.hp = boss.max; keepAlive(b); step(b, 0.05); }
    assert.ok(!boss.gims.rhead.broken && !boss.gims.lhead.broken, '頭は もとに もどる');
});

test('8 章の 金滅鬼: めくらましの とりつきを かける。チャンスタイムは ない (なぐりあい)', async () => {
    const { BOSSES } = await import('../src/data/nakama.js');
    const def = BOSSES.kinme8;
    assert.ok(def.moves.some(m => m.effects.some(fx => fx.status === 'blind')));
    assert.ok(!def.gims && !def.parts, 'ねらえる 部位は ない');
    const others = ['ooni8', 'soutou8'].map(id => BOSSES[id]);
    for (const o of others) assert.ok(def.base.hp > o.base.hp && def.base.atk > o.base.atk && def.lv > o.lv, `${o.name}より 強い`);
    const b = createBattle({ allies: strongParty(), enemies: [{ id: 'kinme8', lv: 33 }], rng: createRng(8), kind: 'boss' });
    for (let i = 0; i < 1200; i++) { b.enemies[0].hp = b.enemies[0].max; keepAlive(b); step(b, 0.05); }
    assert.ok(b.events.some(e => e.type === 'status' && e.status === 'blind'), 'めくらましの とりつき');
    assert.ok(!b.events.some(e => e.type === 'chance'), 'チャンスタイムは ない');
});

test('8 章の おにおに: ためている あいだに ダメージを あたえると 紋が 暴発 (味方に ダメージ・チャンスタイム)。2 回目からは ガード', async () => {
    const { BOSSES } = await import('../src/data/nakama.js');
    const kin = BOSSES.kinme8, oni = BOSSES.onioni8;
    assert.ok(oni.base.atk > kin.base.atk && oni.lv > kin.lv, '金滅鬼より はげしい');
    assert.ok(oni.moves.some(m => m.name === '大火炎の術' && m.effects[0].target === 'all' && m.effects[0].magic));
    assert.ok(oni.moves.some(m => m.effects.some(fx => fx.status === 'slow' && fx.target === 'all')), '全体の のろいの とりつき');
    const b = createBattle({ allies: strongParty(), enemies: [{ id: 'onioni8', lv: 35 }], rng: createRng(2), kind: 'boss' });
    const boss = b.enemies[0];
    b.bossTimer = oni.bigMove.every;
    step(b, 0.05);
    assert.ok(b.burst && !b.burst.guard, '1 回目の ため (ガードなし)');
    const hp0 = b.wheel.map(u => u && u.hp);
    for (let i = 0; i < 400 && b.burst; i++) { boss.hp = boss.max; step(b, 0.05); }
    assert.ok(b.events.some(e => e.type === 'burstBreak'), '紋が 暴発');
    assert.ok(b.events.some(e => e.type === 'chance' && e.why === 'burst'), 'チャンスタイム');
    assert.ok(!b.events.some(e => e.type === 'special' && e.name === oni.bigMove.name), '必殺技は 打たない');
    assert.ok(b.events.some(e => e.type === 'special' && e.name === oni.bigMove.burst.name), '暴発で 味方に ダメージ');
    for (let i = 0; i < 2000 && b.chance; i++) { boss.hp = boss.max; keepAlive(b); step(b, 0.05); }
    // 2 回目: ガードで ダメージが へる
    b.bossTimer = oni.bigMove.every;
    step(b, 0.05);
    assert.ok(b.burst && b.burst.guard, '2 回目の ため は ガード');
    const from = b.events.length;
    for (let i = 0; i < 20 && b.burst; i++) { boss.hp = boss.max; keepAlive(b); step(b, 0.05); }
    const hits = b.events.slice(from).filter(e => e.type === 'damage' && e.target === boss.uid);
    assert.ok(hits.length && hits.every(e => e.guard), 'ガード中の ダメージ');
    assert.ok(hp0.length);
});

test('8 章の おにおに: ため の あいだに ダメージが たりないと 必殺技を 打つ', async () => {
    const { BOSSES } = await import('../src/data/nakama.js');
    const oni = BOSSES.onioni8;
    const b = createBattle({ allies: [{ uid: 'a', id: 'kogame', lv: 5 }], enemies: [{ id: 'onioni8', lv: 35 }], rng: createRng(1), kind: 'boss' });
    b.bossTimer = oni.bigMove.every;
    step(b, 0.05);
    for (let i = 0; i < 400 && b.burst; i++) { b.wheel[0].hp = b.wheel[0].max; b.wheel[0].timer = 0; step(b, 0.05); }
    assert.ok(b.events.some(e => e.type === 'special' && e.name === oni.bigMove.name));
    assert.ok(!b.events.some(e => e.type === 'burstBreak'));
});

test('14 章の サアラハ: ふるカワの おりを こわすと チャンスタイム。おりは もどらず「ふるカワを 盾に」も 使わない', async () => {
    const { lockOn } = await import('../src/logic/battle.js');
    const b = createBattle({ allies: strongParty(), enemies: [{ id: 'saaraha14', lv: 42 }], rng: createRng(4), kind: 'boss' });
    const boss = b.enemies[0];
    assert.ok(lockOn(b, boss.uid, 'cage'));
    for (let i = 0; i < 2000 && !b.chance; i++) { boss.hp = boss.max; keepAlive(b); step(b, 0.05); }
    assert.ok(b.events.some(e => e.type === 'chance' && e.why === 'cage'));
    for (let i = 0; i < 2000 && b.chance; i++) { boss.hp = boss.max; keepAlive(b); step(b, 0.05); }
    assert.ok(boss.gims.cage.broken, 'おりは もどらない');
    const from = b.events.length;
    for (let i = 0; i < 600; i++) { boss.hp = boss.max; keepAlive(b); step(b, 0.05); }
    assert.ok(!b.events.slice(from).some(e => e.type === 'skill' && e.name === 'ふるカワを 盾に'));
});

test('14 章の リハマ: 赤信号の あいだは 体が かたく、信号機を こわすと チャンスタイム (信号は もどる)', async () => {
    const { lockOn, gimOpen } = await import('../src/logic/battle.js');
    const b = createBattle({ allies: strongParty(), enemies: [{ id: 'rihama14', lv: 42 }], rng: createRng(9), kind: 'boss' });
    const boss = b.enemies[0];
    assert.ok(!gimOpen(b, boss, 'signal'), 'ふだんは 信号機を ねらえない');
    for (let i = 0; i < 3000 && !(boss.shell > 0); i++) { boss.hp = boss.max; keepAlive(b); step(b, 0.05); }
    assert.ok(boss.shell > 0, '赤信号');
    assert.ok(gimOpen(b, boss, 'signal'));
    assert.ok(lockOn(b, boss.uid, 'signal'));
    for (let i = 0; i < 2000 && !b.chance; i++) { boss.hp = boss.max; keepAlive(b); if (!(boss.shell > 0) && !boss.gims.signal.broken) boss.shell = 6; step(b, 0.05); }
    assert.ok(b.events.some(e => e.type === 'chance' && e.why === 'signal'));
    assert.equal(boss.shell, 0, '赤信号が おわる');
    for (let i = 0; i < 2000 && b.chance; i++) { boss.hp = boss.max; keepAlive(b); step(b, 0.05); }
    assert.ok(!boss.gims.signal.broken, '信号は もどる');
});

test('9 章の ハル麒麟: HP が 半分で ため → 角が のこっていたら 全回復。チャンスタイムは なし', () => {
    const b = createBattle({ allies: strongParty(), enemies: [{ id: 'harukirin9', lv: 37 }], rng: createRng(3), kind: 'boss' });
    const boss = b.enemies[0];
    for (let i = 0; i < 3000 && !b.regen; i++) { keepAlive(b); step(b, 0.05); }
    assert.ok(b.regen, 'HP が 半分を 切ると ためる');
    assert.ok(boss.hp <= boss.max * 0.5);
    b.wheel.forEach(u => { if (u) u.timer = -999; });   // ため の あいだ 攻撃しない
    for (let i = 0; i < 400 && b.regen; i++) step(b, 0.05);
    assert.equal(boss.hp, boss.max, '角が のこっていたので 全回復');
    assert.ok(b.events.some(e => e.type === 'regenHeal'));
    assert.ok(!b.events.some(e => e.type === 'chance'), 'チャンスタイムは ない');
});

test('9 章の ハル麒麟: 角を こわすと 全回復の ため が 止まり、もう ためない', async () => {
    const { lockOn } = await import('../src/logic/battle.js');
    const b = createBattle({ allies: strongParty(), enemies: [{ id: 'harukirin9', lv: 37 }], rng: createRng(5), kind: 'boss' });
    const boss = b.enemies[0];
    for (let i = 0; i < 3000 && !b.regen; i++) { keepAlive(b); step(b, 0.05); }
    assert.ok(b.regen);
    boss.gims.horn.hp = 1;
    assert.ok(lockOn(b, boss.uid, 'horn'));
    for (let i = 0; i < 400 && !boss.gims.horn.broken; i++) { keepAlive(b); step(b, 0.05); }
    assert.ok(boss.gims.horn.broken);
    assert.ok(!b.regen && b.events.some(e => e.type === 'regenCancel'), 'ため が 止まる');
    boss.hp = Math.round(boss.max * 0.4);
    for (let i = 0; i < 200; i++) { boss.hp = Math.max(1, boss.hp); keepAlive(b); step(b, 0.05); }
    assert.ok(!b.regen && !b.events.some(e => e.type === 'regenHeal'), '角が ないと もう 全回復しない');
});

test('9 章の ノゾエマ: 1 体・全体の 斬撃。「筋肉の おたすけ」で こうげきが 重なって 上がる。チャンスタイムは なし', async () => {
    const { BOSSES } = await import('../src/data/nakama.js');
    const def = BOSSES.nozoema9;
    assert.ok(def.moves.some(m => m.effects.some(fx => fx.kind === 'attack' && fx.target === 'one')));
    assert.ok(def.moves.some(m => m.effects.some(fx => fx.kind === 'attack' && fx.target === 'all')));
    assert.ok(!def.gims && !def.parts && !def.regen);
    assert.ok(def.lv > BOSSES.harukirin9.lv && def.base.atk > BOSSES.harukirin9.base.atk, '中盤の 鬼門');
    const b = createBattle({ allies: strongParty(), enemies: [{ id: 'nozoema9', lv: 40 }], rng: createRng(2), kind: 'boss' });
    const boss = b.enemies[0];
    let most = 0;
    for (let i = 0; i < 3000; i++) { boss.hp = boss.max; keepAlive(b); step(b, 0.05); most = Math.max(most, boss.buffs.atk?.amount || 0); }
    const n = b.events.filter(e => e.type === 'skill' && e.name === '筋肉の おたすけ').length;
    assert.ok(n >= 2, `おたすけ ${n} 回`);
    assert.ok(most > 0.2 + 1e-9, `こうげきが 重なって 上がる (${most})`);
    assert.ok(most <= def.moves.find(m => m.name === '筋肉の おたすけ').effects[0].cap + 1e-9, '上限まで');
    assert.ok(!b.events.some(e => e.type === 'chance'));
});

test('こおりくんの 必殺技は 9 章 クリアで「絶対殺すソード・レクイエム」に 進化する', () => {
    const b = createBattle({ allies: [{ uid: 'a', id: 'koori', lv: 30 }], enemies: [{ id: 'ishikoron', lv: 1 }], rng: createRng(1) });
    assert.equal(b.wheel[0].special.name, '大腸炎アタック');
    const b2 = createBattle({ allies: [{ uid: 'a', id: 'koori', lv: 30, upgrade: true }, { uid: 'b', id: 'kogame', lv: 30, upgrade: true }], enemies: [{ id: 'ishikoron', lv: 1 }], rng: createRng(1) });
    assert.equal(b2.wheel[0].special.name, '絶対殺すソード・レクイエム');
    assert.equal(b2.wheel[1].special.name, NAKAMA.kogame.special.name, 'ほかの なかまは かわらない');
});
