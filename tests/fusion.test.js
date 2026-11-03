// 合体の館 (data/fusion.js・logic/fusion.js。2026-10-30 ユーザー指定)
import test from 'node:test';
import assert from 'node:assert/strict';
import { RECIPES, findRecipe } from '../src/data/fusion.js';
import { NAKAMA } from '../src/data/nakama.js';
import { ITEMS } from '../src/data/items.js';
import { EQUIPS } from '../src/data/equips.js';
import { newGame, receiveWatch, addMedal } from '../src/logic/game.js';
import { canFuse, fuse, fusionParts } from '../src/logic/fusion.js';

const exists = c => (c.startsWith('n:') ? NAKAMA[c.slice(2)] : c.startsWith('e:') ? EQUIPS[c.slice(2)] : ITEMS[c.slice(2)]);

test('レシピ: 材料と できる ものが ある。キャラ+キャラ・キャラ+アイテム・アイテム+アイテム が ぜんぶ ある', () => {
    const kinds = new Set();
    const pairs = new Set();
    for (const r of RECIPES) {
        for (const c of [r.a, r.b, r.to]) assert.ok(exists(c), c);
        kinds.add([r.a, r.b].map(c => c[0]).sort().join('+'));
        const k = [r.a, r.b].sort().join('|');
        assert.ok(!pairs.has(k), `${k} が 2 つ`);
        pairs.add(k);
        assert.equal(findRecipe(r.b, r.a), r, '順番は どちらでも');
    }
    assert.deepEqual([...kinds].sort(), ['e+i', 'i+i', 'i+n', 'n+n']);   // e = 装備 (2026-11-03)
    // 合体でしか 手に 入らない キャラ・アイテムが ある (合成アイテムは 合体で 作れる)
    const fuseOnly = Object.keys(NAKAMA).filter(id => NAKAMA[id].fuse);
    assert.ok(fuseOnly.length >= 5);
    for (const id of fuseOnly) assert.ok(RECIPES.some(r => r.to === `n:${id}`), `${id} の レシピ`);
    for (const id of Object.keys(ITEMS).filter(i => ITEMS[i].onlyFusion)) assert.ok(RECIPES.some(r => r.to === `i:${id}`), `${id} の レシピ`);
    // 進化キャラの 一部は 合体でしか 手に 入らない (ハリーベビーから 合成アイテムで)
    assert.ok(RECIPES.some(r => r.a === 'n:haribaby' && r.b.startsWith('i:') && NAKAMA[r.to.slice(2)].fuse));
});

test('合体: アイテム + アイテム → 合成アイテム (材料が へる)', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    g.items.choco = 1; g.items.cider = 1;
    const a = { type: 'item', id: 'choco' }, b = { type: 'item', id: 'cider' };
    assert.ok(canFuse(g, a, b));
    assert.deepEqual(fuse(g, a, b), { kind: 'item', id: 'hoshikakera' });
    assert.equal(g.items.choco, 0);
    assert.equal(g.items.cider, 0);
    assert.equal(g.items.hoshikakera, 1);
    assert.equal(canFuse(g, a, b), null, '材料が なければ できない');
    assert.equal(canFuse(g, { type: 'item', id: 'choco' }, { type: 'item', id: 'niboshi' }), null);
});

test('合体: キャラ + 合成アイテム → 合体でしか 会えない キャラ (メダルは なくなり、ウォッチの 場所も あく)', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    const baby = addMedal(g, 'haribaby', 20);
    g.items.onitsuno = 1;
    const slot = g.watch.indexOf(baby.uid);
    assert.ok(slot >= 0);
    const out = fuse(g, { type: 'medal', uid: baby.uid }, { type: 'item', id: 'onitsuno' });
    assert.equal(out.kind, 'nakama');
    assert.equal(out.id, 'harryknight');
    assert.equal(out.medal.lv, 20, 'キャラ + アイテムは その キャラの Lv');
    assert.ok(!g.medals.some(m => m.uid === baby.uid));
    assert.ok(g.zukan.friends.harryknight);
    assert.equal(g.watch[slot], out.medal.uid, 'あいた 場所に 入る');
});

test('合体: キャラ + キャラ → キャラ (Lv は 平均)。こおりくんと 同じ メダル 2 枚は 使えない', () => {
    const g = newGame('naitei');
    receiveWatch(g);
    const k = addMedal(g, 'harryknight', 30), m = addMedal(g, 'harrymage', 40);
    const out = fuse(g, { type: 'medal', uid: k.uid }, { type: 'medal', uid: m.uid });
    assert.equal(out.id, 'haridora');
    assert.equal(out.medal.lv, 35);
    const baby = addMedal(g, 'haribaby', 5);
    assert.equal(canFuse(g, { type: 'medal', uid: baby.uid }, { type: 'medal', uid: baby.uid }), null);
    assert.equal(canFuse(g, { type: 'medal', uid: 'hero' }, { type: 'medal', uid: baby.uid }), null);
    assert.ok(!fusionParts(g).some(p => p.uid === 'hero'), 'こおりくんは 材料に ならない');
});

test('合体の館 (2026-11-03): 一覧は 合体できる ものだけ・1 つ目を えらぶと 相手も しぼる・装備も 合体できる', async () => {
    const { newGame, addEquip, addHero } = await import('../src/logic/game.js');
    const { fusionParts, fuse } = await import('../src/logic/fusion.js');
    const g = newGame('naitei');
    g.items = { onigiri: 2, melonpan: 1, book_nonki: 1, onitsuno: 1 };
    addHero(g, 10);
    addEquip(g, 'hachimaki');
    const parts = fusionParts(g);
    assert.ok(!parts.some(p => p.id === 'book_nonki'), '合体に 使わない 本は 出ない');
    assert.ok(parts.some(p => p.type === 'equip' && p.id === 'hachimaki'));
    const partner = fusionParts(g, { type: 'equip', id: 'hachimaki' });
    assert.deepEqual(partner.map(p => p.id), ['onitsuno']);
    const got = fuse(g, { type: 'equip', id: 'hachimaki' }, { type: 'item', id: 'onitsuno' });
    assert.deepEqual(got, { kind: 'equip', id: 'kanaboKey' });
    assert.equal(g.equips.kanaboKey, 1);
    assert.equal(g.equips.hachimaki, 0);
});

test('装備の 売り買い (2026-11-03): お面屋で ティア 1 を 買える・付けて いない ぶんだけ 売れる', async () => {
    const { newGame, buyEquip, sellEquip, equipsForSale, setEquip, addHero } = await import('../src/logic/game.js');
    const g = newGame('naitei');
    g.money = 1000;
    assert.ok(equipsForSale(g).includes('hachimaki'));
    assert.ok(!equipsForSale(g).includes('kanaboKey'), 'ティア 2 は 8 章 クリアから');
    assert.equal(buyEquip(g, 'hachimaki'), true);
    assert.equal(g.money, 500);
    addHero(g, 10);
    setEquip(g, g.medals[0].uid, 'hachimaki');
    assert.equal(sellEquip(g, 'hachimaki'), false, '付けて いる ものは 売れない');
    setEquip(g, g.medals[0].uid, null);
    assert.equal(sellEquip(g, 'hachimaki'), true);
    assert.equal(g.money, 750);
});
