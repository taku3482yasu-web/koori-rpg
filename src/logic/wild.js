// =====================================================================
// 町に いる キャラ (画面に ふれない。セーブには 入らない)
// ---------------------------------------------------------------------
// 見えている キャラ: ROAMS の 場所に 出て、その中を ゆっくり 歩きまわる。話しかけると バトル (赤い「！」)
// 話せる キャラ (friendly): FRIENDS の 場所に いつも いる。話しかけると 会話や 道具 (印なし。2026-10-28)
// かくれている キャラ: レンズで 見つけると その場に 出てくる (reveal)。話しかけると バトル
// バトルの あとは いなくなり、しばらくすると また 出てくる
// =====================================================================
import { TILE, ROAMS, SPOTS, FRIENDS } from '../data/map.js';
import { spotKinds, hasWatch } from './game.js';
import { blockedTile } from './world.js';

const RESPAWN = 20;          // いなくなってから また 出るまで (秒)
const WALK = 22;             // 歩く 速さ (ドット / 秒)
const REVEALED_LIFE = 90;    // 見つけた キャラが その場に いる 時間 (秒)
const NOTICE = 34;           // こおりくんが これより 近いと 立ち止まる (ドット)
const TALK = 26;             // 話しかけられる きょり (ドット)

export function createWild(g, rng) {
    const list = [];
    const wait = {};         // ROAMS の id → また 出せる 時刻 (g.playTime)
    let seq = 0;

    // source.lv: その 場所の Lv の はば (商店街)。なければ ストーリーで 決まる
    const lvRange = source => (source && source.lv) || (g.story === 'clear' ? [4, 9] : [2, 5]);
    const rollLv = source => { const [lo, hi] = lvRange(source); return lo + rng.int(hi - lo + 1); };

    function freeTileIn(r, hero) {
        for (let n = 0; n < 30; n++) {
            const tx = r.x0 + rng.int(r.x1 - r.x0 + 1), ty = r.y0 + rng.int(r.y1 - r.y0 + 1);
            if (blockedTile(g, tx, ty)) continue;
            const x = tx * TILE + 8, y = ty * TILE + 14;
            if (hero && Math.hypot(x - hero.x, y - hero.y) < 48) continue;
            return { x, y };
        }
        return null;
    }

    // 話せる キャラ: いなければ 出す (いなくならない)
    function spawnFriends(hero) {
        for (const f of FRIENDS) {
            if (f.after && g.story !== f.after) continue;
            if (list.some(c => c.friend === f.id)) continue;
            const p = freeTileIn(f, hero);
            if (p) list.push({ key: `f${++seq}`, id: f.kind, friend: f.id, friendly: true, x: p.x, y: p.y, roam: f.id, flip: rng.chance(0.5), target: null, pause: rng.next() * 2, walkT: 0 });
        }
    }

    // ウォッチを もらうまでは キャラが 見えない
    function spawnRoamers(hero) {
        if (!hasWatch(g)) return;
        spawnFriends(hero);
        for (const r of ROAMS) {
            const kinds = spotKinds(g, r);
            const here = list.filter(c => c.roam === r.id);
            // 時間帯や 天気が 変わって いなくなる キャラは 消す
            for (const c of here) if (!kinds.some(k => k.id === c.id)) remove(c);
            if (!kinds.length || list.filter(c => c.roam === r.id).length >= r.max || (wait[r.id] || 0) > g.playTime) continue;
            const p = freeTileIn(r, hero);
            if (!p) continue;
            const kind = rng.weighted(kinds);
            list.push({ key: `w${++seq}`, id: kind.id, lv: rollLv(r), x: p.x, y: p.y, roam: r.id, flip: rng.chance(0.5), target: null, pause: rng.next() * 2, walkT: 0 });
            wait[r.id] = g.playTime + 3;
        }
    }

    // レンズで 見つけた キャラを その場に 出す
    function reveal(spot, id) {
        const c = { key: `w${++seq}`, id, lv: rollLv(spot), x: spot.x * TILE + 8, y: spot.y * TILE + 14, spot: spot.id, flip: false, target: null, pause: 999, walkT: 0, born: g.playTime, revealed: true };
        list.push(c);
        return c;
    }

    function remove(c) {
        const i = list.indexOf(c);
        if (i >= 0) list.splice(i, 1);
        if (c.roam && !c.friendly) wait[c.roam] = g.playTime + RESPAWN;
    }

    function update(dt, hero) {
        spawnRoamers(hero);
        for (const c of [...list]) {
            if (c.revealed) {
                if (g.playTime - c.born > REVEALED_LIFE) remove(c);
                continue;
            }
            const r = ROAMS.find(z => z.id === c.roam) || FRIENDS.find(z => z.id === c.roam);
            // こおりくんが 近くに 来たら 立ち止まって こっちを 向く (話しかけやすいように)
            if (hero && Math.hypot(c.x - hero.x, c.y - hero.y) < NOTICE) {
                c.target = null;
                c.pause = Math.max(c.pause, 0.8);
                c.flip = c.x > hero.x;
                continue;
            }
            if (c.pause > 0) {
                c.pause -= dt;
                if (c.pause <= 0) c.target = freeTileIn(r, null);
                continue;
            }
            if (!c.target) { c.pause = 1; continue; }
            const dx = c.target.x - c.x, dy = c.target.y - c.y, d = Math.hypot(dx, dy);
            if (d < 1) { c.target = null; c.pause = 1 + rng.next() * 3; continue; }
            const step = Math.min(d, WALK * dt);
            const nx = c.x + dx / d * step, ny = c.y + dy / d * step;
            // かべに ぶつかったら 止まって 別の 場所へ
            if (blockedTile(g, Math.floor(nx / TILE), Math.floor((ny - 3) / TILE))) { c.target = null; c.pause = 0.5; continue; }
            c.x = nx;
            c.y = ny;
            c.walkT += dt;
            if (Math.abs(dx) > 0.3) c.flip = dx < 0;
        }
    }

    // 話しかけられる キャラ: 近くて (TALK 以内)、向いている 方の 側に いる。すぐ そば (14 以内) なら 向きは 問わない。いちばん 近い 1 体
    function facing(pos) {
        const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[pos.dir];
        let best = null, bestD = Infinity;
        for (const c of list) {
            const dx = c.x - pos.x, dy = c.y - pos.y, dist = Math.hypot(dx, dy);
            const ahead = dx * d[0] + dy * d[1];
            if (dist > TALK || (dist > 14 && ahead < dist * 0.4)) continue;
            if (dist < bestD) { best = c; bestD = dist; }
        }
        return best;
    }

    const sourceOf = c => (c.friendly ? FRIENDS.find(f => f.id === c.friend) : c.roam ? ROAMS.find(r => r.id === c.roam) : SPOTS.find(s => s.id === c.spot));

    return { list, update, reveal, remove, facing, sourceOf };
}
