// =====================================================================
// なかまの データ (設計書 4 章。1 章 = 石の川タウンの 20 体 + ボス。段階 2 で 商店街の 20 体。2 章で 石の川小学校の 9 体)
// ---------------------------------------------------------------------
// 前作 (koori-dungeon) から来た 15 体は、名前・属性・役割・説明・口ぐせを ダンジョンの データから写した。
// 新キャラ 5 体 (イシコロン〜ハシシタボウズ) は 設計書 4.6 の案。
//
//   rank: E〜S (設計書 4.5)。1 章は 全員 E
//   role: attacker 攻める / defender 守る / healer 治す / jammer じゃまする / supporter 支える
//   base: Lv1 の 能力 (hp・atk こうげき・def ぼうぎょ・spd すばやさ・mag ようじゅつ)
//   waza: キャラごとの わざ / jutsu: 属性の 術 (WAZA・jutsuOf) / special: 必殺技 (ゲージが たまったら プレイヤーが 打つ)
//   favorite: 好物 (items.js の food)。バトルで 投げると 仲間に なりやすい
// =====================================================================

export const ROLES = {
    attacker: '攻める',
    defender: '守る',
    healer: '治す',
    jammer: 'じゃまする',
    supporter: '支える'
};

// 属性の相性 (ダンジョンの units.js の CHART と同じ): わざの属性 → 受ける側の属性 の倍率
export const ELEMENTS = ['こおり', 'ほのお', 'みず', 'しぜん', 'かぜ', 'ふしぎ', 'ふつう'];
export const CHART = {
    'こおり': { 'ほのお': 0.67, 'しぜん': 1.5, 'かぜ': 1.5 },
    'ほのお': { 'こおり': 1.5, 'みず': 0.67, 'しぜん': 1.5 },
    'みず': { 'ほのお': 1.5, 'しぜん': 0.67 },
    'しぜん': { 'ほのお': 0.67, 'みず': 1.5, 'かぜ': 0.67 },
    'かぜ': { 'こおり': 0.67, 'しぜん': 1.5 },
    'ふしぎ': { 'ふしぎ': 1.5, 'ふつう': 0.67 },
    'ふつう': { 'ふしぎ': 0.67 }
};
export const ELEMENT_COLORS = {
    'こおり': '#bff0ff', 'ほのお': '#ff8a4a', 'みず': '#4aa8e0', 'しぜん': '#5ad06a', 'かぜ': '#c8f08a', 'ふしぎ': '#d8a8ff', 'ふつう': '#e0e0e0'
};

// ----- バトルで なかまが 使う 5 つの コマンド (2026-10-27 ユーザー指定) -----
//   通常攻撃 / わざ (キャラごとの わざ) / さぼり / まもり / 術 (属性の 術。強い キャラほど 名前が 変わる)
// 術: 属性ごとに 3 だん (下級・中級・上級)。だんは ランクで 決まる (2026-10-28 ユーザー指定):
//   E・D は 下級 / C・B と A の 一部は 中級 / A の 一部 (upperJutsu: true の キャラ) と S は 上級
//   例: みず は 水流の術 (下級) → 大滝の術 (中級) → 大津波の術 (上級)
export const JUTSU = {
    'こおり': ['氷結の術', '吹雪の術', '氷河の術'],
    'ほのお': ['火炎の術', '業火の術', '大噴火の術'],
    'みず': ['水流の術', '大滝の術', '大津波の術'],
    'しぜん': ['草木の術', '大樹の術', '森羅の術'],
    'かぜ': ['旋風の術', '竜巻の術', '大嵐の術'],
    'ふしぎ': ['幻の術', '妖光の術', '異界の術'],
    'ふつう': ['衝撃の術', '大衝撃の術', '天変の術']
};
const JUTSU_POWER = [1.3, 1.7, 2.2];
export const JUTSU_RANK_NAMES = ['下級', '中級', '上級'];
const RANK_TIER = { E: 0, D: 0, C: 1, B: 1, A: 1, S: 2 };
export const jutsuTier = (rank, upper = false) => (rank === 'A' && upper ? 2 : RANK_TIER[rank] ?? 0);
// 回復の術・吸収の術 (2026-10-28 ユーザー指定)。合いそうな キャラだけ 属性の 術の かわりに 使う (JUTSU_TYPE)
//   回復: 味方を 治す (3 だん目は 味方 全員) / 吸収: 敵 1 体に 術の ダメージを あたえ、半分を 自分の HP に する
export const HEAL_JUTSU = ['回復の術', '大回復の術', '完全回復の術'];
export const DRAIN_JUTSU = ['吸収の術', '大吸収の術', '奪命の術'];
export const JUTSU_TYPE = {
    // 回復: 世話を する キャラ (治す 役の コザラッパは わざで 治すので、術は みずの 術)
    soumennagare: 'heal', mokugyoro: 'heal', gomibakon: 'heal', gachapon: 'heal',
    // 吸収: 取る・うばう・命を 吸う キャラ
    pekorisu: 'drain', rousokubi: 'drain', daichouenkin: 'drain', burakrasher: 'drain', hoshikuzun: 'drain', neontanuki: 'drain'
};
export function jutsuOf(element, tier, type = 'element') {
    if (type === 'heal') {
        return { name: HEAL_JUTSU[tier], tier, type, effects: [{ kind: 'heal', target: tier === 2 ? 'party' : 'lowest', power: [0.6, 0.8, 0.55][tier] }] };
    }
    if (type === 'drain') {
        return { name: DRAIN_JUTSU[tier], tier, type, effects: [{ kind: 'attack', target: 'one', power: [1.0, 1.3, 1.6][tier], magic: true, drain: 0.5 }] };
    }
    return { name: JUTSU[element][tier], tier, type: 'element', effects: [{ kind: 'attack', target: tier === 2 ? 'all' : 'one', power: JUTSU_POWER[tier] * (tier === 2 ? 0.7 : 1), magic: true }] };
}

// わざ: キャラごとの わざ。前作 (ダンジョン) の キャラは その キャラの 得意わざ (allies.js の いちばん はじめに 覚える わざ) を 写した。
//   range: front・line → 1 体 / around → 敵 全員。power は 前作の 威力 (ふつうの 攻撃 = 1)。0 は 状態異常だけ
//   状態異常は この ゲームの 4 つに 置きかえ (しびれ・しばり → のろい / やけど・大腸炎 → どく / めくらまし・ひるみ → こんらん)
//   2 章から「とりつき」(possess) も ある (学校の キャラ。設計書 3.4)
//   heal: 治す わざ (治す 役の キャラ) / buff: 自分を 強くする わざ (ミラーポーズ など)
const W = (name, element, range, power, status = null, chance = 0) => ({ name, element, range, power, status, chance });
export const WAZA = {
    haribaby: W('はりとげ', 'ふつう', 'line', 0.9),
    mumenbachi: W('つっこみ', 'かぜ', 'front', 1.3),
    donguriko: W('ころがりタックル', 'しぜん', 'front', 1.3),
    nemuridake: W('ねむりごな', 'しぜん', 'front', 0, 'sleep', 0.8),
    pekorisu: W('たねマシンガン', 'しぜん', 'line', 1.0),
    tsutankobu: W('からみつく', 'しぜん', 'front', 0.8, 'slow', 0.7),
    yofukashi: W('はばたき', 'かぜ', 'line', 0.9),
    kogame: W('こうらタックル', 'みず', 'front', 1.3),
    tsuribariuo: W('つりばり', 'みず', 'line', 0.8, 'slow', 0.5),
    mokugyoro: W('ポクポク', 'ふつう', 'around', 0, 'confuse', 0.6),
    rousokubi: W('火の玉', 'ほのお', 'line', 1.0, 'poison', 0.3),
    daichouenkin: W('ばい菌', 'ふしぎ', 'front', 0.5, 'poison', 0.6),
    kunaisuzume: W('クナイ', 'かぜ', 'line', 1.0),
    kawarimidanuki: W('ドロン', 'ふしぎ', 'front', 0.8, 'confuse', 0.4),
    shinobigaeru: W('とびだし', 'みず', 'front', 1.5),
    // 新キャラ (この ゲームで 考えた)
    ishikoron: W('ふんづけ返し', 'しぜん', 'front', 1.3),
    mizukirin: W('水切りショット', 'かぜ', 'line', 1.1),
    soumennagare: W('そうめんスライダー', 'みず', 'front', 1.0, 'slow', 0.3),
    kozarappa: { name: 'さらの しずく', heal: 1.0 },
    hashishita: W('かぞえまちがい', 'ふしぎ', 'front', 0.6, 'confuse', 0.6),
    // 商店街
    spamdama: W('めいわくメール', 'ふしぎ', 'line', 0.5, 'confuse', 0.5),
    popupn: W('ポップアップ広告', 'ふしぎ', 'around', 0, 'confuse', 0.6),
    netkozou: W('配信のお経', 'ふしぎ', 'line', 0.5, 'sleep', 0.4),
    kinmenkoinu: W('きんピカ', 'ふつう', 'around', 0, 'confuse', 0.6),
    burakrasher: W('ブツン', 'ふしぎ', 'line', 0.8, 'confuse', 0.5),
    hannyamen: W('はんにゃのにらみ', 'ふしぎ', 'front', 1.2, 'confuse', 0.3),
    makibishimushi: W('まきびしまき', 'ふつう', 'around', 0.8, 'slow', 0.3),
    hoshikuzun: W('キラッ☆', 'ふしぎ', 'line', 0.6, 'confuse', 0.5),
    richibou: W('リーチ宣言', 'ふしぎ', 'around', 0, 'slow', 0.6),
    yopparaigarasu: W('よっぱらいつつき', 'かぜ', 'front', 1.3, 'confuse', 0.4),
    chouchinbura: W('ちょうちん火', 'ほのお', 'line', 1.2, 'poison', 0.3),
    neonkurage: W('ネオンビリビリ', 'かぜ', 'front', 1.1, 'slow', 0.5),
    saikoron: W('サイコロころがし', 'ふつう', 'line', 1.3),
    hakupai: W('ハクの一撃', 'ふつう', 'front', 1.5),
    maikumbo: W('はずれたカラオケ', 'ふしぎ', 'around', 0.8, 'sleep', 0.3),
    pachinkodaman: W('玉のシャワー', 'ふつう', 'line', 1.2),
    neontanuki: W('ネオンばけ', 'ふしぎ', 'front', 0.9, 'confuse', 0.6),
    gomibakon: W('ゴミなげ', 'ふつう', 'line', 1.0, 'poison', 0.4),
    gachapon: W('ガチャころり', 'ふしぎ', 'line', 1.1, 'confuse', 0.3),
    yataiman: W('あつあつラーメン', 'ほのお', 'front', 1.5, 'poison', 0.3),
    // 石の川小学校 (2 章)。とりつき を 使う キャラが いる
    fusaiyougaikotsu: W('不採用通知', 'ふしぎ', 'line', 0.7, 'possess', 0.35),
    mirrormuscle: { name: 'ミラーポーズ', buff: 'def' },
    proteingolem: W('ゴーレムプレス', 'ふつう', 'front', 1.5),
    takaramimic: W('かみつき', 'ふつう', 'front', 1.5),
    umibozun: W('おおなみ', 'みず', 'around', 0.9),
    wasurekurage: W('わすれ針', 'ふしぎ', 'front', 0.8, 'possess', 0.4),
    mikazukibat: W('ちょうおんぱ', 'かぜ', 'line', 0.5, 'confuse', 0.6),
    lunashadow: W('かげうち', 'ふしぎ', 'line', 1.3),
    yoroinukegara: { name: 'よろいがため', buff: 'def' },
    // こおりくん・ボス
    koori: W('コオリソード', 'こおり', 'front', 1.4),
    nushi: W('百のかぞえうた', 'ふしぎ', 'around', 0.6, 'confuse', 0.3),
    kage: W('影の とりつき', 'ふしぎ', 'around', 0.6, 'possess', 0.3)
};
// わざの 効果 (battle.js の applyEffects の 形)。わざは 前作の 威力 × 1.4
export function wazaEffects(w) {
    if (w.heal) return [{ kind: 'heal', target: 'lowest', power: w.heal }];
    if (w.buff) return [{ kind: 'buff', target: 'self', stat: w.buff, amount: 0.5, time: 8 }];
    const target = w.range === 'around' ? 'all' : 'one';
    const fx = [];
    if (w.power > 0) fx.push({ kind: 'attack', target, power: w.power * 1.4 * (target === 'all' ? 0.7 : 1), element: w.element });
    if (w.status) fx.push({ kind: 'status', target, status: w.status, chance: w.chance });
    return fx;
}

// 役割ごとの 能力の ひな形 (キャラごとに mul で 少し 変える)
const ROLE_BASE = {
    attacker: { hp: 52, atk: 15, def: 9, spd: 13, mag: 9 },
    defender: { hp: 70, atk: 10, def: 15, spd: 8, mag: 9 },
    healer: { hp: 56, atk: 8, def: 10, spd: 11, mag: 15 },
    jammer: { hp: 54, atk: 9, def: 10, spd: 12, mag: 14 },
    supporter: { hp: 56, atk: 11, def: 11, spd: 13, mag: 11 }
};

// 必殺技の 効果: { kind: 'attack' | 'heal' | 'buff' | 'status', target: 'one' | 'all' | 'party' | 'self', power, hits, stat, amount, status, chance, drain }
const sp = (name, effects) => ({ name, effects });
const atk = (target, power, extra = {}) => ({ kind: 'attack', target, power, ...extra });

const LIST = [
    // ----- 前作 (ダンジョン) から 15 体 -----
    {
        id: 'haribaby', name: 'ハリベビー', from: 'ダンジョン 001', element: 'ふつう', role: 'attacker', mul: { hp: 0.9, atk: 1.05 },
        line: 'ハリ…！', favorite: 'cider',
        title: 'ハリーの子供', desc: 'ハリーの子供。車を運転することにあこがれており、いつか免許を取りたいと思っている。',
        special: sp('ハリハリ突進', [atk('one', 2.6)])
    },
    {
        id: 'mumenbachi', name: 'ムメンキョバチ', from: 'ダンジョン 002', element: 'かぜ', role: 'attacker', mul: { hp: 0.8, spd: 1.25 },
        line: 'メンキョナイー！', favorite: 'choco',
        title: '無免許で空を飛ぶ蜂', desc: '無免許で空を飛んでいる。警察に見つかったら５０万円の罰金、もしくは刑務所行きになる。',
        special: sp('無免許スピン', [atk('all', 1.6)])
    },
    {
        id: 'donguriko', name: 'ドングリコ', from: 'ダンジョン 003', element: 'しぜん', role: 'defender', mul: { hp: 0.9 },
        line: 'コロコロ～', favorite: 'kyuuri',
        title: '意思を持つドングリ', desc: '食べられないように意思を持ったドングリ。でもドングリなので、すぐ食べられる。',
        special: sp('ころころガード', [{ kind: 'buff', target: 'party', stat: 'def', amount: 0.5, time: 10 }])
    },
    {
        id: 'nemuridake', name: 'ネムリダケ', from: 'ダンジョン 004', element: 'しぜん', role: 'jammer', mul: {},
        line: 'ふぁ～…', favorite: 'melonpan',
        title: '眠いキノコ', desc: 'いつも不眠症なキノコ。周りにいるものも不眠症にする。',
        special: sp('ねむりの胞子', [atk('all', 0.6), { kind: 'status', target: 'all', status: 'sleep', chance: 0.6 }])
    },
    {
        id: 'pekorisu', name: 'ペコリス', from: 'ダンジョン 005', element: 'ふつう', role: 'supporter', mul: { spd: 1.1 },
        line: 'いただきっ！', favorite: 'onigiri',
        title: '森の盗人', desc: 'いつもおなかがすいており、周りから食べ物を奪うことで生きている。',
        special: sp('いただきます', [atk('one', 2.0, { drain: 0.5 })])
    },
    {
        id: 'tsutankobu', name: 'ツタンコブ', from: 'ダンジョン 006', element: 'しぜん', role: 'defender', mul: { hp: 1.1, atk: 1.1 },
        line: 'からまっちゃえ', favorite: 'kyuuri',
        title: '生きたツタ', desc: '自我があるツタの生物。さいきん昆布なのかもしれないという論文が発表された。',
        special: sp('ツタしばり', [atk('all', 0.8), { kind: 'status', target: 'all', status: 'slow', chance: 0.8 }])
    },
    {
        id: 'yofukashi', name: 'ヨフカシフクロウ', from: 'ダンジョン 007', element: 'かぜ', role: 'jammer', mul: { atk: 1.1 },
        line: 'まだ寝ないホー', favorite: 'cider',
        title: '夜更かしする鳥', desc: '夜更かしを日課にしているフクロウ。仲間内では何日寝らずにいられるかを競っているらしい。',
        special: sp('夜ふかしの歌', [atk('all', 0.5), { kind: 'status', target: 'all', status: 'confuse', chance: 0.6 }])
    },
    {
        id: 'kogame', name: 'コガメ', from: 'ダンジョン 008', element: 'みず', role: 'defender', mul: { def: 1.2, spd: 0.9 },
        line: '…（こもる）', favorite: 'kyuuri',
        title: '小さな亀', desc: '小さな亀。それ以外の何物でもない。',
        special: sp('こうらにこもる', [{ kind: 'buff', target: 'party', stat: 'def', amount: 0.6, time: 12 }, { kind: 'heal', target: 'self', power: 1.2 }])
    },
    {
        id: 'tsuribariuo', name: 'ツリバリウオ', from: 'ダンジョン 010', element: 'みず', role: 'jammer', mul: { atk: 1.15, hp: 0.9 },
        line: 'つれた～！', favorite: 'niboshi',
        title: '魚を釣る魚', desc: '口が釣り針になっており、魚を釣って食べている。まれにゴミを釣ってしまい、釣り針が使い物にならなくなり、餓死してしまう個体もいる。',
        special: sp('一本釣り', [atk('one', 2.8)])
    },
    {
        id: 'mokugyoro', name: 'モクギョロ', from: 'ダンジョン 017', element: 'ふつう', role: 'jammer', mul: { def: 1.1 },
        line: 'ポクポクポク…', favorite: 'onigiri',
        title: '木魚', desc: '木魚が使い続けられ、命を宿した。右斜めあたりをたたかれると気持ちいいらしい。',
        special: sp('ポクポク連打', [atk('one', 0.7, { hits: 5 })])
    },
    {
        id: 'rousokubi', name: 'ロウソクビ', from: 'ダンジョン 021', element: 'ほのお', role: 'attacker', mul: { mag: 1.2 },
        line: 'ゆら～り', favorite: 'choco',
        title: 'ろうそくの怪異', desc: 'ろうそくの火が消えると現れる怪異。こいつの火が消えると、周りの人の命が一つ消える。',
        special: sp('ろうそくの灯', [atk('all', 1.7)])
    },
    {
        id: 'daichouenkin', name: 'ダイチョウエンキン', from: 'ダンジョン 051', element: 'ふしぎ', role: 'jammer', mul: { hp: 1.05 },
        line: 'おなか、ぐるぐる～', favorite: 'melonpan',
        title: '大腸菌', desc: '大腸炎が肉眼で見える形になったもの。友好型。こおりくんとは昔からの友達。',
        special: sp('大腸炎ウェーブ', [atk('all', 0.6), { kind: 'status', target: 'all', status: 'poison', chance: 0.9 }])
    },
    {
        id: 'kunaisuzume', name: 'クナイスズメ', from: 'ダンジョン 023', element: 'かぜ', role: 'attacker', mul: { spd: 1.2, hp: 0.9 },
        line: 'チュンッ！', favorite: 'melonpan',
        title: 'クナイをもつスズメ', desc: 'クナイを口に持ち、敵を狙って攻撃する。',
        special: sp('クナイ乱れ投げ', [atk('all', 0.6, { hits: 3 })])
    },
    {
        id: 'kawarimidanuki', name: 'カワリミダヌキ', from: 'ダンジョン 024', element: 'ふしぎ', role: 'jammer', mul: {},
        line: 'ドロン！', favorite: 'onigiri',
        title: '変身の達人', desc: '様々な姿に変身できる特殊な忍者。',
        special: sp('どろんチェンジ', [atk('one', 1.2), { kind: 'buff', target: 'party', stat: 'def', amount: 0.6, time: 10 }])
    },
    {
        id: 'shinobigaeru', name: 'シノビガエル', from: 'ダンジョン 027', element: 'みず', role: 'attacker', mul: { mag: 1.1 },
        line: 'ゲロッと参上', favorite: 'niboshi',
        title: '忍者の蛙', desc: '蛙の忍者。最近ナルトを見たらしい。',
        special: sp('水遁の術', [atk('all', 1.7)])
    },
    // ----- 新キャラ 5 体 (設計書 4.6) -----
    {
        id: 'ishikoron', name: 'イシコロン', from: '新', element: 'しぜん', role: 'defender', mul: { def: 1.15 },
        line: 'ふむなっ！', favorite: 'onigiri',
        title: '怒りっぽい石', desc: '川原の丸い石に意思が宿った。踏まれると怒って転がってくる。石の川タウンの名前の由来と言いはっている。',
        special: sp('ごろごろアタック', [atk('one', 2.6)])
    },
    {
        id: 'mizukirin', name: 'ミズキリン', from: '新', element: 'かぜ', role: 'attacker', mul: { spd: 1.15 },
        line: 'まだまだ跳ねるぜ', favorite: 'cider',
        title: '水切りの石', desc: '水切りで何回はねたかを自慢する平たい石。最高記録は 31 回と言いはるが、誰も見ていない。',
        special: sp('水切り31段', [atk('one', 0.45, { hits: 8 })])
    },
    {
        id: 'soumennagare', name: 'ソウメンナガレ', from: '新', element: 'みず', role: 'supporter', mul: { spd: 1.1 },
        line: 'ながされたい～', favorite: 'niboshi',
        title: '流しそうめんの精', desc: '流しそうめんで取りそこねられたそうめんの精。流されるのが大好きで、仲間のすばやさを上げる。',
        special: sp('ながしそうめん', [{ kind: 'buff', target: 'party', stat: 'spd', amount: 0.5, time: 12 }, { kind: 'heal', target: 'party', power: 0.6 }])
    },
    {
        id: 'kozarappa', name: 'コザラッパ', from: '新', element: 'みず', role: 'healer', mul: {},
        line: 'おさら、どこ～？', favorite: 'kyuuri',
        title: '皿をなくした河童の子', desc: '頭の皿を川に落とした河童の子。皿を探しながら、ケガした仲間に水をかけて治す。',
        special: sp('さらの水', [{ kind: 'heal', target: 'party', power: 1.6 }])
    },
    {
        id: 'hashishita', name: 'ハシシタボウズ', from: '新', element: 'ふしぎ', role: 'jammer', mul: { mag: 1.1 },
        line: 'ひとつ、ふたつ…', favorite: 'choco',
        title: '橋の下の坊主', desc: '橋の下に住み、通る人の足音を数えている。数えまちがえると機嫌が悪くなり、相手を混乱させる。',
        special: sp('足音かぞえ', [atk('all', 0.5), { kind: 'status', target: 'all', status: 'confuse', chance: 0.8 }])
    },
    // ----- 商店街の 20 体 (段階 2。2026-10-27。ダンジョンから。ランクは 設計書 4.5 の 分け方で 計算: E 8・D 10・C 2) -----
    //   名前・属性・役割・口ぐせ・説明は ダンジョンの データから 写した。必殺技は 仮 (設計書 4.7 で ユーザーが 決める)
    {
        id: 'spamdama', name: 'スパムダマ', from: 'ダンジョン 019', area: 'shoutengai', rank: 'E', element: 'ふしぎ', role: 'supporter', mul: { spd: 1.1 },
        line: 'おめでとうございます！当選しました！', favorite: 'choco',
        title: '広告制の人魂', desc: '周りから見てもらいたくて、スパムの真似事をしている人魂。',
        special: sp('大当選のお知らせ', [{ kind: 'buff', target: 'party', stat: 'atk', amount: 0.4, time: 10 }])
    },
    {
        id: 'popupn', name: 'ポップアップン', from: 'ダンジョン 100', area: 'shoutengai', rank: 'E', element: 'ふしぎ', role: 'supporter', mul: { hp: 0.95 },
        line: 'おめでとうございます！！', favorite: 'cider',
        title: '閉じるボタンはどこ', desc: '画面いっぱいに飛び出してくる。閉じるボタンをとても小さく作るのが特技。',
        special: sp('とじられない広告', [atk('all', 0.5), { kind: 'status', target: 'all', status: 'slow', chance: 0.7 }])
    },
    {
        id: 'netkozou', name: 'ネットコゾウ', from: 'ダンジョン 015', area: 'shoutengai', rank: 'E', element: 'ふしぎ', role: 'jammer', mul: {},
        line: 'ご視聴ありがとうございます', favorite: 'melonpan',
        title: 'ネットの坊主', desc: 'ネットに進出した小僧。最近の動画は「池の水全部抜いてみた。」',
        special: sp('ライブ配信', [atk('all', 0.5), { kind: 'status', target: 'all', status: 'confuse', chance: 0.6 }])
    },
    {
        id: 'kinmenkoinu', name: 'キンメンコイヌ', from: 'ダンジョン 052', area: 'shoutengai', rank: 'E', element: 'ふつう', role: 'supporter', mul: { def: 1.1 },
        line: 'ワン！（得意げ）', favorite: 'niboshi',
        title: '金面の子犬', desc: '子犬が金の力をもった。至る所を金色に変える。',
        special: sp('きんぴかコーティング', [{ kind: 'buff', target: 'party', stat: 'def', amount: 0.5, time: 10 }])
    },
    {
        id: 'burakrasher', name: 'ブラクラッシャー', from: 'ダンジョン 020', area: 'shoutengai', rank: 'E', element: 'ふしぎ', role: 'jammer', mul: { mag: 1.1 },
        line: 'ブツン', favorite: 'cider',
        title: '壊れたテレビ。', desc: '壊れたテレビに幽霊がとりついた。時折、映像が流れるが、それを見ると呪われてしまう。',
        special: sp('のろいの放送', [atk('all', 0.6), { kind: 'status', target: 'all', status: 'sleep', chance: 0.5 }])
    },
    {
        id: 'hannyamen', name: 'ハンニャメン', from: 'ダンジョン 018', area: 'shoutengai', rank: 'E', element: 'ふしぎ', role: 'attacker', mul: { atk: 1.1 },
        line: '仏の顔も三度まで', favorite: 'onigiri',
        title: '鬼のお面', desc: 'ダイシが祭りの際に、着用しているお面。つけたものの気性を荒くする呪いを持つ。',
        special: sp('般若の一喝', [atk('one', 2.7)])
    },
    {
        id: 'makibishimushi', name: 'マキビシムシ', from: 'ダンジョン 025', area: 'shoutengai', rank: 'E', element: 'ふつう', role: 'supporter', mul: { def: 1.1 },
        line: 'チクチク', favorite: 'kyuuri',
        title: 'まきびし型の虫', desc: 'まきびしの形をした虫。実際に殺傷力もある。',
        special: sp('まきびし まき', [atk('all', 0.8), { kind: 'status', target: 'all', status: 'slow', chance: 0.5 }])
    },
    {
        id: 'hoshikuzun', name: 'ホシクズン', from: 'ダンジョン 032', area: 'shoutengai', rank: 'E', element: 'ふしぎ', role: 'supporter', mul: { mag: 1.1 },
        line: 'キラッ☆', favorite: 'choco',
        title: 'クズ', desc: 'お星さまの落とし物。性根がクズ。',
        special: sp('ながれぼし', [{ kind: 'heal', target: 'party', power: 0.8 }, { kind: 'buff', target: 'party', stat: 'mag', amount: 0.4, time: 10 }])
    },
    {
        id: 'richibou', name: 'リーチボウ', from: 'ダンジョン 116', area: 'shoutengai', rank: 'D', element: 'ふしぎ', role: 'jammer', mul: {},
        line: 'リーチ！', favorite: 'choco',
        title: 'リーチを告げる棒', desc: 'リーチの時に置かれる点棒の付喪神。一度リーチをかけると、もう後には引けない。',
        special: sp('一発リーチ', [atk('one', 2.4), { kind: 'status', target: 'one', status: 'slow', chance: 0.8 }])
    },
    {
        id: 'yopparaigarasu', name: 'ヨッパライガラス', from: 'ダンジョン 117', area: 'shoutengai', rank: 'D', element: 'かぜ', role: 'attacker', mul: { atk: 1.1, def: 0.9 },
        line: 'カァ～～ もう一軒！', favorite: 'cider',
        title: '横丁の飲んだくれ', desc: '毎晩はしご酒をしているカラス。朝になると、どこで飲んでいたか覚えていない。',
        special: sp('はしご酒', [atk('one', 0.8, { hits: 3 })])
    },
    {
        id: 'chouchinbura', name: 'チョウチンブラ', from: 'ダンジョン 118', area: 'shoutengai', rank: 'D', element: 'ほのお', role: 'jammer', mul: { mag: 1.1 },
        line: 'ゆら～り ぶら～り', favorite: 'onigiri',
        title: 'ぶら下がる提灯', desc: '横丁の軒先にぶら下がる提灯のお化け。道に迷った人を、なぜか店の前まで案内する。',
        special: sp('ちょうちん行列', [atk('all', 1.3)])
    },
    {
        id: 'neonkurage', name: 'ネオンクラゲ', from: 'ダンジョン 121', area: 'shoutengai', rank: 'D', element: 'かぜ', role: 'jammer', mul: { spd: 1.1 },
        line: 'ピカピカ…ビリビリ', favorite: 'niboshi',
        title: '夜の街のクラゲ', desc: 'ネオンの光を浴びて育ったクラゲ。光る色はその日の気分で変わる。',
        special: sp('ネオンしびれ', [atk('all', 0.7), { kind: 'status', target: 'all', status: 'slow', chance: 0.7 }])
    },
    {
        id: 'saikoron', name: 'サイコロン', from: 'ダンジョン 115', area: 'shoutengai', rank: 'D', element: 'ふつう', role: 'attacker', mul: {},
        line: 'ころころ～ 何が出るかな', favorite: 'melonpan',
        title: '運まかせのサイコロ', desc: '転がるたびに気分が変わるサイコロ。本人も次に何が出るかわかっていない。',
        special: sp('ピンゾロ', [atk('one', 0.6, { hits: 6 })])
    },
    {
        id: 'hakupai', name: 'ハクパイ', from: 'ダンジョン 114', area: 'shoutengai', rank: 'D', element: 'ふつう', role: 'defender', mul: { def: 1.15 },
        line: '……（なにも 書いてない）', favorite: 'onigiri',
        title: '何も書いてない牌', desc: '何も書いていない麻雀牌。無口だが、そのぶん何を考えているのか誰にもわからない。',
        special: sp('まっしろガード', [{ kind: 'buff', target: 'party', stat: 'def', amount: 0.6, time: 12 }])
    },
    {
        id: 'maikumbo', name: 'マイクンボー', from: 'ダンジョン 123', area: 'shoutengai', rank: 'D', element: 'ふしぎ', role: 'jammer', mul: { mag: 1.1 },
        line: 'もう一曲 いきます！', favorite: 'cider',
        title: 'マイクを離さない', desc: 'カラオケのマイクを一度握ると離さない。持ち歌は千曲以上。',
        special: sp('アンコール', [atk('all', 0.6), { kind: 'status', target: 'all', status: 'sleep', chance: 0.6 }])
    },
    {
        id: 'pachinkodaman', name: 'パチンコダマン', from: 'ダンジョン 131', area: 'shoutengai', rank: 'D', element: 'ふつう', role: 'attacker', mul: { spd: 1.1 },
        line: 'ジャラジャラ～！', favorite: 'choco',
        title: 'いっぱいあると嬉しい', desc: 'パチンコ玉の付喪神。打たれた時、結構スリルがあって楽しいらしい。',
        special: sp('大当たりフィーバー', [atk('all', 0.5, { hits: 3 })])
    },
    {
        id: 'neontanuki', name: 'ネオンタヌキ', from: 'ダンジョン 130', area: 'shoutengai', rank: 'D', element: 'ふしぎ', role: 'jammer', mul: {},
        line: 'ここは いい お店ですよ～', favorite: 'melonpan',
        title: '客引きの狸', desc: 'ネオンの看板に化けた狸。いい店だとすすめてくるが、ついていくと葉っぱのお金を払わされる。',
        special: sp('葉っぱのお会計', [atk('one', 1.6, { drain: 0.5 }), { kind: 'status', target: 'one', status: 'confuse', chance: 0.6 }])
    },
    {
        id: 'gomibakon', name: 'ゴミバコン', from: 'ダンジョン 124', area: 'shoutengai', rank: 'D', element: 'ふつう', role: 'supporter', mul: { hp: 1.1 },
        line: 'もえるゴミは 火曜日', favorite: 'kyuuri',
        title: '横丁の掃除屋', desc: '横丁のゴミを食べてきれいにしているゴミ箱。分別にはとても厳しい。',
        special: sp('おそうじタイム', [{ kind: 'heal', target: 'party', power: 1.0 }])
    },
    {
        id: 'gachapon', name: 'ガチャポン', from: 'ダンジョン 133', area: 'shoutengai', rank: 'C', element: 'ふしぎ', role: 'supporter', mul: { mag: 1.1 },
        line: '今日は SSR かも！？', favorite: 'choco',
        title: 'ほしいのは1回目ででるか10回目くらいまででないかの2択。', desc: 'ガチャポンの付喪神。願いを込めて引くと、願いが叶うことがある。',
        special: sp('10 連ガチャ', [{ kind: 'heal', target: 'party', power: 1.0 }, { kind: 'buff', target: 'party', stat: 'atk', amount: 0.5, time: 10 }])
    },
    {
        id: 'yataiman', name: 'ヤタイマン', from: 'ダンジョン 122', area: 'shoutengai', rank: 'C', element: 'ほのお', role: 'attacker', mul: { atk: 1.1, hp: 1.05 },
        line: 'へい らっしゃい！', favorite: 'onigiri',
        title: '屋台の大将', desc: '横丁で屋台を営む大将。ラーメンもおでんも焼き鳥も出すが、一番の自慢はつけ麺らしい。',
        special: sp('へい おまち！', [atk('all', 1.8)])
    },
    // ----- 石の川小学校の 9 体 (2 章「学校の七不思議」。2026-10-28。ダンジョンから。D 8・C 1) -----
    //   7 体は 七不思議の 正体 (map.js の MYSTERIES)。ヨロイヌケガラは ろうかを 歩く。ルナシャドウは 8 つ目の ふしぎ (ボス) を たおすと なかまに なる
    //   名前・属性・役割・口ぐせ・説明は ダンジョンの データから 写した。必殺技は 仮 (設計書 4.7)
    {
        id: 'fusaiyougaikotsu', name: 'フサイヨウガイコツ', from: 'ダンジョン 047', area: 'school', rank: 'D', element: 'ふしぎ', role: 'jammer', mul: { mag: 1.1 },
        line: '今回はご縁がなかったということで', favorite: 'onigiri',
        title: '不採用がいこつ', desc: '採用されなかったものの恨みが具現化したもの。',
        special: sp('お祈りメール', [atk('all', 0.6), { kind: 'status', target: 'all', status: 'possess', chance: 0.5 }])
    },
    {
        id: 'mirrormuscle', name: 'ミラーマッスル', from: 'ダンジョン 038', area: 'school', rank: 'D', element: 'ふしぎ', role: 'defender', mul: { def: 1.1 },
        line: 'キレてるよ！', favorite: 'cider',
        title: '鏡型のマッスル', desc: '超マッスル。今日もキレている。',
        special: sp('キレてるポーズ', [{ kind: 'buff', target: 'party', stat: 'def', amount: 0.5, time: 10 }])
    },
    {
        id: 'proteingolem', name: 'プロテインゴーレム', from: 'ダンジョン 036', area: 'school', rank: 'D', element: 'ふつう', role: 'defender', mul: { hp: 1.15, atk: 1.2, spd: 0.8 },
        line: 'タンパク…シツ…', favorite: 'niboshi',
        title: 'プロテイン好きのゴーレム', desc: 'プロテインのみで鍛えているゴーレム。プロテインではなく、ステロイドを直で吸っているうわさがある。',
        special: sp('プロテインパワー', [atk('one', 2.8)])
    },
    {
        id: 'takaramimic', name: 'タカラミミック', from: 'ダンジョン 045', area: 'school', rank: 'D', element: 'ふつう', role: 'defender', mul: { atk: 1.15 },
        line: 'あけたな？', favorite: 'choco',
        title: '宝のミミック', desc: '宝箱の形をしたモンスター。見かけはかわいいが、実は危険。',
        special: sp('ひらけごま', [atk('one', 2.2), { kind: 'buff', target: 'self', stat: 'def', amount: 0.5, time: 8 }])
    },
    {
        id: 'umibozun', name: 'ウミボウズン', from: 'ダンジョン 014', area: 'school', rank: 'D', element: 'ふしぎ', role: 'attacker', mul: { hp: 1.05 },
        line: 'ぼうず～ん', favorite: 'niboshi',
        title: '海の怪異', desc: '漁師に恐れられている古典妖怪。新月の夜に見てしまったが最後、その人はもう闇の中。暗く深い闇の中。',
        special: sp('大うずしお', [atk('all', 1.5, { element: 'みず' })])
    },
    {
        id: 'wasurekurage', name: 'ワスレクラゲ', from: 'ダンジョン 011', area: 'school', rank: 'D', element: 'ふしぎ', role: 'jammer', mul: { hp: 0.9, mag: 1.15 },
        line: 'なんだっけ…', favorite: 'cider',
        title: '忘れられたクラゲ', desc: '昔は有名だったが、最近は忘れられてしまったクラゲ。',
        special: sp('ぜんぶ わすれた', [{ kind: 'status', target: 'all', status: 'possess', chance: 0.5 }, { kind: 'status', target: 'all', status: 'confuse', chance: 0.4 }])
    },
    {
        id: 'mikazukibat', name: 'ミカヅキバット', from: 'ダンジョン 030', area: 'school', rank: 'D', element: 'かぜ', role: 'jammer', mul: { spd: 1.15 },
        line: 'キキッ', favorite: 'melonpan',
        title: '三日月の蝙蝠。', desc: '月が三日月の時にだけ現れる蝙蝠。',
        special: sp('三日月の 超音波', [atk('all', 0.8), { kind: 'status', target: 'all', status: 'confuse', chance: 0.6 }])
    },
    {
        id: 'yoroinukegara', name: 'ヨロイヌケガラ', from: 'ダンジョン 039', area: 'school', rank: 'D', element: 'ふつう', role: 'defender', mul: { def: 1.2, spd: 0.9 },
        line: 'ガシャン、ガシャン', favorite: 'onigiri',
        title: '鎧の抜け殻', desc: '今や着るものがいなくなった抜け殻。持ち主を永遠に探している。',
        special: sp('てっぺき', [{ kind: 'buff', target: 'party', stat: 'def', amount: 0.6, time: 10 }])
    },
    {
        id: 'lunashadow', name: 'ルナシャドウ', from: 'ダンジョン 034', area: 'school', rank: 'C', element: 'ふしぎ', role: 'attacker', mul: { atk: 1.05, spd: 1.1 },
        line: '…………', favorite: 'melonpan',
        title: '正体不明', desc: '正体不明の存在。いったい何者なのか、何が目的なのか、その一切が不明である。',
        special: sp('正体不明', [atk('all', 1.6, { magic: true })])
    }
];

// わざ・術を つける
function moves(id, element, rank, upper = false) {
    const w = WAZA[id];
    return { waza: { name: w.name, effects: wazaEffects(w) }, jutsu: jutsuOf(element, jutsuTier(rank, upper), JUTSU_TYPE[id]) };
}

// ランクが 高いほど 能力も 少し 高い (設計書 4.5)
export const RANK_K = { E: 1, D: 1.15, C: 1.3, B: 1.45, A: 1.6, S: 1.8 };
// 地区 (設計書 5.1)。area の ない キャラは 石の川タウン
export const AREAS = { ishinokawa: '石の川タウン', shoutengai: '商店街', school: '石の川小学校' };

// 図鑑の番号・ランク・能力・ふだんの わざ を足して 仕上げる
export const NAKAMA = {};
LIST.forEach((n, i) => {
    const rank = n.rank || 'E';
    const base = {};
    for (const [k, v] of Object.entries(ROLE_BASE[n.role])) base[k] = Math.round(v * (n.mul[k] || 1) * RANK_K[rank]);
    NAKAMA[n.id] = { ...n, no: i + 1, rank, area: n.area || 'ishinokawa', base, ...moves(n.id, n.element, rank, n.upperJutsu), art: n.id };
});
export const NAKAMA_IDS = LIST.map(n => n.id);
export const idsInArea = area => NAKAMA_IDS.filter(id => NAKAMA[id].area === area);

// 1 章の ボス: 石の川橋の ヌシ (ハシシタボウズの 大きな すがた)。たおすと ハシシタボウズが なかまに なる
export const BOSSES = {
    nushi: {
        id: 'nushi', name: 'ヌシ・ハシシタボウズ', element: 'ふしぎ', role: 'jammer', art: 'hashishita', scale: 2,
        base: { hp: 340, atk: 14, def: 12, spd: 9, mag: 15 },
        // 大技: 2.5 秒 前に 予告が 出る。そのあいだに 輪を 回して よけられる (設計書 3.5)
        bigMove: { name: '足音 百かぞえ', every: 12, warn: 2.5, effects: [atk('all', 1.6, { magic: true })] },
        befriends: 'hashishita', lv: 8, place: 'bridge'
    },
    // 2 章の ボス: 七不思議の 8 つ目「夜の ろうかを 走る 影」(ルナシャドウの 大きな すがた。2026-10-28 ユーザー指定)
    //   HP が とても 多く、体が 大きい。右手・左手・頭を ロックオンで ねらって こわせる (parts。hp は 最大HP に たいする わりあい)
    //   右手を こわすと「不明の右手」、左手を こわすと「未詳の左腕」が 使えなくなる。頭は 両手を こわしてから
    //   頭を こわすと チャンスタイム (chanceTurns 回 うごけない)。おわると こわした ところが もとに もどる
    //   moves: ふだんの わざ (part: その 部位が こわれていると 使えない)。bigMove: 必殺技 アンノウン (予告つき)
    kage: {
        id: 'kage', name: 'ろうかの カゲ・ルナシャドウ', element: 'ふしぎ', role: 'attacker', art: 'lunashadow', scale: 2, rank: 'C',
        base: { hp: 700, atk: 14, def: 13, spd: 11, mag: 14 },
        parts: {
            rhand: { name: '右手', hp: 0.1, move: '不明の右手' },
            lhand: { name: '左手', hp: 0.1, move: '未詳の左腕' },
            head: { name: '頭', hp: 0.12 }
        },
        chanceTurns: 3,
        moves: [
            { name: 'たたきつけ', w: 3, effects: [atk('one', 1.1)] },                                                      // 敵 1 体に 中ダメージ
            { name: '未詳の左腕', w: 2, part: 'lhand', effects: [atk('one', 1.8)] },                                      // 敵 1 体に 大ダメージ
            { name: '不明の右手', w: 2, part: 'rhand', effects: [atk('one', 1.0, { magic: true, drain: 0.5 })] },         // 吸収の術 (中級)
            { name: '振り払い', w: 2, effects: [atk('all', 0.55)] },                                                       // 敵全体に 小ダメージ
            { name: '不安の眼', w: 1.5, effects: [{ kind: 'status', target: 'all', status: 'confuse', chance: 0.7 }] },   // 敵全体を こんらん
            { name: '呪いの笑み', w: 1.5, effects: [{ kind: 'status', target: 'one', status: 'slow', chance: 0.9 }] }      // 敵 1 体を のろい
        ],
        // 必殺技 アンノウン: 敵全体に ふしぎ (中級) の 術の ダメージ × 3
        bigMove: { name: 'アンノウン', every: 14, warn: 2.5, effects: [atk('all', 0.5, { magic: true, element: 'ふしぎ', hits: 3 })] },
        befriends: 'lunashadow', lv: 13, place: 'school'
    }
};
Object.values(BOSSES).forEach(b => Object.assign(b, moves(b.id, b.element, b.rank || 'C')));

// こおりくん (2026-10-27 ユーザー指定: バトルに こおりくんも 出られる)。メダル帳の いちばん はじめに いて、ウォッチの 輪に 入れられる
//   能力は 主人公なので 少し 高め (ダンジョンの こおりくんと 同じく どの 能力も そこそこの アタッカー)。図鑑には のらない
//   必殺技は 前作 (スロット・ダンジョン) の「大腸炎アタック」
export const HERO_ID = 'koori';
export const HERO = {
    id: HERO_ID, name: 'こおりくん', element: 'こおり', role: 'attacker', rank: 'B', art: 'koori', hero: true,
    base: { hp: 60, atk: 15, def: 12, spd: 13, mag: 13 },
    line: 'いくぞ！', title: 'この 物語の 主人公', desc: '石の川タウンに すむ こおりの 男の子。おなかまウォッチで なかまを 呼び出す。たまに 大腸炎。',
    special: sp('大腸炎アタック', [atk('all', 1.8), { kind: 'status', target: 'all', status: 'poison', chance: 0.6 }])
};
Object.assign(HERO, moves(HERO_ID, HERO.element, HERO.rank));

// 絵の 名前 (ボスは なかまの 絵を 大きくして 使う)
export const unitArtKey = id => (NAKAMA[id] ? NAKAMA[id].art : BOSSES[id] ? BOSSES[id].art : id);
// なかま・こおりくん・ボスの どれでも
export const unitOf = id => NAKAMA[id] || (id === HERO_ID ? HERO : null) || BOSSES[id] || null;
