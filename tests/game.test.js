// ゲームの 進み (ストーリー・仲間になる・時間)・町を 歩く テスト
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/core/rng.js';
import { newGame, receiveWatch, encounter, applyBattleResult, acceptBefriend, befriendRate, advanceTime, spotKinds, objective, migrate, PITY_WINS, watchMedals, takeGift, buyItem, maxBuy, MAX_ITEM, bossEnemies, readLegend, sealsSolved, startChapter4, arriveUmi, canRideTrain, rivalEnemies } from '../src/logic/game.js';
import { createBattle } from '../src/logic/battle.js';
import { SPOTS, ROAMS, BUILDINGS, TILE, START, FRIENDS, MYSTERIES, SEALS, YAMA_Y0, UMI_Y0 } from '../src/data/map.js';
import { blockedTile, moveHero, lookAt, peopleHere, mysteriesSolved, gatesHere } from '../src/logic/world.js';

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
    assert.match(objective(g), /山道/);
});

test('3 章: 山に 入り、奥の院で 言いつたえを 読み、封印を 3 つ とくと ダムの主が 出て、たおすと 3 章 クリア (2026-10-29)', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    g.story = 'clear2';
    const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
    assert.ok(!gatesHere(g).some(q => q.id === 'gateYama'), '2 章 クリアで 山道が 通れる');
    g.story = 'yama';
    assert.match(objective(g), /奥の院/);
    assert.ok(readLegend(g), 'はじめて 読む');
    assert.ok(!readLegend(g), '2 回目は なにも おきない');
    assert.match(objective(g), /封印.*0\/3/);
    for (const m of SEALS) {
        assert.ok(!peopleHere(g).some(p => p.id === 'damNushi'), '封印が のこって いると ダムの主は いない');
        const b = winBattle(g, [{ id: m.nakama, lv: m.lv }]);
        b.mystery = m.id;
        applyBattleResult(g, b, rng);
    }
    assert.equal(sealsSolved(g), 3);
    assert.equal(mysteriesSolved(g), 0, '七不思議の 数には 入らない');
    assert.ok(peopleHere(g).some(p => p.id === 'damNushi'), '封印を ぜんぶ とくと ダムの主');
    const lake = { x: 25, y: YAMA_Y0 + 8 };
    assert.ok(!blockedTile(g, lake.x, lake.y), 'クリア前は 湖の 底を 歩ける');
    const out = applyBattleResult(g, winBattle(g, bossEnemies('himuro'), 'boss'), rng);
    assert.equal(out.bossId, 'himuro');
    assert.equal(out.befriend.id, 'hyougaryu');
    assert.equal(g.story, 'clear3');
    assert.ok(!peopleHere(g).some(p => p.id === 'damNushi'), 'たおすと いなくなる');
    assert.ok(blockedTile(g, lake.x, lake.y), 'クリアで 湖に 水が もどる');
    assert.match(objective(g), /ともいし/, '3 章 クリアの あとは ともいしと 話す (4 章へ)');
});

test('4 章: ともいしと 話す → 電車で 海辺の 町 → ライバル探検隊 (バージョンで ちがう) → 浦の島重蔵を たおすと 4 章 クリア (2026-10-29)', () => {
    for (const version of ['naitei', 'menkyo']) {
        const g = newGame(version);
        receiveWatch(g);
        const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
        g.story = 'yama';
        assert.ok(!canRideTrain(g), '3 章の あいだは 電車に 乗れない');
        assert.ok(!startChapter4(g), '3 章 クリア前は 始まらない');
        g.story = 'clear3';
        assert.ok(startChapter4(g));
        assert.equal(g.story, 'umi');
        assert.ok(canRideTrain(g));
        assert.match(objective(g), /石の川駅/);
        assert.ok(arriveUmi(g), 'はじめて 着いた');
        assert.ok(!arriveUmi(g), '2 回目は なにも おきない');
        assert.ok(peopleHere(g).some(p => p.id === 'rival4'), 'ライバル探検隊が 通路を ふさぐ');
        assert.ok(!peopleHere(g).some(p => p.id === 'urashima4'));
        const team = rivalEnemies(g);
        assert.equal(team.length, 3);
        assert.deepEqual(team.map(e => e.id), version === 'naitei' ? ['sasaki', 'asahara', 'kotani'] : ['shibata', 'ueno', 'ikekimu']);
        const rival = applyBattleResult(g, winBattle(g, team, 'rival'), rng);
        assert.ok(rival.rival && !rival.befriend, 'ライバルは なかまに ならない');
        assert.ok(g.flags.rival4);
        assert.ok(!peopleHere(g).some(p => p.id === 'rival4'), '勝つと 通れる');
        assert.ok(peopleHere(g).some(p => p.id === 'urashima4'), '奥に 浦の島重蔵');
        const out = applyBattleResult(g, winBattle(g, bossEnemies('urashima4'), 'boss'), rng);
        assert.equal(out.bossId, 'urashima4');
        assert.equal(out.befriend.id, 'urashima');
        assert.equal(g.story, 'clear4');
        assert.ok(!peopleHere(g).some(p => p.id === 'urashima4'));
        assert.match(objective(g), /ともいし/, '4 章 クリアの あとは 5 章へ');
    }
});

test('4 章: どうくつの せまい 通路は ライバルが いる あいだ 通れない。がけと 海は 通れない', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    g.story = 'umibe';
    assert.ok(blockedTile(g, 39, UMI_Y0 + 7), 'ライバル探検隊が ふさぐ');
    assert.ok(!blockedTile(g, 39, UMI_Y0 + 8), 'しおだまりの 広間');
    assert.ok(blockedTile(g, 31, UMI_Y0 + 5), '岩の がけ');
    assert.ok(blockedTile(g, 10, UMI_Y0 + 28), '海');
    g.flags.rival4 = true;
    assert.ok(!blockedTile(g, 39, UMI_Y0 + 7), '勝つと 通れる');
});

test('3 章: 山道は 2 章 クリアまで 通行止め', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    g.story = 'school';
    assert.ok(gatesHere(g).some(q => q.id === 'gateYama'));
    assert.ok(blockedTile(g, 26, 0));
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
    const sizes = new Set();
    for (let i = 0; i < 200; i++) {
        const enemies = encounter(g, spot('park'), rng, { id: 'nemuridake', lv: 4 });
        sizes.add(enemies.length);
        assert.ok(enemies.length <= 3, '3 体まで');
        assert.deepEqual(enemies[Math.floor((enemies.length - 1) / 2)], { id: 'nemuridake', lv: 4 }, '話しかけた キャラが まんなか (2 体なら 左)');
        for (const e of enemies) assert.ok(e.lv >= 1 && e.lv <= 5);
    }
    assert.deepEqual([...sizes].sort(), [1, 2, 3], '1 体・2 体・3 体 どれも 出る');
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

test('5 章: ともいしの 手紙 → 電車で ネット寺 → 紋の 3 体を 助けると なかまに → 紋の ダイシを たおすと 5 章 クリア (2026-10-29)', async () => {
    const { startChapter5, arriveTera, trainLines, monsSaved } = await import('../src/logic/game.js');
    const { MONS } = await import('../src/data/map.js');
    const g = newGame('naitei');
    receiveWatch(g);
    const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
    g.story = 'umibe';
    assert.ok(!startChapter5(g));
    assert.deepEqual(trainLines(g), ['umi']);
    g.story = 'clear4';
    assert.ok(startChapter5(g));
    assert.deepEqual(trainLines(g), ['umi', 'tera'], '電車の 行き先が ふえる');
    assert.ok(arriveTera(g));
    assert.ok(!arriveTera(g));
    assert.ok(peopleHere(g).some(p => p.id === 'daishiNpc'));
    assert.ok(!peopleHere(g).some(p => p.id === 'daishi5'));
    for (const m of MONS) {
        assert.ok(blockedTile(g, m.x, m.y), `${m.id} は 立っている`);
        const b = winBattle(g, [{ id: m.nakama, lv: m.lv }]);
        b.mystery = m.id;
        const out = applyBattleResult(g, b, rng);
        assert.ok(out.befriend && out.befriend.forced && out.befriend.id === m.nakama, '助けると なかまに なる');
        assert.ok(!blockedTile(g, m.x, m.y), '助けると いなくなる');
    }
    assert.equal(monsSaved(g), 3);
    assert.ok(!peopleHere(g).some(p => p.id === 'daishiNpc'));
    assert.ok(peopleHere(g).some(p => p.id === 'daishi5'), '3 体 助けると ダイシが 紋に のまれる');
    const out = applyBattleResult(g, winBattle(g, bossEnemies('daishi5'), 'boss'), rng);
    assert.equal(out.befriend.id, 'daishi');
    assert.equal(g.story, 'clear5');
    assert.match(objective(g), /ともいし/, '5 章 クリアの あとは 6 章へ');
});

test('進化: 決まった Lv に なると 進化先の キャラに なる (メダル・Lv は そのまま。図鑑にも のる)', async () => {
    const { evolveMedal } = await import('../src/logic/game.js');
    const { EVOLVE, NAKAMA } = await import('../src/data/nakama.js');
    for (const [from, ev] of Object.entries(EVOLVE)) {
        assert.ok(NAKAMA[from] && NAKAMA[ev.to], `${from} → ${ev.to}`);
        assert.ok(ev.lv > 1);
    }
    const g = newGame('naitei');
    receiveWatch(g);
    const medal = g.medals.find(m => m.id === 'daichouenkin');
    assert.equal(evolveMedal(g, medal), null, 'Lv が たりないと 進化しない');
    // けいけんちを たくさん もらう バトルに 勝つと Lv30 を こえて 進化する
    medal.lv = 29;
    medal.exp = 8 * Math.pow(28, 1.9) + 1;
    const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
    const out = applyBattleResult(g, winBattle(g, [{ id: 'koorimodoki', lv: 60 }]), rng);
    assert.ok(out.evolved.some(e => e.from === 'daichouenkin' && e.to === 'daichouenou'));
    assert.equal(medal.id, 'daichouenou');
    assert.ok(g.zukan.friends.daichouenou);
    assert.ok(out.levelUps.some(u => u.uid === medal.uid && u.id === 'daichouenou'));
});

test('絆レベル: 同じ キャラを もう 1 体 なかまに すると 上がり (最大 5)、必殺技の 威力が 上がる', async () => {
    const { bondLevel, addMedal } = await import('../src/logic/game.js');
    const g = newGame('naitei');
    receiveWatch(g);
    assert.equal(bondLevel(g, 'daichouenkin'), 0);
    addMedal(g, 'daichouenkin', 5);
    assert.equal(bondLevel(g, 'daichouenkin'), 1);
    for (let i = 0; i < 8; i++) addMedal(g, 'daichouenkin', 5);
    assert.equal(bondLevel(g, 'daichouenkin'), 5, '最大 5');
    assert.equal(bondLevel(g, 'koori'), 0);
    // 同じ ゲージ・同じ 乱数で、絆 5 の 必殺技は 絆 0 より 強い
    const { createBattle, resolveSpecial } = await import('../src/logic/battle.js');
    const hit = bond => {
        const b = createBattle({ allies: [{ uid: 'a', id: 'daichouenkin', lv: 20, bond }], enemies: [{ id: 'kogame', lv: 40 }], rng: createRng(5) });
        const e = b.enemies[0], before = e.hp;
        resolveSpecial(b, b.wheel[0], 1);
        return before - e.hp;
    };
    assert.ok(hit(5) > hit(0));
});

test('6 章: ともいし → 電車で 忍びの屋敷 → ズミタニ → おにおに → トモオカ の 3 回の ボスで 6 章 クリア (2026-10-29)', async () => {
    const { startChapter6, arriveYashiki, trainLines } = await import('../src/logic/game.js');
    const g = newGame('menkyo');
    receiveWatch(g);
    const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
    g.story = 'clear5';
    assert.ok(startChapter6(g));
    assert.ok(trainLines(g).includes('yashiki'));
    assert.ok(arriveYashiki(g));
    const here = id => peopleHere(g).some(p => p.id === id);
    assert.ok(here('zumitani6') && !here('onioni6') && !here('tomooka6'));
    let out = applyBattleResult(g, winBattle(g, bossEnemies('zumitani6'), 'boss'), rng);
    assert.equal(out.befriend.id, 'zumitani', 'ズミタニは なかまに なる');
    assert.ok(!here('zumitani6') && here('onioni6'));
    out = applyBattleResult(g, winBattle(g, bossEnemies('onioni6'), 'boss'), rng);
    assert.equal(out.befriend, null, 'おにおには まだ なかまに ならない');
    assert.ok(!here('onioni6') && here('tomooka6'));
    out = applyBattleResult(g, winBattle(g, bossEnemies('tomooka6'), 'boss'), rng);
    assert.equal(out.befriend, null);
    assert.equal(g.story, 'clear6');
    assert.ok(!here('tomooka6'));
});

test('7 章: 電車で 月の迷宮 → 鏡の 間の ルナヤに 勝つと 7 章 クリア (2026-10-29)', async () => {
    const { arriveMoon, trainLines } = await import('../src/logic/game.js');
    const g = newGame('naitei');
    receiveWatch(g);
    const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
    g.story = 'yashiki';
    assert.ok(!trainLines(g).includes('moon'));
    g.story = 'clear6';
    assert.ok(trainLines(g).includes('moon'));
    assert.match(objective(g), /月の迷宮/);
    assert.ok(arriveMoon(g));
    assert.ok(peopleHere(g).some(p => p.id === 'runaya7'));
    const out = applyBattleResult(g, winBattle(g, bossEnemies('runaya7'), 'boss'), rng);
    assert.equal(out.befriend.id, 'runaya');
    assert.equal(g.story, 'clear7');
    assert.ok(!peopleHere(g).some(p => p.id === 'runaya7'));
});

test('8 章: 電車で SE城 → 大鬼 → 双頭鬼 → 金滅鬼 (なかまに なる) → おにおにに 勝つと 8 章 クリア (2026-10-30)', async () => {
    const { arriveShiro, trainLines } = await import('../src/logic/game.js');
    const g = newGame('naitei');
    receiveWatch(g);
    const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
    const here = id => peopleHere(g).some(p => p.id === id);
    g.story = 'meikyu';
    assert.ok(!trainLines(g).includes('shiro'));
    g.story = 'clear7';
    assert.ok(trainLines(g).includes('shiro'));
    assert.match(objective(g), /SE城/);
    assert.ok(arriveShiro(g));
    assert.ok(!arriveShiro(g), '2 回目は なにも おきない');
    assert.ok(here('ooni8') && here('soutou8') && here('kinme8') && here('onioni8'));
    let out = applyBattleResult(g, winBattle(g, bossEnemies('ooni8'), 'boss'), rng);
    assert.equal(out.befriend, null);
    assert.ok(!here('ooni8') && here('soutou8'));
    assert.match(objective(g), /双頭鬼/);
    applyBattleResult(g, winBattle(g, bossEnemies('soutou8'), 'boss'), rng);
    assert.ok(!here('soutou8'));
    out = applyBattleResult(g, winBattle(g, bossEnemies('kinme8'), 'boss'), rng);
    assert.equal(out.befriend.id, 'kinmetsuki', '金滅鬼は 紋が とけて なかまに なる');
    assert.match(objective(g), /おにおに/);
    out = applyBattleResult(g, winBattle(g, bossEnemies('onioni8'), 'boss'), rng);
    assert.equal(out.befriend, null);
    assert.equal(g.story, 'clear8');
    assert.equal(g.chapter, 9);
    assert.ok(!here('onioni8'));
});

test('バージョン限定の なかま (2026-10-30): その バージョンでしか 出ない。同じ 地区・同じ ランクで 1 組ずつ', async () => {
    const { NAKAMA, NAKAMA_IDS } = await import('../src/data/nakama.js');
    const only = v => NAKAMA_IDS.filter(id => NAKAMA[id].version === v);
    const nai = only('naitei'), men = only('menkyo');
    assert.ok(nai.length >= 5 && nai.length === men.length, `内定 ${nai.length}・免許 ${men.length}`);
    nai.forEach((id, i) => {
        assert.equal(NAKAMA[id].area, NAKAMA[men[i]].area, `${id} と ${men[i]} の 地区`);
        assert.equal(NAKAMA[id].rank, NAKAMA[men[i]].rank, `${id} と ${men[i]} の ランク`);
    });
    for (const version of ['naitei', 'menkyo']) {
        const g = newGame(version);
        receiveWatch(g);
        g.story = 'clear8';
        g.time = 3;
        const other = version === 'naitei' ? men : nai;
        for (const s of [...SPOTS, ...ROAMS]) {
            for (const k of spotKinds(g, s)) assert.ok(!other.includes(k.id), `${version} で ${k.id} が 出ない (${s.id})`);
        }
        // もくてきの 数にも 入らない
        assert.ok(!objective(g).includes('undefined'));
    }
    // 同じ 場所でも バージョンで 出る キャラが ちがう
    const roam = ROAMS.find(r => r.kinds.some(k => nai.includes(k.id)));
    const ids = v => { const g = newGame(v); receiveWatch(g); g.story = 'clear8'; g.time = 3; return spotKinds(g, roam).map(k => k.id).join(); };
    assert.notEqual(ids('naitei'), ids('menkyo'));
});

test('14 章 (バージョンで ちがう): 招待券 → 遊園地 → ふるカワが いない → 夜の 手がかり 3 つ → 残党の ボス → 15 章 (2026-10-30)', async () => {
    const { startChapter14, arrivePark, parkNight, findClue, cluesFound, boss14Enemies, trainLines } = await import('../src/logic/game.js');
    const { MAIN_END } = await import('../src/logic/story.js');
    const { PARK_CLUES } = await import('../src/data/map.js');
    for (const [version, bossId] of [['naitei', 'saaraha14'], ['menkyo', 'rihama14']]) {
        const g = newGame(version);
        receiveWatch(g);
        const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
        const here = id => peopleHere(g).some(p => p.id === id);
        g.story = 'oshiro';
        assert.ok(!startChapter14(g), '本編が おわるまで はじまらない');
        g.story = MAIN_END;
        assert.ok(!trainLines(g).includes('park'));
        assert.ok(startChapter14(g));
        assert.ok(trainLines(g).includes('park'));
        assert.match(objective(g), version === 'naitei' ? /ナイテイパーク/ : /メンキョシティ/);
        assert.ok(arrivePark(g));
        assert.ok(here('oni14') && !here('boss14'));
        assert.ok(parkNight(g));
        assert.equal(g.time, 3, '夜に なる');
        for (const c of PARK_CLUES) {
            assert.ok(!here('boss14'), '手がかりが そろうまで ボスは いない');
            assert.ok(findClue(g, c.id));
            assert.equal(findClue(g, c.id), null, '同じ 手がかりは 1 回');
        }
        assert.equal(cluesFound(g), PARK_CLUES.length);
        assert.ok(here('boss14'));
        assert.equal(boss14Enemies(g)[0].id, bossId);
        const out = applyBattleResult(g, winBattle(g, boss14Enemies(g), 'boss'), rng);
        assert.equal(out.bossId, bossId);
        assert.equal(g.story, 'clear14');
        assert.equal(g.chapter, 15);
        assert.ok(here('kairou'), '15 章: 無限回廊の 番人');
    }
});

test('15 章: 無限回廊は 1 階ずつ 強化ボスと 戦い、5 階ごとに ごほうび', async () => {
    const { kairouOf, kairouEnemies } = await import('../src/logic/game.js');
    const { BOSSES } = await import('../src/data/nakama.js');
    const g = newGame('menkyo');
    receiveWatch(g);
    g.story = 'clear14';
    const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
    const first = kairouEnemies(g)[0];
    assert.ok(first.lv > BOSSES[first.id].lv, '強化 (Lv が 高い)');
    const lvs = [];
    for (let i = 0; i < 14; i++) {
        const e = kairouEnemies(g);
        lvs.push(e[0].lv);
        const b = winBattle(g, e, 'kairou');
        const out = applyBattleResult(g, b, rng);
        assert.equal(out.kairou, i + 1);
        assert.equal(out.befriend, null);
        if ((i + 1) % 5 === 0) assert.ok(out.prize && g.items[out.prize] >= 1, `${i + 1} 階の ごほうび`);
    }
    assert.equal(kairouOf(g).floor, 15);
    assert.equal(kairouOf(g).best, 14);
    assert.equal(g.story, 'clear14', 'ストーリーは かわらない');
    assert.ok(kairouEnemies(g)[0].lv > lvs[0], '上の 階ほど 強い');
    // さいごの 階は その バージョンの 14 章の ボス
    g.kairou.floor = 20;
    assert.equal(kairouEnemies(g)[0].id, 'rihama14');
});

test('15 章: ライバル探検隊の 仲間クエスト。その バージョンの チーム (+ 5DX) に 勝つと 3 人 なかまに なる', async () => {
    const { teamEnemies, teamsLeft } = await import('../src/logic/game.js');
    const { TEAMS, NAKAMA } = await import('../src/data/nakama.js');
    for (const [version, teams] of [['naitei', ['ask3', 'kemono', '5dx']], ['menkyo', ['muscle', 'bartas', '5dx']]]) {
        const g = newGame(version);
        receiveWatch(g);
        g.story = 'clear14';
        assert.deepEqual(teamsLeft(g).sort(), [...teams].sort());
        const shown = peopleHere(g).filter(p => p.team).map(p => p.team).sort();
        assert.deepEqual(shown, [...teams].sort(), `${version} の チーム`);
        const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
        const b = winBattle(g, teamEnemies(teams[0]), 'team');
        b.team = teams[0];
        const out = applyBattleResult(g, b, rng);
        assert.deepEqual(out.joined.map(m => m.id), TEAMS[teams[0]].members);
        for (const id of TEAMS[teams[0]].members) assert.ok(g.zukan.friends[id]);
        assert.equal(NAKAMA[TEAMS[teams[0]].leader].rank, 'S', 'リーダーは S');
        assert.ok(TEAMS[teams[0]].members.filter(id => id !== TEAMS[teams[0]].leader).every(id => NAKAMA[id].rank === 'A'), 'メンバーは A');
        assert.ok(!peopleHere(g).some(p => p.team === teams[0]), '勝った チームは いなく なる');
    }
});

test('9 章: おにおにが なかまに → 電車で 筋肉の山 → ハル麒麟 → ノゾエマに 勝つと 9 章 クリア・必殺技が 進化 (2026-10-30)', async () => {
    const { startChapter9, arriveKinniku, trainLines, heroUpgraded, startChapter14 } = await import('../src/logic/game.js');
    const g = newGame('naitei');
    receiveWatch(g);
    const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
    const here = id => peopleHere(g).some(p => p.id === id);
    g.story = 'clear8';
    assert.match(objective(g), /ともいし/);
    assert.ok(!trainLines(g).includes('kinniku'));
    const oni = startChapter9(g);
    assert.equal(oni.id, 'onioni', 'おにおにが なかまに');
    assert.equal(startChapter9(g), null, '2 回目は なにも おきない');
    assert.ok(trainLines(g).includes('kinniku'));
    assert.ok(!startChapter14(g), '9 章が おわるまで 14 章は はじまらない');
    assert.ok(arriveKinniku(g));
    assert.ok(here('harukirin9') && !here('nozoema9'));
    let out = applyBattleResult(g, winBattle(g, bossEnemies('harukirin9'), 'boss'), rng);
    assert.equal(out.befriend.id, 'harukirin');
    assert.ok(!here('harukirin9') && here('nozoema9'));
    assert.match(objective(g), /ノゾエマ/);
    assert.ok(!heroUpgraded(g));
    out = applyBattleResult(g, winBattle(g, bossEnemies('nozoema9'), 'boss'), rng);
    assert.equal(out.befriend.id, 'nozoema');
    assert.ok(out.heroSpecial);
    assert.equal(g.story, 'clear9');
    assert.equal(g.chapter, 10);
    assert.ok(heroUpgraded(g), '必殺技が 進化');
    assert.ok(!startChapter14(g), '14 章は 本編の さいご (いまは 10 章) の あと');
});

test('10 章: 町に もどると 黒い 霧。町と 商店街の キャラは ぜんぶ 紋つき (・闇)。5 回 助けると タシケダ → 10 章 クリア (2026-10-30)', async () => {
    const { startChapter10, darkTown, DARK10_GOAL, DARK10_LV, startChapter14 } = await import('../src/logic/game.js');
    const g = newGame('naitei');
    receiveWatch(g);
    const rng = createRng(4);
    const fixed = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
    const here = id => peopleHere(g).some(p => p.id === id);
    g.story = 'clear9';
    assert.ok(startChapter10(g));
    assert.ok(!startChapter10(g));
    const town = ROAMS.find(r => r.id === 'park'), shop = ROAMS.find(r => r.id === 'arcadeW'), yama = ROAMS.find(r => r.y0 >= YAMA_Y0 && r.y0 < UMI_Y0);
    assert.ok(darkTown(g, town) && darkTown(g, shop), '石の川タウンと 商店街は 紋つき');
    assert.ok(!darkTown(g, yama), 'ほかの 地区は ふつう');
    const es = encounter(g, town, rng);
    assert.ok(es.every(e => e.dark && e.lv >= DARK10_LV[0] && e.lv <= DARK10_LV[1]));
    for (let i = 0; i < DARK10_GOAL; i++) {
        assert.ok(!here('tashikeda10'));
        const b = winBattle(g, [{ id: 'nemuridake', lv: 34, dark: true }]);
        b.enemies.forEach(e => { e.dark = true; });
        const out = applyBattleResult(g, b, fixed);
        assert.equal(out.dark, i + 1);
    }
    assert.ok(here('tashikeda10'));
    assert.match(objective(g), /ともいし/);
    const out = applyBattleResult(g, winBattle(g, bossEnemies('tashikeda10'), 'boss'), fixed);
    assert.equal(out.befriend, null);
    assert.equal(g.story, 'clear10');
    assert.ok(!here('tashikeda10'));
    assert.ok(!darkTown(g, town), '霧が はれる');
    assert.ok(!startChapter14(g), '14 章は 本編の さいご (いまは 11 章) の あと');
});

test('11 章: ルキハの 城への 道 → 電車で ASOの壺の底 → バクエンリュウ・闇 (なかまに) → ASO と 話すと 11 章 クリア (2026-10-30)', async () => {
    const { startChapter11, arriveTsubo, meetAso, trainLines, startChapter14 } = await import('../src/logic/game.js');
    const g = newGame('menkyo');
    receiveWatch(g);
    const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
    const here = id => peopleHere(g).some(p => p.id === id);
    g.story = 'clear10';
    assert.ok(!startChapter14(g));
    assert.ok(startChapter11(g));
    assert.ok(trainLines(g).includes('tsubo'));
    assert.ok(arriveTsubo(g));
    assert.ok(here('bakuen11') && !here('aso11'));
    assert.ok(!meetAso(g), 'バクエンリュウの 前に ASO とは 話せない');
    const out = applyBattleResult(g, winBattle(g, bossEnemies('bakuen11'), 'boss'), rng);
    assert.equal(out.befriend.id, 'bakuenryu', '紋が とけて なかまに');
    assert.ok(!here('bakuen11') && here('aso11'));
    assert.match(objective(g), /ASO/);
    assert.ok(meetAso(g));
    assert.equal(g.story, 'clear11');
    assert.equal(g.chapter, 12);
    assert.ok(!startChapter14(g), '14 章は 本編の さいご (いまは 12 章) の あと');
});

test('12 章: 黒い 空 → 神社で おにおに・鬼神と 勝負 → 家で ねると 12 章 クリア。おにおにの 必殺技が 進化 (2026-10-30)', async () => {
    const { startChapter12, nightBefore, specialUpgraded, startChapter14 } = await import('../src/logic/game.js');
    const g = newGame('naitei');
    receiveWatch(g);
    const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
    const here = id => peopleHere(g).some(p => p.id === id);
    g.story = 'clear11';
    assert.ok(startChapter12(g));
    assert.ok(here('onioni12') && here('g12runaya'));
    assert.ok(!nightBefore(g), 'おにおにに 勝つまで 出発の 夜は こない');
    assert.ok(!specialUpgraded(g, 'onioni'));
    const out = applyBattleResult(g, winBattle(g, bossEnemies('onioni12'), 'boss'), rng);
    assert.equal(out.befriend, null);
    assert.ok(out.oniSpecial && specialUpgraded(g, 'onioni'), 'おにおにの 必殺技が 進化');
    assert.ok(!here('onioni12'));
    assert.match(objective(g), /ねよう/);
    assert.ok(nightBefore(g));
    assert.equal(g.story, 'clear12');
    assert.ok(!startChapter14(g), '14 章は 13 章の あと');
});

test('大魔王ASO: 14 章 クリアの あと ASO の 間で 勝負できて、勝つと なかまに なる', async () => {
    const { canFightAso } = await import('../src/logic/game.js');
    const g = newGame('menkyo');
    receiveWatch(g);
    const rng = { chance: () => false, int: () => 0, next: () => 0, weighted: l => l[0] };
    g.story = 'clear12';
    g.flags.baku11 = true;
    assert.ok(!canFightAso(g), '14 章 クリアまでは 戦えない');
    g.story = 'clear14';
    assert.ok(canFightAso(g));
    assert.ok(peopleHere(g).some(p => p.id === 'aso11'));
    const out = applyBattleResult(g, winBattle(g, bossEnemies('aso15'), 'boss'), rng);
    assert.equal(out.befriend.id, 'aso');
    assert.ok(!canFightAso(g));
    assert.equal(g.story, 'clear14', 'ストーリーは かわらない');
});

test('13 章: ヒョウガリュウに 乗って 喰らいの 城 → 3〜7 階の 紋つきの 幹部 (探検隊が 加勢) → 最上階の ルキハで 13 章 クリア。そのあと 14 章 (2026-10-30)', async () => {
    const { startChapter13, arriveKurai, startChapter14, trainLines, darkTown, floor13Next, floor13Helpers } = await import('../src/logic/game.js');
    const { KURAI_Y0 } = await import('../src/data/map.js');
    const { FLOOR13, BOSSES, TEAMS } = await import('../src/data/nakama.js');
    const g = newGame('menkyo');
    receiveWatch(g);
    const rng = { chance: () => true, int: () => 0, next: () => 0, weighted: l => l[0] };
    const here = id => peopleHere(g).some(p => p.id === id);
    g.story = 'clear12';
    assert.ok(startChapter13(g));
    assert.ok(!trainLines(g).includes('kurai'), '電車では 行かない');
    assert.ok(here('hyouga13'), '山の ダムに ヒョウガリュウ');
    assert.match(objective(g), /ヒョウガリュウ/);
    assert.ok(arriveKurai(g));
    assert.ok(darkTown(g, { x: 20, y: KURAI_Y0 + 25 }), '城の 軍勢は ぜんぶ 紋つき');
    assert.ok(!here('rukiha13'), '幹部を たおすまで 最上階には 行けない');
    // 3〜7 階: 1 階に 1 体、前より 強い 紋つきの 幹部。階ごとに ちがう 探検隊が 加勢
    assert.deepEqual(FLOOR13.map(f => f.floor), [3, 4, 5, 6, 7]);
    assert.equal(new Set(FLOOR13.map(f => f.team)).size, 5, '階ごとに ちがう チーム');
    assert.ok(FLOOR13.some(f => f.from === 'tashikeda10'));
    for (const f of FLOOR13) {
        assert.equal(floor13Next(g).id, f.id);
        assert.ok(here(`f13_${f.floor}`));
        assert.ok(BOSSES[f.id].lv > BOSSES[f.from].lv + 10 && BOSSES[f.id].name.endsWith('・闇'), '前より 強い 紋つき');
        assert.ok(bossEnemies(f.id)[0].dark);
        assert.deepEqual(floor13Helpers(f).members, TEAMS[f.team].members);
        assert.match(objective(g), new RegExp(`${f.floor} 階`));
        const out = applyBattleResult(g, winBattle(g, bossEnemies(f.id), 'boss'), rng);
        assert.equal(out.floor13, f.floor);
        assert.equal(out.befriend, null, '幹部は なかまに ならない');
        assert.ok(!here(`f13_${f.floor}`));
    }
    assert.equal(g.story, 'kurai', 'ストーリーは まだ');
    assert.ok(here('rukiha13'));
    assert.match(objective(g), /ルキハ/);
    // 紋つきの 敵は なかまに ならない
    const wild = applyBattleResult(g, winBattle(g, [{ id: 'goukioni', lv: 54, dark: true }]), rng);
    assert.equal(wild.befriend, null, '紋つきは なかまに ならない');
    assert.ok(!startChapter14(g));
    const out = applyBattleResult(g, winBattle(g, bossEnemies('rukiha13'), 'boss'), rng);
    assert.ok(out.ending);
    assert.equal(g.story, 'clear13');
    assert.ok(!here('rukiha13') && !here('hyouga13'));
    assert.ok(startChapter14(g), '13 章の あとで 14 章');
});
