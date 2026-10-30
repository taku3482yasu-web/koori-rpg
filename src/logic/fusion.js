// =====================================================================
// 合体の館 (data/fusion.js) の 合体 (画面に ふれない)
// ---------------------------------------------------------------------
// 材料: { type: 'medal', uid } (メダル 1 枚) / { type: 'item', id } (アイテム 1 こ)
// こおりくん (主人公) の メダルは 使えない。ウォッチに 入っている メダルを 使うと、その 場所は あく
// =====================================================================
import { findRecipe } from '../data/fusion.js';
import { HERO_ID } from '../data/nakama.js';
import { medalByUid, addMedal } from './game.js';

// 材料の 名前 ('n:…' / 'i:…')。使えない 材料は null
export function codeOf(g, part) {
    if (!part) return null;
    if (part.type === 'medal') {
        const m = medalByUid(g, part.uid);
        return m && m.id !== HERO_ID ? `n:${m.id}` : null;
    }
    return (g.items[part.id] || 0) > 0 ? `i:${part.id}` : null;
}

// 合体に 使える もの (メダル帳の メダル・もっている アイテム)
export function fusionParts(g) {
    return [
        ...g.medals.filter(m => m.id !== HERO_ID).map(m => ({ type: 'medal', uid: m.uid })),
        ...Object.keys(g.items).filter(id => g.items[id] > 0).map(id => ({ type: 'item', id }))
    ];
}

// a と b で 合体できるか。できるなら レシピ
export function canFuse(g, a, b) {
    const ca = codeOf(g, a), cb = codeOf(g, b);
    if (!ca || !cb) return null;
    if (a.type === 'medal' && b.type === 'medal' && a.uid === b.uid) return null;           // 同じ メダルは 1 枚しか ない
    if (a.type === 'item' && b.type === 'item' && a.id === b.id && g.items[a.id] < 2) return null;
    return findRecipe(ca, cb);
}

function usePart(g, part) {
    if (part.type === 'item') { g.items[part.id]--; return null; }
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
    const lv = Math.max(1, Math.round(used.reduce((s, m) => s + m.lv, 0) / used.length));
    const medal = addMedal(g, id, lv);   // ウォッチが あいていたら 入る
    return { kind: 'nakama', id, medal };
}
