// =====================================================================
// なかまの 能力・レベル・けいけんち (画面に ふれない)
// =====================================================================
import { unitOf } from '../data/nakama.js';
import { NATURES } from '../data/nature.js';

export const MAX_LV = 99;
export const STAT_KEYS = ['hp', 'atk', 'def', 'spd', 'mag'];

export const speciesOf = unitOf;   // なかま・こおりくん・ボス

// Lv の 能力: Lv1 の 能力から 1 Lv ごとに 7% ずつ 上がる
// nature: メダルの 性格 (2026-11-02)。その 性格の 上がりやすい 能力は のびが 大きい (data/nature.js の grow)
export function statsAt(id, lv, nature = null) {
    const s = speciesOf(id);
    const grow = (nature && NATURES[nature] && NATURES[nature].grow) || {};
    const out = {};
    for (const key of STAT_KEYS) out[key] = Math.round(s.base[key] * (1 + 0.07 * (lv - 1) * (grow[key] || 1)));
    return out;
}

// その Lv に なるのに いる けいけんちの 合計
export const expFor = lv => (lv <= 1 ? 0 : Math.round(8 * Math.pow(lv - 1, 1.9)));

// けいけんちを 足して、上がった Lv の 数を 返す
export function gainExp(medal, exp) {
    const before = medal.lv;
    medal.exp += exp;
    while (medal.lv < MAX_LV && medal.exp >= expFor(medal.lv + 1)) medal.lv++;
    return medal.lv - before;
}

// たおした ときに もらえる けいけんち・お金
const bossK = (id, k) => (unitOf(id)?.bigMove ? k : 1);
export const expReward = (id, lv) => Math.round((10 + lv * 6) * bossK(id, 4));
export const moneyReward = (id, lv) => Math.round((8 + lv * 4) * bossK(id, 5));
