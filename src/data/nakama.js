// =====================================================================
// なかまの データ (設計書 4 章。1 章 = 石の川タウンの 20 体 + ボス)
// ---------------------------------------------------------------------
// 前作 (koori-dungeon) から来た 15 体は、名前・属性・役割・説明・口ぐせを ダンジョンの データから写した。
// 新キャラ 5 体 (イシコロン〜ハシシタボウズ) は 設計書 4.6 の案。
//
//   rank: E〜S (設計書 4.5)。1 章は 全員 E
//   role: attacker 攻める / defender 守る / healer 治す / jammer じゃまする / supporter 支える
//   base: Lv1 の 能力 (hp・atk こうげき・def ぼうぎょ・spd すばやさ・mag ようじゅつ)
//   skill: ふだん ときどき 使う わざ / special: 必殺技 (ゲージが たまったら プレイヤーが 打つ)
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

// 属性ごとの ふだんの わざ
const SKILL_BY_ELEMENT = {
    'こおり': 'こおりのつぶて', 'ほのお': 'ひのこ', 'みず': 'みずでっぽう', 'しぜん': 'はっぱカッター',
    'かぜ': 'かまいたち', 'ふしぎ': 'ふしぎなひかり', 'ふつう': 'たいあたり'
};

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
        line: 'ふぁ～…', favorite: 'melonpan', skillStatus: 'sleep',
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
        line: 'からまっちゃえ', favorite: 'kyuuri', skillStatus: 'slow',
        title: '生きたツタ', desc: '自我があるツタの生物。さいきん昆布なのかもしれないという論文が発表された。',
        special: sp('ツタしばり', [atk('all', 0.8), { kind: 'status', target: 'all', status: 'slow', chance: 0.8 }])
    },
    {
        id: 'yofukashi', name: 'ヨフカシフクロウ', from: 'ダンジョン 007', element: 'かぜ', role: 'jammer', mul: { atk: 1.1 },
        line: 'まだ寝ないホー', favorite: 'cider', skillStatus: 'confuse',
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
        line: 'つれた～！', favorite: 'niboshi', skillStatus: 'slow',
        title: '魚を釣る魚', desc: '口が釣り針になっており、魚を釣って食べている。まれにゴミを釣ってしまい、釣り針が使い物にならなくなり、餓死してしまう個体もいる。',
        special: sp('一本釣り', [atk('one', 2.8)])
    },
    {
        id: 'mokugyoro', name: 'モクギョロ', from: 'ダンジョン 017', element: 'ふつう', role: 'jammer', mul: { def: 1.1 },
        line: 'ポクポクポク…', favorite: 'onigiri', skillStatus: 'sleep',
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
        line: 'おなか、ぐるぐる～', favorite: 'melonpan', skillStatus: 'poison',
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
        line: 'ドロン！', favorite: 'onigiri', skillStatus: 'confuse',
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
        line: 'ひとつ、ふたつ…', favorite: 'choco', skillStatus: 'confuse',
        title: '橋の下の坊主', desc: '橋の下に住み、通る人の足音を数えている。数えまちがえると機嫌が悪くなり、相手を混乱させる。',
        special: sp('足音かぞえ', [atk('all', 0.5), { kind: 'status', target: 'all', status: 'confuse', chance: 0.8 }])
    }
];

// 図鑑の番号・ランク・能力・ふだんの わざ を足して 仕上げる
export const NAKAMA = {};
LIST.forEach((n, i) => {
    const base = {};
    for (const [k, v] of Object.entries(ROLE_BASE[n.role])) base[k] = Math.round(v * (n.mul[k] || 1));
    const skill = n.role === 'healer'
        ? { name: 'いやしの水', effects: [{ kind: 'heal', target: 'lowest', power: 1.0 }] }
        : {
            name: SKILL_BY_ELEMENT[n.element],
            effects: [{ kind: 'attack', target: 'one', power: 1.4, magic: true }, ...(n.skillStatus ? [{ kind: 'status', target: 'one', status: n.skillStatus, chance: 0.25 }] : [])]
        };
    NAKAMA[n.id] = { ...n, no: i + 1, rank: 'E', base, skill, art: n.id };
});
export const NAKAMA_IDS = LIST.map(n => n.id);

// 1 章の ボス: 石の川橋の ヌシ (ハシシタボウズの 大きな すがた)。たおすと ハシシタボウズが なかまに なる
export const BOSSES = {
    nushi: {
        id: 'nushi', name: 'ヌシ・ハシシタボウズ', element: 'ふしぎ', role: 'jammer', art: 'hashishita', scale: 2,
        base: { hp: 340, atk: 14, def: 12, spd: 9, mag: 15 },
        skill: { name: 'ふしぎなひかり', effects: [{ kind: 'attack', target: 'one', power: 1.4, magic: true }, { kind: 'status', target: 'one', status: 'confuse', chance: 0.3 }] },
        // 大技: 2.5 秒 前に 予告が 出る。そのあいだに 輪を 回して よけられる (設計書 3.5)
        bigMove: { name: '足音 百かぞえ', every: 12, warn: 2.5, effects: [atk('all', 1.6, { magic: true })] },
        befriends: 'hashishita'
    }
};

// 絵の 名前 (ボスは なかまの 絵を 大きくして 使う)
export const unitArtKey = id => (NAKAMA[id] ? NAKAMA[id].art : BOSSES[id] ? BOSSES[id].art : id);
