// 合体の館 (data/fusion.js・logic/fusion.js。2026-10-30 ユーザー指定)
import test from 'node:test';
import assert from 'node:assert/strict';
import { RECIPES, findRecipe } from '../src/data/fusion.js';
import { NAKAMA } from '../src/data/nakama.js';
import { ITEMS } from '../src/data/items.js';
import { newGame, receiveWatch, addMedal } from '../src/logic/game.js';
import { canFuse, fuse, fusionParts } from '../src/logic/fusion.js';

const exists = c => (c.startsWith('n:') ? NAKAMA[c.slice(2)] : ITEMS[c.slice(2)]);

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
    assert.deepEqual([...kinds].sort(), ['i+i', 'i+n', 'n+n']);
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
