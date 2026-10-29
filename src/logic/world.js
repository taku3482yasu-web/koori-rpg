// =====================================================================
// 町の 中を 歩く: ぶつかる・調べる・見えない 線を 越えたときの できごと (画面に ふれない)
// ---------------------------------------------------------------------
// こおりくんの 位置 (g.pos) は ドットの 座標で、足元の まんなか。ぶつかる 箱は 足元の 10 × 6 ドット
// =====================================================================
import { TILE, BLOCK, WET, BUILDINGS, PROPS, PEOPLE, GATES, MYSTERIES, SEALS, tileAt } from '../data/map.js';
import { reached } from './story.js';

const HALF_W = 5, BOX_H = 6;

// 七不思議を いくつ たしかめたか (2 章)
export const mysteriesSolved = g => MYSTERIES.filter(m => g.mysteries && g.mysteries[m.id]).length;
export const allMysteriesSolved = g => mysteriesSolved(g) >= MYSTERIES.length;

export function peopleHere(g) {
    return PEOPLE.filter(p =>
        !p.only ||
        (p.only === 'beforeWatch' && g.story === 'intro') ||
        (p.only === 'beforeClear' && !reached(g, 'clear')) ||
        (p.only === 'kage' && g.story === 'school' && allMysteriesSolved(g)) ||
        (p.only === 'damNushi' && g.story === 'yama' && g.flags.oku && SEALS.every(q => g.mysteries[q.id])) ||
        // 4 章: ライバル探検隊が 通路を ふさぐ → 勝つと 奥に 浦の島重蔵 (ボス)
        (p.only === 'rival4' && g.story === 'umibe' && !g.flags.rival4) ||
        (p.only === 'urashima4' && g.story === 'umibe' && g.flags.rival4));
}
// 人の 名前と 絵 (ライバル探検隊の リーダーは バージョンで ちがう)
export const personName = (g, p) => (p.nameBy ? p.nameBy[g.version] || p.name : p.name);
export const personArt = (g, p) => (p.artBy ? p.artBy[g.version] || Object.values(p.artBy)[0] : p.art);

// 工事中の さく (1 章 クリアまで 商店街へ 行けない・2 章 クリアまで 山へ 行けない)
export const gatesHere = g => GATES.filter(q => (q.only === 'beforeClear2' ? !reached(g, 'clear2') : !reached(g, 'clear')));
// まだ とけて いない 氷の 封印 (3 章)
export const sealsHere = g => SEALS.filter(q => !(g.mysteries && g.mysteries[q.id]));
const inGate = (q, tx, ty) => ty === q.y && tx >= q.x && tx < q.x + q.w;

// そのマスに 入れないか
export function blockedTile(g, tx, ty) {
    const tile = tileAt(tx, ty);
    if (BLOCK.has(tile)) return true;
    if (WET.has(tile) && reached(g, 'clear3')) return true;   // 3 章 クリアで ダムに 水が もどる
    if (gatesHere(g).some(q => inGate(q, tx, ty))) return true;
    if (BUILDINGS.some(b => tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h)) return true;
    if (PROPS.some(p => p.x === tx && p.y === ty)) return true;
    if (MYSTERIES.some(m => m.x === tx && m.y === ty)) return true;
    if (sealsHere(g).some(m => m.x === tx && m.y === ty)) return true;
    return peopleHere(g).some(p => p.x === tx && ty >= p.y && ty < p.y + (p.h || 1));
}

function boxFree(g, x, y) {
    const x0 = Math.floor((x - HALF_W) / TILE), x1 = Math.floor((x + HALF_W - 0.01) / TILE);
    const y0 = Math.floor((y - BOX_H) / TILE), y1 = Math.floor((y - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (blockedTile(g, tx, ty)) return false;
    return true;
}

// 町の キャラ (solids: { x, y } の 足元) とも ぶつかる (2026-10-28 ユーザー指定: すけないように)。
//   重なって いるときは、はなれる 向きには 動ける (キャラが 足元に 出てきても 動けなくならないように)
const CHAR_W = 11, CHAR_H = 7;
function charFree(solids, x0, y0, x, y) {
    for (const s of solids) {
        const ox = Math.abs(x - s.x), oy = Math.abs(y - s.y);
        if (ox >= CHAR_W || oy >= CHAR_H) continue;
        if (Math.hypot(x - s.x, y - s.y) < Math.hypot(x0 - s.x, y0 - s.y)) return false;
    }
    return true;
}

// 横と 縦を べつべつに 動かす (かべに そって すべれる)
export function moveHero(g, dx, dy, solids = []) {
    const p = g.pos;
    if (dx && boxFree(g, p.x + dx, p.y) && charFree(solids, p.x, p.y, p.x + dx, p.y)) p.x += dx;
    if (dy && boxFree(g, p.x, p.y + dy) && charFree(solids, p.x, p.y, p.x, p.y + dy)) p.y += dy;
    if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left';
    else if (dy) p.dir = dy > 0 ? 'down' : 'up';
}

export const heroTile = g => ({ x: Math.floor(g.pos.x / TILE), y: Math.floor((g.pos.y - 3) / TILE) });

export function facingTile(g) {
    const t = heroTile(g);
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[g.pos.dir];
    return { x: t.x + d[0], y: t.y + d[1] };
}

// 前の マスを 調べる: 人 か 建物の 入り口 か 七不思議の 物
export function lookAt(g) {
    const f = facingTile(g);
    const person = peopleHere(g).find(p => p.x === f.x && f.y >= p.y && f.y < p.y + (p.h || 1));
    if (person) return { type: 'person', person };
    const door = BUILDINGS.find(b => b.door.x === f.x && b.door.y === f.y);
    if (door) return { type: 'door', building: door };
    const gate = gatesHere(g).find(q => inGate(q, f.x, f.y));
    if (gate) return { type: 'gate', gate };
    const mystery = MYSTERIES.find(m => m.x === f.x && m.y === f.y);
    if (mystery) return { type: 'mystery', mystery };
    const seal = SEALS.find(m => m.x === f.x && m.y === f.y);
    if (seal) return { type: 'seal', seal };
    return null;
}

// 神社の 石だたみに 入ったら (ふるカワに 会う)
export const inShrine = g => {
    const t = heroTile(g);
    return t.x >= 2 && t.x <= 10 && t.y >= 2 && t.y <= 9;
};
