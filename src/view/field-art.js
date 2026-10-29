// =====================================================================
// 町の 絵: マス・建物・鳥居を 1 枚の 絵に して おく (毎コマ 描かない)
// ---------------------------------------------------------------------
// 1 ドット = 1 ピクセルの 絵 (768 × 960) を 作り、上画面に 写す (ぼやけない)
// =====================================================================
import { TILE, MAP_W, MAP_H, TILES, BUILDINGS, PROPS, MYSTERIES, WET, tileAt } from '../data/map.js';

// マスの 場所で 決まる 乱数 (毎回 同じ 絵に なる)
const hash = (x, y, k = 0) => {
    let h = (x * 374761393 + y * 668265263 + k * 2147483647) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return (h ^ (h >>> 16)) / 4294967296;
};

export const MINI_COLORS = { G: '#6cc04a', F: '#8ad070', T: '#2e6e2e', R: '#b8b0a0', W: '#3a8ad0', B: '#b07a48', P: '#c8c0b0', S: '#e8d8a0', K: '#c8c8c0', A: '#6a6a72',
    L: '#c89a62', X: '#3a3040', Y: '#d8eef0', M: '#c03a3a',
    U: '#8a6a4a', H: '#7a5a3a', N: '#f0f6fa', Q: '#9aa0a8', D: '#a89a80', E: '#b8a888', I: '#9ad8f0',
    J: '#4a4e58', C: '#7a7468', Z: '#4a3624', O: '#c8c070' };

function drawTile(c, ch, x, y, wet = false) {
    const px = x * TILE, py = y * TILE;
    const r = (dx, dy, w, h, color) => { c.fillStyle = color; c.fillRect(px + dx, py + dy, w, h); };
    const grass = () => {
        r(0, 0, 16, 16, '#6cc04a');
        for (let i = 0; i < 5; i++) r(Math.floor(hash(x, y, i) * 15), Math.floor(hash(x, y, i + 9) * 14), 1, 2, '#58a83a');
    };
    switch (ch) {
        case 'G': grass(); break;
        case 'F': {
            grass();
            const colors = ['#ff6a8a', '#ffd84a', '#ffffff', '#c88aff'];
            for (let i = 0; i < 4; i++) {
                const fx = 1 + Math.floor(hash(x, y, i + 20) * 13), fy = 1 + Math.floor(hash(x, y, i + 30) * 13);
                r(fx, fy, 2, 2, colors[i % 4]);
                r(fx, fy + 2, 1, 1, '#3a8a3a');
            }
            break;
        }
        case 'T':
            grass();
            r(6, 10, 4, 6, '#7a4a2a');
            r(1, 2, 14, 9, '#2e7d32'); r(3, 0, 10, 2, '#2e7d32'); r(3, 3, 5, 3, '#4aa04a'); r(9, 6, 3, 2, '#256a28');
            break;
        case 'R':
            r(0, 0, 16, 16, '#b8b0a0');
            if (hash(x, y) < 0.3) r(Math.floor(hash(x, y, 2) * 13), Math.floor(hash(x, y, 3) * 13), 2, 1, '#a09888');
            break;
        case 'W':
            r(0, 0, 16, 16, '#3a8ad0');
            r(Math.floor(hash(x, y, 4) * 10), 4 + Math.floor(hash(x, y, 5) * 8), 5, 1, '#6ab0e8');
            break;
        case 'B': {
            r(0, 0, 16, 16, '#b07a48');
            for (let i = 0; i < 16; i += 4) r(i, 0, 1, 16, '#8a5a2a');
            if (tileAt(x, y - 1) !== 'B') r(0, 0, 16, 3, '#6a4020');
            if (tileAt(x, y + 1) !== 'B') r(0, 13, 16, 3, '#6a4020');
            break;
        }
        case 'P':
            r(0, 0, 16, 16, '#c8c0b0');
            for (let i = 0; i < 4; i++) {
                const sx = Math.floor(hash(x, y, i + 40) * 12), sy = Math.floor(hash(x, y, i + 50) * 12);
                r(sx, sy, 4, 3, '#9a948a'); r(sx + 1, sy, 2, 1, '#e0dad0');
            }
            break;
        case 'S':
            r(0, 0, 16, 16, '#e8d8a0');
            if (hash(x, y, 7) < 0.5) r(Math.floor(hash(x, y, 8) * 14), Math.floor(hash(x, y, 9) * 14), 1, 1, '#d0bc80');
            break;
        case 'K':
            r(0, 0, 16, 16, '#c8c8c0');
            r(0, 7, 16, 1, '#b0b0a8'); r((y % 2) * 8, 0, 1, 7, '#b0b0a8'); r(((y + 1) % 2) * 8, 8, 1, 8, '#b0b0a8');
            break;
        case 'A':
            r(0, 0, 16, 16, '#6a6a72');
            if (x % 2 === 0) r(0, 2, 1, 12, '#f0f0f0');
            break;
        // ----- 学校の 中 (2 章) -----
        case 'L':
            r(0, 0, 16, 16, '#c89a62');
            r(0, (x % 2) * 8 + 7, 16, 1, '#a87a48');
            r(((y * 5) % 16), 0, 1, 16, '#b88a52');
            break;
        case 'X': {
            // かべ: 上は こい 色、ゆかに 面した ところは 明るい かべ
            const face = tileAt(x, y + 1) !== 'X';
            r(0, 0, 16, 16, '#3a3040');
            if (face) { r(0, 4, 16, 12, '#e8e0cc'); r(0, 13, 16, 3, '#8a7a5a'); }
            break;
        }
        case 'Y':
            r(0, 0, 16, 16, '#d8eef0');
            r(0, 0, 16, 1, '#b0d0d8'); r(0, 0, 1, 16, '#b0d0d8'); r(8, 0, 1, 16, '#c0dce4'); r(0, 8, 16, 1, '#c0dce4');
            break;
        case 'M':
            r(0, 0, 16, 16, '#c89a62');
            r(1, 2, 14, 12, '#c03a3a'); r(2, 4, 12, 1, '#e86a5a'); r(2, 9, 12, 1, '#e86a5a');
            break;
        // ----- 山と ダム (3 章) -----
        case 'U':   // 山道の 入り口 (土の 道と 丸太の 段)
            r(0, 0, 16, 16, '#9a7a52');
            r(0, 3, 16, 2, '#6a4a2a'); r(0, 10, 16, 2, '#6a4a2a');
            r(0, 5, 16, 1, '#b89a6a'); r(0, 12, 16, 1, '#b89a6a');
            break;
        case 'H':   // 畑 (うねと 葉っぱ)
            r(0, 0, 16, 16, '#7a5a3a');
            r(0, 3, 16, 3, '#8a6a48'); r(0, 11, 16, 3, '#8a6a48');
            if ((x + y) % 2) { r(3, 1, 2, 3, '#4aa04a'); r(5, 0, 2, 3, '#5ab05a'); }
            if ((x + y) % 2 === 0) { r(10, 9, 2, 3, '#4aa04a'); r(12, 8, 2, 3, '#5ab05a'); }
            break;
        case 'N':   // 雪
            r(0, 0, 16, 16, '#f0f6fa');
            for (let i = 0; i < 3; i++) r(Math.floor(hash(x, y, i + 60) * 14), Math.floor(hash(x, y, i + 70) * 14), 2, 1, '#d0e0ea');
            break;
        case 'Q': { // ダムの かべ (コンクリート)
            r(0, 0, 16, 16, '#9aa0a8');
            r(0, 0, 16, 3, '#c8ccd2'); r(0, 13, 16, 3, '#7a8088');
            r((x % 2) * 8, 3, 1, 10, '#8a9098');
            break;
        }
        case 'D': case 'E': {
            // かれた 沢・水が 消えた 湖の 底 (ひびわれ と 石)。3 章 クリアで 水 (wet)
            if (wet) { drawTile(c, 'W', x, y, false); break; }
            r(0, 0, 16, 16, ch === 'D' ? '#a89a80' : '#b8a888');
            r(Math.floor(hash(x, y, 80) * 10), Math.floor(hash(x, y, 81) * 12), 6, 1, '#8a7a60');
            r(Math.floor(hash(x, y, 82) * 12), Math.floor(hash(x, y, 83) * 10), 1, 5, '#8a7a60');
            if (hash(x, y, 84) < 0.4) { const sx = Math.floor(hash(x, y, 85) * 12); r(sx, 9, 4, 3, '#9a948a'); r(sx + 1, 9, 2, 1, '#d0cac0'); }
            break;
        }
        case 'I': { // 氷の 城 (氷の ブロック)
            if (wet) { drawTile(c, 'W', x, y, false); break; }
            r(0, 0, 16, 16, '#9ad8f0');
            r(0, 0, 16, 1, '#e0f6ff'); r(0, 8, 16, 1, '#7ac0e0'); r((y % 2) * 8, 0, 1, 8, '#7ac0e0'); r(((y + 1) % 2) * 8, 8, 1, 8, '#7ac0e0');
            r(2, 2, 3, 2, '#ffffff');
            break;
        }
        // ----- 海辺の 町と 海岸どうくつ (4 章) -----
        case 'J': { // 岩の がけ (どうくつの かべ)。ゆかに 面した ところは 明るい 岩はだ
            r(0, 0, 16, 16, '#3a3e48');
            r(Math.floor(hash(x, y, 90) * 10), Math.floor(hash(x, y, 91) * 10), 6, 4, '#4a4e58');
            if (tileAt(x, y + 1) === 'C' || tileAt(x, y + 1) === 'S' || tileAt(x, y + 1) === 'G' || tileAt(x, y + 1) === 'R') { r(0, 9, 16, 7, '#6a6e78'); r(0, 15, 16, 1, '#2a2e36'); }
            break;
        }
        case 'C':   // どうくつの ゆか (しめった 岩と 小石)
            r(0, 0, 16, 16, '#7a7468');
            if (hash(x, y, 92) < 0.5) r(Math.floor(hash(x, y, 93) * 12), Math.floor(hash(x, y, 94) * 12), 4, 2, '#6a6458');
            if (hash(x, y, 95) < 0.3) r(Math.floor(hash(x, y, 96) * 14), Math.floor(hash(x, y, 97) * 14), 1, 1, '#c8e0f0');
            break;
        // ----- 忍びの屋敷 (6 章) -----
        case 'Z': { // 屋敷の かべ (板べい)。ゆかや 庭に 面した ところは 明るい 板
            r(0, 0, 16, 16, '#3a2818');
            const below = tileAt(x, y + 1);
            if (below !== 'Z' && below !== 'T') { r(0, 4, 16, 12, '#8a6440'); for (let i = 0; i < 16; i += 4) r(i, 4, 1, 12, '#6a4a2c'); r(0, 4, 16, 1, '#a07a50'); }
            else r(0, 0, 16, 2, '#5a4028');
            break;
        }
        case 'O':   // たたみ
            r(0, 0, 16, 16, '#c8c070');
            r(0, (x + y) % 2 ? 0 : 15, 16, 1, '#5a6a3a');
            for (let i = 2; i < 16; i += 3) r(0, i, 16, 1, '#b8b060');
            break;
        default:
            r(0, 0, 16, 16, '#ff00ff');
    }
}

function drawBuilding(c, b) {
    const px = b.x * TILE, py = b.y * TILE, w = b.w * TILE, h = b.h * TILE;
    const roofH = Math.round(h * 0.45);
    // 屋根
    c.fillStyle = b.roof;
    c.fillRect(px - 2, py, w + 4, roofH);
    c.fillStyle = 'rgba(0,0,0,0.18)';
    for (let i = 4; i < roofH; i += 4) c.fillRect(px - 2, py + i, w + 4, 1);
    // かべ
    c.fillStyle = b.wall;
    c.fillRect(px, py + roofH, w, h - roofH);
    c.fillStyle = 'rgba(0,0,0,0.15)';
    c.fillRect(px, py + roofH, w, 2);
    // まど
    for (let tx = 0; tx < b.w; tx++) {
        const wx = px + tx * TILE + 4;
        if (b.x + tx === b.door.x) continue;
        if (h - roofH > 20) {
            c.fillStyle = '#5a8ac0';
            c.fillRect(wx, py + roofH + 6, 8, 7);
            c.fillStyle = '#bfe0ff';
            c.fillRect(wx + 1, py + roofH + 7, 3, 2);
        }
    }
    // 入り口
    const dx = b.door.x * TILE, dy = b.door.y * TILE;
    c.fillStyle = '#5a3a20';
    c.fillRect(dx + 3, dy + 3, 10, 13);
    c.fillStyle = '#ffd84a';
    c.fillRect(dx + 10, dy + 9, 1, 2);
}

function drawProp(c, p) {
    if (p.kind !== 'torii') return;
    const px = p.x * TILE, py = p.y * TILE;
    c.fillStyle = '#d0402a';
    c.fillRect(px + 6, py - 6, 4, 22);
}

// wet: 3 章 クリアの あと (かれた 沢・湖の 底・氷の 城が 水に もどる)
export function buildFieldCanvas(wet = false) {
    const cv = document.createElement('canvas');
    cv.width = MAP_W * TILE;
    cv.height = MAP_H * TILE;
    const c = cv.getContext('2d');
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) drawTile(c, TILES[y][x], x, y, wet);
    BUILDINGS.forEach(b => drawBuilding(c, b));
    PROPS.forEach(p => drawProp(c, p));
    // 鳥居の 上の 横木 (左右の 柱を つなぐ)
    const l = PROPS.find(p => p.id === 'torii-l'), rr = PROPS.find(p => p.id === 'torii-r');
    if (l && rr) {
        c.fillStyle = '#d0402a';
        c.fillRect(l.x * TILE + 2, l.y * TILE - 8, (rr.x - l.x) * TILE + 12, 3);
        c.fillStyle = '#2a2a2a';
        c.fillRect(l.x * TILE, l.y * TILE - 11, (rr.x - l.x) * TILE + 16, 3);
    }
    drawLandmarks(c);
    MYSTERIES.forEach(m => drawMysteryProp(c, m));
    return cv;
}

// 七不思議の 物 (2 章)。いつも ある 物。まだ たしかめて いない ものには field.js が「？」を 足す
function drawMysteryProp(c, m) {
    const x = m.x * TILE, y = m.y * TILE;
    const r = (dx, dy, w, h, color) => { c.fillStyle = color; c.fillRect(x + dx, y + dy, w, h); };
    switch (m.prop) {
        case 'skeleton':   // ガイコツの 標本 (台と 骨)
            r(7, 12, 2, 4, '#5a4a3a'); r(4, 15, 8, 1, '#5a4a3a');
            r(5, -2, 6, 5, '#f0f0e0'); r(6, 0, 1, 1, '#222'); r(9, 0, 1, 1, '#222');
            r(7, 3, 2, 8, '#f0f0e0'); r(4, 5, 8, 1, '#e0e0d0'); r(4, 7, 8, 1, '#e0e0d0'); r(5, 10, 6, 1, '#e0e0d0');
            break;
        case 'piano':      // ピアノ
            r(0, 2, 16, 12, '#1a1a22'); r(1, 9, 14, 3, '#f8f8f8');
            for (let i = 2; i < 15; i += 2) r(i, 9, 1, 2, '#1a1a22');
            r(2, 14, 2, 2, '#1a1a22'); r(12, 14, 2, 2, '#1a1a22');
            break;
        case 'books':      // 本だな
            r(0, -4, 16, 20, '#7a4a2a');
            [['#c84a4a', '#4a7ac8', '#5ab05a', '#d8b84a'], ['#8a5ac8', '#d87a3a', '#4a9aa8', '#c8c8c8']].forEach((cols, row) => {
                cols.forEach((col, i) => r(1 + i * 3.5, -2 + row * 9, 3, 7, col));
            });
            break;
        case 'mirror':     // 大鏡
            r(2, -6, 12, 20, '#8a6a3a'); r(3, -5, 10, 18, '#bfe8ff'); r(4, -4, 3, 6, '#ffffff');
            break;
        case 'crates':     // とびばこ
            r(1, 4, 14, 4, '#d8b070'); r(1, 8, 14, 4, '#c8a060'); r(1, 12, 14, 4, '#b89050'); r(3, 1, 10, 3, '#f0f0f0');
            break;
        case 'locker':     // そうじ用具入れ
            r(2, -6, 12, 22, '#7a8a9a'); r(3, -5, 10, 20, '#8a9aaa');
            r(5, -3, 6, 1, '#4a5a6a'); r(5, -1, 6, 1, '#4a5a6a'); r(11, 4, 1, 3, '#ffd84a');
            break;
        case 'ladder':     // プールの はしご
            r(3, 0, 2, 16, '#c8c8d0'); r(11, 0, 2, 16, '#c8c8d0'); r(3, 4, 10, 1, '#c8c8d0'); r(3, 9, 10, 1, '#c8c8d0');
            break;
    }
}

// かくれ場所の 目じるし (いつも ある 物。キャラが いるときだけ cues.js が 違和感を 足す)
function drawLandmarks(c) {
    // 小学校の 裏山の お地蔵さん (25, 3)
    const jx = 25 * TILE + 8, jy = 3 * TILE + 8;
    c.fillStyle = '#9a9aa0'; c.fillRect(jx - 5, jy - 8, 10, 14);
    c.fillStyle = '#b4b4ba'; c.fillRect(jx - 4, jy - 11, 8, 4);
    c.fillStyle = '#d03a3a'; c.fillRect(jx - 5, jy - 3, 10, 4);
    c.fillStyle = '#5a5a60'; c.fillRect(jx - 2, jy - 9, 1, 1); c.fillRect(jx + 1, jy - 9, 1, 1);
    c.fillStyle = '#707078'; c.fillRect(jx - 6, jy + 6, 12, 2);
    // 駐車場の 車 (4, 31 の 上)
    const cx = 4 * TILE + 8, cy = 31 * TILE + 8;
    c.fillStyle = '#3a6ac8'; c.fillRect(cx - 16, cy - 14, 32, 12);
    c.fillStyle = '#5a8ae8'; c.fillRect(cx - 10, cy - 20, 20, 7);
    c.fillStyle = '#bfe0ff'; c.fillRect(cx - 8, cy - 19, 7, 5); c.fillRect(cx + 1, cy - 19, 7, 5);
    c.fillStyle = '#202028'; c.fillRect(cx - 13, cy - 3, 6, 5); c.fillRect(cx + 7, cy - 3, 6, 5);
    c.fillStyle = '#ffe08a'; c.fillRect(cx + 14, cy - 11, 2, 3);
    // ----- 商店街 (段階 2) -----
    // 電気屋の 前の 古い テレビ (20, 53)
    const tx = 20 * TILE + 8, ty = 53 * TILE + 8;
    c.fillStyle = '#5a4a3a'; c.fillRect(tx - 7, ty - 8, 14, 12);
    c.fillStyle = '#2a3a3a'; c.fillRect(tx - 5, ty - 6, 9, 8);
    c.fillStyle = '#8a7a6a'; c.fillRect(tx + 5, ty - 5, 1, 1); c.fillRect(tx + 5, ty - 2, 1, 1);
    c.fillStyle = '#3a3030'; c.fillRect(tx - 5, ty + 4, 2, 3); c.fillRect(tx + 3, ty + 4, 2, 3);
    // 八百屋の 横の ガチャの 機械 (27, 45)
    const gx = 27 * TILE + 8, gy = 45 * TILE + 8;
    c.fillStyle = '#e83a3a'; c.fillRect(gx - 5, gy - 2, 10, 9);
    c.fillStyle = '#d8eef8'; c.fillRect(gx - 5, gy - 11, 10, 9);
    c.fillStyle = '#ffd84a'; c.fillRect(gx - 3, gy - 8, 3, 3);
    c.fillStyle = '#5ad06a'; c.fillRect(gx + 1, gy - 6, 3, 3);
    c.fillStyle = '#ffffff'; c.fillRect(gx - 1, gy + 1, 3, 3);
    // 雀荘の 看板 (7, 53): 牌の 形
    const jx2 = 7 * TILE + 8, jy2 = 53 * TILE + 8;
    c.fillStyle = '#4a3a2a'; c.fillRect(jx2 - 1, jy2 - 2, 2, 9);
    c.fillStyle = '#f8f4e8'; c.fillRect(jx2 - 5, jy2 - 11, 10, 11);
    c.fillStyle = '#2a8a4a'; c.fillRect(jx2 - 5, jy2 - 11, 10, 2);
    // 銭湯の 裏の ネオン看板 (46, 49)
    const nx = 46 * TILE + 8, ny = 49 * TILE + 8;
    c.fillStyle = '#2a2a3a'; c.fillRect(nx - 6, ny - 10, 12, 14);
    c.fillStyle = '#ff5ae0'; c.fillRect(nx - 4, ny - 8, 8, 2); c.fillRect(nx - 4, ny - 3, 8, 2);
    c.fillStyle = '#5ae0ff'; c.fillRect(nx - 4, ny - 6, 2, 3);
    // 広場の 屋台の のれん (18, 56)
    const yx = 18 * TILE, yy = 56 * TILE;
    c.fillStyle = '#8a5a2a'; c.fillRect(yx, yy + 2, 30, 12);
    c.fillStyle = '#d83a3a'; c.fillRect(yx - 2, yy - 4, 34, 6);
    c.fillStyle = '#f8f0e0'; for (let i = 0; i < 4; i++) c.fillRect(yx + 2 + i * 8, yy + 2, 6, 5);
}

export function buildMiniMap(scale = 3, wet = false) {
    const cv = document.createElement('canvas');
    cv.width = MAP_W * scale;
    cv.height = MAP_H * scale;
    const c = cv.getContext('2d');
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
        const ch = TILES[y][x];
        c.fillStyle = MINI_COLORS[wet && WET.has(ch) ? 'W' : ch] || '#000';
        c.fillRect(x * scale, y * scale, scale, scale);
    }
    BUILDINGS.forEach(b => {
        c.fillStyle = b.roof;
        c.fillRect(b.x * scale, b.y * scale, b.w * scale, b.h * scale);
    });
    return cv;
}
