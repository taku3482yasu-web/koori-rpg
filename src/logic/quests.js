// =====================================================================
// 町の 依頼 (data/quests.js) の 進み (画面に ふれない)
// ---------------------------------------------------------------------
// g.quests[id]: なし = まだ たのまれていない / 'active' = うけた / 'done' = お礼を もらった
// =====================================================================
import { QUESTS } from '../data/quests.js';
import { MYSTERIES } from '../data/map.js';
import { reached } from './story.js';

export const questState = (g, id) => (g.quests && g.quests[id]) || null;
export const questById = id => QUESTS.find(q => q.id === id) || null;

// 今 その キャラが たのむ 依頼 (1 人 1 つずつ 順番に。ストーリーが 進んでいない ものは まだ)
export function questOf(g, friendId) {
    return QUESTS.find(q => q.from === friendId && questState(g, q.id) !== 'done' && (!q.after || reached(g, q.after))) || null;
}

// どこまで できたか { now, need }
export function questProgress(g, q) {
    const n = q.need;
    if (n.kind === 'item') return { now: Math.min(n.n, g.items[n.item] || 0), need: n.n };
    if (n.kind === 'befriend') return { now: g.zukan.friends[n.id] ? 1 : 0, need: 1 };
    if (n.kind === 'friends') return { now: Math.min(n.n, Object.keys(g.zukan.friends).length), need: n.n };
    if (n.kind === 'mysteries') return { now: Math.min(n.n, MYSTERIES.filter(m => g.mysteries && g.mysteries[m.id]).length), need: n.n };
    return { now: 0, need: 1 };
}
export const questReady = (g, q) => { const p = questProgress(g, q); return p.now >= p.need; };

export function acceptQuest(g, id) {
    if (!g.quests) g.quests = {};
    if (!g.quests[id]) g.quests[id] = 'active';
}

// できていたら お礼を もらう (道具を わたす 依頼は 道具が へる)。お礼を 返す
export function completeQuest(g, q) {
    if (questState(g, q.id) !== 'active' || !questReady(g, q)) return null;
    if (q.need.kind === 'item') g.items[q.need.item] -= q.need.n;
    const r = q.reward;
    if (r.money) g.money += r.money;
    if (r.item) g.items[r.item] = (g.items[r.item] || 0) + r.n;
    g.quests[q.id] = 'done';
    return r;
}

// メニューに 出す 一覧 (うけた もの → おわった もの)
export const questList = g => QUESTS.filter(q => questState(g, q.id)).sort((a, b) => (questState(g, a.id) === 'done') - (questState(g, b.id) === 'done'));
