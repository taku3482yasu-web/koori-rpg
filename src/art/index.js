// 絵を ひとつに まとめる (前作から 写した 絵 + 新キャラの 絵)
import { LEGACY_ART } from './legacy-art.js';
import { NEW_ART } from './new-art.js';

export const ART = { ...LEGACY_ART, ...NEW_ART };
