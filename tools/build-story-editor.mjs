// =====================================================================
// ストーリー工房 (tools/story-editor.html) に ゲームの 立ち絵と 登場人物を 入れて 1 枚の HTML に する
//   node tools/build-story-editor.mjs [出力先]   (出力先の 省略は dist/story-editor.html)
// 書いた ストーリーは claude.ai の Artifact の db (chapters コレクション) に 入る。ここでは 絵と 名前だけ 入れる
// =====================================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ART } from '../src/art/index.js';
import { NAKAMA, BOSSES } from '../src/data/nakama.js';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || resolve(here, '../dist/story-editor.html'));

// 登場人物: 主人公・前作の 人たち → なかま (図鑑の 順) → ボス
const cast = [
    { name: 'こおりくん', art: 'koori' },
    { name: 'ふるカワ', art: 'furukawa' },
    { name: 'ともいし', art: 'tomoishi' },
    { name: 'おにおに', art: 'onioni' },
    { name: 'ルキハ', art: 'rukiha' },
    { name: 'トモオカ', art: 'tomooka' },
    ...Object.values(NAKAMA).sort((a, b) => a.no - b.no).map(n => ({ name: n.name, art: n.art, group: 'なかま' })),
    ...Object.values(BOSSES).map(b => ({ name: b.name, art: b.art, group: 'ボス' }))
];
const used = new Set(cast.map(c => c.art));
const art = Object.fromEntries(Object.entries(ART).filter(([k]) => used.has(k))
    .map(([k, a]) => [k, { w: a.w, h: a.h, p: a.palette, f: a.frames[0] }]));

const html = readFileSync(resolve(here, 'story-editor.html'), 'utf8')
    .replace('/*CAST*/[]', JSON.stringify(cast))
    .replace('/*ART*/{}', JSON.stringify(art));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`${out} (${cast.length} 人・${(html.length / 1024).toFixed(0)} KB)`);
