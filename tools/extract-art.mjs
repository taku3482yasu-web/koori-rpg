// =====================================================================
// 前作 (koori-dungeon) のドット絵を、このゲームの形 (パレット + 文字列の絵) に写す
// ---------------------------------------------------------------------
// node tools/extract-art.mjs ../koori-dungeon  →  src/art/legacy-art.js を作り直す
// 絵を変えたいときは koori-dungeon の絵を直してから、これを回す (src/art/legacy-art.js は手で直さない)
// =====================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dungeon = process.argv[2] || join(here, '..', '..', 'koori-dungeon');
globalThis.performance = { now: () => 0 };
globalThis.KD = {};
for (const f of ['rng.js', 'dungeon.js', 'units.js', 'enemies.js', 'items.js', 'dungeons.js', 'collection.js', 'allies.js', 'enemies9.js', 'enemies10.js', 'enemies11.js', 'art.js', 'bigart.js', 'enemyart.js', 'enemyart9.js', 'enemyart10.js', 'enemyart11.js']) {
    vm.runInThisContext(readFileSync(join(dungeon, 'js', f), 'utf8'));
}

// 文字列の絵 (SPRITES) はそのまま。四角を重ねる絵 (BIG) は 1 ドットずつ色を読んで文字にする
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function fromSprite(s) {
    return { w: s.frames[0][0].length, h: s.frames[0].length, palette: s.palette, frames: s.frames };
}
function fromBig(art) {
    const colors = [];
    const frames = [0, 1].map(frame => {
        const grid = Array.from({ length: art.h }, () => Array(art.w).fill('.'));
        art.draw((x, y, w, h, color) => {
            let i = colors.indexOf(color);
            if (i < 0) { colors.push(color); i = colors.length - 1; }
            for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
                if (yy >= 0 && yy < art.h && xx >= 0 && xx < art.w) grid[yy][xx] = CHARS[i];
            }
        }, frame);
        return grid.map(row => row.join(''));
    });
    const palette = {};
    colors.forEach((c, i) => { palette[CHARS[i]] = c; });
    return { w: art.w, h: art.h, palette, frames };
}

const SPRITE_KEYS = ['koori', 'tomoishi', 'furukawa', 'onioni', 'haribaby', 'mumenbachi', 'donguriko', 'nemuridake', 'pekorisu', 'tsutankobu', 'yofukashi'];
const BIG_KEYS = ['kogame', 'tsuribariuo', 'mokugyoro', 'rousokubi', 'daichouenkin', 'kunaisuzume', 'kawarimidanuki', 'shinobigaeru',
    // 商店街の 20 体 (段階 2。2026-10-27)
    'spamdama', 'popupn', 'netkozou', 'kinmenkoinu', 'burakrasher', 'hannyamen', 'makibishimushi', 'hoshikuzun', 'richibou', 'yopparaigarasu',
    'chouchinbura', 'neonkurage', 'saikoron', 'hakupai', 'maikumbo', 'pachinkodaman', 'neontanuki', 'gomibakon', 'gachapon', 'yataiman',
    // 2 章 石の川小学校の 9 体 (2026-10-28)
    'fusaiyougaikotsu', 'mirrormuscle', 'proteingolem', 'takaramimic', 'umibozun', 'wasurekurage', 'mikazukibat', 'lunashadow', 'yoroinukegara'];
const out = {};
for (const k of SPRITE_KEYS) out[k] = fromSprite(KD.Art.SPRITES[k]);
for (const k of BIG_KEYS) out[k] = fromBig(KD.BigArt.BIG[k]);

const body = Object.entries(out).map(([k, a]) =>
    `    ${k}: {\n        w: ${a.w}, h: ${a.h},\n        palette: ${JSON.stringify(a.palette)},\n        frames: [\n${a.frames.map(f => `            [\n${f.map(r => `                '${r}'`).join(',\n')}\n            ]`).join(',\n')}\n        ]\n    }`).join(',\n');
writeFileSync(join(here, '..', 'src', 'art', 'legacy-art.js'),
`// 前作 (koori-dungeon の art.js・enemyart.js) のドット絵を写したもの。tools/extract-art.mjs が作る (手で直さない)
// 1 文字 = 1 ドット。'.' は透明。frames は [待機 0, 待機 1]
export const LEGACY_ART = {
${body}
};
`);
console.log(`src/art/legacy-art.js: ${Object.keys(out).length} 体`);
