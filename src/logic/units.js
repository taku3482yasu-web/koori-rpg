// =====================================================================
// なかまの 能力・レベル・けいけんち (画面に ふれない)
// =====================================================================
import { NAKAMA, BOSSES } from '../data/nakama.js';

export const MAX_LV = 99;
export const STAT_KEYS = ['hp', 'atk', 'def', 'spd', 'mag'];

export const speciesOf = id => NAKAMA[id] || BOSSES[id];

// Lv の 能力: Lv1 の 能力から 1 Lv ごとに 7% ずつ 上がる
export function statsAt(id, lv) {
    const s = speciesOf(id);
    const k = 1 + 0.07 * (lv - 1);
    const out = {};
    for (const key of STAT_KEYS) out[key] = Math.round(s.base[key] * k);
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
export const expReward = (id, lv) => Math.round((10 + lv * 6) * (BOSSES[id] ? 4 : 1));
export const moneyReward = (id, lv) => Math.round((8 + lv * 4) * (BOSSES[id] ? 5 : 1));
