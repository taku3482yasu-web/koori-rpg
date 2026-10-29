// ゲームの 進み (ストーリー・仲間になる・時間)・町を 歩く テスト
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/core/rng.js';
import { newGame, receiveWatch, encounter, applyBattleResult, acceptBefriend, befriendRate, advanceTime, spotKinds, objective, migrate, PITY_WINS, watchMedals, takeGift, buyItem, maxBuy, MAX_ITEM, bossEnemies } from '../src/logic/game.js';
import { createBattle } from '../src/logic/battle.js';
import { SPOTS, ROAMS, BUILDINGS, TILE, START, FRIENDS, MYSTERIES } from '../src/data/map.js';
import { blockedTile, moveHero, lookAt, peopleHere, mysteriesSolved } from '../src/logic/world.js';

const spot = id => SPOTS.find(s => s.id === id) || ROAMS.find(s => s.id === id);
const winBattle = (g, enemies, kind = 'wild') => {
    const b = createBattle({ allies: watchMedals(g), enemies, rng: createRng(1), kind });
    b.outcome = 'win';
    return b;
};

test('神社で ウォッチを もらい、なかまを 3 体 ふやすと 橋へ、ヌシを たおすと 1 章 クリア', () => {
    const g = newGame('naitei');
    assert.equal(g.story, 'intro');
    const m = receiveWatch(g);
    assert.equal(m.id, 'daichouenkin');
    assert.equal(g.watch[0], m.uid);
    // こおりくんも ウォッチに 入る (2026-10-27)。図鑑には のらない
    assert.equal(g.watch[1], 'hero');
    assert.equal(g.medals[0].id, 'koori');
    assert.ok(!g.zukan.friends.koori);
    assert.equal(g.story, 'friends');
    const rng = { chance: () => true, int: () => 0, next: () => 0, weighted: l => l[0] };
    for (const id of ['ishikoron', 'kogame', 'haribaby']) acceptBefriend(g, applyBattleResult(g, winBattle(g, [{ id, lv: 3 }]), rng));
    assert.equal(g.story, 'bridge');
    assert.equal(g.watch.filter(Boolean).length, 5);
    const out = applyBattleResult(g, winBattle(g, [{ id: 'nushi', lv: 8 }], 'boss'), rng);
    assert.equal(out.befriend.id, 'hashishita');
    assert.equal(g.story, 'clear');
    assert.match(objective(g), /七不思議/);
});

test('2 章: 七不思議を 7 つ たしかめると 8 つ目の 影が 出て、たおすと 2 章 クリア (2026-10-28)', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    g.story = 'school';
    const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
    assert.ok(!peopleHere(g).some(p => p.id === 'kage'), 'はじめは 影が いない');
    for (const m of MYSTERIES) {
        const b = winBattle(g, [{ id: m.nakama, lv: m.lv }]);
        b.mystery = m.id;
        applyBattleResult(g, b, rng);
    }
    assert.equal(mysteriesSolved(g), 7);
    assert.match(objective(g), /黒い 影/);
    assert.ok(peopleHere(g).some(p => p.id === 'kage'), '7 つ たしかめると ろうかに 影');
    const out = applyBattleResult(g, winBattle(g, bossEnemies('kage'), 'boss'), rng);
    assert.equal(out.bossId, 'kage');
    assert.equal(out.befriend.id, 'lunashadow');
    assert.equal(g.story, 'clear2');
    assert.ok(!peopleHere(g).some(p => p.id === 'kage'), 'たおすと いなくなる');
    assert.match(objective(g), /学校 1\/9/);
});

test('2 章: 負けた 七不思議は たしかめた ことに ならない', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    g.story = 'school';
    const b = winBattle(g, [{ id: 'umibozun', lv: 12 }]);
    b.outcome = 'lose';
    b.mystery = 'pool';
    applyBattleResult(g, b, { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] });
    assert.equal(mysteriesSolved(g), 0);
});

test('商店街へは 1 章 クリアまで 工事中の さくで 行けない', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    assert.ok(blockedTile(g, 12, 35) && blockedTile(g, 41, 35));
    g.pos = { x: 12 * TILE + 8, y: 34 * TILE + 12, dir: 'down' };
    assert.equal(lookAt(g)?.type, 'gate');
    g.story = 'clear';
    assert.ok(!blockedTile(g, 12, 35) && !blockedTile(g, 41, 35));
    // 商店街の キャラは Lv6〜10
    const e = encounter(g, spot('arcadeW'), createRng(3));
    assert.ok(e[0].lv >= 6 && e[0].lv <= 10, `Lv${e[0].lv}`);
});

test('仲間に なる 確率: E は 25%・好物で 2 倍・10 回 勝つと 必ず', () => {
    const g = newGame('menkyo');
    assert.equal(befriendRate(g, 'kogame', null), 0.25);
    assert.equal(befriendRate(g, 'kogame', { target: 'kogame', favorite: true }), 0.5);
    assert.ok(Math.abs(befriendRate(g, 'kogame', { target: 'kogame', favorite: false }) - 0.325) < 1e-9);
    g.wins.kogame = PITY_WINS;
    assert.equal(befriendRate(g, 'kogame', null), 1);
});

test('仲間に なりたそうでも、えらばなければ 仲間に ならない (2026-10-28)', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    const rng = { chance: () => true, int: () => 0, next: () => 0, weighted: l => l[0] };
    const before = g.medals.length;
    const out = applyBattleResult(g, winBattle(g, [{ id: 'kogame', lv: 3 }]), rng);
    assert.equal(out.befriend.id, 'kogame');
    assert.equal(g.medals.length, before, 'まだ 仲間に なっていない');
    assert.ok(!g.zukan.friends.kogame);
    const m = acceptBefriend(g, out);
    assert.equal(m.id, 'kogame');
    assert.equal(g.medals.length, before + 1);
    assert.ok(g.zukan.friends.kogame);
    assert.equal(acceptBefriend(g, out), m, '2 回 えらんでも 1 枚');
});

test('仲間に なる 割合を 2000 回 ためすと だいたい 25%', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    const rng = createRng(7);
    let n = 0;
    for (let i = 0; i < 2000; i++) {
        g.wins = {};
        const out = applyBattleResult(g, winBattle(g, [{ id: 'kogame', lv: 3 }]), rng);
        if (out.befriend) n++;
    }
    assert.ok(n > 430 && n < 570, `${n}/2000`);
});

test('夜だけ・雨の日だけ・クリア後だけの キャラ', () => {
    const g = newGame('naitei');
    assert.equal(spotKinds(g, spot('shrineTree')).length, 0);
    g.time = 3;
    assert.equal(spotKinds(g, spot('shrineTree'))[0].id, 'yofukashi');
    assert.deepEqual(spotKinds(g, spot('kawaraS')).map(k => k.id), ['kogame', 'kozarappa']);
    g.weather = 'rain';
    assert.deepEqual(spotKinds(g, spot('kawaraS')).map(k => k.id), ['kogame', 'kozarappa', 'shinobigaeru']);
    assert.deepEqual(spotKinds(g, spot('hashishita')).map(k => k.id), []);
    g.story = 'clear';
    assert.deepEqual(spotKinds(g, spot('hashishita')).map(k => k.id), ['hashishita']);
});

test('ねると 時間が 進み、夜の 次は 次の日の 朝', () => {
    const g = newGame('naitei');
    const rng = createRng(1);
    for (let i = 0; i < 4; i++) advanceTime(g, rng);
    assert.equal(g.day, 2);
    assert.equal(g.time, 0);
});

test('出会い: 話しかけた キャラが 先頭・1 章の 野生は Lv5 まで・図鑑に 「見た」が つく', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    const rng = createRng(2);
    for (let i = 0; i < 50; i++) {
        const enemies = encounter(g, spot('park'), rng, { id: 'nemuridake', lv: 4 });
        assert.deepEqual(enemies[0], { id: 'nemuridake', lv: 4 });
        for (const e of enemies) assert.ok(e.lv >= 1 && e.lv <= 5);
    }
    assert.ok(g.zukan.seen.nemuridake);
});

test('町を 歩く: 川と 建物には 入れない。橋は ヌシが いる あいだ 渡れない', () => {
    const g = newGame('naitei');
    assert.ok(blockedTile(g, 31, 10));            // 川
    assert.ok(blockedTile(g, 4, 21));             // 家
    assert.ok(!blockedTile(g, 29, 17));           // 橋の 西の はし
    assert.ok(blockedTile(g, 31, 17));            // ヌシ
    g.story = 'clear';
    assert.ok(!blockedTile(g, 31, 17));
    // 家の 前から 上を 向いて 調べると 家の 入り口
    g.pos = { x: START.x * TILE + 8, y: START.y * TILE + 12, dir: 'up' };
    assert.equal(lookAt(g).building.id, 'home');
    // 歩くと 動く
    const x = g.pos.x;
    moveHero(g, 3, 0);
    assert.equal(g.pos.x, x + 3);
    assert.ok(BUILDINGS.length >= 5);
});

test('西側 (橋の 手前) から、1 章クリア前に 行ける 場所 だけで なかま 3 体 以上に 会える', () => {
    // 西側の 場所 (橋より 西) で 昼に 会える キャラ
    const g = newGame('naitei');
    receiveWatch(g);
    const west = [...SPOTS.filter(s => s.x < 30), ...ROAMS.filter(r => r.x1 < 30)];
    const kinds = new Set(west.flatMap(s => spotKinds(g, s).map(k => k.id)));
    assert.ok(kinds.size >= 10, `${kinds.size} 種類`);
});

test('セーブの 形を 直す (古い セーブに 足りない 項目)', () => {
    const g = migrate({ version: 'naitei', story: 'friends', medals: [{ uid: 'm1', id: 'kogame', lv: 9, exp: 0 }], watch: ['m1', null, null, null, null, null], zukan: { seen: { kogame: true } } });
    assert.equal(g.zukan.seen.kogame, true);
    assert.deepEqual(g.zukan.friends, {});
    assert.equal(g.watch.length, 6);
    // こおりくんの メダルが 足され、あいている ところに 入る (Lv は なかまの いちばん 高い Lv)
    assert.equal(g.medals[0].id, 'koori');
    assert.equal(g.medals[0].lv, 9);
    assert.equal(g.watch[1], 'hero');
});

test('話せる キャラ (印なし) は 1 日 1 回 道具を くれる', () => {
    const g = newGame('naitei');
    const f = FRIENDS.find(x => x.id === 'f_kogame');
    const before = g.items.kyuuri || 0;
    assert.deepEqual(takeGift(g, f), { item: 'kyuuri', n: 1 });
    assert.equal(g.items.kyuuri, before + 1);
    assert.equal(takeGift(g, f), null, '同じ 日は もう くれない');
    advanceTime(g, createRng(1)); advanceTime(g, createRng(1)); advanceTime(g, createRng(1)); advanceTime(g, createRng(1));
    assert.ok(takeGift(g, f), '次の 日は また くれる');
    assert.equal(takeGift(g, FRIENDS.find(x => !x.gift)), null);
});

test('駄菓子屋で 何こ 買うか えらべる。お金と 99 こ までが 上限 (2026-10-28)', () => {
    const g = newGame('naitei');
    g.money = 200;
    g.items.choco = 0;
    assert.equal(maxBuy(g, 'choco'), 5, '40円 × 5 = 200円');
    assert.ok(buyItem(g, 'choco', 3));
    assert.equal(g.money, 80);
    assert.equal(g.items.choco, 3);
    assert.equal(buyItem(g, 'choco', 3), false, 'お金が たりないと 買えない');
    assert.equal(buyItem(g, 'choco', 0), false);
    assert.equal(g.money, 80);
    g.money = 99999;
    g.items.choco = MAX_ITEM - 2;
    assert.equal(maxBuy(g, 'choco'), 2, '99 こ まで');
});

test('町の キャラとは ぶつかる (すけない)。重なっていても はなれる 向きには 動ける', () => {
    const g = newGame('naitei');
    g.pos = { x: 6 * TILE + 8, y: 26 * TILE + 12, dir: 'right' };
    const c = { x: g.pos.x + 14, y: g.pos.y };
    for (let i = 0; i < 20; i++) moveHero(g, 1, 0, [c]);
    assert.ok(c.x - g.pos.x >= 10, `止まる (${c.x - g.pos.x})`);
    const on = { x: g.pos.x + 2, y: g.pos.y };
    const x0 = g.pos.x;
    moveHero(g, -1, 0, [on]);
    assert.equal(g.pos.x, x0 - 1, 'はなれる 向きには 動ける');
});

test('にげたら お金も けいけんちも かわらない', () => {
    const g = newGame('naitei', 1);
    g.money = 500;
    const b = createBattle({ allies: [{ id: 'kogame', lv: 9 }], enemies: [{ id: 'saikoron', lv: 3 }], rng: createRng(8) });
    b.outcome = 'flee';
    const out = applyBattleResult(g, b, createRng(1));
    assert.equal(g.money, 500);
    assert.equal(out.money, 0);
    assert.equal(out.exp, 0);
});
