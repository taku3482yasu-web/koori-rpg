// 絵を ひとつに まとめる (前作から 写した 絵 + 新キャラの 絵)
import { LEGACY_ART } from './legacy-art.js';
import { NEW_ART } from './new-art.js';
import { HARIMA_ART } from './harima-art.js';

export const ART = { ...LEGACY_ART, ...NEW_ART, ...HARIMA_ART };
// おにおに・鬼神 (12 章の 第 2 形態。2026-10-30): おにおにの 絵の 色を かえる (こい 赤の はだ・金の 角と 金棒・赤い 目)
ART.onioni2 = { ...ART.onioni, palette: { ...ART.onioni.palette, h: '#ffd040', k: '#1a0a0a', r: '#7a0a1a', d: '#4a0510', y: '#ff3030', t: '#3a3a3a', g: '#ffd040', s: '#fff0a0' } };

// 無限回廊の 色違いボス (2026-11-02 ユーザー指定: 全員 赤黒い 色): 明るさだけ のこして 黒 → こい 赤 → 赤 に ぬりかえる
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const toHex = v => '#' + v.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
function crimson(color) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
    const [r, g, b] = hex(color);
    const L = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
    const stops = [[0, [8, 0, 4]], [0.3, [70, 4, 14]], [0.6, [160, 16, 30]], [0.85, [230, 60, 60]], [1, [255, 170, 160]]];
    for (let i = 1; i < stops.length; i++) {
        const [l0, c0] = stops[i - 1], [l1, c1] = stops[i];
        if (L <= l1) { const k = (L - l0) / (l1 - l0); return toHex(c0.map((v, j) => v + (c1[j] - v) * k)); }
    }
    return toHex(stops[stops.length - 1][1]);
}
export const crimsonArtId = id => `${id}_crimson`;
for (const id of ['kageboss', 'hyougaryu', 'urashima', 'daishi', 'zumitani', 'tomooka', 'runaya', 'onioni2', 'harukirin', 'nozoema', 'tashikeda', 'bakuenryu', 'niolioten']) {
    const a = ART[id];
    if (a) ART[crimsonArtId(id)] = { ...a, palette: Object.fromEntries(Object.entries(a.palette).map(([k, c]) => [k, crimson(c)])) };
}
