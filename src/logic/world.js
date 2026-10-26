// =====================================================================
// 町の 中を 歩く: ぶつかる・調べる・見えない 線を 越えたときの できごと (画面に ふれない)
// ---------------------------------------------------------------------
// こおりくんの 位置 (g.pos) は ドットの 座標で、足元の まんなか。ぶつかる 箱は 足元の 10 × 6 ドット
// =====================================================================
import { TILE, BLOCK, BUILDINGS, PROPS, PEOPLE, tileAt } from '../data/map.js';

const HALF_W = 5, BOX_H = 6;

export function peopleHere(g) {
    return PEOPLE.filter(p =>
        !p.only ||
        (p.only === 'beforeWatch' && g.story === 'intro') ||
        (p.only === 'beforeClear' && g.story !== 'clear'));
}

// そのマスに 入れないか
export function blockedTile(g, tx, ty) {
    if (BLOCK.has(tileAt(tx, ty))) return true;
    if (BUILDINGS.some(b => tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h)) return true;
    if (PROPS.some(p => p.x === tx && p.y === ty)) return true;
    return peopleHere(g).some(p => p.x === tx && ty >= p.y && ty < p.y + (p.h || 1));
}

function boxFree(g, x, y) {
    const x0 = Math.floor((x - HALF_W) / TILE), x1 = Math.floor((x + HALF_W - 0.01) / TILE);
    const y0 = Math.floor((y - BOX_H) / TILE), y1 = Math.floor((y - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (blockedTile(g, tx, ty)) return false;
    return true;
}

// 横と 縦を べつべつに 動かす (かべに そって すべれる)
export function moveHero(g, dx, dy) {
    const p = g.pos;
    if (dx && boxFree(g, p.x + dx, p.y)) p.x += dx;
    if (dy && boxFree(g, p.x, p.y + dy)) p.y += dy;
    if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left';
    else if (dy) p.dir = dy > 0 ? 'down' : 'up';
}

export const heroTile = g => ({ x: Math.floor(g.pos.x / TILE), y: Math.floor((g.pos.y - 3) / TILE) });

export function facingTile(g) {
    const t = heroTile(g);
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[g.pos.dir];
    return { x: t.x + d[0], y: t.y + d[1] };
}

// 前の マスを 調べる: 人 か 建物の 入り口
export function lookAt(g) {
    const f = facingTile(g);
    const person = peopleHere(g).find(p => p.x === f.x && f.y >= p.y && f.y < p.y + (p.h || 1));
    if (person) return { type: 'person', person };
    const door = BUILDINGS.find(b => b.door.x === f.x && b.door.y === f.y);
    if (door) return { type: 'door', building: door };
    return null;
}

// 神社の 石だたみに 入ったら (ふるカワに 会う)
export const inShrine = g => {
    const t = heroTile(g);
    return t.x >= 2 && t.x <= 10 && t.y >= 2 && t.y <= 9;
};
