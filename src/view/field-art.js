// =====================================================================
// 町の 絵: マス・建物・鳥居を 1 枚の 絵に して おく (毎コマ 描かない)
// ---------------------------------------------------------------------
// 1 ドット = 1 ピクセルの 絵 (768 × 960) を 作り、上画面に 写す (ぼやけない)
// =====================================================================
import { TILE, MAP_W, MAP_H, TILES, BUILDINGS, PROPS, tileAt } from '../data/map.js';

// マスの 場所で 決まる 乱数 (毎回 同じ 絵に なる)
const hash = (x, y, k = 0) => {
    let h = (x * 374761393 + y * 668265263 + k * 2147483647) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return (h ^ (h >>> 16)) / 4294967296;
};

export const MINI_COLORS = { G: '#6cc04a', F: '#8ad070', T: '#2e6e2e', R: '#b8b0a0', W: '#3a8ad0', B: '#b07a48', P: '#c8c0b0', S: '#e8d8a0', K: '#c8c8c0', A: '#6a6a72' };

function drawTile(c, ch, x, y) {
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

export function buildFieldCanvas() {
    const cv = document.createElement('canvas');
    cv.width = MAP_W * TILE;
    cv.height = MAP_H * TILE;
    const c = cv.getContext('2d');
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) drawTile(c, TILES[y][x], x, y);
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
    return cv;
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

export function buildMiniMap(scale = 3) {
    const cv = document.createElement('canvas');
    cv.width = MAP_W * scale;
    cv.height = MAP_H * scale;
    const c = cv.getContext('2d');
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
        c.fillStyle = MINI_COLORS[TILES[y][x]] || '#000';
        c.fillRect(x * scale, y * scale, scale, scale);
    }
    BUILDINGS.forEach(b => {
        c.fillStyle = b.roof;
        c.fillRect(b.x * scale, b.y * scale, b.w * scale, b.h * scale);
    });
    return cv;
}
