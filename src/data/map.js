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
// その 下 (y 156〜191) は ネット寺 (5 章。2026-10-29)。4 章 クリアの あと ダイシの 手紙を 読むと、石の川駅から 電車で 行ける
// その 下 (y 192〜227) は 忍びの屋敷 (6 章。2026-10-29)。5 章 クリアの あと ともいしと 話すと、石の川駅から 電車で 行ける
// その 下 (y 228〜263) は 月の迷宮 (7 章。2026-10-29)。6 章 クリアの あと、石の川駅から 電車で 行ける
// その 下 (y 264〜299) は 金色のSE城 (8 章。2026-10-30)。7 章 クリアの あと、石の川駅から 電車で 行ける
// その 下 (y 300〜335) は 14 章の 遊園地 (2026-10-30)。内定版は ナイテイパーク・免許版は メンキョシティ (地図は 同じで 名前が ちがう)
// その 下 (y 336〜371) は 筋肉の山 (9 章。2026-10-30)。8 章 クリアの あと、石の川駅から 電車で 行ける。とちゅうに 雪どけの 氷河
// その 下 (y 372〜407) は ASOの壺の底 (11 章。2026-10-30)。10 章 クリアの あと、石の川駅から 電車で 行ける。火山の 底に バクエンリュウ
// いちばん 下 (y 408〜443) は 喰らいの 城 (13 章。2026-10-30)。12 章 クリアの あと、石の川駅から 黒い 光の 道で 行ける
//
//   tiles[y][x]: G 草 / F 花 / T 木 / R 道 / W 川 / B 橋 / P 川原の 石ころ / S 公園の 砂 / K 石だたみ / A 駐車場
//                学校: L 木の ゆか / X かべ / Y プールサイド / M げた箱の マット (W は プールの 水)
//                山: U 山道の 入り口 / H 畑 / N 雪 / Q ダムの かべ / D かれた 沢 / E 水が 消えた 湖の 底 / I 氷の 城
//                    (D・E・I は 3 章 クリアで 水に もどって 通れなくなる。world.js の blockedTile)
//                海: J 岩の がけ / C どうくつの ゆか (S 浜辺・W 海・B 桟橋・P 浜の 岩場 は 町と 同じ)
//                屋敷: Z 屋敷の かべ (板べい) / O たたみ (L 木の ろうか は 学校と 同じ)
//                月の迷宮: V 迷宮の かべ / v 迷宮の ゆか
//                SE城: k 金の かべ / r 赤い じゅうたん
//                ASOの壺の底: m 溶岩 (通れない。どうくつの ゆか C・岩 J は 海と 同じ)
//   BUILDINGS: 家などの 建物 (通れない)。door は 調べる マス (建物の 下の まんなか)
//   SPOTS: レンズで さがす 場所 (設計書 5.2)。kinds の time は 出る 時間帯、weather: 'rain' は 雨の日だけ
// =====================================================================
export const TILE = 16;
export const MAP_W = 48, MAP_H = 444;
export const TOWN_H = 36;       // ここから 下が 商店街
export const SCHOOL_Y0 = 60;    // ここから 下が 小学校の 中
export const YAMA_Y0 = 84;      // ここから 下が 山と ダム
export const UMI_Y0 = 120;      // ここから 下が 海辺の 町と 浦の島の海岸どうくつ (4 章)
export const TERA_Y0 = 156;     // ここから 下が ネット寺 (5 章)
export const YASHIKI_Y0 = 192;  // ここから 下が 忍びの屋敷 (6 章)
export const MOON_Y0 = 228;     // ここから 下が 月の迷宮 (7 章)
export const SHIRO_Y0 = 264;    // ここから 下が 金色のSE城 (8 章)
export const PARK_Y0 = 300;     // ここから 下が 14 章の 遊園地 (ナイテイパーク / メンキョシティ)
export const KINNIKU_Y0 = 336;  // ここから 下が 筋肉の山 (9 章)
export const TSUBO_Y0 = 372;    // ここから 下が ASOの壺の底 (11 章)
export const KURAI_Y0 = 408;    // ここから 下が 喰らいの 城 (13 章)
// 喰らいの 城の 2〜7 階: [階の 上の 行 (KURAI_Y0 から), 上への 階段の x]。下から 2 階・3 階 … 7 階 の 順
export const FLOORS13 = [[21, 10], [18, 37], [15, 10], [12, 37], [9, 10], [6, 24]];
export const BLOCK = new Set(['T', 'W', 'X', 'Q', 'I', 'J', 'Z', 'V', 'k', 'm']);
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

    // ----- ネット寺 (y 156〜191。5 章「ネット寺の のろい」) -----
    //   北: 本堂・鐘楼・書庫と 境内の 石だたみ / まんなか: 参道 / 西: 竹やぶ / 東: 池 / 南西: ネット寺前駅
    const N = TERA_Y0;
    fill(0, N, MAP_W - 1, MAP_H - 1, 'T');
    fill(1, N + 1, MAP_W - 2, N + 34, 'G');
    fill(7, N + 7, 40, N + 15, 'K');                                    // 境内
    fill(22, N + 16, 25, N + 33, 'K');                                  // 参道
    fill(4, N + 31, 6, N + 31, 'K'); fill(4, N + 32, 25, N + 33, 'K');  // 駅から 参道へ
    fill(30, N + 19, 37, N + 24, 'W');                                  // 池
    fill(9, N + 18, 16, N + 19, 'F');
    [[3, N + 18], [5, N + 20], [2, N + 23], [7, N + 22], [4, N + 26], [10, N + 25], [14, N + 23], [17, N + 28], [12, N + 29], [20, N + 22],
        [42, N + 18], [44, N + 23], [40, N + 28], [45, N + 30], [28, N + 29]].forEach(([x, y]) => { t[y][x] = 'T'; });

    // ----- 忍びの屋敷 (y 192〜227。6 章「忍びの屋敷と 消えた メダル」) -----
    //   板べいで かこまれた 屋敷。南の 門 → 庭 → (ズミタニが ふさぐ 1 マスの 戸口) → ろうか → 北に 西の間・奥の 間・東の 蔵
    //   南西に 忍びの屋敷前駅
    const Y6 = YASHIKI_Y0;
    fill(0, Y6, MAP_W - 1, MAP_H - 1, 'T');
    fill(1, Y6 + 1, MAP_W - 2, Y6 + 34, 'G');
    fill(8, Y6 + 2, 40, Y6 + 23, 'Z');                                   // 板べい
    fill(9, Y6 + 14, 39, Y6 + 22, 'G');                                  // 庭
    fill(22, Y6 + 15, 25, Y6 + 22, 'K');                                 // 庭の 石だたみ
    fill(30, Y6 + 16, 35, Y6 + 19, 'W');                                 // 池
    fill(11, Y6 + 16, 16, Y6 + 17, 'F');
    fill(9, Y6 + 11, 39, Y6 + 12, 'L');                                  // ろうか
    fill(24, Y6 + 13, 24, Y6 + 13, 'L');                                 // 庭から ろうかへの 戸口 (1 マス)
    fill(9, Y6 + 3, 16, Y6 + 9, 'L');  fill(12, Y6 + 10, 12, Y6 + 10, 'L');    // 西の間
    fill(18, Y6 + 3, 30, Y6 + 9, 'O'); fill(24, Y6 + 10, 24, Y6 + 10, 'O');    // 奥の 間 (たたみ)
    fill(32, Y6 + 3, 39, Y6 + 9, 'L'); fill(35, Y6 + 10, 35, Y6 + 10, 'L');    // 東の 蔵
    fill(23, Y6 + 23, 24, Y6 + 23, 'K');                                 // 南の 門
    fill(23, Y6 + 24, 24, Y6 + 31, 'K');                                 // 門への 道
    fill(4, Y6 + 31, 6, Y6 + 31, 'K'); fill(4, Y6 + 32, 24, Y6 + 33, 'K');    // 駅から 門へ
    [[3, Y6 + 4], [5, Y6 + 10], [2, Y6 + 16], [4, Y6 + 22], [43, Y6 + 4], [45, Y6 + 12], [42, Y6 + 20], [44, Y6 + 27], [14, Y6 + 27], [33, Y6 + 28], [38, Y6 + 31]]
        .forEach(([x, y]) => { t[y][x] = 'T'; });

    // ----- 月の迷宮 (y 228〜263。7 章「月の迷宮と 喰らう 者の 伝説」) -----
    //   南に 駅と 入り口。迷宮は 2 マスはばの 通路で、左まわりが 正しい 道 (右と 左下は 行き止まり)。いちばん 奥に 月の 鏡の 間
    const M = MOON_Y0;
    fill(0, M, MAP_W - 1, MAP_H - 1, 'T');
    fill(1, M + 27, MAP_W - 2, M + 34, 'G');
    fill(4, M + 1, 44, M + 26, 'V');
    const v = (x0, y0, x1, y1) => fill(x0, y0, x1, y1, 'v');
    v(23, M + 20, 24, M + 26);      // 入り口から 北へ
    v(8, M + 20, 40, M + 21);       // 南の 横道
    v(8, M + 8, 9, M + 21);         // 西の たて道 (正しい 道)
    v(8, M + 8, 20, M + 9);         // 北西の 横道
    v(19, M + 3, 20, M + 9);        // 鏡の 間へ
    v(17, M + 1, 31, M + 5);        // 月の 鏡の 間
    v(39, M + 12, 40, M + 21);      // 東の たて道 (行き止まり)
    v(26, M + 12, 40, M + 13);
    v(26, M + 12, 27, M + 17);
    v(30, M + 16, 35, M + 17);
    v(28, M + 16, 29, M + 17);
    v(12, M + 14, 16, M + 17);      // 西の 小部屋 (行き止まり)
    v(10, M + 15, 11, M + 16);
    v(14, M + 10, 15, M + 13);
    fill(23, M + 27, 24, M + 33, 'K');
    fill(4, M + 31, 6, M + 31, 'K'); fill(4, M + 32, 24, M + 33, 'K');
    [[3, M + 28], [12, M + 29], [30, M + 29], [40, M + 30], [44, M + 28], [17, M + 33]].forEach(([x, y]) => { t[y][x] = 'T'; });

    // ----- 金色のSE城 (y 264〜299。8 章「金色のSE城の 決戦」) -----
    //   南に 駅と 城門。城の 中は 南から 北へ 大広間 (大鬼) → 双頭の間 → 金の間 (金滅鬼) → 玉座の 間 (おにおに) → 宝物庫。
    //   部屋と 部屋は 1 マスの 戸口で、幹部が 戸口の 前に 立って ふさぐ
    const S = SHIRO_Y0;
    fill(0, S, MAP_W - 1, MAP_H - 1, 'T');
    fill(1, S + 1, MAP_W - 2, S + 34, 'G');
    fill(6, S + 1, 41, S + 25, 'k');                                     // 金の かべ
    fill(18, S + 2, 31, S + 4, 'r');  fill(31, S + 5, 31, S + 5, 'r');   // 宝物庫 (戸口は 玉座の 右うしろ)
    fill(12, S + 6, 35, S + 9, 'r');  fill(24, S + 10, 24, S + 10, 'r'); // 玉座の 間
    fill(12, S + 11, 35, S + 13, 'r'); fill(24, S + 14, 24, S + 14, 'r'); // 金の間
    fill(12, S + 15, 35, S + 17, 'r'); fill(24, S + 18, 24, S + 18, 'r'); // 双頭の間
    fill(9, S + 19, 38, S + 23, 'r');                                    // 大広間
    fill(23, S + 24, 24, S + 25, 'K');                                   // 城門
    fill(23, S + 26, 24, S + 31, 'K');                                   // 門への 道
    fill(4, S + 31, 6, S + 31, 'K'); fill(4, S + 32, 24, S + 33, 'K');   // 駅から 門へ
    [[3, S + 28], [12, S + 29], [30, S + 29], [40, S + 30], [44, S + 28], [17, S + 33], [36, S + 27]].forEach(([x, y]) => { t[y][x] = 'T'; });

    // ----- 14 章の 遊園地 (y 300〜335。ナイテイパーク / メンキョシティ) -----
    //   南に 駅と 入場ゲート。中は 石だたみの 広場と 花だん。アトラクション 3 つ (建物) は 西・北・東。夜は 広場の まんなかに 残党の ボス
    const P = PARK_Y0;
    fill(0, P, MAP_W - 1, MAP_H - 1, 'T');
    fill(1, P + 1, MAP_W - 2, P + 34, 'G');
    fill(5, P + 2, 42, P + 23, 'K');                                     // 広場
    fill(6, P + 18, 11, P + 21, 'F'); fill(36, P + 18, 41, P + 21, 'F'); // 花だん
    fill(16, P + 9, 19, P + 10, 'F'); fill(29, P + 9, 32, P + 10, 'F');
    for (let x = 4; x <= 43; x++) { t[P + 1][x] = 'T'; t[P + 24][x] = 'T'; }   // 植えこみの かき
    for (let y = P + 1; y <= P + 24; y++) { t[y][4] = 'T'; t[y][43] = 'T'; }
    fill(23, P + 24, 24, P + 24, 'K');                                   // 入場ゲート
    fill(23, P + 25, 24, P + 31, 'K');
    fill(4, P + 31, 6, P + 31, 'K'); fill(4, P + 32, 24, P + 33, 'K');
    [[3, P + 28], [12, P + 29], [30, P + 29], [40, P + 30], [44, P + 28], [17, P + 33]].forEach(([x, y]) => { t[y][x] = 'T'; });

    // ----- 筋肉の山 (y 336〜371。9 章「筋肉の山と 新しい なかま」) -----
    //   南の 駅から 登山道を のぼる → 雪どけの 氷河 (ハル麒麟が 北への 細道を ふさぐ) → 尾根道 → 山頂の 道場 (ノゾエマ)
    const K = KINNIKU_Y0;
    fill(0, K, MAP_W - 1, MAP_H - 1, 'T');
    fill(1, K + 1, MAP_W - 2, K + 34, 'G');
    fill(4, K + 1, 43, K + 25, 'Q');                                     // 岩山
    fill(23, K + 20, 24, K + 25, 'U');                                   // 登山口から 北へ
    fill(8, K + 19, 24, K + 20, 'U');                                    // 登山道 (西へ)
    fill(8, K + 14, 9, K + 20, 'U');
    fill(5, K + 10, 20, K + 15, 'N');                                    // 雪どけの 氷河
    fill(13, K + 6, 13, K + 9, 'U');                                     // 氷河から 北への 細道 (ハル麒麟が ふさぐ)
    fill(13, K + 5, 34, K + 6, 'U');                                     // 尾根道 (東へ)
    fill(28, K + 1, 41, K + 4, 'L');                                     // 山頂の 道場
    fill(23, K + 26, 24, K + 31, 'K');
    fill(4, K + 31, 6, K + 31, 'K'); fill(4, K + 32, 24, K + 33, 'K');
    [[3, K + 28], [12, K + 29], [30, K + 29], [40, K + 30], [44, K + 28], [17, K + 33]].forEach(([x, y]) => { t[y][x] = 'T'; });

    // ----- ASOの壺の底 (y 372〜407。11 章「ASOの壺の底」) -----
    //   南の 駅から 壺の 口へ → 溶岩の 大どうくつ → 北の 細道 → 火山の 底 (バクエンリュウが 東の 戸口を ふさぐ) → ASO の 間
    const A = TSUBO_Y0;
    fill(0, A, MAP_W - 1, MAP_H - 1, 'T');
    fill(1, A + 1, MAP_W - 2, A + 34, 'G');
    fill(4, A + 1, 43, A + 25, 'J');                                     // 岩
    fill(23, A + 20, 24, A + 25, 'C');                                   // 壺の 口から 北へ
    fill(8, A + 13, 38, A + 19, 'C');                                    // 溶岩の 大どうくつ
    fill(12, A + 15, 15, A + 16, 'm'); fill(28, A + 14, 32, A + 15, 'm'); fill(19, A + 18, 21, A + 18, 'm');
    fill(12, A + 8, 13, A + 12, 'C');                                    // 北の 細道
    fill(8, A + 3, 28, A + 7, 'C');                                      // 火山の 底
    fill(9, A + 3, 11, A + 4, 'm'); fill(23, A + 6, 26, A + 7, 'm');
    fill(29, A + 5, 29, A + 5, 'C');                                     // ASO の 間への 戸口 (バクエンリュウが ふさぐ)
    fill(30, A + 2, 40, A + 8, 'C');                                     // ASO の 間
    fill(23, A + 26, 24, A + 31, 'K');
    fill(4, A + 31, 6, A + 31, 'K'); fill(4, A + 32, 24, A + 33, 'K');
    [[3, A + 28], [12, A + 29], [30, A + 29], [40, A + 30], [44, A + 28], [17, A + 33]].forEach(([x, y]) => { t[y][x] = 'T'; });

    // ----- 喰らいの 城 (y 408〜443。13 章「喰らいの 城」) -----
    //   南の 野原 (ヒョウガリュウが おりる) から 城門 → 1 階 大広間 → 2 階 → 3〜7 階 (階段の 前に 紋つきの 幹部) → 最上階 (ルキハ)
    //   階段は 東と 西に かわりばんこ
    const R = KURAI_Y0;
    fill(0, R, MAP_W - 1, MAP_H - 1, 'T');
    fill(1, R + 1, MAP_W - 2, R + 34, 'G');
    fill(6, R + 1, 41, R + 29, 'V');                                     // 城の かべ
    fill(12, R + 2, 35, R + 4, 'v');                                     // 最上階
    for (const [y0, sx] of FLOORS13) {                                   // 2〜7 階と 上への 階段
        fill(9, R + y0, 38, R + y0 + 1, 'v');
        fill(sx, R + y0 - 1, sx, R + y0 - 1, 'v');
    }
    fill(9, R + 24, 38, R + 27, 'v');                                    // 1 階 大広間
    fill(37, R + 23, 37, R + 23, 'v');                                   // 1 階 → 2 階
    fill(23, R + 28, 24, R + 29, 'v');                                   // 城門
    fill(23, R + 30, 24, R + 32, 'K');
    [[3, R + 31], [12, R + 32], [32, R + 31], [40, R + 33], [44, R + 30], [8, R + 33]].forEach(([x, y]) => { t[y][x] = 'T'; });
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
    { id: 'uminoie', label: '海の家', x: 20, y: UMI_Y0 + 14, w: 5, h: 4, wall: '#f8f0d8', roof: '#e85a7a', door: { x: 22, y: UMI_Y0 + 17 } },
    // ネット寺 (5 章)
    { id: 'hondou', label: 'ネット寺 本堂', x: 17, y: TERA_Y0 + 1, w: 14, h: 6, wall: '#b88a5a', roof: '#3a3a48', door: { x: 23, y: TERA_Y0 + 6 } },
    { id: 'shouro', label: '鐘楼', x: 9, y: TERA_Y0 + 3, w: 5, h: 4, wall: '#a87a4a', roof: '#3a3a48', door: { x: 11, y: TERA_Y0 + 6 } },
    { id: 'shoko', label: '書庫', x: 34, y: TERA_Y0 + 3, w: 6, h: 4, wall: '#c8a878', roof: '#4a3a3a', door: { x: 36, y: TERA_Y0 + 6 } },
    { id: 'teraStation', label: 'ネット寺前駅', x: 2, y: TERA_Y0 + 27, w: 6, h: 4, wall: '#e8e0d0', roof: '#5a3a8a', door: { x: 5, y: TERA_Y0 + 30 } },
    // 忍びの屋敷 (6 章)
    { id: 'yashikiStation', label: '忍びの屋敷前駅', x: 2, y: YASHIKI_Y0 + 27, w: 6, h: 4, wall: '#e8e0d0', roof: '#3a3a3a', door: { x: 5, y: YASHIKI_Y0 + 30 } },
    // 月の迷宮 (7 章)
    { id: 'moonStation', label: '月の迷宮前駅', x: 2, y: MOON_Y0 + 27, w: 6, h: 4, wall: '#e0e0f0', roof: '#3a3a6a', door: { x: 5, y: MOON_Y0 + 30 } },
    // 商店街の 合体の館 (2026-10-30 ユーザー指定。パチンコ店あとの 北)
    { id: 'gattai', label: '合体の館', x: 15, y: 37, w: 6, h: 4, wall: '#d8c8f0', roof: '#6a3a9a', door: { x: 18, y: 40 } },
    // 金色のSE城 (8 章)
    { id: 'shiroStation', label: 'SE城前駅', x: 2, y: SHIRO_Y0 + 27, w: 6, h: 4, wall: '#f0e0b0', roof: '#a02020', door: { x: 5, y: SHIRO_Y0 + 30 } },
    // 14 章の 遊園地 (アトラクションの 名前は どちらの バージョンも 同じ)
    { id: 'attrA', label: 'コースター', x: 8, y: PARK_Y0 + 11, w: 6, h: 4, wall: '#ffd0e0', roof: '#e04a8a', door: { x: 11, y: PARK_Y0 + 14 } },
    { id: 'attrB', label: 'かんらん車', x: 20, y: PARK_Y0 + 3, w: 8, h: 4, wall: '#d0f0ff', roof: '#3a8ae0', door: { x: 24, y: PARK_Y0 + 6 } },
    { id: 'attrC', label: 'おばけ屋敷', x: 34, y: PARK_Y0 + 11, w: 6, h: 4, wall: '#d8d0e8', roof: '#4a3a6a', door: { x: 37, y: PARK_Y0 + 14 } },
    { id: 'tsuboStation', label: 'ASOの壺前駅', x: 2, y: TSUBO_Y0 + 27, w: 6, h: 4, wall: '#d8c8b8', roof: '#4a2a5a', door: { x: 5, y: TSUBO_Y0 + 30 } },
    { id: 'kinnikuStation', label: '筋肉の山 登山口駅', x: 2, y: KINNIKU_Y0 + 27, w: 6, h: 4, wall: '#e8e0d0', roof: '#6a4a2a', door: { x: 5, y: KINNIKU_Y0 + 30 } },
    { id: 'parkStation', label: '遊園地前駅', x: 2, y: PARK_Y0 + 27, w: 6, h: 4, wall: '#fff0d0', roof: '#e08a2a', door: { x: 5, y: PARK_Y0 + 30 } }
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
    { id: 'torii-r', kind: 'torii', x: 8, y: 9 },
    // 7 章: 月の迷宮の 月の 鏡
    { id: 'moonMirror', kind: 'mirror', x: 24, y: MOON_Y0 + 1 },
    // 8 章: SE城の 玉座 (玉座の 間の 北の かべ ぎわ)
    { id: 'throne', kind: 'throne', x: 24, y: SHIRO_Y0 + 6 }
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
// ネット寺の キャラの Lv (5 章)
export const TERA_LV = [19, 22];
// 忍びの屋敷の キャラの Lv (6 章)
export const YASHIKI_LV = [22, 25];
// 月の迷宮の キャラの Lv (7 章)
export const MOON_LV = [25, 28];
// 金色のSE城の キャラの Lv (8 章)
export const SHIRO_LV = [28, 31];
// 14 章の 遊園地の キャラの Lv
export const PARK_LV = [36, 40];
// 筋肉の山の キャラの Lv (9 章)
export const KINNIKU_LV = [31, 35];
// ASOの壺の底の キャラの Lv (11 章)
export const TSUBO_LV = [38, 42];
// 喰らいの 城の 軍勢の Lv (13 章。ぜんぶ 紋つき)
export const KURAI_LV = [52, 56];

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
    { id: 'shiodamari', label: 'どうくつの しおだまり', x: 36, y: UMI_Y0 + 15, cue: 'tidePool', lv: CAVE_LV, kinds: [{ id: 'isoginchakku', w: 1 }] },
    // ネット寺 (5 章)
    { id: 'saisen', label: '本堂の 前の おさいせん箱', x: 19, y: TERA_Y0 + 8, cue: 'glitch', lv: TERA_LV, kinds: [{ id: 'nullpon', w: 1 }] },
    { id: 'takeOku', label: '竹やぶの おく', x: 8, y: TERA_Y0 + 29, cue: 'nightEyes', lv: TERA_LV, kinds: [{ id: 'notfound', w: 1, time: ['evening', 'night'] }] },
    // 忍びの屋敷 (6 章)
    { id: 'tenjou', label: '西の間の 天井うら', x: 14, y: YASHIKI_Y0 + 4, cue: 'nightEyes', lv: YASHIKI_LV, kinds: [{ id: 'geninman', w: 1 }] },
    { id: 'kuraTsubo', label: '蔵の すみ', x: 38, y: YASHIKI_Y0 + 8, cue: 'glitch', lv: YASHIKI_LV, kinds: [{ id: 'makibikonmk3', w: 1 }] },
    // 月の迷宮 (7 章)
    { id: 'moonTsubo', label: '西の 小部屋の ツボ', x: 13, y: MOON_Y0 + 15, cue: 'glitch', lv: MOON_LV, kinds: [{ id: 'tsubomajin', w: 1 }] },
    { id: 'moonKado', label: '行き止まりの かげ', x: 34, y: MOON_Y0 + 17, cue: 'nightEyes', lv: MOON_LV, kinds: [{ id: 'shakkinbourei', w: 1 }] },
    // 金色のSE城 (8 章)
    { id: 'shiroMasu', label: '城門の 豆の ます', x: 21, y: SHIRO_Y0 + 26, cue: 'glitch', lv: SHIRO_LV, kinds: [{ id: 'setsubunmame', w: 1 }] },
    { id: 'hyougaFuki', label: '氷河の 雪の 下', x: 6, y: KINNIKU_Y0 + 15, cue: 'glitch', lv: KINNIKU_LV, kinds: [{ id: 'fukinoton', w: 1 }] },
    { id: 'shiroKama', label: '大広間の すみの かまど', x: 10, y: SHIRO_Y0 + 19, cue: 'nightEyes', lv: SHIRO_LV, kinds: [{ id: 'onigirin', w: 1 }] }
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
    { id: 'pachinkoMae', label: 'パチンコ店の跡の前', x0: 21, y0: 37, x1: 26, y1: 41, max: 1, lv: SHOUTENGAI_LV, kinds: [{ id: 'pachinkodaman', w: 2 }, { id: 'richibou', w: 1 }] },
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
    { id: 'caveOku', label: 'どうくつの いちばん 奥', x0: 40, y0: UMI_Y0 + 1, x1: 45, y1: UMI_Y0 + 6, max: 1, lv: CAVE_LV, kinds: [{ id: 'urashima', w: 1, after: 'clear4' }, { id: 'ryuuguudai', w: 1, after: 'clear4' }] },
    // ネット寺 (5 章)。紋つきだった 3 体と ダイシは 5 章 クリアの あと (clear5) から 歩きまわる
    { id: 'keidai', label: 'ネット寺の 境内', x0: 8, y0: TERA_Y0 + 8, x1: 40, y1: TERA_Y0 + 15, max: 2, lv: TERA_LV, kinds: [{ id: 'bugmushi', w: 2 }, { id: 'csspakkun', w: 2 }, { id: 'mugenloop', w: 1, time: ['evening', 'night'] }, { id: 'daishi', w: 1, after: 'clear5' }] },
    { id: 'sandou', label: 'ネット寺の 参道', x0: 22, y0: TERA_Y0 + 16, x1: 25, y1: TERA_Y0 + 31, max: 1, lv: TERA_LV, kinds: [{ id: 'firewall', w: 1 }, { id: 'htmlmokkun', w: 1, after: 'clear5' }, { id: 'loadingu', w: 1, after: 'clear5' }, { id: 'enjoubouzu', w: 1, after: 'clear5' }] },
    { id: 'takeyabu', label: '竹やぶ', x0: 1, y0: TERA_Y0 + 17, x1: 19, y1: TERA_Y0 + 30, max: 2, lv: TERA_LV, kinds: [{ id: 'bugmushi', w: 1 }, { id: 'csspakkun', w: 1 }, { id: 'firewall', w: 1 }] },
    { id: 'ikenohata', label: '池の ほとり', x0: 27, y0: TERA_Y0 + 17, x1: 45, y1: TERA_Y0 + 31, max: 1, lv: TERA_LV, kinds: [{ id: 'virusn', w: 2 }, { id: 'mugenloop', w: 1 }] },
    // 忍びの屋敷 (6 章)。ズミタニは 6 章 クリアの あと (clear6) 庭を 歩きまわる
    { id: 'niwa', label: '屋敷の 庭', x0: 9, y0: YASHIKI_Y0 + 14, x1: 39, y1: YASHIKI_Y0 + 22, max: 2, lv: YASHIKI_LV, kinds: [{ id: 'shurikenbo', w: 2 }, { id: 'konin', w: 2 }, { id: 'aoonibo', w: 1 }, { id: 'zumitani', w: 1, after: 'clear6' }] },
    { id: 'rouka6', label: '屋敷の ろうか', x0: 9, y0: YASHIKI_Y0 + 11, x1: 39, y1: YASHIKI_Y0 + 12, max: 1, lv: YASHIKI_LV, kinds: [{ id: 'kanabone', w: 2 }, { id: 'hyoutanoni', w: 1, time: ['evening', 'night'] }] },
    { id: 'nishinoma', label: '西の間', x0: 9, y0: YASHIKI_Y0 + 3, x1: 16, y1: YASHIKI_Y0 + 9, max: 1, lv: YASHIKI_LV, kinds: [{ id: 'taikooni', w: 1 }, { id: 'bakudanjirou', w: 2 }] },
    // 月の迷宮 (7 章)。ルナヤは 7 章 クリアの あと (clear7) 鏡の 間に いる
    { id: 'moonSouth', label: '迷宮の 南の 横道', x0: 8, y0: MOON_Y0 + 20, x1: 40, y1: MOON_Y0 + 21, max: 2, lv: MOON_LV, kinds: [{ id: 'tsukiusagi', w: 2 }, { id: 'nandomoslime', w: 2 }, { id: 'watageboushi', w: 1 }] },
    { id: 'moonWest', label: '迷宮の 西の たて道', x0: 8, y0: MOON_Y0 + 8, x1: 20, y1: MOON_Y0 + 19, max: 1, lv: MOON_LV, kinds: [{ id: 'mangetsuwolf', w: 2, time: ['evening', 'night'] }, { id: 'tatsumakitsune', w: 1 }, { id: 'nandomoslime', w: 1 }] },
    { id: 'moonEast', label: '迷宮の 東の 行き止まり', x0: 26, y0: MOON_Y0 + 12, x1: 40, y1: MOON_Y0 + 19, max: 1, lv: MOON_LV, kinds: [{ id: 'kaminarigumo', w: 1 }, { id: 'watageboushi', w: 1 }, { id: 'tatsumakitsune', w: 1 }] },
    { id: 'moonOku', label: '月の 鏡の 間', x0: 17, y0: MOON_Y0 + 1, x1: 31, y1: MOON_Y0 + 5, max: 1, lv: MOON_LV, kinds: [{ id: 'runaya', w: 1, after: 'clear7' }, { id: 'tsukiusagi', w: 1, after: 'clear7' }] },
    // 金色のSE城 (8 章)。ゴウキオニは 8 章 クリアの あと (clear8) 玉座の 間に いる
    { id: 'shiroSoto', label: '城の まわり', x0: 1, y0: SHIRO_Y0 + 26, x1: 46, y1: SHIRO_Y0 + 33, max: 2, lv: SHIRO_LV, kinds: [{ id: 'setsubunmame', w: 2 }, { id: 'onibin', w: 1, time: ['evening', 'night'] }, { id: 'tsunodaruma', w: 1 }] },
    { id: 'hiroma', label: '大広間', x0: 9, y0: SHIRO_Y0 + 20, x1: 38, y1: SHIRO_Y0 + 23, max: 2, lv: SHIRO_LV, kinds: [{ id: 'tsunodaruma', w: 2 }, { id: 'onibin', w: 2 }, { id: 'onigirin', w: 1 }] },
    { id: 'gyokuza', label: '玉座の 間', x0: 12, y0: SHIRO_Y0 + 7, x1: 35, y1: SHIRO_Y0 + 9, max: 1, lv: SHIRO_LV, kinds: [{ id: 'goukioni', w: 1, after: 'clear8' }, { id: 'kinmetsuki', w: 1, after: 'clear8' }] },
    // 喰らいの 城 (13 章)。ルキハの 軍勢 = これまでの 強い キャラが 紋つき (・闇) で 出る
    //   紋つきの 敵は なかまに ならない (外の 軍勢は 元四天王が ひきうけて くれる)
    { id: 'kuraiHiroma', label: '喰らいの 城の 大広間', x0: 9, y0: KURAI_Y0 + 24, x1: 38, y1: KURAI_Y0 + 27, max: 3, lv: KURAI_LV, kinds: [{ id: 'goukioni', w: 2 }, { id: 'kaendaruma', w: 2 }, { id: 'shirokumatcho', w: 2 }, { id: 'nakatadraco', w: 1 }, { id: 'yukionnan', w: 1 }, { id: 'dradora', w: 1 }] },
    { id: 'kurai2f', label: '喰らいの 城の 2 階', x0: 9, y0: KURAI_Y0 + 21, x1: 38, y1: KURAI_Y0 + 22, max: 2, lv: KURAI_LV, kinds: [{ id: 'hinotorin', w: 2 }, { id: 'onibin', w: 2 }, { id: 'youganworm', w: 1 }] },
    // ASOの壺の底 (11 章)。バクエンリュウは 11 章 クリアの あと (clear11) 火山の 底に いる
    { id: 'youganDou', label: '溶岩の 大どうくつ', x0: 8, y0: TSUBO_Y0 + 13, x1: 38, y1: TSUBO_Y0 + 19, max: 3, lv: TSUBO_LV, kinds: [{ id: 'asohei', w: 3 }, { id: 'hinotorin', w: 2 }, { id: 'kaendaruma', w: 2 }, { id: 'youganworm', w: 2 }, { id: 'dradora', w: 1 }] },
    { id: 'kazanSoko', label: '火山の 底', x0: 8, y0: TSUBO_Y0 + 3, x1: 28, y1: TSUBO_Y0 + 7, max: 1, lv: TSUBO_LV, kinds: [{ id: 'youganworm', w: 1 }, { id: 'hinotorin', w: 1 }, { id: 'bakuenryu', w: 1, after: 'clear11' }] },
    // 筋肉の山 (9 章)
    { id: 'tozandou', label: '登山道', x0: 8, y0: KINNIKU_Y0 + 19, x1: 24, y1: KINNIKU_Y0 + 20, max: 2, lv: KINNIKU_LV, kinds: [{ id: 'dumbbellkong', w: 2 }, { id: 'magmatcho', w: 2 }, { id: 'harukazedori', w: 1 }] },
    { id: 'hyouga', label: '雪どけの 氷河', x0: 5, y0: KINNIKU_Y0 + 11, x1: 20, y1: KINNIKU_Y0 + 15, max: 3, lv: KINNIKU_LV, kinds: [{ id: 'yukiusapon', w: 2 }, { id: 'tsurarabo', w: 2 }, { id: 'kakigoora', w: 1 }, { id: 'penguinknight', w: 1 }, { id: 'shirokumatcho', w: 1 }, { id: 'yukionnan', w: 1, time: ['evening', 'night'] }, { id: 'sakurarisu', w: 1 }] },
    // ノゾエマと ハル麒麟は 9 章 クリアの あと (clear9) 山頂の 道場に いる
    { id: 'doujou', label: '山頂の 道場', x0: 28, y0: KINNIKU_Y0 + 1, x1: 41, y1: KINNIKU_Y0 + 4, max: 1, lv: KINNIKU_LV, kinds: [{ id: 'nozoema', w: 1, after: 'clear9' }, { id: 'harukirin', w: 1, after: 'clear9' }, { id: 'dumbbellkong', w: 1, after: 'clear9' }] },
    { id: 'one', label: '尾根道', x0: 13, y0: KINNIKU_Y0 + 5, x1: 34, y1: KINNIKU_Y0 + 6, max: 1, lv: KINNIKU_LV, kinds: [{ id: 'harukazedori', w: 2 }, { id: 'dumbbellkong', w: 1 }, { id: 'magmatcho', w: 1 }] },
    // 14 章の 遊園地 (前の 地区の にぎやかな キャラが あそびに 来ている)
    { id: 'parkHiroba', label: '遊園地の 広場', x0: 5, y0: PARK_Y0 + 16, x1: 42, y1: PARK_Y0 + 23, max: 3, lv: PARK_LV, kinds: [{ id: 'gachapon', w: 2 }, { id: 'chouchinbura', w: 2 }, { id: 'neonkurage', w: 1, time: ['evening', 'night'] }, { id: 'pachinkodaman', w: 1 }, { id: 'kinmenkoinu', w: 1 }] },
    { id: 'yashikiSoto', label: '屋敷の まわり', x0: 1, y0: YASHIKI_Y0 + 24, x1: 46, y1: YASHIKI_Y0 + 33, max: 2, lv: YASHIKI_LV, kinds: [{ id: 'shurikenbo', w: 1 }, { id: 'konin', w: 1 }, { id: 'bakudanjirou', w: 1 }] }
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
        lines: ['もえるゴミは 火曜日！ ……あ、まだ 飲める サイダーが すててあった。', 'もったいないから あげる。'], gift: { item: 'cider', n: 1 } },
    // 2 章から 先の 地区にも 話せる キャラ (2026-10-30。依頼を 40 個に ふやした ときに 足した)
    { id: 'f_mirrormuscle', kind: 'mirrormuscle', label: '体育館', x0: 14, y0: 75, x1: 20, y1: 78, after: 'school',
        lines: ['見よ、この 大胸筋！ ……夜の 体育館は 鏡が よく 見えるんだ。', 'ポーズの 合間に プロテイン……じゃなくて サイダー、いるかい？'], gift: { item: 'cider', n: 1 } },
    { id: 'f_fubukipenguin', kind: 'fubukipenguin', label: '雪渓', x0: 39, y0: 99, x1: 45, y1: 103, after: 'yama',
        lines: ['ペンペン！ 雪渓は すべって 遊べるペン。', 'ダムの 氷の 城、いまでも ときどき キラキラ 光ってるペン。'] },
    { id: 'f_asedakku', kind: 'asedakku', label: '海辺の 町の 通り', x0: 10, y0: 127, x1: 20, y1: 131, after: 'umibe',
        lines: ['あせだっく～。海の 町は あついダック……。', '浜辺で にぼしを ひろったダック。あげるダック。'], gift: { item: 'niboshi', n: 1 } },
    { id: 'f_loadingu', kind: 'loadingu', label: 'ネット寺の 境内', x0: 30, y0: 165, x1: 38, y1: 168, after: 'netdera',
        lines: ['よみこみちゅう……よみこみちゅう……。', '……あ、こんにちは。お寺の Wi-Fi、さいきん 速くなったんですよ。'] },
    { id: 'f_aoonibo', kind: 'aoonibo', label: '屋敷の まわり', x0: 30, y0: 217, x1: 44, y1: 224, after: 'yashiki',
        lines: ['あおくて わるいか。……忍者屋敷の まわりの 見はりを してるんだ。', '鬼鬼団の 鬼は、ほんとは みんな 気の いい やつなんだぞ。'] },
    { id: 'f_tsukiusagi', kind: 'tsukiusagi', label: '迷宮の 南の 横道', x0: 26, y0: 248, x1: 34, y1: 249, after: 'meikyu',
        lines: ['ぺったん ぺったん。月の 迷宮で おもちを ついてるの。', 'ひとつ どうぞ。……あ、おにぎりしか なかった。'], gift: { item: 'onigiri', n: 1 } },
    { id: 'f_onigirin', kind: 'onigirin', label: '城の まわり', x0: 28, y0: 291, x1: 40, y1: 296, after: 'oshiro',
        lines: ['のりは パリパリ派！ 鬼鬼団の まかないは おれに まかせろ。', 'できたての おにぎり、ひとつ もってけ！'], gift: { item: 'onigiri', n: 1 } }
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
    { id: 'urashima4', name: '浦の島重蔵', art: 'urashima', x: 43, y: UMI_Y0 + 1, h: 2, only: 'urashima4', scale: 1.5 },
    // 5 章: 本堂の 前の ダイシ。紋つきの 3 体を 助けるまでは 話せる 和尚、助けたあとは 黒い 紋に のまれて ボスに なる
    { id: 'daishiNpc', name: 'ダイシ', art: 'daishi', x: 26, y: TERA_Y0 + 8, only: 'daishiNpc', scale: 1.3 },
    { id: 'daishi5', name: 'ダイシ', art: 'daishi', x: 26, y: TERA_Y0 + 8, only: 'daishi5', scale: 1.5 },
    // 6 章: 庭の 戸口を ふさぐ ズミタニ → 奥の 間の おにおに (ルキハに あやつられている) → 東の 蔵の 鬼鬼団の 幹部 トモオカ
    { id: 'zumitani6', name: 'ズミタニ', art: 'zumitani', x: 24, y: YASHIKI_Y0 + 14, only: 'zumitani6', scale: 1.2 },
    { id: 'onioni6', name: 'おにおに', art: 'onioni', x: 24, y: YASHIKI_Y0 + 5, only: 'onioni6' },
    // ルキハ (第 1 形態) は おにおにの うしろに 座っている (話しかけるのは おにおに)
    { id: 'rukiha6', name: 'ルキハ', art: 'rukiha', x: 21, y: YASHIKI_Y0 + 4, only: 'onioni6' },
    { id: 'tomooka6', name: 'トモオカ', art: 'tomooka', x: 35, y: YASHIKI_Y0 + 5, only: 'tomooka6', scale: 1.3 },
    // 7 章: 月の 鏡の 間で 待つ ルナヤ (話すと 鏡の 回想 → 力を ためす バトル)
    { id: 'runaya7', name: 'ルナヤ', art: 'runaya', x: 27, y: MOON_Y0 + 2, only: 'runaya7', scale: 1.2 },
    // 8 章: SE城の 幹部 3 人と おにおに。それぞれ 次の 部屋への 戸口の 前に 立って ふさぐ
    { id: 'ooni8', name: '大鬼', art: 'ooni', x: 24, y: SHIRO_Y0 + 19, only: 'ooni8', scale: 1.5 },
    { id: 'soutou8', name: '双頭鬼', art: 'soutouki', x: 24, y: SHIRO_Y0 + 15, only: 'soutou8', scale: 1.4 },
    { id: 'kinme8', name: '金滅鬼', art: 'kinmetsuki', x: 24, y: SHIRO_Y0 + 11, only: 'kinme8', scale: 1.2 },
    { id: 'onioni8', name: 'おにおに', art: 'onioni', x: 24, y: SHIRO_Y0 + 7, only: 'onioni8' },
    // 13 章: 喰らいの 城の 最上階の ルキハ
    { id: 'rukiha13', name: 'ルキハ', art: 'rukiha', x: 24, y: KURAI_Y0 + 2, only: 'rukiha13', scale: 1 },
    // 13 章: 3〜7 階の 階段の 前で まつ 紋つきの 幹部 (boss = BOSSES の id)
    { id: 'f13_3', boss: 'tomooka13', name: 'トモオカ・闇', art: 'tomooka', x: 37, y: KURAI_Y0 + 18, only: 'floor13', floor: 3, scale: 1 },
    { id: 'f13_4', boss: 'ooni13', name: '大鬼・闇', art: 'ooni', x: 10, y: KURAI_Y0 + 15, only: 'floor13', floor: 4, scale: 1 },
    { id: 'f13_5', boss: 'soutou13', name: '双頭鬼・闇', art: 'soutouki', x: 37, y: KURAI_Y0 + 12, only: 'floor13', floor: 5, scale: 1 },
    { id: 'f13_6', boss: 'kinme13', name: '金滅鬼・闇', art: 'kinmetsuki', x: 10, y: KURAI_Y0 + 9, only: 'floor13', floor: 6, scale: 1 },
    { id: 'f13_7', boss: 'tashikeda13', name: 'タシケダ・闇', art: 'tashikeda', x: 24, y: KURAI_Y0 + 6, only: 'floor13', floor: 7, scale: 1 },
    // 13 章: 山の ダムで まつ ヒョウガリュウ (乗せて 城へ 飛んでくれる) と、城の 前で まつ ヒョウガリュウ (帰り)
    { id: 'hyouga13', name: 'ヒョウガリュウ', art: 'hyougaryu', x: 40, y: YAMA_Y0 + 14, only: 'hyouga13', scale: 1.4 },
    { id: 'hyougaKurai', name: 'ヒョウガリュウ', art: 'hyougaryu', x: 19, y: KURAI_Y0 + 32, only: 'hyouga13', scale: 1.4 },
    // 12 章: 神社に あつまった みんな (話せる) と、勝負を いどむ おにおに
    { id: 'onioni12', name: 'おにおに', art: 'onioni2', x: 8, y: 6, only: 'onioni12', scale: 1.2 },
    { id: 'g12zumitani', name: 'ズミタニ', art: 'zumitani', x: 3, y: 7, only: 'gather12' },
    { id: 'g12runaya', name: 'ルナヤ', art: 'runaya', x: 3, y: 5, only: 'gather12' },
    { id: 'g12nozoema', name: 'ノゾエマ', art: 'nozoema', x: 10, y: 4, only: 'gather12' },
    { id: 'g12daishi', name: 'ダイシ', art: 'daishi', x: 9, y: 8, only: 'gather12' },
    { id: 'g12rival', name: 'KING.ASAHARA', art: 'asahara', nameBy: { naitei: 'KING.ASAHARA', menkyo: 'マッスルウエノーブル' }, artBy: { naitei: 'asahara', menkyo: 'ueno' }, x: 6, y: 8, only: 'gather12' },
    // 11 章: 火山の 底の バクエンリュウ (ASO の 間への 戸口の 前) → ASO の 間の 大魔王ASO
    { id: 'bakuen11', name: 'バクエンリュウ', art: 'bakuenryu', x: 28, y: TSUBO_Y0 + 5, only: 'bakuen11', scale: 1.3 },
    { id: 'aso11', name: '大魔王ASO', art: 'maou', x: 36, y: TSUBO_Y0 + 4, only: 'aso11', scale: 1.2 },
    // 10 章: 家の 前で ともいしを ねらう 幹部 タシケダ
    { id: 'tashikeda10', name: 'タシケダ', art: 'tashikeda', x: 10, y: 24, only: 'tashikeda10', scale: 1.2 },
    // 9 章: 雪どけの 氷河の ハル麒麟 (北への 細道の 前) → 山頂の 道場の ノゾエマ
    { id: 'harukirin9', name: 'ハル麒麟', art: 'harukirin', x: 13, y: KINNIKU_Y0 + 10, only: 'harukirin9', scale: 1.3 },
    { id: 'nozoema9', name: 'ノゾエマ', art: 'nozoema', x: 34, y: KINNIKU_Y0 + 2, only: 'nozoema9', scale: 1.3 },
    // 14 章: 遊園地の 広場の おにおに (いっしょに 来た)。夜は 広場の まんなかに 残党の ボス (バージョンで ちがう)
    { id: 'oni14', name: 'おにおに', art: 'onioni', x: 20, y: PARK_Y0 + 20, only: 'park14' },
    { id: 'boss14', name: 'サアラハ', art: 'saaraha', nameBy: { naitei: 'サアラハ', menkyo: 'リハマ' }, artBy: { naitei: 'saaraha', menkyo: 'rihama' }, x: 24, y: PARK_Y0 + 12, only: 'boss14', scale: 1.3 },
    // 15 章: 無限回廊の 番人 (石の川駅の 前) と ライバル探検隊 (勝つと なかまに なる。version の チームは その バージョンだけ)
    { id: 'kairou', name: '回廊の 番人', art: 'haridaijin', x: 10, y: 40, only: 'clear14' },
    { id: 'team_5dx', name: 'おかがっぱ', art: 'okagappa', x: 20, y: 29, only: 'team', team: '5dx' },
    { id: 'team_ask3', name: 'KING.ASAHARA', art: 'asahara', x: 24, y: 48, only: 'team', team: 'ask3', version: 'naitei' },
    { id: 'team_kemono', name: 'イシイー', art: 'ishii', x: 36, y: MOON_Y0 + 21, only: 'team', team: 'kemono', version: 'naitei' },
    { id: 'team_muscle', name: 'マッスルウエノーブル', art: 'ueno', x: 20, y: UMI_Y0 + 9, only: 'team', team: 'muscle', version: 'menkyo' },
    { id: 'team_bartas', name: 'ヤーハミー', art: 'yahami', x: 36, y: MOON_Y0 + 21, only: 'team', team: 'bartas', version: 'menkyo' }
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
// ----- 月の迷宮 (7 章「月の迷宮と 喰らう 者の 伝説」。2026-10-29) -----
export const MOON_IN = { x: 5, y: MOON_Y0 + 31, dir: 'down' };
// 月の 鏡 (鏡の 間の かべ ぎわ。通れない)
export const MOON_MIRROR = { x: 24, y: MOON_Y0 + 1 };
export const MOON_PLACES = [
    { id: 'kagami', label: '月の鏡', x: 24, y: MOON_Y0 + 2 },
    { id: 'iriguchi', label: '入り口', x: 23.5, y: MOON_Y0 + 25 },
    { id: 'moonStation', label: '駅', x: 5, y: MOON_Y0 + 28 }
];

// ----- 喰らいの 城 (13 章「喰らいの 城」。2026-10-30) -----
export const KURAI_IN = { x: 23, y: KURAI_Y0 + 32, dir: 'up' };
export const HYOUGA13_AT = { x: 39, y: YAMA_Y0 + 14, dir: 'right' };   // 山で ヒョウガリュウに 話す ところ (帰りも ここに おりる)
export const KURAI_PLACES = [
    { id: 'saijou', label: '最上階', x: 24, y: KURAI_Y0 + 3 },
    { id: 'f7', label: '7 階', x: 16, y: KURAI_Y0 + 6.5 },
    { id: 'f5', label: '5 階', x: 16, y: KURAI_Y0 + 12.5 },
    { id: 'f3', label: '3 階', x: 16, y: KURAI_Y0 + 18.5 },
    { id: 'hiroma', label: '1 階', x: 16, y: KURAI_Y0 + 25.5 },
    { id: 'jomon', label: '城門', x: 23.5, y: KURAI_Y0 + 29 },
    { id: 'hyougaKurai', label: 'ヒョウガリュウ', x: 15, y: KURAI_Y0 + 32 }
];

// ----- ASOの壺の底 (11 章「ASOの壺の底」。2026-10-30) -----
export const TSUBO_IN = { x: 5, y: TSUBO_Y0 + 31, dir: 'down' };
export const TSUBO_PLACES = [
    { id: 'asonoma', label: 'ASOの間', x: 35, y: TSUBO_Y0 + 3 },
    { id: 'kazan', label: '火山の 底', x: 16, y: TSUBO_Y0 + 4 },
    { id: 'dokutsu', label: '溶岩の 大どうくつ', x: 22, y: TSUBO_Y0 + 16 },
    { id: 'tsubonokuchi', label: '壺の 口', x: 23.5, y: TSUBO_Y0 + 24 },
    { id: 'tsuboStation', label: '駅', x: 5, y: TSUBO_Y0 + 28 }
];

// ----- 筋肉の山 (9 章「筋肉の山と 新しい なかま」。2026-10-30) -----
export const KINNIKU_IN = { x: 5, y: KINNIKU_Y0 + 31, dir: 'down' };
export const KINNIKU_PLACES = [
    { id: 'doujou', label: '山頂の 道場', x: 34, y: KINNIKU_Y0 + 2 },
    { id: 'one', label: '尾根道', x: 22, y: KINNIKU_Y0 + 5 },
    { id: 'hyouga', label: '雪どけの 氷河', x: 12, y: KINNIKU_Y0 + 13 },
    { id: 'tozandou', label: '登山道', x: 16, y: KINNIKU_Y0 + 19 },
    { id: 'kinnikuStation', label: '駅', x: 5, y: KINNIKU_Y0 + 28 }
];

// ----- 14 章の 遊園地 (ナイテイパーク / メンキョシティ。2026-10-30) -----
export const PARK_IN = { x: 5, y: PARK_Y0 + 31, dir: 'down' };
export const PARK_NAME = { naitei: 'ナイテイパーク', menkyo: 'メンキョシティ' };
export const PARK_PLACES = [
    { id: 'attrB', label: 'かんらん車', x: 24, y: PARK_Y0 + 4 },
    { id: 'attrA', label: 'コースター', x: 11, y: PARK_Y0 + 12 },
    { id: 'attrC', label: 'おばけ屋敷', x: 37, y: PARK_Y0 + 12 },
    { id: 'hiroba', label: '広場', x: 24, y: PARK_Y0 + 17 },
    { id: 'gate', label: 'ゲート', x: 23.5, y: PARK_Y0 + 24 },
    { id: 'parkStation', label: '駅', x: 5, y: PARK_Y0 + 28 }
];
// 夜の 遊園地で さがす ふるカワの 手がかり (アトラクションの 入り口で しらべる)
export const PARK_CLUES = [
    { id: 'attrA', item: 'ふるカワの リボン' },
    { id: 'attrB', item: 'ふるカワの 招待券' },
    { id: 'attrC', item: 'ふるカワの スマホ' }
];

// ----- 金色のSE城 (8 章「金色のSE城の 決戦」。2026-10-30) -----
export const SHIRO_IN = { x: 5, y: SHIRO_Y0 + 31, dir: 'down' };
export const SHIRO_PLACES = [
    { id: 'houmotsuko', label: '宝物庫', x: 24, y: SHIRO_Y0 + 3 },
    { id: 'gyokuza', label: '玉座の間', x: 24, y: SHIRO_Y0 + 7.5 },
    { id: 'kinnoma', label: '金の間', x: 18, y: SHIRO_Y0 + 12 },
    { id: 'soutou', label: '双頭の間', x: 18, y: SHIRO_Y0 + 16 },
    { id: 'hiroma', label: '大広間', x: 16, y: SHIRO_Y0 + 21 },
    { id: 'jomon', label: '城門', x: 23.5, y: SHIRO_Y0 + 25 },
    { id: 'shiroStation', label: '駅', x: 5, y: SHIRO_Y0 + 28 }
];

// ----- 忍びの屋敷 (6 章「忍びの屋敷と 消えた メダル」。2026-10-29) -----
export const YASHIKI_IN = { x: 5, y: YASHIKI_Y0 + 31, dir: 'down' };
export const YASHIKI_PLACES = [
    { id: 'okunoma', label: '奥の間', x: 24, y: YASHIKI_Y0 + 4 },
    { id: 'nishinoma', label: '西の間', x: 12.5, y: YASHIKI_Y0 + 4 },
    { id: 'kura', label: '蔵', x: 35.5, y: YASHIKI_Y0 + 4 },
    { id: 'niwa', label: '庭', x: 18, y: YASHIKI_Y0 + 18 },
    { id: 'mon', label: '門', x: 23.5, y: YASHIKI_Y0 + 23 },
    { id: 'yashikiStation', label: '駅', x: 5, y: YASHIKI_Y0 + 28 }
];

// ----- ネット寺 (5 章「ネット寺の のろい」。2026-10-29) -----
export const TERA_IN = { x: 5, y: TERA_Y0 + 31, dir: 'down' };
// ボスに 勝った あと (書庫の 前)
export const TERA_AFTER_BOSS = { x: 36, y: TERA_Y0 + 7, dir: 'up' };
export const TERA_PLACES = [
    { id: 'hondou', label: '本堂', x: 24, y: TERA_Y0 + 3 },
    { id: 'shouro', label: '鐘楼', x: 11.5, y: TERA_Y0 + 4 },
    { id: 'shoko', label: '書庫', x: 37, y: TERA_Y0 + 4 },
    { id: 'takeyabu', label: '竹やぶ', x: 8, y: TERA_Y0 + 22 },
    { id: 'ike', label: '池', x: 33.5, y: TERA_Y0 + 21 },
    { id: 'teraStation', label: '駅', x: 5, y: TERA_Y0 + 28 }
];
// 黒い 紋に とりつかれた なかま (5 章): 話しかけると バトル。勝つと 紋が 消えて なかまに なる (g.mysteries に 入る)。
//   3 体 ぜんぶ 助けると 本堂の うらに 鬼の 角の かげ → ダイシが 紋に のまれる (ボス)
export const MONS = [
    { id: 'monShouro', label: '鐘楼の 紋つき', x: 12, y: TERA_Y0 + 11, nakama: 'htmlmokkun', lv: 20,
        lines: ['鐘楼の 前に、体に 黒い 紋の うかんだ キャラが 立っている……。'], done: '鐘楼の 鐘が しずかに ゆれている。' },
    { id: 'monShoko', label: '書庫の 紋つき', x: 35, y: TERA_Y0 + 11, nakama: 'loadingu', lv: 20,
        lines: ['書庫の 前で、黒い 紋の キャラが ぐるぐる 回りつづけている……。'], done: '書庫の とびらが あいている。' },
    { id: 'monSandou', label: '参道の 紋つき', x: 23, y: TERA_Y0 + 20, nakama: 'enjoubouzu', lv: 21,
        lines: ['参道の まんなかで、黒い 紋の 坊主が 火を ふいている……。'], done: '参道に こげあとが のこっている。' }
];

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
export const areaAt = (x, y) => (y >= KURAI_Y0 ? 'kurai' : y >= TSUBO_Y0 ? 'tsubo' : y >= KINNIKU_Y0 ? 'kinniku' : y >= PARK_Y0 ? 'park' : y >= SHIRO_Y0 ? 'shiro' : y >= MOON_Y0 ? 'moon' : y >= YASHIKI_Y0 ? 'yashiki' : y >= TERA_Y0 ? 'tera' : y >= UMI_Y0 ? 'umi' : y >= YAMA_Y0 ? 'yama' : y >= SCHOOL_Y0 ? 'school' : y >= TOWN_H ? 'shoutengai' : 'ishinokawa');
export const inSchoolTile = y => y >= SCHOOL_Y0 && y < YAMA_Y0;
// 町・学校・山・海 は つながって いないので、カメラと 地図は べつに する。[上, 下) の マス
export const regionOf = ty => (ty >= KURAI_Y0 ? [KURAI_Y0, MAP_H] : ty >= TSUBO_Y0 ? [TSUBO_Y0, KURAI_Y0] : ty >= KINNIKU_Y0 ? [KINNIKU_Y0, TSUBO_Y0] : ty >= PARK_Y0 ? [PARK_Y0, KINNIKU_Y0] : ty >= SHIRO_Y0 ? [SHIRO_Y0, PARK_Y0] : ty >= MOON_Y0 ? [MOON_Y0, SHIRO_Y0] : ty >= YASHIKI_Y0 ? [YASHIKI_Y0, MOON_Y0] : ty >= TERA_Y0 ? [TERA_Y0, YASHIKI_Y0] : ty >= UMI_Y0 ? [UMI_Y0, TERA_Y0] : ty >= YAMA_Y0 ? [YAMA_Y0, UMI_Y0] : ty >= SCHOOL_Y0 ? [SCHOOL_Y0, YAMA_Y0] : [0, SCHOOL_Y0]);
// どうくつの 中か (4 章。バトルの 背景が かわる)
export const inCaveTile = (x, y) => y >= UMI_Y0 && y < TERA_Y0 && x >= 30;
