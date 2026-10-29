// =====================================================================
// 石の川タウン と 商店街 と 石の川小学校の 中 と 山と ダム の 地図 (設計書 5.1。1 章の 舞台 + 段階 2 の 商店街 + 2 章の 学校 + 3 章の 山)
// ---------------------------------------------------------------------
// 1 マス 16 ドット・48 × 120 マス。まんなかを 石の川が 南北に 流れ、石の川橋 だけで 東西が つながる。
// 1 章の あいだは 橋に ヌシ が いて 東へ 渡れない (ボスを たおすと 通れる)。
// 上の 36 マス (y 0〜35) が 石の川タウン、下 (y 36〜59) が 商店街 (2026-10-27)。
//   商店街へ 行く 道 (x 12・13 と 40・41 の 南の はし) は、1 章 クリアまで 工事中の さく (GATES) で 通れない
// いちばん 下 (y 60〜83) は 石の川小学校の 中 (2 章。2026-10-28)。町とは つながって いなくて、小学校の 入り口から 入る
//   (夕方・夜だけ 開く)。げた箱の マット (M) に のると 外に 出る
// その 下 (y 84〜119) は 山と ダム (3 章。2026-10-29)。町の 北の はしの 山道の 入り口 (U。2 章 クリアまで 通行止め) から 入る。
//   山の 南の はしの U に のると 町に もどる
// いちばん 下 (y 120〜155) は 海辺の 町と 浦の島の海岸どうくつ (4 章。2026-10-29)。商店街の 石の川駅から 電車で 行く
//   (3 章 クリアの あと ともいしと 話してから)。海辺駅から 電車で もどる
//
//   tiles[y][x]: G 草 / F 花 / T 木 / R 道 / W 川 / B 橋 / P 川原の 石ころ / S 公園の 砂 / K 石だたみ / A 駐車場
//                学校: L 木の ゆか / X かべ / Y プールサイド / M げた箱の マット (W は プールの 水)
//                山: U 山道の 入り口 / H 畑 / N 雪 / Q ダムの かべ / D かれた 沢 / E 水が 消えた 湖の 底 / I 氷の 城
//                    (D・E・I は 3 章 クリアで 水に もどって 通れなくなる。world.js の blockedTile)
//                海: J 岩の がけ / C どうくつの ゆか (S 浜辺・W 海・B 桟橋・P 浜の 岩場 は 町と 同じ)
//   BUILDINGS: 家などの 建物 (通れない)。door は 調べる マス (建物の 下の まんなか)
//   SPOTS: レンズで さがす 場所 (設計書 5.2)。kinds の time は 出る 時間帯、weather: 'rain' は 雨の日だけ
// =====================================================================
export const TILE = 16;
export const MAP_W = 48, MAP_H = 156;
export const TOWN_H = 36;       // ここから 下が 商店街
export const SCHOOL_Y0 = 60;    // ここから 下が 小学校の 中
export const YAMA_Y0 = 84;      // ここから 下が 山と ダム
export const UMI_Y0 = 120;      // ここから 下が 海辺の 町と 浦の島の海岸どうくつ (4 章)
export const BLOCK = new Set(['T', 'W', 'X', 'Q', 'I', 'J']);
export const WET = new Set(['D', 'E', 'I']);   // 3 章 クリアで 水に もどる マス

function build() {
    const t = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('G'));
    const fill = (x0, y0, x1, y1, c) => {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) t[y][x] = c;
    };
    // まわりは 木
    fill(0, 0, MAP_W - 1, 0, 'T'); fill(0, SCHOOL_Y0 - 1, MAP_W - 1, SCHOOL_Y0 - 1, 'T');
    fill(0, 0, 0, SCHOOL_Y0 - 1, 'T'); fill(MAP_W - 1, 0, MAP_W - 1, SCHOOL_Y0 - 1, 'T');
    // 神社 (北西) の 石だたみと、南の 木の 列
    fill(2, 2, 10, 9, 'K');
    fill(1, 10, 9, 10, 'T');
    // お寺 (北東) の 石だたみ
    fill(36, 2, 46, 10, 'K');
    // 石の川 と 川原
    fill(30, 1, 33, SCHOOL_Y0 - 2, 'W');
    fill(28, 1, 29, SCHOOL_Y0 - 2, 'P'); fill(34, 1, 35, SCHOOL_Y0 - 2, 'P');
    // 道 (たての 2 本は 商店街まで のびる)
    fill(1, 17, 27, 18, 'R'); fill(36, 17, 46, 18, 'R');
    fill(12, 2, 13, SCHOOL_Y0 - 2, 'R'); fill(40, 2, 41, SCHOOL_Y0 - 2, 'R');
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

    // ----- 石の川小学校の 中 (y 60〜83。2 章) -----
    //   北: 理科室・音楽室・図書室・校長室 (y 61〜67) / ろうか (y 69〜71) / 南: おどり場・体育館・プール (y 73〜82)
    fill(0, SCHOOL_Y0, MAP_W - 1, YAMA_Y0 - 1, 'X');
    fill(1, 61, 10, 67, 'L'); fill(12, 61, 21, 67, 'L'); fill(23, 61, 32, 67, 'L'); fill(34, 61, 46, 67, 'L');
    fill(1, 69, 46, 71, 'L');
    fill(1, 73, 10, 82, 'L'); fill(12, 73, 30, 82, 'L'); fill(32, 73, 46, 82, 'Y');
    fill(35, 76, 44, 81, 'W');
    // 教室の 入り口 (かべの すきま)
    [5, 16, 27, 40].forEach(x => fill(x, 68, x + 1, 68, 'L'));
    [5, 20, 38].forEach(x => fill(x, 72, x + 1, 72, 'L'));
    // げた箱の マット (のると 外へ)
    fill(23, 72, 24, 72, 'M');

    // ----- 山と ダム (y 84〜119。3 章「ダムの水が消える」) -----
    //   西: 奥の院 (北) と 森の 原っぱ・山の畑 (南) / まんなか: 山道と かれた 沢 / 北: ダム (水が 消えた 湖の 底と 氷の 城) / 東: 雪渓と 岩場
    const Y = YAMA_Y0;
    fill(0, Y, MAP_W - 1, MAP_H - 1, 'T');
    fill(3, Y + 2, 13, Y + 11, 'K');                                   // 奥の院の 石だたみ
    fill(3, Y + 20, 22, Y + 33, 'G');                                  // 森の 原っぱ
    fill(5, Y + 26, 10, Y + 29, 'H');                                  // 山の畑
    fill(14, Y + 30, 18, Y + 32, 'F');
    fill(20, Y + 1, 45, Y + 11, 'E');                                  // 水が 消えた 湖の 底
    fill(30, Y + 1, 35, Y + 4, 'I');                                   // 氷の 城
    fill(20, Y + 12, 45, Y + 12, 'Q');                                 // ダムの かべ
    fill(29, Y + 13, 29, Y + 33, 'P'); fill(33, Y + 13, 33, Y + 33, 'P');
    fill(30, Y + 13, 32, Y + 33, 'D');                                 // かれた 沢
    fill(38, Y + 14, 46, Y + 20, 'N');                                 // 雪渓
    fill(38, Y + 21, 46, Y + 31, 'P');                                 // 岩場
    fill(23, Y + 14, 24, Y + 33, 'R');                                 // 山道
    fill(8, Y + 14, 37, Y + 15, 'R');
    fill(8, Y + 12, 9, Y + 13, 'R');
    fill(36, Y + 12, 37, Y + 13, 'R');                                 // ダムの かべの 階段
    fill(29, Y + 14, 33, Y + 15, 'B');                                 // 沢の 橋
    fill(23, Y + 34, 24, Y + 34, 'U');                                 // 町へ もどる 入り口
    [[6, Y + 22], [12, Y + 24], [19, Y + 21], [4, Y + 31], [21, Y + 27], [41, Y + 24], [44, Y + 28]].forEach(([x, y]) => { t[y][x] = 'T'; });
    // 町の 北の はしの 山道の 入り口 (2 章 クリアまで 通行止め)
    fill(26, 0, 27, 0, 'U');

    // ----- 海辺の 町と 浦の島の海岸どうくつ (y 120〜155。4 章「海辺の どうくつと ライバル探検隊」) -----
    //   北西: 海辺駅と 家 / まんなか: 浜辺と 海の家・桟橋 / 南: 海 / 東: 岩の がけの 中に 海岸どうくつ
    //   どうくつ: 入り口 → ひろい しおだまり → 北へ 1 マスの せまい 通路 (ライバル探検隊が ふさぐ) → いちばん 奥 (ボス)
    const O = UMI_Y0;
    fill(0, O, MAP_W - 1, MAP_H - 1, 'T');
    fill(1, O + 1, 29, O + 17, 'G');                                   // 町の 原っぱ
    fill(9, O + 7, 14, O + 8, 'F');
    fill(4, O + 5, 5, O + 17, 'R');                                    // 駅から 浜辺への 道
    fill(1, O + 11, 29, O + 12, 'R');                                  // どうくつへの 道
    fill(1, O + 18, 29, O + 25, 'S');                                  // 浜辺
    fill(26, O + 19, 29, O + 25, 'P');                                 // 浜の 岩場
    fill(1, O + 26, MAP_W - 2, MAP_H - 1, 'W');                        // 海
    fill(12, O + 22, 13, O + 30, 'B');                                 // 桟橋
    fill(30, O + 1, MAP_W - 1, O + 25, 'J');                           // 岩の がけ
    fill(30, O + 11, 32, O + 12, 'C');                                 // どうくつの 入り口
    fill(32, O + 8, 40, O + 19, 'C');                                  // しおだまりの 広間
    fill(34, O + 14, 35, O + 15, 'W'); fill(38, O + 17, 39, O + 18, 'W');
    fill(39, O + 3, 39, O + 7, 'C');                                   // せまい 通路
    fill(40, O + 1, 45, O + 6, 'C');                                   // いちばん 奥
    [[3, O + 15], [8, O + 14], [26, O + 15], [27, O + 3], [15, O + 15]].forEach(([x, y]) => { t[y][x] = 'T'; });
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
    { id: 'sentou', label: '銭湯', x: 42, y: 50, w: 5, h: 4, wall: '#f0e8d8', roof: '#4a7ab0', door: { x: 44, y: 53 } },
    // 商店街の 西の はしの 駅 (4 章。電車で 海辺の 町へ)
    { id: 'station', label: '石の川駅', x: 2, y: 37, w: 6, h: 4, wall: '#e8e0d0', roof: '#3a5a8a', door: { x: 5, y: 40 } },
    // 山 (3 章)
    { id: 'okunoin', label: '奥の院', x: 6, y: YAMA_Y0 + 3, w: 4, h: 3, wall: '#c84a3a', roof: '#3a3a40', door: { x: 7, y: YAMA_Y0 + 5 } },
    // 海辺の 町 (4 章)
    { id: 'umiStation', label: '海辺駅', x: 2, y: UMI_Y0 + 1, w: 6, h: 4, wall: '#f0f0e8', roof: '#3a8ab0', door: { x: 5, y: UMI_Y0 + 4 } },
    { id: 'umiHouse', label: '漁師の家', x: 9, y: UMI_Y0 + 2, w: 5, h: 4, wall: '#e8d8b8', roof: '#4a6a8a', door: { x: 11, y: UMI_Y0 + 5 } },
    { id: 'tsuriguya', label: '釣具屋', x: 16, y: UMI_Y0 + 2, w: 5, h: 4, wall: '#f0e8d0', roof: '#c85a3a', door: { x: 18, y: UMI_Y0 + 5 } },
    { id: 'uminoie', label: '海の家', x: 20, y: UMI_Y0 + 14, w: 5, h: 4, wall: '#f8f0d8', roof: '#e85a7a', door: { x: 22, y: UMI_Y0 + 17 } }
];

// 商店街へ 行く 道の 工事中の さく (1 章 クリアまで 通れない。調べると わけが わかる)
export const GATES = [
    { id: 'gateW', x: 12, y: TOWN_H - 1, w: 2, only: 'beforeClear' },
    { id: 'gateE', x: 40, y: TOWN_H - 1, w: 2, only: 'beforeClear' },
    // 山道 (2 章 クリアまで 通れない。3 章)
    { id: 'gateYama', x: 26, y: 0, w: 2, only: 'beforeClear2', label: '通行止め' }
];

// 動かない 飾り (通れない): 鳥居の 柱
export const PROPS = [
    { id: 'torii-l', kind: 'torii', x: 5, y: 9 },
    { id: 'torii-r', kind: 'torii', x: 8, y: 9 }
];

// 商店街の キャラの Lv (1 章 クリアの ころの なかまは Lv7〜9 くらい)
export const SHOUTENGAI_LV = [6, 10];
// 小学校の 中の キャラの Lv (2 章)
export const SCHOOL_LV = [9, 13];
// 山の キャラの Lv (3 章)
export const YAMA_LV = [12, 16];
// 海辺の 町の キャラの Lv (4 章)。どうくつの 中は 少し 強い
export const UMI_LV = [15, 18];
export const CAVE_LV = [17, 20];

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
    { id: 'gacha', label: '八百屋の横のガチャ', x: 27, y: 45, cue: 'gachaShake', lv: [8, 11], kinds: [{ id: 'gachapon', w: 1 }] },
    // 山 (3 章)
    { id: 'okunoinNoki', label: '奥の院の のき下', x: 11, y: YAMA_Y0 + 4, cue: 'nightEyes', lv: YAMA_LV, kinds: [{ id: 'tsuraracomori', w: 1 }] },
    { id: 'hatakeDaikon', label: '山の畑の 大根', x: 9, y: YAMA_Y0 + 27, cue: 'leafShake', lv: YAMA_LV, kinds: [{ id: 'mandoragon', w: 1 }] },
    // 海辺の 町と どうくつ (4 章)
    { id: 'hamaSuna', label: '浜辺の 砂の 中', x: 8, y: UMI_Y0 + 21, cue: 'sandBubbles', lv: UMI_LV, kinds: [{ id: 'tamatebakogani', w: 1 }] },
    { id: 'shiodamari', label: 'どうくつの しおだまり', x: 36, y: UMI_Y0 + 15, cue: 'tidePool', lv: CAVE_LV, kinds: [{ id: 'isoginchakku', w: 1 }] }
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
    { id: 'parkingS', label: '商店街の駐車場', x0: 42, y0: 56, x1: 46, y1: 58, max: 1, lv: SHOUTENGAI_LV, kinds: [{ id: 'gomibakon', w: 1 }, { id: 'makibishimushi', w: 1 }] },
    // 石の川小学校の 中 (2 章)。七不思議の キャラは 2 章 クリアの あと (clear2) から 歩きまわる (なかまに しそこねても また 会える)
    { id: 'kouchou', label: '校長室', x0: 35, y0: 62, x1: 45, y1: 66, max: 1, lv: SCHOOL_LV, kinds: [{ id: 'yoroinukegara', w: 1 }] },
    { id: 'rouka', label: '学校の ろうか', x0: 2, y0: 69, x1: 44, y1: 71, max: 1, lv: SCHOOL_LV, kinds: [{ id: 'fusaiyougaikotsu', w: 1, after: 'clear2' }, { id: 'wasurekurage', w: 1, after: 'clear2' }, { id: 'mikazukibat', w: 1, after: 'clear2' }, { id: 'lunashadow', w: 1, after: 'clear2', time: ['night'] }] },
    { id: 'taiikukan', label: '体育館', x0: 13, y0: 74, x1: 29, y1: 81, max: 1, lv: SCHOOL_LV, kinds: [{ id: 'proteingolem', w: 1, after: 'clear2' }, { id: 'takaramimic', w: 1, after: 'clear2' }, { id: 'mirrormuscle', w: 1, after: 'clear2' }] },
    { id: 'poolside', label: 'プールサイド', x0: 32, y0: 73, x1: 46, y1: 74, max: 1, lv: SCHOOL_LV, kinds: [{ id: 'umibozun', w: 1, after: 'clear2' }] },
    // 山と ダム (3 章)。封印を まもる キャラは 3 章 クリアの あと (clear3) から 歩きまわる。湖の 底は 3 章 クリアで 水に しずむ
    { id: 'yamaMori', label: '森の 原っぱ', x0: 3, y0: YAMA_Y0 + 20, x1: 22, y1: YAMA_Y0 + 33, max: 2, lv: YAMA_LV, kinds: [{ id: 'haetorigusan', w: 2 }, { id: 'obakekabocha', w: 2, time: ['evening', 'night'] }, { id: 'kokemusha', w: 1, after: 'clear3' }] },
    { id: 'yamaHatake', label: '山の畑', x0: 5, y0: YAMA_Y0 + 26, x1: 10, y1: YAMA_Y0 + 29, max: 1, lv: YAMA_LV, kinds: [{ id: 'obakekabocha', w: 1 }] },
    { id: 'sekkei', label: '雪渓', x0: 38, y0: YAMA_Y0 + 14, x1: 46, y1: YAMA_Y0 + 20, max: 2, lv: YAMA_LV, kinds: [{ id: 'yukimidango', w: 2 }, { id: 'fubukipenguin', w: 2 }, { id: 'koorinokagami', w: 1, after: 'clear3' }, { id: 'koorimodokishin', w: 1, after: 'clear3', time: ['night'] }] },
    { id: 'iwaba', label: '岩場', x0: 38, y0: YAMA_Y0 + 21, x1: 46, y1: YAMA_Y0 + 31, max: 1, lv: YAMA_LV, kinds: [{ id: 'koorimodoki', w: 2 }, { id: 'yukidarumuscle', w: 1, after: 'clear3' }, { id: 'hyougaryu', w: 1, after: 'clear3', time: ['night'] }] },
    { id: 'kosho', label: '湖の 底', x0: 20, y0: YAMA_Y0 + 6, x1: 45, y1: YAMA_Y0 + 11, max: 1, lv: YAMA_LV, kinds: [{ id: 'koorimodoki', w: 1 }] },
    // 海辺の 町と 浦の島の海岸どうくつ (4 章)。浦の島重蔵は 4 章 クリアの あと (clear4) どうくつの 奥に いる
    { id: 'umiMachi', label: '海辺の 町の 通り', x0: 1, y0: UMI_Y0 + 6, x1: 28, y1: UMI_Y0 + 12, max: 1, lv: UMI_LV, kinds: [{ id: 'asedakku', w: 1 }] },
    { id: 'hamabe', label: '浜辺', x0: 1, y0: UMI_Y0 + 18, x1: 25, y1: UMI_Y0 + 25, max: 2, lv: UMI_LV, kinds: [{ id: 'asedakku', w: 2 }, { id: 'uniharry', w: 2 }, { id: 'otohimedai', w: 1 }] },
    { id: 'sanbashi', label: '桟橋', x0: 12, y0: UMI_Y0 + 22, x1: 13, y1: UMI_Y0 + 30, max: 1, lv: UMI_LV, kinds: [{ id: 'otohimedai', w: 2 }, { id: 'umibozuou', w: 1, time: ['night'] }] },
    { id: 'caveHiroma', label: 'しおだまりの 広間', x0: 32, y0: UMI_Y0 + 8, x1: 40, y1: UMI_Y0 + 19, max: 2, lv: CAVE_LV, kinds: [{ id: 'nakatadraco', w: 2 }, { id: 'uniharry', w: 1 }, { id: 'otohimedai', w: 1 }, { id: 'ryuuguudai', w: 1, time: ['evening', 'night'] }] },
    { id: 'caveOku', label: 'どうくつの いちばん 奥', x0: 40, y0: UMI_Y0 + 1, x1: 45, y1: UMI_Y0 + 6, max: 1, lv: CAVE_LV, kinds: [{ id: 'urashima', w: 1, after: 'clear4' }, { id: 'ryuuguudai', w: 1, after: 'clear4' }] }
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
    { id: 'nushi', name: 'ヌシ', art: 'hashishita', x: 31, y: 17, h: 2, only: 'beforeClear', scale: 2 },
    // 2 章: 七不思議を 7 つ たしかめると、ろうかの おくに 8 つ目の ふしぎ (ボス) が 出る
    { id: 'kage', name: 'ろうかの カゲ', art: 'lunashadow', x: 9, y: 70, only: 'kage', scale: 2 },
    // 3 章: 氷の 封印を 3 つ とくと、氷の 城の 前に ダムの主 (ボス・ヒョウガリュウ) が 出る
    { id: 'damNushi', name: 'ダムの主', art: 'hyougaryu', x: 32, y: YAMA_Y0 + 6, h: 2, only: 'damNushi', scale: 2 },
    // 4 章: ライバル探検隊の リーダーが どうくつの せまい 通路を ふさぐ (バージョンで ちがう。artBy・nameBy)。
    //   勝つと 通れる。いちばん 奥には 黒い 紋に とりつかれた 浦の島重蔵 (ボス)
    { id: 'rival4', name: '探検隊の リーダー', nameBy: { naitei: 'KING.ASAHARA', menkyo: 'マッスルウエノーブル' }, artBy: { naitei: 'asahara', menkyo: 'ueno' }, x: 39, y: UMI_Y0 + 7, only: 'rival4' },
    { id: 'urashima4', name: '浦の島重蔵', art: 'urashima', x: 43, y: UMI_Y0 + 1, h: 2, only: 'urashima4', scale: 1.5 }
];

// こおりくんが 始める 場所 (家の 前)
export const START = { x: 6, y: 24 };

// ----- 石の川小学校の 中 (2 章「学校の七不思議」。2026-10-28) -----
// 入ると ろうかの げた箱の 前 (SCHOOL_IN)。マットに のると 小学校の 入り口の 前 (SCHOOL_OUT) に 出る
export const SCHOOL_IN = { x: 23.5, y: 70, dir: 'up' };
export const SCHOOL_OUT = { x: 19, y: 7, dir: 'down' };
export const SCHOOL_OPEN = [2, 3];     // 開いている 時間帯 (夕方・夜)
// 教室の 名札 (x, y はマス。かべの 上に 出す)
export const SCHOOL_ROOMS = [
    { id: 'rika', label: '理科室', x: 5.5, y: 61 },
    { id: 'ongaku', label: '音楽室', x: 16.5, y: 61 },
    { id: 'tosho', label: '図書室', x: 27.5, y: 61 },
    { id: 'kouchou', label: '校長室', x: 40, y: 61 },
    { id: 'odoriba', label: 'おどり場', x: 5.5, y: 73 },
    { id: 'taiiku', label: '体育館', x: 21, y: 73 },
    { id: 'pool', label: 'プール', x: 39.5, y: 73 },
    { id: 'getabako', label: 'げた箱', x: 24, y: 71.2 }
];
// 七不思議: 調べると 正体の キャラと バトル。勝つと たしかめた ことに なる (g.mysteries)。7 つ たしかめると 8 つ目 (ボス) が 出る
//   x, y: 調べる 物の マス (通れない)。lines: 調べた ときの 文。done: たしかめた あとに 調べた ときの 文
export const MYSTERIES = [
    { id: 'rika', label: '理科室の 動く ガイコツ', x: 3, y: 62, prop: 'skeleton', nakama: 'fusaiyougaikotsu', lv: 10,
        lines: ['ガイコツの 標本が ある。……いま、こっちを 見た？', 'カタカタカタ……！ 標本が 動きだした！'], done: 'ふつうの 標本だ。もう 動かない。' },
    { id: 'ongaku', label: '音楽室で 夜中に 鳴る 音', x: 18, y: 62, prop: 'piano', nakama: 'mikazukibat', lv: 10,
        lines: ['だれも いないのに、ピアノの 中から キーキー 音が する……。', 'ふたを あけたら、なにかが 飛びだしてきた！'], done: 'ピアノは しずかだ。' },
    { id: 'tosho', label: '図書室の わすれられた 本', x: 30, y: 62, prop: 'books', nakama: 'wasurekurage', lv: 10,
        lines: ['読んだ 人が 中身を ぜんぶ わすれる、という 本が ある。', '……あれ？ なにを しに 来たんだっけ？ 本の すきまから なにかが ふわふわ 出てきた！'], done: 'ふつうの 本だ。ちゃんと おぼえて いられる。' },
    { id: 'kagami', label: 'おどり場の 大鏡', x: 5, y: 74, prop: 'mirror', nakama: 'mirrormuscle', lv: 11,
        lines: ['夜中に のぞくと、ちがう 自分が うつる という 大鏡。', '鏡の 中の こおりくんが、ムキムキの ポーズを とっている！'], done: 'こおりくんが うつっている。ふつうの 鏡だ。' },
    { id: 'souko', label: '体育倉庫の かけ声', x: 28, y: 80, prop: 'crates', nakama: 'proteingolem', lv: 11,
        lines: ['体育倉庫から「ふんっ！ ふんっ！」と かけ声が 聞こえる。', 'とびばこの うしろで、だれかが 筋トレを している！'], done: 'とびばこが きちんと ならんでいる。' },
    { id: 'locker', label: '開かずの ロッカー', x: 46, y: 70, prop: 'locker', nakama: 'takaramimic', lv: 11,
        lines: ['ずっと 開かない という そうじ用具入れ。', 'カギは かかって いない……。あけた しゅんかん、ロッカーが かみついてきた！'], done: 'ほうきと ちりとりが 入っている。' },
    { id: 'pool', label: 'プールの 手', x: 39, y: 75, prop: 'ladder', nakama: 'umibozun', lv: 12,
        lines: ['夜の プールから 手が 出てきて、足を つかむ という うわさ。', 'ザバァ！ 水の 中から 大きな 黒い 頭が 出てきた！'], done: 'しずかな 水面に 月が うつっている。' }
];

// ----- 山と ダム (3 章「ダムの水が消える」。2026-10-29) -----
// 町の 北の はしの 山道 (U) に のると 山の 南の はし (YAMA_IN) へ。山の U に のると 町 (YAMA_OUT) へ
export const YAMA_IN = { x: 23.5, y: YAMA_Y0 + 32, dir: 'up' };
export const YAMA_OUT = { x: 26.5, y: 1, dir: 'down' };
// ボスに 勝った あと (湖に 水が もどるので ダムの かべの 階段に 立つ)
export const YAMA_AFTER_BOSS = { x: 36.5, y: YAMA_Y0 + 13, dir: 'up' };
// 地図の 名札
export const YAMA_PLACES = [
    { id: 'okunoin', label: '奥の院', x: 8, y: YAMA_Y0 + 2 },
    { id: 'dam', label: 'ダム', x: 32.5, y: YAMA_Y0 + 9 },
    { id: 'sekkei', label: '雪渓', x: 42, y: YAMA_Y0 + 16 },
    { id: 'hatake', label: '山の畑', x: 7.5, y: YAMA_Y0 + 25 },
    { id: 'iwaba', label: '岩場', x: 42, y: YAMA_Y0 + 26 }
];
// 氷の 封印 (3 章): 奥の院で 言いつたえを 読むと 調べられる。調べると 封印を まもる キャラと バトル。
//   勝つと 封印が とける (g.mysteries に 入る。七不思議と 同じ しくみ)。3 つ とくと 氷の 城の 前に ボスが 出る
export const SEALS = [
    { id: 'sealMori', label: '森の 氷の柱', x: 15, y: YAMA_Y0 + 23, prop: 'icepillar', nakama: 'kokemusha', lv: 14,
        lines: ['原っぱの まんなかに、大きな 氷の 柱が 立っている。夏なのに とけない……。', '柱の うしろから、コケだらけの よろいが ぬっと 出てきた！'], done: '氷の 柱が あった ところに、水たまりが できている。' },
    { id: 'sealSekkei', label: '雪渓の 氷の柱', x: 43, y: YAMA_Y0 + 18, prop: 'icepillar', nakama: 'koorinokagami', lv: 14,
        lines: ['雪渓の おくに、鏡のように ぴかぴかの 氷の 柱が ある。', '柱に こおりくんが うつった……と 思ったら、柱が しゃべった！'], done: 'とけた 氷の 柱から、水が ちょろちょろ 流れている。' },
    { id: 'sealIwa', label: '岩場の 氷の柱', x: 40, y: YAMA_Y0 + 29, prop: 'icepillar', nakama: 'yukidarumuscle', lv: 15,
        lines: ['岩の あいだに、ひときわ 大きな 氷の 柱が ある。', '「この 柱は 通さん！」 ムキムキの 雪だるまが 立ちふさがった！'], done: '岩の すきまに 水が しみこんで いく。' }
];

// ----- 海辺の 町と 浦の島の海岸どうくつ (4 章「海辺の どうくつと ライバル探検隊」。2026-10-29) -----
// 商店街の 石の川駅 (STATION_OUT は 駅の 前) と 海辺駅 (UMI_IN は 駅の 前) を 電車で 行き来する
export const UMI_IN = { x: 5, y: UMI_Y0 + 5, dir: 'down' };
export const STATION_OUT = { x: 5, y: 41, dir: 'down' };
// ボスに 勝った あと (どうくつの 出口の 外)
export const UMI_AFTER_BOSS = { x: 28, y: UMI_Y0 + 11, dir: 'right' };
// 地図の 名札
export const UMI_PLACES = [
    { id: 'umiStation', label: '海辺駅', x: 5, y: UMI_Y0 + 2 },
    { id: 'umiHouse', label: '漁師の家', x: 11.5, y: UMI_Y0 + 3 },
    { id: 'tsuriguya', label: '釣具屋', x: 18.5, y: UMI_Y0 + 3 },
    { id: 'uminoie', label: '海の家', x: 22.5, y: UMI_Y0 + 15 },
    { id: 'hamabe', label: '浜辺', x: 7, y: UMI_Y0 + 21 },
    { id: 'cave', label: '海岸どうくつ', x: 37, y: UMI_Y0 + 13 }
];

export const tileAt = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? 'T' : TILES[y][x]);
// その マスの 地区 (設計書 5.1)
export const areaAt = (x, y) => (y >= UMI_Y0 ? 'umi' : y >= YAMA_Y0 ? 'yama' : y >= SCHOOL_Y0 ? 'school' : y >= TOWN_H ? 'shoutengai' : 'ishinokawa');
export const inSchoolTile = y => y >= SCHOOL_Y0 && y < YAMA_Y0;
// 町・学校・山・海 は つながって いないので、カメラと 地図は べつに する。[上, 下) の マス
export const regionOf = ty => (ty >= UMI_Y0 ? [UMI_Y0, MAP_H] : ty >= YAMA_Y0 ? [YAMA_Y0, UMI_Y0] : ty >= SCHOOL_Y0 ? [SCHOOL_Y0, YAMA_Y0] : [0, SCHOOL_Y0]);
// どうくつの 中か (4 章。バトルの 背景が かわる)
export const inCaveTile = (x, y) => y >= UMI_Y0 && x >= 30;
