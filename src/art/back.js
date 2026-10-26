// =====================================================================
// うしろ姿の 絵 (2026-10-26 ユーザー指定: バトルでは 味方を 手前に 置き、敵の ほうを 向いた 背中が 見えるように)
// ---------------------------------------------------------------------
// 前向きの 絵から 顔 (目・口・ほっぺ・くちばし・目の 光) を 消して、まわりの 体の 色で うめる。
//   顔の ドット = 絵の 上 75% の 中で、まわり 4 つが 全部 色の ある 内側の ドット (ふちの 線は 残す)、
//                 かつ その 色が 絵の 中で 少ない (12% 未満。体の 色は もっと 多い)
// 1 回 作ったら おぼえておく
// =====================================================================
const cache = new Map();

function backFrame(rows, rare) {
    const h = rows.length, w = rows[0].length;
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? '.' : rows[y][x]);
    const out = rows.map(r => r.split(''));
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const ch = rows[y][x];
            if (ch === '.' || !rare.has(ch) || y > h * 0.75) continue;
            const n4 = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)];
            if (n4.includes('.')) continue;   // ふちの 線は 消さない
            // まわり 8 つで いちばん 多い 体の 色
            const count = {};
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
                const c = at(x + dx, y + dy);
                if (c === '.' || rare.has(c)) continue;
                count[c] = (count[c] || 0) + 1;
            }
            const best = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
            if (best) out[y][x] = best[0];
        }
    }
    return out.map(r => r.join(''));
}

export function backArt(art) {
    if (!art) return art;
    if (cache.has(art)) return cache.get(art);
    // 絵の 中で 少ない 色 (顔の 部品の 候補)
    const freq = {};
    let total = 0;
    for (const row of art.frames[0]) for (const ch of row) if (ch !== '.') { freq[ch] = (freq[ch] || 0) + 1; total++; }
    const rare = new Set(Object.keys(freq).filter(ch => freq[ch] < total * 0.12));
    const back = { ...art, frames: art.frames.map(f => backFrame(f, rare)) };
    cache.set(art, back);
    return back;
}
