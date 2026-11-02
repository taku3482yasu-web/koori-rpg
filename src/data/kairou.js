// =====================================================================
// 無限回廊 (15 章) の ボス (2026-11-02 ユーザー指定)
// ---------------------------------------------------------------------
// 章の ボスの 色違い (赤黒い)。しくみと 必殺技の 中身は もとの ボスと 同じで、名前・わざの 名前・必殺技の 名前が ちがう。
//   もとの ボスの データを 写して (buildKairou)、names の とおりに 名前を かえる。なかまには ならない
//   from2: もとの ボスの 第 2 形態から 始まる (ハルガ・オニルクーテン = ルキハ・ニオニオーテン)
// さいごの 階 (14 階・28 階 …) は 覇理魔様 (はりまさま):
//   目が 赤い あいだは 攻撃 (物理) しか きかず、術を 多用する。目が 青い あいだは 術しか きかず、物理の わざしか 使わない (eyes)
//   必殺技の 前に バリアを はる (trigger: 'barrier')。バリアを 4 つ こわすと 必殺技が 止まって チャンスタイム
//   6 本の 手 (gims の hand) は それぞれ 得意な わざが ある。ねらって こわすと その わざが 使えない。時間で もどる (regrow)
// =====================================================================
const atk = (target, power, extra = {}) => ({ kind: 'attack', target, power, ...extra });
const status = (target, st, chance) => ({ kind: 'status', target, status: st, chance });

// もとの ボス → 色違い。names: もとの 名前 → 新しい 名前 (わざ・必殺技・部位・形態)
export const KAIROU_VARIANTS = [
    { from: 'kage', id: 'k_kage', name: 'ポルターガイスト', names: {
        'たたきつけ': 'ポルター・クラッシュ', '未詳の左腕': '見えざる 左腕', '不明の右手': 'うかぶ 右手', '振り払い': 'ラップ音', '不安の眼': '怪奇の 眼', '呪いの笑み': '騒霊の わらい',
        'アンノウン': '認識停止', '右手': 'うかぶ 右手', '左手': '見えざる 左腕', '頭': '騒霊の 頭' } },
    { from: 'himuro', id: 'k_himuro', name: '黒氷竜', names: {
        'ひょうがブレス': '黒氷の ブレス', 'かみつき': '黒牙', 'はばたき': '凍てつく 羽ばたき', '大吹雪': '黒い 大吹雪', '氷の偶像': '黒氷の 偶像', '氷河の咆哮': '暗黒の氷河' } },
    { from: 'urashima4', id: 'k_urashima', name: '裏の丘修一', names: {
        '玉手箱': '裏手箱', 'つりざお': '裏つりざお', 'こうらに こもる': '裏こうらに こもる', '……なんじゃったかの': '……忘れたわい', '黒い紋の 玉手箱': '玉手箱・裏', '頭': '裏の 頭' } },
    { from: 'daishi5', id: 'k_daishi', name: 'やぶれかぶれ僧侶', names: {
        '説法': 'やけくそ 説法', '錫杖': '折れた 錫杖', '数珠まわし': 'ちぎれ 数珠', '配信の お経': '炎上の お経', 'ネット念仏': '敗れ僧侶の呪い', '鬼神 ネット念仏': '敗れ僧侶の 大呪い',
        '鬼の顔': '破戒の 顔', '鬼の 錫杖': '破戒の 錫杖', '鬼の にらみ': '破戒の にらみ', '鬼の 数珠ぜめ': '破戒の 数珠ぜめ', '鬼の面': '破戒の 面', '鐘': '割れ鐘' } },
    { from: 'zumitani6', id: 'k_zumitani', name: '影武者・紫煙', names: {
        'クナイ乱れうち': '紫煙 クナイ', '忍び斬り': '影武者 斬り', 'かげぶんしん': '紫煙 ぶんしん', '百影 クナイ': '影武者の舞' } },
    { from: 'tomooka6', id: 'k_tomooka', name: '刑務者・怒猛', names: {
        '右ストレート': '怒りの 鉄拳', '地ならし': '怒号の 地ならし', 'にらみ': '看守の にらみ', '丘砕きの一撃': '怒りの一撃', '右腕': '怒りの 右腕' } },
    { from: 'runaya7', id: 'k_runaya', name: 'おぼろ月の魔女', names: {
        'ムーンビーム': 'おぼろ ビーム', '月の 魔術': '朧の 魔術', '迷宮がえ': '夢うつつ', '満月の ムーンビーム': '夢幻がごとく', '月': 'おぼろ月' } },
    { from: 'onioni12', id: 'k_onioni', name: 'おにおにの影', names: {
        '鬼神 金棒': '影の 金棒うち', '鬼神パンチ 連打': '影パンチ 連打', '鬼の 大のろい': '影の のろい', '大火炎の術': '黒炎の術', '地獄の 業火': '影の 業火',
        '鬼神 金棒くだき・極': '影の金棒', '鬼神の 力の 暴発': '影の 暴発' } },
    { from: 'harukirin9', id: 'k_kirin', name: '淵角', names: {
        '春をよぶ角': '深淵の 角', '麒麟のいかずち': '淵の いかずち', '春の そよ風': '冥府の 風', '春麗': '深淵来る', '角': '淵の 角', '春の 目ざめ': '深淵の 目ざめ' } },
    { from: 'nozoema9', id: 'k_nozoema', name: '亡霊武者', names: {
        '刀の一振り': '亡霊の 太刀', '兜割り': '亡霊 兜割り', '大斬撃': '怨念 大斬撃', '筋肉の おたすけ': '怨念の たかまり', '鏡筋一刀斬り': '兵どもが夢のあと' } },
    { from: 'tashikeda10', id: 'k_tashikeda', name: 'ダークウェブ', names: {
        '行動不能の とりつき': 'フリーズ ウイルス', 'レベル ドレイン': 'データ ドレイン', 'ウイルス さんぷ': 'ランサムウェア', 'エンターキー連打': 'DDoS 攻撃', '私はハッキングが好きだ！': '制御不能のコンピュータ' } },
    { from: 'bakuen11', id: 'k_bakuen', name: '爆嵐竜', names: {
        'ほのおの いき': '爆嵐の いき', 'しっぽ たたき': '嵐の しっぽ', 'マグマの 波': '火砕の 波', '大噴火': '嵐を呼ぶ火砕流' } },
    { from: 'rukiha13', id: 'k_rukiha', name: 'ハルガ・オニルクーテン', from2: true, names: {
        'マジュウノヒトタチ': 'ハルガノヒトタチ', 'セイレイノウタ': 'ドハツノウタ', 'チョウジュウノホノオ': 'ドハツノホノオ', 'チョウジュウノミズ': 'ドハツノミズ', 'チョウジュウノコオリ': 'ドハツノコオリ',
        'チョウジュウノイカヅチ': 'ドハツノイカヅチ', 'チョウジュウノツタ': 'ドハツノツタ', 'チョウジュウノマボロシ': 'ドハツノマボロシ', 'チョウジュウノイワ': 'ドハツノイワ',
        'ゼンブ オレノ モノ': '怒髪天の爆喰らい', 'オオグライノカミツキ': 'バクグライノカミツキ', 'ルキハの 顔': 'ハルガの 顔' } }
];

// 覇理魔様
export const HARIMA = {
    id: 'harima', name: '覇理魔様', element: 'ふしぎ', role: 'jammer', art: 'harima_r', scale: 2.2, huge: true, rank: 'S', shade: true,
    base: { hp: 1500, atk: 25, def: 21, spd: 15, mag: 26 },
    moves: [
        { name: '炎の手: 獄炎', w: 2, gim: 'enHand', effects: [atk('one', 1.6, { magic: true, element: 'ほのお' })] },
        { name: '炎の手: 炎輪', w: 1.5, gim: 'enHand', effects: [atk('all', 0.85, { magic: true, element: 'ほのお' })] },
        { name: '氷の手: 獄氷', w: 2, gim: 'hyoHand', effects: [atk('all', 0.85, { magic: true, element: 'こおり' })] },
        { name: '雷の手: 獄雷', w: 2, gim: 'raiHand', effects: [atk('one', 1.4, { magic: true, element: 'かぜ' }), status('one', 'stun', 0.25)] },
        { name: '数珠の手: 地獄の 数珠', w: 1.5, gim: 'juzuHand', effects: [status('all', 'possess', 0.4)] },
        { name: '剣の手: 千手斬り', w: 2, gim: 'kenHand', effects: [atk('one', 0.7, { hitsMin: 3, hitsMax: 5 })] },
        { name: 'こぶしの手: 千手拳', w: 2, gim: 'kobushiHand', effects: [atk('all', 0.8)] },
        { name: '八眼の にらみ', w: 1, effects: [status('all', 'slow', 0.5)] },
        { name: '観音の 体当たり', w: 1, effects: [atk('one', 1.2)] }
    ],
    bigMove: { name: '千手地獄観音', trigger: 'barrier', every: 16, charge: 7, barrier: { hp: 0.025, count: 4 },
        effects: [atk('all', 2.2, { magic: true, element: 'ふしぎ' }), status('all', 'possess', 0.3)] },
    // 6 本の 手 (絵の その 部分)。こわすと その 手の わざが 使えない。regrow 秒で もどる
    gims: {
        enHand: { name: '炎の手', hp: 0.05, when: 'always', rect: [1, 1, 5, 7], move: '炎の わざ', regrow: 18 },
        hyoHand: { name: '氷の手', hp: 0.05, when: 'always', rect: [0, 10, 3, 14], move: '氷の わざ', regrow: 18 },
        kenHand: { name: '剣の手', hp: 0.05, when: 'always', rect: [1, 14, 5, 21], move: '剣の わざ', regrow: 18 },
        kobushiHand: { name: 'こぶしの手', hp: 0.05, when: 'always', rect: [26, 2, 30, 7], move: 'こぶしの わざ', regrow: 18 },
        juzuHand: { name: '数珠の手', hp: 0.05, when: 'always', rect: [28, 10, 31, 14], move: '数珠の わざ', regrow: 18 },
        raiHand: { name: '雷の手', hp: 0.05, when: 'always', rect: [26, 17, 30, 21], move: '雷の わざ', regrow: 18 }
    },
    eyes: { every: 11, red: 'harima_r', blue: 'harima_b' },
    bgm: 'harima',   // 専用の 曲 (data/bgm.js。2026-11-03)
    chanceTurns: 3,
    befriends: null, lv: 90, place: 'kurai'
};

// 名前を かえる (name・idolName を さがして names の とおりに)
function rename(obj, names) {
    if (Array.isArray(obj)) return obj.map(x => rename(x, names));
    if (!obj || typeof obj !== 'object') return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = (k === 'name' || k === 'idolName') && typeof v === 'string' && names[v] ? names[v] : rename(v, names);
    return out;
}

// もとの ボス (BOSSES) から 色違いを 作る。art は 赤黒い 絵 (art/index.js の crimsonArtId)
export function buildKairou(BOSSES) {
    const units = {};
    for (const v of KAIROU_VARIANTS) {
        const src = BOSSES[v.from];
        let def = { ...src };
        if (v.from2) {
            // 第 2 形態から: 形態の わざ・必殺技・部位・キメラ・いかりを はじめから もつ
            const p2 = src.phase2;
            def = { ...src, art: p2.art, huge: p2.huge, moves: p2.moves, bigMove: p2.bigMove, gims: p2.gims, chimera: p2.chimera, enrage: p2.enrage };
            delete def.phase2;
        }
        def = rename(def, v.names);
        units[v.id] = { ...def, id: v.id, name: v.name, art: `${def.art}_crimson`, dark: false, shade: true, base: { ...src.base }, baseBoss: v.from, befriends: null };
    }
    units.harima = HARIMA;
    return units;
}
// 階の ならび (14 階で 一周。14 階ごとに 覇理魔様)
export const KAIROU_FLOORS = [...KAIROU_VARIANTS.map(v => v.id), 'harima'];
