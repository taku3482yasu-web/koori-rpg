// ゲームの 進み (ストーリー・仲間になる・時間)・町を 歩く テスト
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/core/rng.js';
import { newGame, receiveWatch, encounter, applyBattleResult, befriendRate, advanceTime, spotKinds, objective, migrate, PITY_WINS, watchMedals } from '../src/logic/game.js';
import { createBattle } from '../src/logic/battle.js';
import { SPOTS, BUILDINGS, TILE, START } from '../src/data/map.js';
import { blockedTile, moveHero, lookAt } from '../src/logic/world.js';

const spot = id => SPOTS.find(s => s.id === id);
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
    assert.equal(g.story, 'friends');
    const rng = { chance: () => true, int: () => 0, next: () => 0, weighted: l => l[0] };
    for (const id of ['ishikoron', 'kogame', 'haribaby']) applyBattleResult(g, winBattle(g, [{ id, lv: 3 }]), rng);
    assert.equal(g.story, 'bridge');
    assert.equal(g.watch.filter(Boolean).length, 4);
    const out = applyBattleResult(g, winBattle(g, [{ id: 'nushi', lv: 8 }], 'boss'), rng);
    assert.equal(out.befriend.id, 'hashishita');
    assert.equal(g.story, 'clear');
    assert.match(objective(g), /5\/20/);
});

test('仲間に なる 確率: E は 25%・好物で 2 倍・10 回 勝つと 必ず', () => {
    const g = newGame('menkyo');
    assert.equal(befriendRate(g, 'kogame', null), 0.25);
    assert.equal(befriendRate(g, 'kogame', { target: 'kogame', favorite: true }), 0.5);
    assert.ok(Math.abs(befriendRate(g, 'kogame', { target: 'kogame', favorite: false }) - 0.325) < 1e-9);
    g.wins.kogame = PITY_WINS;
    assert.equal(befriendRate(g, 'kogame', null), 1);
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
    assert.deepEqual(spotKinds(g, spot('asase')).map(k => k.id), ['kogame']);
    g.weather = 'rain';
    assert.deepEqual(spotKinds(g, spot('asase')).map(k => k.id), ['kogame', 'shinobigaeru']);
    assert.deepEqual(spotKinds(g, spot('hashishita')).map(k => k.id), ['kozarappa']);
    g.story = 'clear';
    assert.deepEqual(spotKinds(g, spot('hashishita')).map(k => k.id), ['kozarappa', 'hashishita']);
});

test('ねると 時間が 進み、夜の 次は 次の日の 朝', () => {
    const g = newGame('naitei');
    const rng = createRng(1);
    for (let i = 0; i < 4; i++) advanceTime(g, rng);
    assert.equal(g.day, 2);
    assert.equal(g.time, 0);
});

test('出会い: 1 章の 野生は Lv2〜5・図鑑に 「見た」が つく', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    const rng = createRng(2);
    for (let i = 0; i < 50; i++) {
        const enemies = encounter(g, spot('kawara'), rng);
        for (const e of enemies) assert.ok(e.lv >= 1 && e.lv <= 5);
    }
    assert.ok(g.zukan.seen.ishikoron);
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
    const west = SPOTS.filter(s => s.x < 30);
    const kinds = new Set(west.flatMap(s => spotKinds(g, s).map(k => k.id)));
    assert.ok(kinds.size >= 10, `${kinds.size} 種類`);
});

test('セーブの 形を 直す (古い セーブに 足りない 項目)', () => {
    const g = migrate({ version: 'naitei', story: 'friends', medals: [], zukan: { seen: { kogame: true } } });
    assert.equal(g.zukan.seen.kogame, true);
    assert.deepEqual(g.zukan.friends, {});
    assert.equal(g.watch.length, 6);
});
