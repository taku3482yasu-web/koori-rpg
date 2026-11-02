// =====================================================================
// 覇理魔様 (はりまさま。無限回廊の さいごの 階の ボス。2026-11-02 ユーザー指定)
// ---------------------------------------------------------------------
// 地獄の 観音さまの ような すがた。うしろに 炎の 光背、千手観音の ように 無数の 手、顔に 8 つの 目。
// 6 本の 大きな 手は それぞれ 持ち物が ちがう (左上 炎・左中 氷・左下 剣 / 右上 こぶし・右中 数珠・右下 雷)。
// 目の 色 (e) は 赤 (攻撃しか きかない) と 青 (術しか きかない) で かわる → harima_r / harima_b
// =====================================================================
const ROWS = [
    '........H.hhGggGGggGhh.H........',
    '........hhhHgGGGGGGgHhhh........',
    '......hhhH..oooooooo..Hhhh......',
    '..fffhhHH.a.SSSSSSSS.a.HHhh.q...',
    '..SSShH....osssssssso....HhSSS..',
    '..SfSH.a...oseesseeso...a.HSqS..',
    '..SSSH.....ossskkssso.....HSSS..',
    '...haa.....oseesseeso.....aah...',
    '..hhHaa....osssssssso....aaHhh..',
    '..hH.aaa...osssssssso...aaa.Hh..',
    '.ihH...a...osskkkksso...a...Hhb.',
    'SSSH...aa...SSwSSwSS...aa...HSSS',
    'SiSa....aa..RRooooR...aa....aSbS',
    'SSSaaaaaaaa.rrsggsr..aaaaaaaaSSS',
    '.hhHaaaaaaaarrssssr.aaaaaaaaHhh.',
    '..hw.....aaaRRRRRRRRRaa.....Hh..',
    '..hw....aaa.rrrrrrrrraaa....Hh..',
    '..hwH..aaa..rrrrrrrrr.aaa..Hhh..',
    '...wHaaa..RRRRRRRRRRR...aaayyy..',
    '..SSSaa...rrrrrrrrrrr....aaSSS..',
    '..SwSH....rrrrrrrrrrr.....HSyS..',
    '..SSShH...RRRRRRRRRRRRR..HhSSS..',
    '.....hhHH.rrrrrrrrrrrrrHHhh.....',
    '......hhhHrrrrrrrrrrrrrhhh......',
    '........RRRRRRRRRRRRRRRh........',
    '........H.pppppppppppppH........',
    '........PPPPPPPPPPPPPPP.........',
    '........ppppppppppppppppp.......',
    '......PPPPPPPPPPPPPPPPPPP.......',
    '......ppooooooooooooooooppp.....'
];
const PALETTE = {
    o: '#0a0408', h: '#c02010', H: '#ff8a20', a: '#4a2a3a', S: '#7a4a5a', s: '#5a3048', g: '#c09020', G: '#ffe070',
    r: '#6a0814', R: '#9a1020', k: '#0a0004', w: '#e0e0e8', f: '#ff5010', i: '#8ad8ff', q: '#d8a878', b: '#a040e0', y: '#ffe040',
    p: '#5a1a3a', P: '#8a2a50'
};
// 待機 1 は 光背の 炎が ゆらぐ (h と H を 入れかえる)
const flicker = ROWS.map(r => r.replace(/[hH]/g, c => (c === 'h' ? 'H' : 'h')));
const art = eye => ({ w: 32, h: 30, palette: { ...PALETTE, e: eye }, frames: [ROWS, flicker] });
export const HARIMA_ART = { harima_r: art('#ff2020'), harima_b: art('#30a8ff') };
