// 絵を ひとつに まとめる (前作から 写した 絵 + 新キャラの 絵)
import { LEGACY_ART } from './legacy-art.js';
import { NEW_ART } from './new-art.js';

export const ART = { ...LEGACY_ART, ...NEW_ART };
// おにおに・鬼神 (12 章の 第 2 形態。2026-10-30): おにおにの 絵の 色を かえる (こい 赤の はだ・金の 角と 金棒・赤い 目)
ART.onioni2 = { ...ART.onioni, palette: { ...ART.onioni.palette, h: '#ffd040', k: '#1a0a0a', r: '#7a0a1a', d: '#4a0510', y: '#ff3030', t: '#3a3a3a', g: '#ffd040', s: '#fff0a0' } };
