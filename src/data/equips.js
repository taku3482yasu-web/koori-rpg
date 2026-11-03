// =====================================================================
// 装備 (2026-11-03 ユーザー指定: 宝箱から 出る。なかま 1 体に 1 つ = お守り型)
// ---------------------------------------------------------------------
// メニューの「なかま」で なかまを えらんで A → 付ける 装備を えらぶ。バトルで その なかまの 力が 上がる
//   bonus: 能力の アップ (0.1 = +10%)。hp / atk (こうげき) / def (まもり) / spd (すばやさ) / mag (ようじゅつ)
//   gauge: 必殺技ゲージの たまりやすさ (0.2 = 2 わり はやい)
//   tier: 1 町の 宝箱・2 ダンジョンの 宝箱・3 奥の エリアの いちばん 奥 (レア)
// =====================================================================
export const EQUIPS = {
    // ----- 1: 町 -----
    hachimaki: { name: 'ちからの はちまき', tier: 1, bonus: { atk: 0.08 }, desc: 'こうげきが 8% アップ。ぎゅっと しめると 気合いが 入る' },
    haramaki: { name: 'ぬくぬく はらまき', tier: 1, bonus: { def: 0.08 }, desc: 'まもりが 8% アップ。おなかを ひやさない' },
    zouri: { name: 'はやあしの ぞうり', tier: 1, bonus: { spd: 0.08 }, desc: 'すばやさが 8% アップ。かるくて 走りやすい' },
    beads: { name: 'ふしぎな ビーズ', tier: 1, bonus: { mag: 0.08 }, desc: 'ようじゅつが 8% アップ。のぞくと 星が 見える' },
    wristband: { name: 'げんきの リストバンド', tier: 1, bonus: { hp: 0.1 }, desc: 'HP が 10% アップ。あせを すって くれる' },
    // ----- 2: ダンジョン -----
    kanaboKey: { name: '金棒の キーホルダー', tier: 2, bonus: { atk: 0.15 }, desc: 'こうげきが 15% アップ。鬼鬼団の おみやげ' },
    koura: { name: '亀の こうらの たて', tier: 2, bonus: { def: 0.15 }, desc: 'まもりが 15% アップ。浦の島の 海で ひろった' },
    tenguGeta: { name: '天狗の げた', tier: 2, bonus: { spd: 0.15 }, desc: 'すばやさが 15% アップ。一本歯で ぴょんぴょん はねる' },
    moonPendant: { name: '月の ペンダント', tier: 2, bonus: { mag: 0.15 }, desc: 'ようじゅつが 15% アップ。月の 光を ためている' },
    muscleBelt: { name: '筋肉ベルト', tier: 2, bonus: { hp: 0.15, atk: 0.05 }, desc: 'HP 15%・こうげき 5% アップ。巻くだけで 筋肉が つく (気がする)' },
    hissatsuBand: { name: '必殺の はちまき', tier: 2, gauge: 0.2, desc: '必殺技ゲージが 2 わり はやく たまる' },
    netJuzu: { name: '電脳の 数珠', tier: 2, bonus: { mag: 0.1, def: 0.05 }, desc: 'ようじゅつ 10%・まもり 5% アップ。ネット寺の 品' },
    // ----- 3: 奥の エリアの いちばん 奥 -----
    kooriMuffler: { name: '氷隊の マフラー', tier: 3, bonus: { atk: 0.12, spd: 0.12 }, desc: 'こうげき・すばやさが 12% アップ。氷隊の あかし' },
    goldArmor: { name: '黄金の よろい', tier: 3, bonus: { def: 0.2, hp: 0.15 }, desc: 'まもり 20%・HP 15% アップ。SE城の 宝物' },
    shinobiZukin: { name: '忍びの 頭巾', tier: 3, bonus: { spd: 0.2 }, gauge: 0.15, desc: 'すばやさ 20% アップ・ゲージが 1.5 わり はやい' },
    pagodaCharm: { name: '五重塔の お守り', tier: 3, bonus: { mag: 0.2, def: 0.1 }, desc: 'ようじゅつ 20%・まもり 10% アップ' },
    dragonScale: { name: '竜の うろこ', tier: 3, bonus: { hp: 0.25 }, desc: 'HP が 25% アップ。とても かたい うろこ' },
    shitennouBand: { name: '四天王の 腕章', tier: 3, bonus: { atk: 0.2, mag: 0.1 }, desc: 'こうげき 20%・ようじゅつ 10% アップ。ASO四天王の 腕章' },
    kinnikuGlove: { name: '修行の グローブ', tier: 3, bonus: { atk: 0.15, hp: 0.15 }, desc: 'こうげき・HP が 15% アップ。修行の 洞穴の 奥に あった' },
    magmaStone: { name: '溶岩の 石', tier: 3, bonus: { mag: 0.25 }, desc: 'ようじゅつが 25% アップ。まだ ほんのり あたたかい' },
    kuraiFang: { name: '喰らいの 牙', tier: 3, bonus: { atk: 0.25 }, gauge: 0.1, desc: 'こうげき 25% アップ・ゲージが 1 わり はやい。まがまがしい 牙' },
    hoshiCrown: { name: '星の 王冠', tier: 3, bonus: { hp: 0.1, atk: 0.1, def: 0.1, spd: 0.1, mag: 0.1 }, gauge: 0.2, desc: 'ぜんぶの 能力が 10% アップ・ゲージが 2 わり はやい' }
};
export const EQUIP_IDS = Object.keys(EQUIPS);
// ねだん (2026-11-03): お面屋で ティア 1 (いつでも)・ティア 2 (8 章 クリアから) を 売っている。売ると 半分
export const TIER_PRICE = { 1: 500, 2: 2000, 3: 6000 };
export const equipPrice = id => TIER_PRICE[EQUIPS[id].tier];
export const equipSellPrice = id => Math.floor(equipPrice(id) / 2);
export const EQUIP_STATS = { hp: 'HP', atk: 'こうげき', def: 'まもり', spd: 'すばやさ', mag: 'ようじゅつ' };
// 装備の ききめを 短く (メニュー用)
export const equipShort = id => {
    const e = EQUIPS[id];
    if (!e) return '';
    const parts = Object.entries(e.bonus || {}).map(([k, v]) => `${EQUIP_STATS[k]}+${Math.round(v * 100)}%`);
    if (e.gauge) parts.push(`ゲージ+${Math.round(e.gauge * 100)}%`);
    return parts.join(' ');
};
