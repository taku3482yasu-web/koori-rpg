// =====================================================================
// なかまの データ (設計書 4 章。1 章 = 石の川タウンの 20 体 + ボス。段階 2 で 商店街の 20 体。2 章で 石の川小学校の 9 体。3 章で 山と ダムの 12 体。4 章で 海辺の 町の 9 体)
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
    ryuuguudai: 'heal',
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
    // 山と ダム (3 章)。こおり (凍る) は のろい・目つぶし・ひるみ は こんらんに 置きかえ
    yukimidango: W('雪玉', 'こおり', 'front', 1.1, 'slow', 0.4),
    yukidarumuscle: W('ひえひえパンチ', 'こおり', 'front', 1.3, 'slow', 0.2),
    koorimodoki: W('コオリソード', 'こおり', 'front', 1.4),
    fubukipenguin: W('ペンギンすべり', 'こおり', 'front', 1.5, 'slow', 0.3),
    tsuraracomori: W('つららとばし', 'こおり', 'line', 1.2),
    koorinokagami: W('かがみのひかり', 'こおり', 'line', 1.0, 'confuse', 0.5),
    mandoragon: W('マンドラのさけび', 'しぜん', 'around', 0, 'confuse', 0.8),
    obakekabocha: W('かぼちゃばくだん', 'しぜん', 'front', 1.4, 'confuse', 0.2),
    haetorigusan: W('パックン', 'しぜん', 'front', 1.8),
    kokemusha: W('こけむし斬り', 'しぜん', 'front', 1.8),
    koorimodokishin: W('コオリハンマー', 'こおり', 'front', 2.0, 'confuse', 0.3),
    hyougaryu: W('ひょうがブレス', 'こおり', 'line', 1.3, 'slow', 0.2),
    // 海辺の 町と 浦の島の海岸どうくつ (4 章)。めくらまし は こんらんに 置きかえ
    tamatebakogani: W('けむり', 'みず', 'front', 0.6, 'confuse', 0.8),
    isoginchakku: W('すいこみ', 'しぜん', 'front', 1.3),
    otohimedai: W('乙姫の舞', 'みず', 'front', 0, 'confuse', 1.0),
    asedakku: W('汗とばし', 'みず', 'line', 0.9),
    uniharry: W('うにトゲ', 'みず', 'front', 1.3, 'poison', 0.3),
    ryuuguudai: W('りゅうぐうの舞', 'みず', 'around', 0, 'confuse', 0.6),
    nakatadraco: W('水のブレス', 'みず', 'line', 1.2),
    umibozuou: W('だいおおなみ', 'みず', 'line', 1.5),
    urashima: W('玉手箱', 'ふしぎ', 'around', 0.8, 'confuse', 0.6),
    // ネット寺 (5 章)。やけど は どく・めくらまし・ひるみ は こんらん
    enjoubouzu: W('炎上', 'ほのお', 'front', 1.2, 'poison', 0.4),
    bugmushi: W('バグかみつき', 'しぜん', 'front', 1.2, 'confuse', 0.3),
    htmlmokkun: W('タグとじわすれ', 'ふつう', 'front', 1, 'confuse', 0.4),
    csspakkun: W('パックンスタイル', 'しぜん', 'front', 1.5),
    nullpon: W('ぬるぽ', 'ふしぎ', 'front', 1.3, 'confuse', 0.4),
    loadingu: W('ぐるぐる読みこみ', 'かぜ', 'around', 0, 'sleep', 0.6),
    mugenloop: W('むげんループ', 'ふしぎ', 'front', 0.8, 'confuse', 0.7),
    notfound: W('ページがみつかりません', 'ふしぎ', 'line', 1.2, 'confuse', 0.4),
    virusn: W('ウイルス感染', 'ふしぎ', 'front', 0.9, 'poison', 0.8),
    firewall: W('ファイアウォール', 'ほのお', 'around', 1.1, 'poison', 0.3),
    daishi: W('説法', 'ふしぎ', 'around', 0.6, 'sleep', 0.4),
    // 忍びの屋敷 (6 章)。ひるみ は こんらん・まひ は のろい
    geninman: W('しゅりけん', 'ふつう', 'line', 1),
    shurikenbo: W('回転突進', 'かぜ', 'front', 1.6),
    bakudanjirou: W('ばくだん なげ', 'ほのお', 'line', 1.3),
    konin: W('こおにパンチ', 'ほのお', 'front', 1.2),
    aoonibo: W('あおおにしぶき', 'みず', 'line', 1.2),
    kanabone: W('かなぼう', 'ふつう', 'front', 1.6),
    makibikonmk3: W('ビーム', 'ふつう', 'line', 1.2),
    hyoutanoni: W('ひょうたんの酒', 'ふしぎ', 'front', 0.9, 'confuse', 0.6),
    taikooni: W('かみなりだいこ', 'かぜ', 'around', 1, 'slow', 0.3),
    jouninman: W('かげぎり', 'かぜ', 'front', 1.6, 'confuse', 0.2),
    daibakudanjirou: W('大ばくはつ', 'ほのお', 'around', 2.4),
    zumitani: W('クナイ乱れうち', 'かぜ', 'line', 1.3),
    // 進化で なる キャラ (ダンジョンの 進化先)
    harigeneral: W('針とばし', 'ふつう', 'line', 1.2),
    joubachi: W('じょおうばり', 'かぜ', 'front', 1.5, 'poison', 0.4),
    oodonguriko: W('おおころがり', 'しぜん', 'front', 1.8),
    nemuridakeou: W('ほうしのあらし', 'しぜん', 'around', 0, 'sleep', 0.8),
    pekorisuking: W('キングたねマシンガン', 'しぜん', 'line', 1.3),
    tsutankobuju: W('つたしばり', 'しぜん', 'around', 0.8, 'slow', 0.6),
    yoakefukurou: W('あさやけの風', 'かぜ', 'line', 1.2, 'confuse', 0.4),
    hyougame: W('ひょうこうら', 'こおり', 'front', 1.4, 'slow', 0.3),
    spamking: W('スパムのあらし', 'ふしぎ', 'line', 0.7, 'confuse', 0.6),
    hitodamaou: W('青い火の玉', 'ほのお', 'line', 1.3, 'poison', 0.4),
    kagebunshin: W('かげぶんしん', 'ふしぎ', 'front', 0.9, 'confuse', 0.5),
    yukimidaifuku: W('だいふくゆきだま', 'こおり', 'front', 1.3, 'slow', 0.4),
    muscletitan: W('タイタンプレス', 'ふつう', 'front', 2.6),
    hyouzanmuscle: W('ふぶき', 'こおり', 'around', 1.3, 'slow', 0.3),
    kinkomimic: W('金庫かみつき', 'ふつう', 'front', 2, 'confuse', 0.3),
    daichouenou: W('大ばい菌', 'ふしぎ', 'around', 0.6, 'poison', 0.5),
    // ライバル探検隊 (4 章。前作の 必殺わざ)。ひるみ・めくらまし は こんらん、まひ は のろい
    asahara: W('DOPAPANCHI', 'ほのお', 'front', 1.6),
    sasaki: W('ASAスラッシュ', 'ふつう', 'front', 1.4),
    kotani: W('NABIテンポ', 'ふしぎ', 'around', 0, 'slow', 0.7),
    ueno: W('マッスルウエノクラッシュ', 'ふつう', 'around', 1.3),
    shibata: W('シバタードライバー', 'ふつう', 'front', 1.9, 'confuse', 0.4),
    ikekimu: W('イケキムドライブ', 'かぜ', 'line', 1.5, 'confuse', 0.3),
    // こおりくん・ボス
    koori: W('コオリソード', 'こおり', 'front', 1.4),
    nushi: W('百のかぞえうた', 'ふしぎ', 'around', 0.6, 'confuse', 0.3),
    kage: W('影の とりつき', 'ふしぎ', 'around', 0.6, 'possess', 0.3),
    himuro: W('ふぶき', 'こおり', 'around', 1.3, 'slow', 0.3),
    urashima4: W('玉手箱', 'ふしぎ', 'around', 0.8, 'confuse', 0.5),
    daishi5: W('説法', 'ふしぎ', 'around', 0.6, 'sleep', 0.4),
    zumitani6: W('クナイ乱れうち', 'かぜ', 'line', 1.3),
    onioni6: W('金棒 たたき', 'ほのお', 'front', 1.4),
    tomooka6: W('右ストレート', 'ふつう', 'front', 1.3)
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
    },
    // ----- 山と ダムの 12 体 (3 章「ダムの水が消える」。2026-10-29。ダンジョンから。D 7・C 4・B 1。ヒョウガリュウは C (2026-10-29 ユーザー指定)) -----
    //   こおり族 6 体と しょくぶつ族 (しぜん) 4 体。コケムシャ・コオリノカガミ・ユキダルマッスルは 氷の 封印を まもる (map.js の SEALS)
    //   ヒョウガリュウは ダムの主 (ボス) を たおすと なかまに なる。コオリモドキ・真は 3 章 クリアの あと 夜の 雪渓に 出る。名前・属性・役割・口ぐせ・説明は ダンジョンの データから 写した。必殺技は 仮
    {
        id: 'yukimidango', name: 'ユキミダンゴ', from: 'ダンジョン 035', area: 'yama', rank: 'D', element: 'こおり', role: 'defender', mul: { def: 1.1, hp: 1.05 },
        line: 'おつきみ～', favorite: 'onigiri',
        title: '雪で作った団子', desc: '雪の団子。一番上が長男。',
        special: sp('だんご 三兄弟', [{ kind: 'buff', target: 'party', stat: 'def', amount: 0.4, time: 10 }, { kind: 'heal', target: 'party', power: 0.3 }])
    },
    {
        id: 'yukidarumuscle', name: 'ユキダルマッスル', from: 'ダンジョン 042', area: 'yama', rank: 'D', element: 'こおり', role: 'attacker', mul: { atk: 1.15, spd: 0.9 },
        line: '冷えた筋肉も最高だ', favorite: 'cider',
        title: '雪だるまのマッスル', desc: '雪の力を持つ。冷えた筋肉を誇る。筋肉自慢の３男。',
        special: sp('ひえひえ ラッシュ', [atk('one', 1.0, { hits: 3 })])
    },
    {
        id: 'koorimodoki', name: 'コオリモドキ', from: 'ダンジョン 050', area: 'yama', rank: 'C', element: 'こおり', role: 'attacker', mul: { atk: 1.1, spd: 1.05 },
        line: 'ぼくが ほんものの こおりくんだよ', favorite: 'choco',
        title: 'こおりくんの そっくりさん', desc: 'こおりの力を持つ。こいつこそ、本物のこおりくんだ。',
        special: sp('ニセ大腸炎アタック', [atk('all', 1.6), { kind: 'status', target: 'all', status: 'poison', chance: 0.4 }])
    },
    {
        id: 'fubukipenguin', name: 'フブキペンギン', from: 'ダンジョン 080', area: 'yama', rank: 'D', element: 'こおり', role: 'attacker', mul: { spd: 1.2 },
        line: 'ペンペン！', favorite: 'niboshi',
        title: '吹雪を好むペンギン', desc: '吹雪に一匹打ち勝ったペンギン。意外と気持ちがいいらしい。',
        special: sp('ふぶきの 大すべり', [atk('all', 1.4)])
    },
    {
        id: 'tsuraracomori', name: 'ツララコウモリ', from: 'ダンジョン 081', area: 'yama', rank: 'D', element: 'こおり', role: 'jammer', mul: { spd: 1.1, mag: 1.05 },
        line: 'キキーン', favorite: 'melonpan',
        title: 'つらら型の蝙蝠', desc: 'つららに化けた蝙蝠。たまに本物のつららが生えて、飛べなくなる個体が出る。',
        special: sp('つららの 雨', [atk('all', 0.5, { hits: 3 })])
    },
    {
        id: 'koorinokagami', name: 'コオリノカガミ', from: 'ダンジョン 082', area: 'yama', rank: 'C', element: 'こおり', role: 'defender', mul: { def: 1.2 },
        line: 'うつってるよ…きみが', favorite: 'cider',
        title: '氷に映る人影', desc: '氷でできた鏡の妖怪。映ったが最後、その鏡の中にとらわれ、1晩たつと鏡の中に氷像が一つ増えているという。',
        special: sp('こおりの 鏡像', [{ kind: 'buff', target: 'party', stat: 'def', amount: 0.5, time: 10 }, { kind: 'status', target: 'all', status: 'confuse', chance: 0.4 }])
    },
    {
        id: 'mandoragon', name: 'マンドラゴン', from: 'ダンジョン 086', area: 'yama', rank: 'D', element: 'しぜん', role: 'jammer', mul: { mag: 1.1 },
        line: 'ギャアアア！（抜かないで）', favorite: 'kyuuri',
        title: '叫ぶ大根', desc: '大根の突然変異体。２０代女性と同じ周波数を持つ。',
        special: sp('ぜっきょう', [atk('all', 0.8, { magic: true }), { kind: 'status', target: 'all', status: 'confuse', chance: 0.7 }])
    },
    {
        id: 'obakekabocha', name: 'オバケカボチャ', from: 'ダンジョン 087', area: 'yama', rank: 'D', element: 'しぜん', role: 'jammer', mul: { hp: 1.05 },
        line: 'トリック オア トリート！', favorite: 'choco',
        title: 'トリックオアトリート', desc: 'かぼちゃのお化け。人間に友好的で、お菓子をくれる。',
        special: sp('ハロウィン ナイト', [atk('all', 1.0), { kind: 'status', target: 'all', status: 'sleep', chance: 0.4 }])
    },
    {
        id: 'haetorigusan', name: 'ハエトリグサーン', from: 'ダンジョン 088', area: 'yama', rank: 'D', element: 'しぜん', role: 'defender', mul: { atk: 1.15 },
        line: 'パクッ', favorite: 'niboshi',
        title: 'はえとりの達人', desc: '蠅をとって１００年のベテラン。今まで食らった蠅は数知れず。',
        special: sp('百年の ひとのみ', [atk('one', 2.4, { drain: 0.5 })])
    },
    {
        id: 'kokemusha', name: 'コケムシャ', from: 'ダンジョン 089', area: 'yama', rank: 'C', element: 'しぜん', role: 'attacker', mul: { hp: 1.1, atk: 1.1, spd: 0.9 },
        line: '百年 こけむして 待っておった', favorite: 'onigiri',
        title: 'コケに食われた武士', desc: 'コケに支配された武士。もはや体はコケの思うが儘だが、宿敵と一騎打ちを果たすため、無理やり精神を保っている。',
        special: sp('こけむす 一騎打ち', [atk('one', 3.0)])
    },
    {
        id: 'koorimodokishin', name: 'コオリモドキ・真', from: 'ダンジョン 077', area: 'yama', rank: 'B', element: 'こおり', role: 'attacker', mul: { atk: 1.1, mag: 1.1 },
        line: 'ぼくこそ ほんものの こおりくんだよ', favorite: 'choco',
        title: '真のコオリモドキ', desc: 'コオリモドキがこおりの王冠で進化した姿。ニセ四天王絶対殺す剣まで覚えてしまった。こいつこそ、本物の本物のこおりくんだ。',
        special: sp('ニセ四天王絶対殺す剣', [atk('all', 2.0)])
    },
    {
        id: 'hyougaryu', name: 'ヒョウガリュウ', from: 'ダンジョン V10', area: 'yama', rank: 'C', element: 'こおり', role: 'attacker', mul: { hp: 1.1, atk: 1.1 },
        line: '氷河の 底で 眠っていた……', favorite: 'niboshi',
        title: '氷河の龍', desc: '氷河の底に眠っていた龍。氷の力を持つ。',
        special: sp('氷河の咆哮', [atk('all', 2.0, { element: 'こおり', magic: true })])
    },
    // ----- 海辺の 町と 浦の島の海岸どうくつの 9 体 (4 章「海辺の どうくつと ライバル探検隊」。2026-10-29。ダンジョンから。D 5・C 4) -----
    //   ダンジョンの 浦の島の海岸どうくつに 出る キャラと 海の キャラ。浦の島重蔵は どうくつの ボス (黒い 紋つき) を たおすと なかまに なる
    //   名前・属性・役割・口ぐせ・説明は ダンジョンの データから 写した。必殺技は 仮
    {
        id: 'tamatebakogani', name: 'タマテバコガニ', from: 'ダンジョン 009', area: 'umi', rank: 'D', element: 'みず', role: 'jammer', mul: { def: 1.1 },
        line: 'ケムッ！', favorite: 'niboshi',
        title: '玉手箱を守るカニ', desc: '玉手箱を守っている。この中にはラフテルへのエターナルポースが入っているとか。',
        special: sp('けむりの 玉手箱', [atk('all', 0.6), { kind: 'status', target: 'all', status: 'confuse', chance: 0.6 }])
    },
    {
        id: 'isoginchakku', name: 'イソギンチャック', from: 'ダンジョン 013', area: 'umi', rank: 'D', element: 'しぜん', role: 'defender', mul: { hp: 1.1 },
        line: 'ジジジ…', favorite: 'kyuuri',
        title: 'お口チャック', desc: '口がチャックになっていて、この口の中を見たものは誰もいない。',
        special: sp('チャック すいこみ', [atk('one', 2.2, { drain: 0.5 })])
    },
    {
        id: 'otohimedai', name: 'オトヒメダイ', from: 'ダンジョン 012', area: 'umi', rank: 'D', element: 'みず', role: 'supporter', mul: { spd: 1.1 },
        line: '踊りましょ♪', favorite: 'melonpan',
        title: '踊る大捜査線', desc: '珍しい踊る魚。ダンスは地上で踊るんじゃない！洞窟で踊るんだ！',
        special: sp('乙姫の 大舞台', [{ kind: 'buff', target: 'party', stat: 'atk', amount: 0.4, time: 10 }])
    },
    {
        id: 'asedakku', name: 'アセダック', from: 'ダンジョン 040', area: 'umi', rank: 'D', element: 'みず', role: 'supporter', mul: { hp: 1.05 },
        line: 'あせあせ！', favorite: 'cider',
        title: '汗だくの鳥', desc: '汗腺が崩壊した鳥。いつもびしょびしょ。',
        special: sp('汗だく スプラッシュ', [atk('all', 1.3, { element: 'みず' })])
    },
    {
        id: 'uniharry', name: 'ウニハリー', from: 'ダンジョン 139', area: 'umi', rank: 'D', element: 'みず', role: 'defender', mul: { def: 1.15 },
        line: 'うにうに', favorite: 'cider',
        title: '海のハリー', desc: '海で暮らすことを選んだハリー。ウニと間違えられて食べられそうになるのが悩み。',
        special: sp('うにうに ニードル', [atk('one', 0.9, { hits: 3 }), { kind: 'status', target: 'one', status: 'poison', chance: 0.6 }])
    },
    {
        id: 'ryuuguudai', name: 'リュウグウダイ', from: 'ダンジョン 061', area: 'umi', rank: 'C', element: 'みず', role: 'healer', mul: { mag: 1.1 },
        line: '竜宮へ ご案内♪', favorite: 'choco',
        title: '竜宮の踊り子', desc: 'オトヒメダイが海岸どうくつの奥で進化した姿。洞窟で踊るだけでは物足りず、竜宮城でショーを開くようになった。踊りを見た者は元気になるらしい。',
        special: sp('竜宮の 宴', [{ kind: 'heal', target: 'party', power: 0.5 }])
    },
    {
        id: 'nakatadraco', name: 'ナカタドラコ', from: 'ダンジョン 048', area: 'umi', rank: 'C', element: 'みず', role: 'attacker', mul: { atk: 1.1 },
        line: 'ガオー（加減中）', favorite: 'onigiri',
        title: '中田のドラゴン', desc: '幼体のドラゴン。活発で、元気いっぱい。',
        special: sp('加減しない ブレス', [atk('all', 1.8, { element: 'みず' })])
    },
    {
        id: 'umibozuou', name: 'ウミボウズオウ', from: 'ダンジョン 062', area: 'umi', rank: 'C', element: 'ふしぎ', role: 'attacker', mul: { hp: 1.1 },
        line: 'ぼうず～～ん！！', favorite: 'onigiri',
        title: '海の大怪異', desc: 'ウミボウズンが深い迷宮の底で進化した姿。新月でなくても現れるようになり、漁師たちはもう海に出られない。闇はさらに暗く深くなった。',
        special: sp('大海嘯', [atk('all', 2.0, { element: 'みず' })])
    },
    {
        id: 'urashima', name: '浦の島重蔵', from: 'スロット・ダンジョン', area: 'umi', rank: 'C', element: 'みず', role: 'defender', mul: { hp: 1.1, def: 1.1, spd: 0.85 },
        line: 'わしは……なんじゃったかの……', favorite: 'niboshi',
        title: '帰れなくなった釣り人', desc: '一人で摩天楼に挑戦したが、道に迷って帰れなくなった 釣り人。今は 浦の島の海岸どうくつに 家を建てて住んでいる。亀の甲羅で守り、玉手箱で煙幕を放って戦う。物忘れがひどい。',
        special: sp('玉手箱 ぜんかい', [atk('all', 1.4, { magic: true, element: 'ふしぎ' }), { kind: 'status', target: 'all', status: 'confuse', chance: 0.5 }])
    },
    // ----- ネット寺の 10 体 (5 章「ネット寺の のろい」。2026-10-29。ダンジョンの ネット寺と ネットの キャラ。D 6・C 4) -----
    //   HTMLモックン・ローディン・エンジョウボウズは 黒い 紋に とりつかれて 寺に いる (map.js の MONS。助けると なかまに なる)
    //   名前・属性・役割・口ぐせ・説明は ダンジョンの データから 写した。必殺技は 仮
    {
        id: 'enjoubouzu', name: 'エンジョウボウズ', from: 'ダンジョン 016', area: 'tera', rank: 'D', element: 'ほのお', role: 'attacker', mul: {},
        line: '炎上上等！', favorite: 'cider',
        title: '炎上の申し子', desc: '炎上上等をモットーに炎上行為を繰り返している迷惑な奴。',
        special: sp('大炎上', [atk('all', 1.7)])
    },
    {
        id: 'bugmushi', name: 'バグムシ', from: 'ダンジョン 093', area: 'tera', rank: 'D', element: 'しぜん', role: 'jammer', mul: {},
        line: 'ジジッ…エラー…', favorite: 'kyuuri',
        title: 'バグを知らせる虫', desc: 'バグが発生すると、大量に湧いて出て、バグを知らせる。',
        special: sp('バグ 大発生', [atk('all', 0.8, { magic: true }), { kind: 'status', target: 'all', status: 'confuse', chance: 0.6 }])
    },
    {
        id: 'htmlmokkun', name: 'HTMLモックン', from: 'ダンジョン 094', area: 'tera', rank: 'D', element: 'ふつう', role: 'defender', mul: {},
        line: '<モックン>こんにちは</モックン>', favorite: 'onigiri',
        title: 'よくあるよね', desc: 'タグを閉じ忘れると現れ、小ばかにしてくる。',
        special: sp('タグ とじわすれ地獄', [atk('one', 2.0), { kind: 'buff', target: 'party', stat: 'def', amount: 0.4, time: 10 }])
    },
    {
        id: 'csspakkun', name: 'CSSパックン', from: 'ダンジョン 095', area: 'tera', rank: 'D', element: 'しぜん', role: 'attacker', mul: {},
        line: 'パックン！ スタイル いただき！', favorite: 'kyuuri',
        title: 'スタイル泥棒', desc: 'CSSでデザインしたスタイルを丸パクリする怪人。',
        special: sp('スタイル まるパクリ', [atk('all', 1.7)])
    },
    {
        id: 'nullpon', name: 'ヌルポン', from: 'ダンジョン 096', area: 'tera', rank: 'D', element: 'ふしぎ', role: 'jammer', mul: {},
        line: 'ぬるぽ', favorite: 'melonpan',
        title: 'ガッ！', desc: 'NullPointerExceptionの略。Javaでよくあるエラー。',
        special: sp('ガッ！', [atk('all', 0.8, { magic: true }), { kind: 'status', target: 'all', status: 'confuse', chance: 0.6 }])
    },
    {
        id: 'loadingu', name: 'ローディン', from: 'ダンジョン 098', area: 'tera', rank: 'D', element: 'かぜ', role: 'jammer', mul: {},
        line: 'しょうしょう おまちください…', favorite: 'choco',
        title: 'くるくる回る者', desc: '読み込み中の画面に現れ、ずっとくるくる回っている。本人も何を待っているのかは知らない。',
        special: sp('むげん 読みこみ', [atk('all', 0.8, { magic: true }), { kind: 'status', target: 'all', status: 'sleep', chance: 0.6 }])
    },
    {
        id: 'mugenloop', name: 'ムゲンループ', from: 'ダンジョン 107', area: 'tera', rank: 'C', element: 'ふしぎ', role: 'jammer', mul: {},
        line: 'もういちど もういちど もういちど', favorite: 'melonpan',
        title: '終わらない繰り返し', desc: '止まる条件を書き忘れると生まれる。同じことを永遠に繰り返し、パソコンを熱くする。',
        special: sp('おわらない ループ', [atk('all', 0.8, { magic: true }), { kind: 'status', target: 'all', status: 'confuse', chance: 0.6 }])
    },
    {
        id: 'notfound', name: 'ノットファウンド', from: 'ダンジョン 110', area: 'tera', rank: 'C', element: 'ふしぎ', role: 'jammer', mul: {},
        line: '404……ここには なにも ない', favorite: 'melonpan',
        title: 'ここには何もない', desc: 'リンク切れのページにひっそり住んでいる。探しに来た者に「何もない」と伝えるのが仕事。',
        special: sp('404 の 闇', [atk('all', 0.8, { magic: true }), { kind: 'status', target: 'all', status: 'confuse', chance: 0.6 }])
    },
    {
        id: 'virusn', name: 'ウイルスン', from: 'ダンジョン 112', area: 'tera', rank: 'C', element: 'ふしぎ', role: 'jammer', mul: {},
        line: 'ぞうしょく します', favorite: 'melonpan',
        title: '増える厄介者', desc: 'パソコンからパソコンへ渡り歩き、勝手に増える。ファイアウォールとは犬猿の仲。',
        special: sp('パンデミック', [atk('all', 0.8, { magic: true }), { kind: 'status', target: 'all', status: 'poison', chance: 0.6 }])
    },
    {
        id: 'firewall', name: 'ファイアウォール', from: 'ダンジョン 113', area: 'tera', rank: 'C', element: 'ほのお', role: 'defender', mul: {},
        line: 'ここは とおしません', favorite: 'cider',
        title: '炎の門番', desc: '燃える壁で怪しい者を通さない門番。たまに味方まで通さないのが玉にきず。',
        special: sp('炎の 防壁', [atk('one', 2.0), { kind: 'buff', target: 'party', stat: 'def', amount: 0.4, time: 10 }])
    },
    {
        id: 'daishi', name: 'ダイシ', from: 'アソ・ダンジョン', area: 'tera', rank: 'C', element: 'ふしぎ', role: 'jammer', mul: { mag: 1.15, hp: 1.05 },
        line: 'よくぞ参られた。拙僧が相手いたそう。', favorite: 'onigiri',
        title: 'ネット寺の和尚', desc: 'ASO四天王の1人。有名な和尚で、いろいろな所に出向いてお経をあげてきた。仏の顔と鬼の顔をあわせ持ち、鬼になると戦闘力は計り知れない。最近はネットの世界を救おうと「ネット寺」を立ち上げた。',
        special: sp('鬼の 顔', [{ kind: 'buff', target: 'self', stat: 'atk', amount: 0.6, time: 10 }, atk('all', 1.5, { magic: true, element: 'ふしぎ' })])
    },
    // ----- 忍びの屋敷の 10 体 (6 章「忍びの屋敷と 消えた メダル」。2026-10-29。ダンジョンの 忍びの屋敷と 鬼鬼団の キャラ。D 6・C 4) -----
    //   ズミタニは 屋敷の 門の ボス (影分身) を たおすと なかまに なる。名前・属性・役割・口ぐせ・説明は ダンジョンの データから 写した。必殺技は 仮
    {
        id: 'geninman', name: 'ゲニンマン', from: 'ダンジョン 022', area: 'yashiki', rank: 'D', element: 'ふつう', role: 'attacker', mul: {},
        line: 'あ、まだいたんですね～', favorite: 'onigiri',
        title: '忍者の男', desc: '忍者の一員。静かに行動し、敵を狙って攻撃する。',
        special: sp('下忍の 百本手裏剣', [atk('all', 1.7)])
    },
    {
        id: 'shurikenbo', name: 'シュリケンボー', from: 'ダンジョン 026', area: 'yashiki', rank: 'D', element: 'かぜ', role: 'attacker', mul: {},
        line: 'シュルルル！', favorite: 'choco',
        title: '手裏剣の妖怪。', desc: '手裏剣の付喪神。最近は手裏剣戦隊ニンニンジャーにあこがれている。',
        special: sp('大回転 しゅりけん', [atk('all', 1.7)])
    },
    {
        id: 'bakudanjirou', name: 'バクダンジロウ', from: 'ダンジョン 028', area: 'yashiki', rank: 'D', element: 'ほのお', role: 'attacker', mul: {},
        line: 'あとはまかせた～！', favorite: 'cider',
        title: '儚き命。', desc: '爆弾の忍者。爆発すると死ぬ。どう見たって儚いだろ！',
        special: sp('あとは まかせた 大爆発', [atk('all', 1.7)])
    },
    {
        id: 'konin', name: 'コオニン', from: 'ダンジョン V11', area: 'yashiki', rank: 'D', element: 'ほのお', role: 'attacker', mul: {},
        line: 'オニ！ オニ！', favorite: 'cider',
        title: '見習いの鬼', desc: '鬼鬼団の見習い。いつかゴウキオニのような一番槍になりたい。',
        special: sp('こおに 連打', [atk('all', 1.7)])
    },
    {
        id: 'aoonibo', name: 'アオオニボ', from: 'ダンジョン V12', area: 'yashiki', rank: 'D', element: 'みず', role: 'defender', mul: {},
        line: 'あおくて わるいか', favorite: 'niboshi',
        title: '青い鬼', desc: '青い体の鬼。青いことを気にしているが、気にしていないふりをしている。',
        special: sp('あおおに 大しぶき', [atk('one', 2.0), { kind: 'buff', target: 'party', stat: 'def', amount: 0.4, time: 10 }])
    },
    {
        id: 'kanabone', name: 'カナボーン', from: 'ダンジョン V13', area: 'yashiki', rank: 'D', element: 'ふつう', role: 'attacker', mul: {},
        line: '鬼に かなぼう だ！', favorite: 'onigiri',
        title: '金棒の付喪神', desc: '鬼に持たれ続けた金棒が命を宿した。鬼に金棒というが、金棒にも鬼が必要らしい。',
        special: sp('金棒 ぶんまわし', [atk('all', 1.7)])
    },
    {
        id: 'makibikonmk3', name: 'マキビコンMk-3', from: 'ダンジョン 049', area: 'yashiki', rank: 'C', element: 'ふつう', role: 'attacker', mul: {},
        line: '計算中であります…エラーであります', favorite: 'onigiri',
        title: 'オールドタイプ', desc: '古いタイプのマキビコン。計算能力は高いが、最新機能は搭載されていない。',
        special: sp('エラー ビーム', [atk('all', 1.7)])
    },
    {
        id: 'hyoutanoni', name: 'ヒョウタンオニ', from: 'ダンジョン V16', area: 'yashiki', rank: 'C', element: 'ふしぎ', role: 'jammer', mul: {},
        line: 'ひっく……もう いっぱい……', favorite: 'melonpan',
        title: 'ひょうたんの酒鬼', desc: 'ひょうたんの酒を手放さない鬼。もう一杯が口ぐせで、飲みすぎて城の廊下で寝ている。',
        special: sp('よっぱらい 大宴会', [atk('all', 0.8, { magic: true }), { kind: 'status', target: 'all', status: 'confuse', chance: 0.6 }])
    },
    {
        id: 'taikooni', name: 'タイコオニ', from: 'ダンジョン V17', area: 'yashiki', rank: 'C', element: 'かぜ', role: 'supporter', mul: {},
        line: 'ドドン！ カッ！', favorite: 'choco',
        title: '太鼓の鬼', desc: '太鼓をたたいて仲間を元気づける鬼。ヨシブックとは太鼓仲間らしい。',
        special: sp('雷 だいこ 乱れ打ち', [{ kind: 'buff', target: 'party', stat: 'atk', amount: 0.4, time: 10 }, atk('all', 0.8)])
    },
    {
        id: 'zumitani', name: 'ズミタニ', from: 'アソ・ダンジョン', area: 'yashiki', rank: 'C', element: 'かぜ', role: 'attacker', mul: { spd: 1.25, atk: 1.05 },
        line: 'やっほー、77代目の ズミタニだよ！ ついてこられるかな♪', favorite: 'choco',
        title: '忍びの屋敷の主', desc: 'ASO四天王の1人。古くから続くズミタニ家の忍者で、77代目。すばやい動きで敵を翻弄する。口調は明るいが、言葉のふしぶしにとげがある。',
        special: sp('影分身の術', [atk('all', 0.7, { hits: 3 })])
    },
    // 忍びの屋敷の キャラの 進化先 2 体 (6 章。町には 出ない)
    {
        id: 'jouninman', name: 'ジョウニンマン', from: 'ダンジョン 066', area: 'yashiki', evo: 'geninman', rank: 'C', element: 'かぜ', role: 'attacker', mul: {},
        line: 'もう いましたよ～', favorite: 'choco',
        title: '上忍の男', desc: 'ゲニンマンが修行を積んで上忍になった姿。気配を消すのがうますぎて、仲間にも「もういたんですね」と言われる。',
        special: sp('上忍の かげ斬り', [atk('all', 1.7)])
    },
    {
        id: 'daibakudanjirou', name: 'ダイバクダンジロウ', from: 'ダンジョン 068', area: 'yashiki', evo: 'bakudanjirou', rank: 'C', element: 'ほのお', role: 'attacker', mul: {},
        line: 'あとは まかせた～～！！', favorite: 'cider',
        title: 'さらに儚き命。', desc: 'バクダンジロウがマグマの石で進化した姿。爆発の大きさは何倍にもなった。そして爆発すると死ぬ。どう見たってさらに儚いだろ！',
        special: sp('超 大ばくはつ', [atk('all', 1.7)])
    },
    // ----- 進化で なる 16 体 (2026-10-29。ダンジョンの 進化表の 進化先。evo: 進化する 前の キャラ) -----
    //   町には 出ない。進化前の キャラが 決まった Lv に なると 進化する (EVOLVE)。ランクは 進化前の 1 つ上、好物と 能力の くせは 進化前と 同じ
    //   名前・属性・役割・口ぐせ・説明は ダンジョンの データから 写した。必殺技は 仮
    {
        id: 'harigeneral', name: 'ハリジェネラル', from: 'ダンジョン 053', area: 'ishinokawa', evo: 'haribaby', rank: 'D', element: 'ふつう', role: 'attacker', mul: { hp: 0.9, atk: 1.05 },
        line: '突撃ハリ！', favorite: 'cider',
        title: '優秀な兵', desc: '免許を持ったハリー。見違えるほどたくましく成長した。',
        special: sp('針の 総攻撃', [atk('all', 1.7)])
    },
    {
        id: 'joubachi', name: 'ジョオウバチ', from: 'ダンジョン 054', area: 'ishinokawa', evo: 'mumenbachi', rank: 'D', element: 'かぜ', role: 'attacker', mul: { hp: 0.8, spd: 1.25 },
        line: '免許？ 女王には いらないの', favorite: 'choco',
        title: '無免許の女王', desc: '無免許のまま女王になったが、女王なので、何とかなる。',
        special: sp('女王の 一刺し', [atk('all', 1.7)])
    },
    {
        id: 'oodonguriko', name: 'オオドングリコ', from: 'ダンジョン 055', area: 'ishinokawa', evo: 'donguriko', rank: 'D', element: 'しぜん', role: 'defender', mul: { hp: 0.9 },
        line: 'ゴロゴロゴロ～！', favorite: 'kyuuri',
        title: 'でかいドングリ', desc: '前兆３Mのドングリ。どんぐりころころで魚ごと叩き潰した。',
        special: sp('どんぐり 大ころがし', [atk('one', 2.0), { kind: 'buff', target: 'party', stat: 'def', amount: 0.4, time: 10 }])
    },
    {
        id: 'nemuridakeou', name: 'ネムリダケオウ', from: 'ダンジョン 056', area: 'ishinokawa', evo: 'nemuridake', rank: 'D', element: 'しぜん', role: 'jammer', mul: {  },
        line: 'おやすみ…みんな…', favorite: 'melonpan',
        title: '不眠症の王', desc: 'ネムリダケが月のちりを浴びて進化した姿。「おやすみ」が口ぐせだが、本人は一度も眠れたことがない。王になって、周りを不眠症にする範囲も広がった。',
        special: sp('王の 子守歌', [atk('all', 0.8, { magic: true }), { kind: 'status', target: 'all', status: 'sleep', chance: 0.6 }])
    },
    {
        id: 'pekorisuking', name: 'ペコリスキング', from: 'ダンジョン 057', area: 'ishinokawa', evo: 'pekorisu', rank: 'D', element: 'かぜ', role: 'supporter', mul: { spd: 1.1 },
        line: 'ぜんぶ いただきっ！', favorite: 'onigiri',
        title: '森の大盗賊', desc: 'ペコリスがラッキーコインで進化した姿。食べ物だけでは満足できなくなり、目についたものを全部いただくようになった。それでもおなかはすいている。',
        special: sp('キング たね ガトリング', [{ kind: 'buff', target: 'party', stat: 'atk', amount: 0.4, time: 10 }, atk('all', 0.8)])
    },
    {
        id: 'tsutankobuju', name: 'ツタンコブジュ', from: 'ダンジョン 058', area: 'ishinokawa', evo: 'tsutankobu', rank: 'D', element: 'しぜん', role: 'defender', mul: { hp: 1.1, atk: 1.1 },
        line: 'からめとる…', favorite: 'kyuuri',
        title: '巨大なツタ', desc: 'ツタンコブが昆布を取りこんで進化した姿。これで昆布説がますます有力になったが、本人はツタだと言いはっている。',
        special: sp('大ツタしばり', [atk('one', 2.0), { kind: 'buff', target: 'party', stat: 'def', amount: 0.4, time: 10 }])
    },
    {
        id: 'yoakefukurou', name: 'ヨアケフクロウ', from: 'ダンジョン 059', area: 'ishinokawa', evo: 'yofukashi', rank: 'D', element: 'かぜ', role: 'jammer', mul: { atk: 1.1 },
        line: 'もう朝だホー', favorite: 'cider',
        title: '朝をむかえた鳥', desc: 'ヨフカシフクロウが月の迷宮で夜を明かして進化した姿。何日も寝ないで朝をむかえた記録保持者として、仲間内では伝説になっている。まだ寝ない。',
        special: sp('よあけの 一閃', [atk('all', 0.8, { magic: true }), { kind: 'status', target: 'all', status: 'confuse', chance: 0.6 }])
    },
    {
        id: 'hyougame', name: 'ヒョウガメ', from: 'ダンジョン 060', area: 'ishinokawa', evo: 'kogame', rank: 'D', element: 'こおり', role: 'defender', mul: { def: 1.2, spd: 0.9 },
        line: '…（ひえひえ）', favorite: 'kyuuri',
        title: '凍った亀', desc: 'コガメが海岸どうくつの冷たい海で凍って進化した姿。少しだけ大きくなって、少しだけ冷たくなった。それ以外の何物でもない。',
        special: sp('ひょうけつ こうら', [atk('one', 2.0), { kind: 'buff', target: 'party', stat: 'def', amount: 0.4, time: 10 }])
    },
    {
        id: 'spamking', name: 'スパムキング', from: 'ダンジョン 064', area: 'shoutengai', evo: 'spamdama', rank: 'D', element: 'ふしぎ', role: 'supporter', mul: { spd: 1.1 },
        line: '100万人目の お客様です！', favorite: 'choco',
        title: '広告の王', desc: 'スパムダマが壊れたケーブルで進化した姿。見てもらいたい気持ちがあふれ、ついに「100万人目のお客様」を名乗り出した。当選した人は今のところいない。',
        special: sp('100万人目の あらし', [{ kind: 'buff', target: 'party', stat: 'atk', amount: 0.4, time: 10 }, atk('all', 0.8)])
    },
    {
        id: 'hitodamaou', name: 'ヒトダマオウ', from: 'ダンジョン 065', area: 'ishinokawa', evo: 'rousokubi', rank: 'D', element: 'ほのお', role: 'attacker', mul: { mag: 1.2 },
        line: 'めら～り', favorite: 'choco',
        title: '青い炎の怪異', desc: 'ロウソクビがお寺のお香で進化した姿。火は青く燃えるようになり、もう簡単には消えない。それでも消えたときのことは、考えないほうがいい。',
        special: sp('青い 鬼火', [atk('all', 1.7)])
    },
    {
        id: 'kagebunshin', name: 'カゲブンシンダヌキ', from: 'ダンジョン 067', area: 'ishinokawa', evo: 'kawarimidanuki', rank: 'D', element: 'ふしぎ', role: 'jammer', mul: {  },
        line: 'ドロロン！', favorite: 'onigiri',
        title: '分身の達人', desc: 'カワリミダヌキが修行を重ねて進化した姿。変身だけでなく分身もできるようになったが、どれが本物か自分でもわからなくなるときがある。',
        special: sp('百分身', [atk('all', 0.8, { magic: true }), { kind: 'status', target: 'all', status: 'confuse', chance: 0.6 }])
    },
    {
        id: 'yukimidaifuku', name: 'ユキミダイフク', from: 'ダンジョン 071', area: 'yama', evo: 'yukimidango', rank: 'C', element: 'こおり', role: 'defender', mul: { def: 1.1, hp: 1.05 },
        line: 'ひんやり おつきみ～', favorite: 'onigiri',
        title: '雪の大福', desc: 'ユキミダンゴが星のかけらで進化した姿。団子がひとつにまとまって大福になった。中身はたぶん長男。',
        special: sp('おつきみ 大福', [atk('one', 2.0), { kind: 'buff', target: 'party', stat: 'def', amount: 0.4, time: 10 }])
    },
    {
        id: 'muscletitan', name: 'マッスルタイタン', from: 'ダンジョン 072', area: 'school', evo: 'proteingolem', rank: 'C', element: 'ふつう', role: 'defender', mul: { hp: 1.15, atk: 1.2, spd: 0.8 },
        line: 'タンパク…シツ…ゴールド…', favorite: 'niboshi',
        title: 'プロテインの巨人', desc: 'プロテインゴーレムが鍛えぬいて進化した姿。ゴールドのプロテインしか口にしない。ステロイドのうわさは、本人がかたく否定している。',
        special: sp('ゴールド タイタンプレス', [atk('one', 2.0), { kind: 'buff', target: 'party', stat: 'def', amount: 0.4, time: 10 }])
    },
    {
        id: 'hyouzanmuscle', name: 'ヒョウザンマッスル', from: 'ダンジョン 074', area: 'yama', evo: 'yukidarumuscle', rank: 'C', element: 'こおり', role: 'attacker', mul: { atk: 1.15, spd: 0.9 },
        line: '冷えきった 筋肉こそ 最強', favorite: 'cider',
        title: '氷山の筋肉', desc: 'ユキダルマッスルが月の迷宮の寒さで進化した姿。冷えきった筋肉は氷山のようにかたい。筋肉自慢の３男は、兄たちに追いつこうと今日も鍛えている。',
        special: sp('氷山 マッスル', [atk('all', 1.7)])
    },
    {
        id: 'kinkomimic', name: 'キンコミミック', from: 'ダンジョン 076', area: 'school', evo: 'takaramimic', rank: 'C', element: 'ふつう', role: 'defender', mul: { atk: 1.15 },
        line: 'あけたな？ 暗証番号は？', favorite: 'choco',
        title: '金庫のミミック', desc: 'タカラミミックが金の腕輪で進化した姿。宝箱から金庫になり、ますますかわいくなくなった。暗証番号を聞いてくるが、答えても噛まれる。',
        special: sp('金庫 クラッシュ', [atk('one', 2.0), { kind: 'buff', target: 'party', stat: 'def', amount: 0.4, time: 10 }])
    },
    {
        id: 'daichouenou', name: 'ダイチョウエンオウ', from: 'ダンジョン 079', area: 'ishinokawa', evo: 'daichouenkin', rank: 'D', element: 'ふしぎ', role: 'jammer', mul: { hp: 1.05 },
        line: 'おなか、ぐるぐるぐる～！', favorite: 'melonpan',
        title: '大腸菌の王', desc: 'ダイチョウエンキンが育ちきった姿。友好型のままだが、おなかのぐるぐるは何倍にもなった。こおりくんとは昔からの友達らしい。',
        special: sp('大腸 大混乱', [atk('all', 0.8, { magic: true }), { kind: 'status', target: 'all', status: 'poison', chance: 0.6 }])
    },
];

// わざ・術を つける
function moves(id, element, rank, upper = false) {
    const w = WAZA[id];
    return { waza: { name: w.name, effects: wazaEffects(w) }, jutsu: jutsuOf(element, jutsuTier(rank, upper), JUTSU_TYPE[id]) };
}

// ランクが 高いほど 能力も 少し 高い (設計書 4.5)
export const RANK_K = { E: 1, D: 1.15, C: 1.3, B: 1.45, A: 1.6, S: 1.8 };
// 地区 (設計書 5.1)。area の ない キャラは 石の川タウン
export const AREAS = { ishinokawa: '石の川タウン', shoutengai: '商店街', school: '石の川小学校', yama: '山と ダム', umi: '海辺の 町', tera: 'ネット寺', yashiki: '忍びの屋敷' };

// 図鑑の番号・ランク・能力・ふだんの わざ を足して 仕上げる
export const NAKAMA = {};
LIST.forEach((n, i) => {
    const rank = n.rank || 'E';
    const base = {};
    for (const [k, v] of Object.entries(ROLE_BASE[n.role])) base[k] = Math.round(v * (n.mul[k] || 1) * RANK_K[rank]);
    NAKAMA[n.id] = { ...n, no: i + 1, rank, area: n.area || 'ishinokawa', base, ...moves(n.id, n.element, rank, n.upperJutsu), art: n.id };
});
export const NAKAMA_IDS = LIST.map(n => n.id);
// 地区で 出会う キャラ (進化で なる キャラは 入れない)
export const idsInArea = area => NAKAMA_IDS.filter(id => NAKAMA[id].area === area && !NAKAMA[id].evo);

// ----- 進化 (設計書 4.3。2026-10-29) -----
//   なかまが 決まった Lv に なると、すがたが 変わって 進化先の キャラに なる (メダルは そのまま。Lv・けいけんちも そのまま)
//   ダンジョンの 進化表 (allies.js の EVOLVE) を 写した。道具・ダンジョンが 条件の 進化も、いまは Lv だけで 進化する
export const EVOLVE = {
    haribaby: { to: 'harigeneral', lv: 22 },
    mumenbachi: { to: 'joubachi', lv: 25 },
    donguriko: { to: 'oodonguriko', lv: 20 },
    nemuridake: { to: 'nemuridakeou', lv: 18 },
    pekorisu: { to: 'pekorisuking', lv: 20 },
    tsutankobu: { to: 'tsutankobuju', lv: 25 },
    yofukashi: { to: 'yoakefukurou', lv: 26 },
    kogame: { to: 'hyougame', lv: 24 },
    otohimedai: { to: 'ryuuguudai', lv: 30 },
    umibozun: { to: 'umibozuou', lv: 40 },
    spamdama: { to: 'spamking', lv: 24 },
    rousokubi: { to: 'hitodamaou', lv: 28 },
    kawarimidanuki: { to: 'kagebunshin', lv: 38 },
    yukimidango: { to: 'yukimidaifuku', lv: 30 },
    proteingolem: { to: 'muscletitan', lv: 48 },
    yukidarumuscle: { to: 'hyouzanmuscle', lv: 42 },
    takaramimic: { to: 'kinkomimic', lv: 45 },
    koorimodoki: { to: 'koorimodokishin', lv: 50 },
    daichouenkin: { to: 'daichouenou', lv: 30 },
    geninman: { to: 'jouninman', lv: 35 },
    bakudanjirou: { to: 'daibakudanjirou', lv: 34 },
};
export const evolveOf = id => EVOLVE[id] || null;

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
    },
    // 3 章の ボス: ダムの主 (ヒョウガリュウ。2026-10-29 ユーザー指定)。こおりの 王冠で 目ざめ、ダムの 水を ぜんぶ 氷の 城に した
    //   わざ: ひょうがブレス (全体に こおり 中)・かみつき (1 体に 中)・はばたき (全体に ふつう 中〜小)・大吹雪 (全体に こおり 中〜大)
    //   氷の偶像: 左右 どちらかに 自分の 偶像を 1 体 作る。2 体 そろうと 必殺技 氷河の咆哮 (全体に こおり 大) の ため に 入る。
    //     ためて いる あいだに 偶像を こわすと 必殺技は 止まる (battle.js の summonIdol)。チャンスタイムは なし
    himuro: {
        id: 'himuro', name: 'ダムの主', element: 'こおり', role: 'attacker', art: 'hyougaryu', scale: 2, rank: 'B',
        base: { hp: 800, atk: 15, def: 14, spd: 12, mag: 15 },
        moves: [
            { name: 'ひょうがブレス', w: 3, effects: [atk('all', 0.75, { magic: true, element: 'こおり' })] },
            { name: 'かみつき', w: 3, effects: [atk('one', 1.3)] },
            { name: 'はばたき', w: 2, effects: [atk('all', 0.55, { element: 'ふつう' })] },
            { name: '大吹雪', w: 1.5, effects: [atk('all', 0.95, { magic: true, element: 'こおり' })] },
            { name: '氷の偶像', w: 2, summon: true }
        ],
        // 必殺技は 時間では 打たない (偶像が 2 体 そろうと charge 秒 ためて 打つ)。偶像の HP は ボスの 最大HP の idolHp
        bigMove: { name: '氷河の咆哮', trigger: 'idols', charge: 7, idolName: '氷の偶像', idolHp: 0.06, effects: [atk('all', 1.6, { magic: true, element: 'こおり' })] },
        befriends: 'hyougaryu', lv: 17, place: 'dam'
    },
    // 4 章の ボス: 黒い 紋に とりつかれた 浦の島重蔵 (浦の島の海岸どうくつの いちばん 奥)。たおすと 紋が 消えて なかまに なる
    //   わざ: 玉手箱 (全体に ふしぎ 小 + こんらん)・つりざお (1 体に 中)・こうらに こもる・「……なんじゃったかの」(もの忘れ)
    //   必殺技: 黒い紋の 玉手箱 (予告つき。全体に みず 大 + ときどき とりつき)
    //   しかけ (2026-10-29 ユーザー指定。battle.js の gims):
    //     玉手箱: いつも ねらえる。こわすと 玉手箱の わざと 必殺技が 使えなくなるが、けむりが 出て 10 秒 味方の 攻撃が 当たりにくい
    //     頭: こうらに こもって いる (7 秒) あいだ だけ ねらえる。こもって いる あいだは 体への ダメージが へる。
    //       頭を こわすと ひっくり返って チャンスタイム
    //   gims の pos: 絵の どこに 出すか [横 (絵の 半分の はばで), たて (絵の 高さで。足元が 0)]
    urashima4: {
        id: 'urashima4', name: '浦の島重蔵 (黒い紋)', element: 'みず', role: 'defender', art: 'urashima', scale: 1.5, rank: 'B',
        base: { hp: 700, atk: 14, def: 15, spd: 10, mag: 14 },
        moves: [
            { name: '玉手箱', w: 3, box: true, effects: [atk('all', 0.7, { magic: true, element: 'ふしぎ' }), { kind: 'status', target: 'all', status: 'confuse', chance: 0.35 }] },
            { name: 'つりざお', w: 3, effects: [atk('one', 1.3)] },
            { name: 'こうらに こもる', w: 1.5, shell: 7 },
            { name: '……なんじゃったかの', w: 1.2, effects: [] }
        ],
        bigMove: { name: '黒い紋の 玉手箱', box: true, every: 13, warn: 2.5, effects: [atk('all', 1.4, { magic: true, element: 'みず' }), { kind: 'status', target: 'all', status: 'possess', chance: 0.25 }] },
        gims: {
            box: { name: '玉手箱', hp: 0.08, when: 'always', pos: [-0.55, -0.25], move: '玉手箱', smoke: 10, miss: 0.45 },
            head: { name: '頭', hp: 0.05, when: 'shell', pos: [0, -0.82], reset: true }
        },
        shellCut: 0.3,   // こもっている あいだの 体への ダメージ (30%)
        chanceTurns: 3,
        befriends: 'urashima', lv: 20, place: 'cave'
    },
    // 5 章の ボス: 黒い 紋に のまれた ダイシ (ネット寺の 本堂の 前)。たおすと 紋が 消えて なかまに なる
    //   仏の顔: 説法 (全体 ねむり)・錫杖 (1 体に 中)・数珠まわし (全体に 小)・配信の お経 (全体 こんらん)
    //   しかけ (2026-10-29 ユーザー指定。battle.js の gims・oni・chant):
    //     鬼の顔: 攻撃を うけつづける (最大HP の 22% ぶん) と 鬼の顔に なり、こうげきが 上がって わざが かわる (前作の「鬼になると
    //       戦闘力は計り知れない」)。鬼の顔の あいだ だけ 顔の 鬼の面を ねらえ、こわすと 仏の顔に もどる (また 怒れば 鬼に なる)
    //     お経: 仏の顔でも 鬼の顔でも、13 秒ごとに お経を 6 秒 となえ、となえきると 必殺技 (鬼の顔なら もっと 強い)。
    //       となえている あいだ だけ うしろの 鐘を ねらえる。だれかが 当てると 鐘が 鳴り、おどろいて チャンスタイム (お経も 止まる)
    daishi5: {
        id: 'daishi5', name: 'ダイシ (黒い紋)', element: 'ふしぎ', role: 'jammer', art: 'daishi', scale: 1.5, rank: 'B',
        base: { hp: 820, atk: 15, def: 14, spd: 10, mag: 16 },
        moves: [
            { name: '説法', w: 2, effects: [{ kind: 'status', target: 'all', status: 'sleep', chance: 0.35 }] },
            { name: '錫杖', w: 3, effects: [atk('one', 1.3)] },
            { name: '数珠まわし', w: 2, effects: [atk('all', 0.6)] },
            { name: '配信の お経', w: 1.5, effects: [atk('all', 0.5, { magic: true, element: 'ふしぎ' }), { kind: 'status', target: 'all', status: 'confuse', chance: 0.4 }] }
        ],
        bigMove: { name: 'ネット念仏', trigger: 'chant', every: 13, chant: 6, effects: [atk('all', 1.4, { magic: true, element: 'ふしぎ' })],
            oni: { name: '鬼神 ネット念仏', effects: [atk('all', 1.75, { magic: true, element: 'ふしぎ' })] } },
        oni: {
            at: 0.22, name: '鬼の顔', atk: 0.35,
            moves: [
                { name: '鬼の 錫杖', w: 3, effects: [atk('one', 1.6)] },
                { name: '鬼の にらみ', w: 2, effects: [{ kind: 'status', target: 'all', status: 'confuse', chance: 0.6 }] },
                { name: '鬼の 数珠ぜめ', w: 2, effects: [atk('all', 0.85)] }
            ]
        },
        gims: {
            mask: { name: '鬼の面', hp: 0.08, when: 'oni', pos: [0, -0.8] },
            bell: { name: '鐘', hp: 0.01, when: 'chant', pos: [-1.9, -0.55], noBody: true, reset: true }
        },
        chanceTurns: 3,
        befriends: 'daishi', lv: 23, place: 'tera'
    },
    // ----- 6 章の ボス 3 体 (2026-10-29 ユーザー指定) -----
    // 屋敷の 門: ズミタニ。かげぶんしんで 2 体の 分身を 出し、4 秒ごとに 瞬間移動で 3 体の 位置を 入れかえる (14 秒で 消える)。
    //   分身が いる あいだは ロックオン した あいてにしか 攻撃が 当たらない。本物なら 分身が 消えて ダメージ 1.3 倍、
    //   分身を ねらうと しっぱい: 当てた なかまに ダメージと とりつき (分身は 1 体 消える)。clones・battle.js の summonClones
    zumitani6: {
        id: 'zumitani6', name: 'ズミタニ', element: 'かぜ', role: 'attacker', art: 'zumitani', scale: 1.4, rank: 'B',
        base: { hp: 660, atk: 15, def: 12, spd: 15, mag: 13 },
        moves: [
            { name: 'クナイ乱れうち', w: 3, effects: [atk('all', 0.6, { element: 'かぜ' })] },
            { name: '忍び斬り', w: 3, effects: [atk('one', 1.4), { kind: 'status', target: 'one', status: 'confuse', chance: 0.3 }] },
            { name: 'かげぶんしん', w: 4, clones: 2 }
        ],
        bigMove: { name: '百影 クナイ', every: 16, warn: 2.5, effects: [atk('all', 1.1, { element: 'かぜ' })] },
        clones: { count: 2, life: 14, teleport: 4, bonus: 1.3, counter: [atk('one', 1.5), { kind: 'status', target: 'one', status: 'possess', chance: 1 }] },
        befriends: 'zumitani', lv: 26, place: 'yashiki'
    },
    // 奥の 間: ルキハに あやつられた おにおに (第 1 形態だけ)。ふつうの 攻撃と、予告つきの 凪払い (全体)。なかまには ならない
    onioni6: {
        id: 'onioni6', name: 'おにおに', element: 'ほのお', role: 'attacker', art: 'onioni', scale: 2, rank: 'B',
        base: { hp: 900, atk: 18, def: 14, spd: 12, mag: 11 },
        moves: [
            { name: '金棒 たたき', w: 3, effects: [atk('one', 1.4)] },
            { name: '鬼パンチ', w: 3, effects: [atk('one', 1.1)] },
            { name: 'お金かえせ！', w: 1.5, effects: [{ kind: 'status', target: 'one', status: 'slow', chance: 0.7 }] }
        ],
        bigMove: { name: '凪払い', every: 11, warn: 2.5, effects: [atk('all', 1.3)] },
        befriends: null, lv: 27, place: 'yashiki'
    },
    // 東の 蔵: 鬼鬼団の 幹部 トモオカ (新キャラ)。体を 攻撃される たびに 右腕が 大きく なり (1 回で 1 段・10 段で 限界)、
    //   限界に なると 4 秒 ためて 防御不能の 必殺技「丘砕きの一撃」。右腕を ロックオンして 当てると、最大HP の 3.5% ごとに 1 段ずつ
    //   しぼむ (体への ダメージは 40% だけ)。ためている あいだに 限界より 小さく すると 止まる。arm・battle.js の armHit
    tomooka6: {
        id: 'tomooka6', name: 'トモオカ', element: 'ふつう', role: 'attacker', art: 'tomooka', scale: 2, rank: 'B',
        base: { hp: 820, atk: 16, def: 15, spd: 9, mag: 10 },
        moves: [
            { name: '右ストレート', w: 3, effects: [atk('one', 1.3)] },
            { name: '地ならし', w: 2, effects: [atk('all', 0.6)] },
            { name: 'にらみ', w: 1.5, effects: [{ kind: 'status', target: 'all', status: 'slow', chance: 0.4 }] }
        ],
        arm: { max: 10, start: 2, perHit: 1, step: 0.035, bodyCut: 0.4, charge: 4, after: 0,
            move: { name: '丘砕きの一撃', effects: [atk('all', 2.6, { unguardable: true })] } },
        gims: { arm: { name: '右腕', hp: 99, when: 'always', pos: [-1.15, -0.68], arm: true } },
        befriends: null, lv: 28, place: 'yashiki'
    }
};
Object.values(BOSSES).forEach(b => Object.assign(b, moves(b.id, b.element, b.rank || 'C')));

// ライバル探検隊 (4 章。2026-10-29): バージョンで ちがう チームが 浦の島の海岸どうくつで 勝負を いどんでくる (3 体の バトル)
//   内定: ASK-3 (リーダー KING.ASAHARA) / 免許: お願いマッスル (リーダー マッスルウエノーブル)。設計書では リーダー S・メンバー A
//   だが 4 章の あいては 少し 弱め (リーダー B・メンバー C)。まだ なかまに ならない。リーダーの 必殺技は 予告つき
//   名前・属性・口ぐせ・わざは ダンジョンの データから 写した
const rival = (id, name, element, role, rank, mul, line, special, extra = {}) => {
    const base = {};
    for (const [k, v] of Object.entries(ROLE_BASE[role])) base[k] = Math.round(v * (mul[k] || 1) * RANK_K[rank]);
    return { id, name, element, role, rank, art: id, base, line, special, ...moves(id, element, rank), ...extra };
};
export const RIVAL_TEAMS = {
    naitei: { name: 'ASK-3', leader: 'asahara', members: ['sasaki', 'asahara', 'kotani'] },
    menkyo: { name: 'お願いマッスル', leader: 'ueno', members: ['shibata', 'ueno', 'ikekimu'] }
};
export const RIVALS = {
    asahara: rival('asahara', 'KING.ASAHARA', 'ほのお', 'attacker', 'B', { hp: 1.15, atk: 1.0 }, 'CS城の主の力、見せてやろう！ ひれ伏せ！',
        sp('DOPAPANCHI', [atk('one', 2.0)]),
        { bigMove: { name: 'DOPAPANCHI！！', every: 14, warn: 2.5, effects: [atk('all', 1.3, { element: 'ほのお' })] } }),
    sasaki: rival('sasaki', 'Mr.SASAKI', 'ふつう', 'supporter', 'C', { atk: 1.1 }, 'どうも、しご出来です。', sp('しめきり厳守', [atk('one', 1.8)])),
    kotani: rival('kotani', 'Mr.KOTANI', 'かぜ', 'jammer', 'C', { spd: 1.1 }, '勝率は計算済みです。', sp('計算どおり', [{ kind: 'status', target: 'all', status: 'slow', chance: 0.7 }])),
    ueno: rival('ueno', 'マッスルウエノーブル', 'ふつう', 'defender', 'B', { hp: 1.2, atk: 1.25 }, '我が筋肉の前にひれ伏すがよい！',
        sp('マッスルウエノクラッシュ', [atk('all', 1.3)]),
        { bigMove: { name: '筋肉 大解放！', every: 14, warn: 2.5, effects: [atk('all', 1.3, { element: 'ふつう' })] } }),
    shibata: rival('shibata', 'シバター', 'ふつう', 'attacker', 'C', {}, 'ぶんぶん！ 撮れ高いただき！ んなああ～', sp('撮れ高 ばっちり', [atk('one', 2.0)])),
    ikekimu: rival('ikekimu', 'イケキム', 'かぜ', 'attacker', 'C', { spd: 1.1 }, 'チッ…邪魔だ。', sp('暗殺術', [atk('one', 1.9)]))
};
export const RIVAL_LV = 17;
export const rivalTeam = version => RIVAL_TEAMS[version] || RIVAL_TEAMS.naitei;

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
export const unitArtKey = id => (NAKAMA[id] ? NAKAMA[id].art : BOSSES[id] ? BOSSES[id].art : RIVALS[id] ? RIVALS[id].art : id);
// なかま・こおりくん・ボス・ライバル探検隊の どれでも
export const unitOf = id => NAKAMA[id] || (id === HERO_ID ? HERO : null) || BOSSES[id] || RIVALS[id] || null;
