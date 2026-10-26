// =====================================================================
// 石の川タウン の 地図 (設計書 5.1。1 章の 舞台)
// ---------------------------------------------------------------------
// 1 マス 16 ドット・48 × 36 マス。まんなかを 石の川が 南北に 流れ、石の川橋 だけで 東西が つながる。
// 1 章の あいだは 橋に ヌシ が いて 東へ 渡れない (ボスを たおすと 通れる)。
//
//   tiles[y][x]: G 草 / F 花 / T 木 / R 道 / W 川 / B 橋 / P 川原の 石ころ / S 公園の 砂 / K 石だたみ / A 駐車場
//   BUILDINGS: 家などの 建物 (通れない)。door は 調べる マス (建物の 下の まんなか)
//   SPOTS: レンズで さがす 場所 (設計書 5.2)。kinds の time は 出る 時間帯、weather: 'rain' は 雨の日だけ
// =====================================================================
export const TILE = 16;
export const MAP_W = 48, MAP_H = 36;
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
    // 道
    fill(1, 17, 27, 18, 'R'); fill(36, 17, 46, 18, 'R');
    fill(12, 2, 13, 33, 'R'); fill(40, 2, 41, 33, 'R');
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
    { id: 'temple', label: '石の川寺', x: 42, y: 3, w: 5, h: 4, wall: '#a87a4a', roof: '#3a3a40', door: { x: 44, y: 6 } }
];

// 動かない 飾り (通れない): 鳥居の 柱
export const PROPS = [
    { id: 'torii-l', kind: 'torii', x: 5, y: 9 },
    { id: 'torii-r', kind: 'torii', x: 8, y: 9 }
];

// レンズで さがす 場所。x, y はマス。after: 'clear' は 1 章クリアのあとだけ
export const SPOTS = [
    { id: 'kawara', label: '川原の石ころ', x: 28, y: 11, kinds: [{ id: 'ishikoron', w: 3 }, { id: 'mizukirin', w: 2 }] },
    { id: 'riverTree', label: '川原の木の下', x: 25, y: 12, kinds: [{ id: 'donguriko', w: 1 }] },
    { id: 'park', label: '公園のしげみ', x: 17, y: 27, kinds: [{ id: 'nemuridake', w: 1 }, { id: 'nemuridake', w: 3, time: ['night'] }] },
    { id: 'dagashiBack', label: '駄菓子屋の裏', x: 21, y: 21, kinds: [{ id: 'pekorisu', w: 1 }] },
    { id: 'ishigaki', label: '石垣のツタ', x: 11, y: 3, kinds: [{ id: 'tsutankobu', w: 1 }] },
    { id: 'shrineTree', label: '神社の大きな木', x: 2, y: 3, kinds: [{ id: 'yofukashi', w: 1, time: ['night'] }] },
    { id: 'densen', label: '商店の電線', x: 14, y: 19, kinds: [{ id: 'kunaisuzume', w: 1 }] },
    { id: 'asase', label: '川の浅いところ', x: 29, y: 26, kinds: [{ id: 'kogame', w: 3 }, { id: 'shinobigaeru', w: 3, weather: 'rain' }] },
    { id: 'hashiue', label: '橋から見る川', x: 29, y: 16, kinds: [{ id: 'tsuribariuo', w: 1 }] },
    { id: 'toiletSide', label: '公園のトイレ', x: 26, y: 28, kinds: [{ id: 'daichouenkin', w: 1 }] },
    { id: 'uraYama', label: '小学校の裏山', x: 25, y: 3, kinds: [{ id: 'kawarimidanuki', w: 1 }] },
    { id: 'kadan', label: '花だん', x: 5, y: 26, kinds: [{ id: 'mumenbachi', w: 1 }] },
    { id: 'parking', label: '駐車場の車の下', x: 4, y: 31, kinds: [{ id: 'haribaby', w: 1 }] },
    { id: 'kawakami', label: '夏の川上', x: 29, y: 2, kinds: [{ id: 'soumennagare', w: 1 }] },
    { id: 'hashishita', label: '橋の下の水たまり', x: 28, y: 20, kinds: [{ id: 'kozarappa', w: 2 }, { id: 'hashishita', w: 2, after: 'clear' }] },
    { id: 'hondou', label: 'お寺の本堂', x: 43, y: 8, kinds: [{ id: 'mokugyoro', w: 1 }] },
    { id: 'teraUra', label: 'お寺の裏', x: 37, y: 3, kinds: [{ id: 'rousokubi', w: 1, time: ['night'] }] }
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
