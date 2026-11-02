// =====================================================================
// 性格と 戦い方 (2026-11-02 ユーザー指定)
// ---------------------------------------------------------------------
// 戦い方 (STYLES): キャラ (種類) ごとに 決まっている、バトルで 多用する コマンド。
//   NAKAMA の style が あれば それ、なければ 能力と 役割から 決める (styleOf)
// 性格 (NATURES): メダル 1 枚ごとに ちがう。なかまに なった ときに 決まり、本屋の「性格の本」で かえられる。
//   w: コマンドの えらびやすさに かける 数 (戦い方と かけあわせる)・loaf: さぼりやすさ・grow: レベルが 上がるときの 能力の のびかた
//   ぼうぎょ (def) は 攻撃も 術も ふせぐ (とくぼうを かねる)
// =====================================================================
export const STYLES = {
    attack: { name: 'こうげき型', desc: '通常攻撃を 多用する', w: { attack: 1.5 } },
    waza: { name: 'わざ型', desc: 'わざを 多用する', w: { waza: 1.6 } },
    jutsu: { name: '術型', desc: '術を 多用する', w: { jutsu: 1.6 } },
    guard: { name: 'まもり型', desc: 'まもりを 多用する', w: { guard: 1.3, attack: 1.1 } },
    balance: { name: 'バランス型', desc: 'いろいろな コマンドを まんべんなく', w: {} }
};

export const NATURES = {
    isamashii: { name: 'いさましい', desc: '攻撃的。通常攻撃を よく えらび、こうげきが 上がりやすい', w: { attack: 1.6, guard: 0.6 }, grow: { atk: 1.15 } },
    shinchou: { name: 'しんちょう', desc: '慎重。まもりを よく えらび、ぼうぎょと HP が 上がりやすい', w: { guard: 2.2, attack: 0.8 }, grow: { def: 1.15, hp: 1.06 } },
    kashikoi: { name: 'かしこい', desc: '術を よく えらび、ようじゅつが 上がりやすい', w: { jutsu: 1.8 }, grow: { mag: 1.15 } },
    sekkachi: { name: 'せっかち', desc: 'わざを よく えらび、すばやさが 上がりやすい', w: { waza: 1.6 }, grow: { spd: 1.15 } },
    nekketsu: { name: 'ねっけつ', desc: '通常攻撃も わざも よく えらび、こうげきと すばやさが 少し 上がりやすい', w: { attack: 1.3, waza: 1.3, guard: 0.5 }, grow: { atk: 1.08, spd: 1.08 } },
    yasashii: { name: 'やさしい', desc: 'まもりと 術を よく えらび、ようじゅつと ぼうぎょが 少し 上がりやすい', w: { guard: 1.4, jutsu: 1.3, attack: 0.8 }, grow: { mag: 1.08, def: 1.08 } },
    nonki: { name: 'のんき', desc: 'ときどき さぼるが、HP が 上がりやすい', w: {}, loaf: 2.2, grow: { hp: 1.15 } },
    kimagure: { name: 'きまぐれ', desc: 'なにを するか わからない。どの 能力も 少しずつ 上がりやすい', w: { attack: 1, waza: 1, jutsu: 1, guard: 1 }, flat: true, grow: { hp: 1.03, atk: 1.03, def: 1.03, spd: 1.03, mag: 1.03 } }
};
export const NATURE_IDS = Object.keys(NATURES);

// 戦い方を 決める: 指定 (style) が なければ 能力と 役割から
export function styleOf(sp) {
    if (!sp) return 'balance';
    if (sp.style) return sp.style;
    const b = sp.base || {};
    if (sp.role === 'defender' && (b.def || 0) >= Math.max(b.atk || 0, b.mag || 0) * 1.6) return 'guard';
    if ((b.mag || 0) > (b.atk || 0) * 1.12) return 'jutsu';
    if (sp.role === 'jammer' || sp.role === 'supporter') return 'waza';
    if ((b.atk || 0) > (b.mag || 0) * 1.12) return 'attack';
    return 'balance';
}

// メダルの uid から 性格を 決める (セーブに 性格が ない ときも 毎回 同じに なる)
export function natureFromSeed(seed) {
    let h = 2166136261;
    for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    return NATURE_IDS[h % NATURE_IDS.length];
}
