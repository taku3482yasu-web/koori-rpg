// =====================================================================
// ダンジョンの 奥の エリア (2026-11-03 ユーザー指定: ダンジョンを 大きく して 探索の しがいを。奥の エリアを 足す)
// ---------------------------------------------------------------------
// いまの ダンジョンは そのまま、それぞれに 広い「奥」を つなぐ。地図の いちばん 下 (OKU_Y0 から) に 1 つ 40 行ずつ 足す。
// 中は 部屋と 通路の 迷路 (毎回 同じ 形。id から きまる 乱数)。いちばん 奥の 部屋に レアな 宝箱、行き止まりの 部屋にも 宝箱。
//   parent: もとの ダンジョンの 地区 (areaAt は この 地区を 返す = BGM・紋つき・背景は もとと 同じ)
//   wall / floor / accent: マスの 文字 (map.js)。gate: もとの ダンジョンの 入り口を おく 場所の めやす (parent の 上から の マス)
//   place: バトルの 背景 / lvAdd: もとの ダンジョンより どれだけ 強いか
// =====================================================================
export const OKU_H = 40;
export const OKU = [
    { id: 'yamaOku', parent: 'yama', name: '山の 氷穴', place: 'yama', wall: 'J', floor: 'C', accent: 'N', gate: { x: 44, y: 3 }, lvAdd: 3 },
    { id: 'umiOku', parent: 'umi', name: '海底どうくつ', place: 'cave', wall: 'J', floor: 'C', accent: 'S', gate: { x: 45, y: 20 }, lvAdd: 3 },
    { id: 'teraOku', parent: 'tera', name: '迷いの 竹林', place: 'tera', wall: 'T', floor: 'G', accent: 'K', gate: { x: 2, y: 25 }, lvAdd: 3 },
    { id: 'yashikiOku', parent: 'yashiki', name: 'からくり 地下道', place: 'yashiki', wall: 'Z', floor: 'L', accent: 'O', gate: { x: 45, y: 12 }, lvAdd: 3 },
    { id: 'moonOku', parent: 'moon', name: '月の迷宮 裏層', place: 'moon', wall: 'V', floor: 'v', accent: 'v', gate: { x: 44, y: 28 }, lvAdd: 3 },
    { id: 'shiroOku', parent: 'shiro', name: 'SE城 地下 宝物蔵', place: 'shiro', wall: 'k', floor: 'r', accent: 'K', gate: { x: 44, y: 24 }, lvAdd: 3 },
    { id: 'kinnikuOku', parent: 'kinniku', name: '修行の 洞穴', place: 'kinniku', wall: 'J', floor: 'C', accent: 'N', gate: { x: 44, y: 20 }, lvAdd: 3 },
    { id: 'tsuboOku', parent: 'tsubo', name: '溶岩の 迷路', place: 'tsubo', wall: 'J', wall2: 'm', floor: 'C', accent: 'C', gate: { x: 44, y: 28 }, lvAdd: 3 },
    { id: 'kuraiOku', parent: 'kurai', name: '喰らいの 城 地下牢', place: 'kurai', wall: 'V', floor: 'v', accent: 'K', gate: { x: 44, y: 32 }, lvAdd: 3 }
];

// id から きまる 乱数
function rngOf(id) {
    let s = 2166136261;
    for (const ch of id) s = Math.imul(s ^ ch.charCodeAt(0), 16777619) >>> 0;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

// t: 地図の マス (配列の 配列)・y0: この エリアの 上の 行・W: 地図の はば
// → { rooms, start: { x, y } (着く マス), exit: { x, y } (もどり道), far: いちばん 奥の 部屋, deadEnds: 行き止まりの 部屋 }
export function carveOku(t, def, y0, W) {
    const rand = rngOf(def.id);
    const int = n => Math.floor(rand() * n);
    const H = OKU_H;
    for (let y = y0; y < y0 + H; y++) for (let x = 0; x < W; x++) t[y][x] = def.wall2 && rand() < 0.25 ? def.wall2 : def.wall;
    const COLS = 4, ROWS = 4, CW = Math.floor(W / COLS), CH = Math.floor(H / ROWS);
    const rooms = [];
    for (let cy = 0; cy < ROWS; cy++) for (let cx = 0; cx < COLS; cx++) {
        const w = 5 + int(4), h = 4 + int(2);
        const x = cx * CW + 1 + int(CW - 2 - w), y = y0 + cy * CH + 1 + int(CH - 2 - h);
        rooms.push({ i: rooms.length, cx, cy, x, y, w, h, links: [] });
    }
    const carve = (x, y) => { if (x > 0 && x < W - 1 && y > y0 && y < y0 + H - 1) t[y][x] = rand() < 0.1 ? def.accent : def.floor; };
    for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) carve(x, y);
    const at = (cx, cy) => rooms[cy * COLS + cx];
    const center = r => ({ x: r.x + Math.floor(r.w / 2), y: r.y + Math.floor(r.h / 2) });
    // 2 マス はばの L 字の 通路
    function corridor(a, b) {
        const p = center(a), q = center(b);
        const hFirst = rand() < 0.5;
        const xs = [Math.min(p.x, q.x), Math.max(p.x, q.x)], ys = [Math.min(p.y, q.y), Math.max(p.y, q.y)];
        const hy = hFirst ? p.y : q.y, vx = hFirst ? q.x : p.x;
        for (let x = xs[0]; x <= xs[1]; x++) { carve(x, hy); carve(x, hy + 1); }
        for (let y = ys[0]; y <= ys[1]; y++) { carve(vx, y); carve(vx + 1, y); }
        a.links.push(b.i); b.links.push(a.i);
    }
    // つながりの 木 (入り口の 部屋 = 下の まんなか から)
    const startRoom = at(1, ROWS - 1);
    const seen = new Set([startRoom.i]);
    const stack = [startRoom];
    while (stack.length) {
        const r = stack[stack.length - 1];
        const next = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (r.cx + dx >= 0 && r.cx + dx < COLS && r.cy + dy >= 0 && r.cy + dy < ROWS ? at(r.cx + dx, r.cy + dy) : null)).filter(n => n && !seen.has(n.i));
        if (!next.length) { stack.pop(); continue; }
        const n = next[int(next.length)];
        corridor(r, n);
        seen.add(n.i);
        stack.push(n);
    }
    // ぐるっと 回れる 道を 2 本
    for (let k = 0; k < 2; k++) {
        const a = rooms[int(rooms.length)];
        const b = rooms.find(r => Math.abs(r.cx - a.cx) + Math.abs(r.cy - a.cy) === 1 && !a.links.includes(r.i));
        if (b) corridor(a, b);
    }
    // いちばん 奥の 部屋 (つながりで いちばん 遠い)
    const dist = { [startRoom.i]: 0 };
    const q = [startRoom];
    while (q.length) {
        const r = q.shift();
        for (const j of r.links) if (dist[j] === undefined) { dist[j] = dist[r.i] + 1; q.push(rooms[j]); }
    }
    const far = rooms.reduce((a, b) => (dist[b.i] > dist[a.i] ? b : a), startRoom);
    const deadEnds = rooms.filter(r => r !== startRoom && r !== far && r.links.length === 1);
    // もどり道 (入り口の 部屋の 下の かべ ぎわ)・着く マス (その 上)
    const exit = { x: center(startRoom).x, y: startRoom.y + startRoom.h - 1 };
    const start = { x: exit.x, y: exit.y - 1 };
    return { rooms, start, exit, far, deadEnds, startRoom };
}

// 部屋の すみの マス (宝箱を おく。通り道を ふさがない よう 角)
export const roomCorner = (r, k = 0) => [{ x: r.x, y: r.y }, { x: r.x + r.w - 1, y: r.y }, { x: r.x, y: r.y + r.h - 1 }, { x: r.x + r.w - 1, y: r.y + r.h - 1 }][k % 4];
