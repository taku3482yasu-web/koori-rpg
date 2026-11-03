// =====================================================================
// 合体の館 (data/fusion.js) の 合体 (画面に ふれない)
// ---------------------------------------------------------------------
// 材料: { type: 'medal', uid } (メダル 1 枚) / { type: 'item', id } (アイテム 1 こ) / { type: 'equip', id } (だれも 付けて いない 装備 1 こ)
// こおりくん (主人公) の メダルは 使えない。ウォッチに 入っている メダルを 使うと、その 場所は あく
// 一覧に 出すのは 合体に 使える もの だけ (2026-11-03 ユーザー指定)。1 つ目を えらんだら、それと 合体できる ものだけ
// =====================================================================
import { findRecipe, FUSION_CODES } from '../data/fusion.js';
import { HERO_ID } from '../data/nakama.js';
import { medalByUid, addMedal, addEquip, equipFree } from './game.js';

// 材料の 名前 ('n:…' / 'i:…')。使えない 材料は null
export function codeOf(g, part) {
    if (!part) return null;
    if (part.type === 'medal') {
        const m = medalByUid(g, part.uid);
        return m && m.id !== HERO_ID ? `n:${m.id}` : null;
    }
    if (part.type === 'equip') return equipFree(g, part.id) > 0 ? `e:${part.id}` : null;
    return (g.items[part.id] || 0) > 0 ? `i:${part.id}` : null;
}
const countOf = (g, p) => (p.type === 'equip' ? equipFree(g, p.id) : g.items[p.id] || 0);

// 合体に 使える もの (メダル帳の メダル・もっている アイテム・付けて いない 装備) の うち、レシピに ある もの。
//   first: 1 つ目に えらんだ もの (あれば、それと 合体できる ものだけ)
export function fusionParts(g, first = null) {
    const all = [
        ...g.medals.filter(m => m.id !== HERO_ID).map(m => ({ type: 'medal', uid: m.uid })),
        ...Object.keys(g.items).filter(id => g.items[id] > 0).map(id => ({ type: 'item', id })),
        ...Object.keys(g.equips || {}).filter(id => equipFree(g, id) > 0).map(id => ({ type: 'equip', id }))
    ].filter(p => FUSION_CODES.has(codeOf(g, p)));
    return first ? all.filter(p => canFuse(g, first, p)) : all;
}

// a と b で 合体できるか。できるなら レシピ
export function canFuse(g, a, b) {
    const ca = codeOf(g, a), cb = codeOf(g, b);
    if (!ca || !cb) return null;
    if (a.type === 'medal' && b.type === 'medal' && a.uid === b.uid) return null;           // 同じ メダルは 1 枚しか ない
    if (a.type !== 'medal' && a.type === b.type && a.id === b.id && countOf(g, a) < 2) return null;
    return findRecipe(ca, cb);
}

function usePart(g, part) {
    if (part.type === 'item') { g.items[part.id]--; return null; }
    if (part.type === 'equip') { g.equips[part.id]--; return null; }
    const m = medalByUid(g, part.uid);
    g.medals = g.medals.filter(x => x.uid !== part.uid);
    g.watch = g.watch.map(u => (u === part.uid ? null : u));
    return m;
}

// 合体する。できた もの { kind: 'nakama', id, medal } / { kind: 'item', id } を 返す。できなければ null
export function fuse(g, a, b) {
    const r = canFuse(g, a, b);
    if (!r) return null;
    const used = [usePart(g, a), usePart(g, b)].filter(Boolean);
    const [kind, id] = r.to.split(':');
    if (!g.zukan.fused) g.zukan.fused = {};
    g.zukan.fused[r.to] = true;
    if (kind === 'i') {
        g.items[id] = (g.items[id] || 0) + 1;
        return { kind: 'item', id };
    }
    if (kind === 'e') {
        addEquip(g, id);
        return { kind: 'equip', id };
    }
    const lv = Math.max(1, Math.round(used.reduce((s, m) => s + m.lv, 0) / used.length));
    const medal = addMedal(g, id, lv);   // ウォッチが あいていたら 入る
    return { kind: 'nakama', id, medal };
}
