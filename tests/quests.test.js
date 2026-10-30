// 町の 依頼 (data/quests.js・logic/quests.js)
import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTS } from '../src/data/quests.js';
import { FRIENDS } from '../src/data/map.js';
import { NAKAMA } from '../src/data/nakama.js';
import { ITEMS } from '../src/data/items.js';
import { STORY } from '../src/logic/story.js';
import { newGame, receiveWatch } from '../src/logic/game.js';
import { questOf, questState, questReady, questProgress, acceptQuest, completeQuest, questList } from '../src/logic/quests.js';

test('依頼の データ: たのむ キャラ・道具・なかま・ストーリーが ある', () => {
    const ids = new Set();
    for (const q of QUESTS) {
        assert.ok(!ids.has(q.id), `${q.id} が 2 つ`);
        ids.add(q.id);
        assert.ok(FRIENDS.some(f => f.id === q.from), `${q.id} の たのむ キャラ`);
        assert.ok(!q.after || STORY.includes(q.after), `${q.id} の after`);
        if (q.need.kind === 'item') assert.ok(ITEMS[q.need.item], `${q.id} の 道具`);
        if (q.need.kind === 'befriend') assert.ok(NAKAMA[q.need.id], `${q.id} の なかま`);
        if (q.reward.item) assert.ok(ITEMS[q.reward.item], `${q.id} の お礼`);
        assert.ok(q.ask && q.thanks && q.title);
    }
});

test('依頼: うける → できたら お礼 (道具を わたす 依頼は 道具が へる)', () => {
    const g = newGame('naitei');
    assert.equal(questOf(g, 'f_kogame'), null, 'ストーリーが 進むまで たのまれない');
    receiveWatch(g);
    const q = questOf(g, 'f_kogame');
    assert.equal(q.id, 'q_niboshi');
    assert.equal(completeQuest(g, q), null, 'うける 前は お礼なし');
    acceptQuest(g, q.id);
    assert.equal(questState(g, q.id), 'active');
    assert.deepEqual(questProgress(g, q), { now: 0, need: 2 });
    g.items.niboshi = 3;
    assert.ok(questReady(g, q));
    const money = g.money, kyuuri = g.items.kyuuri || 0;
    assert.ok(completeQuest(g, q));
    assert.equal(g.items.niboshi, 1);
    assert.equal(g.money, money + 150);
    assert.equal(g.items.kyuuri, kyuuri + 3);
    assert.equal(questState(g, q.id), 'done');
    assert.equal(questOf(g, 'f_kogame'), null, 'おわった 依頼は もう たのまれない');
    assert.deepEqual(questList(g).map(x => x.id), ['q_niboshi']);
});

test('依頼: なかまに する 依頼は 図鑑で 決まる', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    const q = questOf(g, 'f_pekorisu');
    acceptQuest(g, q.id);
    assert.ok(!questReady(g, q));
    g.zukan.friends.donguriko = true;
    assert.ok(questReady(g, q));
});

test('依頼は 40 個 (2026-10-30 ユーザー指定)。たのむ キャラは どの 地区にも いて、立つ 場所が ある', async () => {
    const { TILES, BLOCK, areaAt } = await import('../src/data/map.js');
    assert.equal(QUESTS.length, 40);
    const areas = new Set();
    for (const f of FRIENDS) {
        let free = 0;
        for (let y = f.y0; y <= f.y1; y++) for (let x = f.x0; x <= f.x1; x++) if (!BLOCK.has(TILES[y][x])) free++;
        assert.ok(free > 0, `${f.id} の 立つ 場所`);
        assert.ok(NAKAMA[f.kind], `${f.id} の 絵`);
        areas.add(areaAt(f.x0, f.y0));
    }
    for (const a of ['ishinokawa', 'shoutengai', 'school', 'yama', 'umi', 'tera', 'yashiki', 'moon', 'shiro']) assert.ok(areas.has(a), `${a} に たのむ キャラ`);
    // 合体の館の キャラ・合成アイテムの 依頼も ある
    assert.ok(QUESTS.some(q => q.need.kind === 'befriend' && NAKAMA[q.need.id].fuse));
    assert.ok(QUESTS.some(q => q.need.kind === 'item' && ITEMS[q.need.item].material));
});
