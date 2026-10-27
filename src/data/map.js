// =====================================================================
// 石の川タウン と 商店街 の 地図 (設計書 5.1。1 章の 舞台 + 段階 2 の 商店街)
// ---------------------------------------------------------------------
// 1 マス 16 ドット・48 × 60 マス。まんなかを 石の川が 南北に 流れ、石の川橋 だけで 東西が つながる。
// 1 章の あいだは 橋に ヌシ が いて 東へ 渡れない (ボスを たおすと 通れる)。
// 上の 36 マス (y 0〜35) が 石の川タウン、下 (y 36〜59) が 商店街 (2026-10-27)。
//   商店街へ 行く 道 (x 12・13 と 40・41 の 南の はし) は、1 章 クリアまで 工事中の さく (GATES) で 通れない
//
//   tiles[y][x]: G 草 / F 花 / T 木 / R 道 / W 川 / B 橋 / P 川原の 石ころ / S 公園の 砂 / K 石だたみ / A 駐車場
//   BUILDINGS: 家などの 建物 (通れない)。door は 調べる マス (建物の 下の まんなか)
//   SPOTS: レンズで さがす 場所 (設計書 5.2)。kinds の time は 出る 時間帯、weather: 'rain' は 雨の日だけ
// =====================================================================
export const TILE = 16;
export const MAP_W = 48, MAP_H = 60;
export const TOWN_H = 36;   // ここから 下が 商店街
export const BLOCK = new Set(['T', 'W']);

function build() {
    const t = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('G'));
    const fill = (x0, y0, x1, y1, c) => {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) t[y][x] = c;
    };
    // まわりは 木
    fill(0, 0, MAP_W - 1, 0, 'T'); fill(0, MAP_H - 1, MAP_W - 1, MAP_H - 1, 'T');
    fill(0, 0, 0, MAP_H - 1, 'T'); fill(MAP_W - 1, 0, MAP_W - 1, MAP_H - 1, 'T');
    // 神社 (北西) の 石だたみと、南の 木の 列
    fill(2, 2, 10, 9, 'K');
    fill(1, 10, 9, 10, 'T');
    // お寺 (北東) の 石だたみ
    fill(36, 2, 46, 10, 'K');
    // 石の川 と 川原
    fill(30, 1, 33, MAP_H - 2, 'W');
    fill(28, 1, 29, MAP_H - 2, 'P'); fill(34, 1, 35, MAP_H - 2, 'P');
    // 道 (たての 2 本は 商店街まで のびる)
    fill(1, 17, 27, 18, 'R'); fill(36, 17, 46, 18, 'R');
    fill(12, 2, 13, MAP_H - 2, 'R'); fill(40, 2, 41, MAP_H - 2, 'R');
    fill(14, 8, 27, 9, 'R');
    // 石の川橋
    fill(28, 17, 35, 18, 'B');
    // 公園・花だん・駐車場
    fill(16, 26, 26, 33, 'S');
    fill(16, 31, 18, 33, 'F');
    fill(2, 26, 9, 27, 'F');
    fill(2, 29, 9, 33, 'A');
    fill(36, 24, 39, 28, 'F');
    // 木 (川原・公園・東の 原っぱ)
    [[26, 12], [25, 13], [22, 13], [16, 26], [26, 33], [21, 30], [38, 14], [44, 14], [37, 31], [44, 30], [45, 22], [9, 14], [3, 14], [6, 15]]
        .forEach(([x, y]) => { t[y][x] = 'T'; });

    // ----- 商店街 (y 36〜58。段階 2) -----
    // さかいめの 木の 列 (道と 川だけ 通る。川原も ふさぐ)
    for (let x = 0; x < MAP_W; x++) if (![12, 13, 40, 41, 30, 31, 32, 33].includes(x)) t[TOWN_H - 1][x] = 'T';
    // 大通り (アーケード) と 商店街橋・うら通り
    fill(1, 46, 27, 47, 'R'); fill(36, 46, 46, 47, 'R');
    fill(28, 46, 35, 47, 'B');
    fill(1, 54, 27, 55, 'R'); fill(36, 54, 46, 55, 'R');
    // 広場 (屋台が 出る)・駐車場・花だん
    fill(14, 56, 26, 58, 'S');
    fill(42, 56, 46, 58, 'A');
    fill(2, 37, 9, 38, 'F'); fill(43, 37, 46, 38, 'F');
    [[3, 40], [8, 40], [24, 37], [37, 38], [46, 41], [2, 57], [9, 57], [37, 57]].forEach(([x, y]) => { t[y][x] = 'T'; });
    return t.map(row => row.join(''));
}
export const TILES = build();

// 建物 (マスの 座標)。label は 看板の 文字
export const BUILDINGS = [
    { id: 'home', label: 'こおりくんの家', x: 3, y: 20, w: 6, h: 4, wall: '#f0e0c0', roof: '#4a7ac0', door: { x: 6, y: 23 } },
    { id: 'dagashi', label: '駄菓子屋', x: 15, y: 20, w: 6, h: 4, wall: '#f8d8a0', roof: '#d05a3a', door: { x: 17, y: 23 } },
    { id: 'school', label: '石の川小学校', x: 15, y: 2, w: 10, h: 5, wall: '#f4f0e8', roof: '#8a6a4a', door: { x: 19, y: 6 } },
    { id: 'shrine', label: '石の川神社', x: 4, y: 2, w: 4, h: 3, wall: '#c84a3a', roof: '#3a3a40', door: { x: 5, y: 4 } },
    { id: 'toilet', label: 'トイレ', x: 24, y: 27, w: 2, h: 2, wall: '#d8e8f0', roof: '#5a8aa0', door: { x: 24, y: 28 } },
    { id: 'temple', label: '石の川寺', x: 42, y: 3, w: 5, h: 4, wall: '#a87a4a', roof: '#3a3a40', door: { x: 44, y: 6 } },
    // 商店街 (大通りの 北側・うら通りの 北側)
    { id: 'gamecenter', label: 'ゲームセンター', x: 2, y: 42, w: 6, h: 4, wall: '#f0d0f8', roof: '#8a3ac0', door: { x: 4, y: 45 } },
    { id: 'pachinkoAto', label: 'パチンコ店の跡', x: 15, y: 42, w: 6, h: 4, wall: '#c8c0c8', roof: '#6a5a6a', door: { x: 17, y: 45 } },
    { id: 'yaoya', label: '八百屋', x: 22, y: 42, w: 5, h: 4, wall: '#f8e8c0', roof: '#3a9a4a', door: { x: 24, y: 45 } },
    { id: 'omenya', label: 'お面屋', x: 36, y: 42, w: 4, h: 4, wall: '#f8e0d0', roof: '#c83a3a', door: { x: 37, y: 45 } },
    { id: 'kouban', label: '交番', x: 42, y: 42, w: 5, h: 4, wall: '#e8eef8', roof: '#3a4a8a', door: { x: 44, y: 45 } },
    { id: 'jansou', label: '雀荘ツモツモ', x: 2, y: 50, w: 5, h: 4, wall: '#d8f0d8', roof: '#2a6a3a', door: { x: 4, y: 53 } },
    { id: 'denkiya', label: '電気屋', x: 15, y: 50, w: 5, h: 4, wall: '#e0e8f8', roof: '#3a6ac8', door: { x: 17, y: 53 } },
    { id: 'honya', label: '本屋', x: 21, y: 50, w: 5, h: 4, wall: '#f8f0d8', roof: '#8a6a3a', door: { x: 23, y: 53 } },
    { id: 'karaoke', label: 'カラオケ', x: 36, y: 50, w: 4, h: 4, wall: '#f8d8e8', roof: '#d04a8a', door: { x: 37, y: 53 } },
    { id: 'sentou', label: '銭湯', x: 42, y: 50, w: 5, h: 4, wall: '#f0e8d8', roof: '#4a7ab0', door: { x: 44, y: 53 } }
];

// 商店街へ 行く 道の 工事中の さく (1 章 クリアまで 通れない。調べると わけが わかる)
export const GATES = [
    { id: 'gateW', x: 12, y: TOWN_H - 1, w: 2, only: 'beforeClear' },
    { id: 'gateE', x: 40, y: TOWN_H - 1, w: 2, only: 'beforeClear' }
];

// 動かない 飾り (通れない): 鳥居の 柱
export const PROPS = [
    { id: 'torii-l', kind: 'torii', x: 5, y: 9 },
    { id: 'torii-r', kind: 'torii', x: 8, y: 9 }
];

// 商店街の キャラの Lv (1 章 クリアの ころの なかまは Lv7〜9 くらい)
export const SHOUTENGAI_LV = [6, 10];

// かくれている キャラ (レンズで さがす。2026-10-26 ユーザー指定: ふだんの 画面でも「なにか へん」と わかるように 化けている)
//   x, y はマス。cue: ふだんの 画面に 出す 違和感の 絵 (view/field.js の drawCue)
//   レンズで 見つけると「○○を 見つけた！」→ その場に 出てくる → 話しかけると バトル
//   time: 出る 時間帯 / weather: 'rain' は 雨の日だけ / after: 'clear' は 1 章クリアのあとだけ
export const SPOTS = [
    { id: 'kawara', label: '川原の石ころ', x: 28, y: 11, cue: 'eyeStone', kinds: [{ id: 'ishikoron', w: 1 }] },
    { id: 'uraYama', label: '小学校の裏山のお地蔵さん', x: 25, y: 3, cue: 'jizoTail', kinds: [{ id: 'kawarimidanuki', w: 1 }] },
    { id: 'parking', label: '駐車場の車の下', x: 4, y: 31, cue: 'carNeedles', kinds: [{ id: 'haribaby', w: 1 }] },
    { id: 'hashiue', label: '橋のそばの川', x: 29, y: 15, cue: 'fishLine', kinds: [{ id: 'tsuribariuo', w: 1 }] },
    { id: 'shrineTree', label: '神社のくらがり', x: 2, y: 3, cue: 'nightEyes', kinds: [{ id: 'yofukashi', w: 1, time: ['night'] }] },
    { id: 'teraUra', label: 'お寺の裏', x: 37, y: 3, cue: 'candle', kinds: [{ id: 'rousokubi', w: 1, time: ['night'] }] },
    { id: 'hashishita', label: '橋の下', x: 28, y: 20, cue: 'glowEyes', kinds: [{ id: 'hashishita', w: 1, after: 'clear' }] },
    // 商店街 (lv: 出る Lv の はば)
    { id: 'tvMae', label: '電気屋の前の古いテレビ', x: 20, y: 53, cue: 'tvStatic', lv: SHOUTENGAI_LV, kinds: [{ id: 'burakrasher', w: 1 }] },
    { id: 'omenMae', label: 'お面屋の屋根の上', x: 37, y: 41, cue: 'maskEyes', lv: SHOUTENGAI_LV, kinds: [{ id: 'hannyamen', w: 1 }] },
    { id: 'jansouKanban', label: '雀荘の看板', x: 7, y: 53, cue: 'tileFlip', lv: SHOUTENGAI_LV, kinds: [{ id: 'hakupai', w: 1 }] },
    { id: 'neonKanban', label: '銭湯の裏のネオン看板', x: 46, y: 49, cue: 'nightEyes', lv: SHOUTENGAI_LV, kinds: [{ id: 'neontanuki', w: 1, time: ['evening', 'night'] }] },
    { id: 'gacha', label: '八百屋の横のガチャ', x: 27, y: 45, cue: 'gachaShake', lv: [8, 11], kinds: [{ id: 'gachapon', w: 1 }] }
];

// 見えている キャラが 歩きまわる 場所 (なかまの 大多数はこちら)。x0..x1, y0..y1 はマス。max: 同時に 出る 数。lv: 出る Lv の はば
export const ROAMS = [
    { id: 'kawakami', label: '夏の川上', x0: 25, y0: 1, x1: 29, y1: 5, max: 1, kinds: [{ id: 'soumennagare', w: 1 }] },
    { id: 'kawaraN', label: '川原 (北)', x0: 28, y0: 6, x1: 29, y1: 15, max: 1, kinds: [{ id: 'mizukirin', w: 1 }] },
    { id: 'kawaraS', label: '川原 (南)', x0: 28, y0: 19, x1: 29, y1: 33, max: 2, kinds: [{ id: 'kogame', w: 2 }, { id: 'kozarappa', w: 2 }, { id: 'shinobigaeru', w: 3, weather: 'rain' }] },
    { id: 'riverTree', label: '川原の木のあたり', x0: 21, y0: 10, x1: 27, y1: 15, max: 1, kinds: [{ id: 'donguriko', w: 1 }] },
    { id: 'ishigaki', label: '神社の石垣', x0: 9, y0: 2, x1: 11, y1: 8, max: 1, kinds: [{ id: 'tsutankobu', w: 1 }] },
    { id: 'shoutengai', label: '商店のあたり', x0: 14, y0: 16, x1: 23, y1: 19, max: 2, kinds: [{ id: 'kunaisuzume', w: 1 }, { id: 'pekorisu', w: 1 }] },
    { id: 'kadan', label: '花だん', x0: 2, y0: 25, x1: 10, y1: 27, max: 1, kinds: [{ id: 'mumenbachi', w: 1 }] },
    { id: 'park', label: '公園', x0: 17, y0: 27, x1: 23, y1: 32, max: 2, kinds: [{ id: 'nemuridake', w: 1 }, { id: 'nemuridake', w: 2, time: ['night'] }, { id: 'daichouenkin', w: 1 }] },
    { id: 'temple', label: 'お寺', x0: 36, y0: 7, x1: 46, y1: 10, max: 1, kinds: [{ id: 'mokugyoro', w: 1 }] },
    { id: 'eastField', label: '東の原っぱ', x0: 36, y0: 20, x1: 46, y1: 30, max: 1, kinds: [{ id: 'mumenbachi', w: 1 }, { id: 'donguriko', w: 1 }] },
    // 商店街 (夕方・夜に ふえる。ヤタイマンは 夜の 屋台だけ)
    { id: 'arcadeW', label: '商店街の大通り', x0: 1, y0: 45, x1: 27, y1: 47, max: 2, lv: SHOUTENGAI_LV, kinds: [{ id: 'spamdama', w: 2 }, { id: 'kinmenkoinu', w: 2 }, { id: 'saikoron', w: 1 }] },
    { id: 'arcadeE', label: '商店街の大通り (東)', x0: 36, y0: 45, x1: 46, y1: 47, max: 1, lv: SHOUTENGAI_LV, kinds: [{ id: 'netkozou', w: 2 }, { id: 'makibishimushi', w: 1 }] },
    { id: 'pachinkoMae', label: 'パチンコ店の跡の前', x0: 14, y0: 37, x1: 21, y1: 41, max: 1, lv: SHOUTENGAI_LV, kinds: [{ id: 'pachinkodaman', w: 2 }, { id: 'richibou', w: 1 }] },
    { id: 'backW', label: 'うら通り', x0: 1, y0: 54, x1: 27, y1: 55, max: 2, lv: SHOUTENGAI_LV, kinds: [{ id: 'gomibakon', w: 2 }, { id: 'yopparaigarasu', w: 2, time: ['evening', 'night'] }, { id: 'maikumbo', w: 1 }] },
    { id: 'hiroba', label: '商店街の広場', x0: 14, y0: 56, x1: 26, y1: 58, max: 2, lv: SHOUTENGAI_LV, kinds: [{ id: 'popupn', w: 2 }, { id: 'hoshikuzun', w: 2, time: ['night'] }, { id: 'chouchinbura', w: 2, time: ['evening', 'night'] }, { id: 'yataiman', w: 1, time: ['night'] }] },
    { id: 'backE', label: 'うら通り (東)', x0: 36, y0: 54, x1: 46, y1: 55, max: 1, lv: SHOUTENGAI_LV, kinds: [{ id: 'neonkurage', w: 2, time: ['evening', 'night'] }, { id: 'maikumbo', w: 1 }] },
    { id: 'parkingS', label: '商店街の駐車場', x0: 42, y0: 56, x1: 46, y1: 58, max: 1, lv: SHOUTENGAI_LV, kinds: [{ id: 'gomibakon', w: 1 }, { id: 'makibishimushi', w: 1 }] }
];

// 話せる キャラ (2026-10-28 ユーザー指定: 町の キャラは、戦える キャラに 赤い「！」が つき、
//   なにも ついていない キャラは 話しかけると 会話や 道具を くれる)。ウォッチを もらうと 見える。
//   kind: なかまの 絵と 名前 / x0..y1: 歩きまわる はんい (マス) / lines: 話す こと / gift: 1 日 1 回 くれる 道具
//   after: 'clear' は 1 章 クリアの あとだけ
export const FRIENDS = [
    { id: 'f_kogame', kind: 'kogame', label: '川原 (南)', x0: 28, y0: 24, x1: 29, y1: 31,
        lines: ['……（ひなたぼっこ中）', 'あ、こおりくん。川で きゅうりを ひろったから あげる。'], gift: { item: 'kyuuri', n: 1 } },
    { id: 'f_pekorisu', kind: 'pekorisu', label: '駄菓子屋の前', x0: 14, y0: 24, x1: 21, y1: 25,
        lines: ['駄菓子屋の おばあちゃんが メロンパンを おまけ してくれたんだ。', 'ひとつ あげる！ ……今日だけだぞ！'], gift: { item: 'melonpan', n: 1 } },
    // 会話だけの キャラ (2026-10-28 ユーザー指定: 道具は くれず、ゲームの ヒントや 町の 話を する)
    { id: 'f_donguriko', kind: 'donguriko', label: '神社', x0: 3, y0: 6, x1: 9, y1: 8,
        lines: ['コロコロ～。夜の 神社には、目が 光る なにかが いるらしいよ……。', 'レンズで のぞいて みたら？'] },
    { id: 'f_ishikoron', kind: 'ishikoron', label: '川原 (北)', x0: 28, y0: 12, x1: 29, y1: 15,
        lines: ['むかし この 川には 丸い 石が いっぱい あって、それで「石の川」って 名前に なったんだぞ。', '……つまり おれが この 町の 由来だ。ふむなよ。'] },
    { id: 'f_nemuridake', kind: 'nemuridake', label: '公園', x0: 18, y0: 28, x1: 23, y1: 31,
        lines: ['ふぁ～……。バトルで おやつを 投げると、なかまに なりやすいんだって……。', '好物だと もっと なりやすい……。好物は メニューの 図鑑に 書いてあるよ……ぐう。'] },
    { id: 'f_kunaisuzume', kind: 'kunaisuzume', label: '小学校の前', x0: 15, y0: 7, x1: 24, y1: 7,
        lines: ['チュンッ！ 大きな 相手が 力を ためたら、ウォッチの 輪を 回して、守りの 強い なかまを 前に 出すんだ！', 'ねると 時間が 進むよ。夜にしか 出ない キャラも いるんだって。'] },
    { id: 'f_saikoron', kind: 'saikoron', label: '商店街の大通り (はし)', x0: 2, y0: 48, x1: 10, y1: 49,
        lines: ['ころころ～。むかしは パチンコ店が にぎやかで、ジャラジャラ 音が 毎日 聞こえたんだ。', 'さいきん、ゲームセンターの まわりで 鬼みたいな 影を 見たって うわさだよ。'] },
    { id: 'f_mokugyoro', kind: 'mokugyoro', label: 'お寺', x0: 37, y0: 8, x1: 45, y1: 9, after: 'clear',
        lines: ['ポク……。夜に なると お寺の 裏で、ろうそくが ひとりでに ゆれるんじゃ。', 'これでも 食べて 元気を だしなさい。'], gift: { item: 'onigiri', n: 1 } },
    { id: 'f_kinmenkoinu', kind: 'kinmenkoinu', label: '交番の前', x0: 42, y0: 48, x1: 46, y1: 49,
        lines: ['ワン！ 八百屋の 横の ガチャ、ときどき ひとりでに ガタガタ ゆれるんだって。', 'これ、きんピカの チョコ。あげる！'], gift: { item: 'choco', n: 1 } },
    { id: 'f_gomibakon', kind: 'gomibakon', label: '商店街の広場', x0: 20, y0: 56, x1: 26, y1: 58,
        lines: ['もえるゴミは 火曜日！ ……あ、まだ 飲める サイダーが すててあった。', 'もったいないから あげる。'], gift: { item: 'cider', n: 1 } }
];

// 人 (通れない)。art は 絵の 名前。only: そのときだけ いる
export const PEOPLE = [
    { id: 'mama', name: 'ともいし', art: 'tomoishi', x: 8, y: 24 },
    { id: 'furukawaShrine', name: 'ふるカワ', art: 'furukawa', x: 7, y: 6, only: 'beforeWatch' },
    { id: 'nushi', name: 'ヌシ', art: 'hashishita', x: 31, y: 17, h: 2, only: 'beforeClear', scale: 2 }
];

// こおりくんが 始める 場所 (家の 前)
export const START = { x: 6, y: 24 };

export const tileAt = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? 'T' : TILES[y][x]);
// その マスの 地区 (設計書 5.1)
export const areaAt = (x, y) => (y >= TOWN_H ? 'shoutengai' : 'ishinokawa');
