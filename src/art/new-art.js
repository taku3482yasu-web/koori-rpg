// =====================================================================
// 新キャラのドット絵 (16 × 16。設計書 4.6 の 5 体)
// ---------------------------------------------------------------------
// legacy-art.js と同じ形 (1 文字 = 1 ドット・'.' は透明)。frames は [待機 0, 待機 1]
// =====================================================================

// 待機 1 は、絵を 1 ドット上にずらして はねさせる
const bob = rows => [rows, [...rows.slice(1), '.'.repeat(rows[0].length)]];
// 待機 1 は、目 (from の文字) を閉じる
const blink = (rows, from, to) => [rows, rows.map(r => r.split(from).join(to))];

export const NEW_ART = {
    // イシコロン: 川原の丸い石。おこった まゆ
    ishikoron: {
        w: 16, h: 16,
        palette: { o: '#3a3a40', G: '#d4d4dc', g: '#a4a4ae', d: '#70707c', k: '#10162a', w: '#ffffff' },
        frames: bob([
            '................',
            '................',
            '.....oooooo.....',
            '...ooGGGgggoo...',
            '..oGGgggggggdo..',
            '.oGGkkgggggkkdo.',
            '.oGggkwggggwkdo.',
            '.oggggkggggkgddo',
            '.ogggggggggggddo',
            '.oggggkkkkgggddo',
            '.odgggggggggdddo',
            '..oddgggggddddo.',
            '...oodddddddoo..',
            '.....oooooooo...',
            '................',
            '................'
        ])
    },
    // ミズキリン: 水切りの平たい石。水しぶき
    mizukirin: {
        w: 16, h: 16,
        palette: { o: '#2a3a4a', S: '#e4ecf2', s: '#b8c8d4', d: '#7a8a98', k: '#10162a', b: '#4aa8e0', B: '#bff0ff' },
        frames: bob([
            '................',
            '................',
            '................',
            '................',
            '..B.........B...',
            '.B...oooooo...B.',
            '...ooSSSssssoo..',
            '..oSSsksssskssdo',
            '..osssssssssssdo',
            '...odsskksssddo.',
            '....ooddddddoo..',
            '.bbbbbbbbbbbbbb.',
            '..BbbBbbbBbbbB..',
            '................',
            '................',
            '................'
        ])
    },
    // ソウメンナガレ: 流しそうめんの そうめん。竹のとい の上
    soumennagare: {
        w: 16, h: 16,
        palette: { w: '#f8f4e8', W: '#d8ccb0', k: '#10162a', p: '#ff9eb5', b: '#4aa8e0', g: '#5aa05a', G: '#3a7a3a' },
        frames: bob([
            '................',
            '.....w.w.w......',
            '....wWwWwWw.....',
            '...wwwwwwwwww...',
            '..wWwwwwwwwwWw..',
            '..wwkwwwwwwkww..',
            '..wwkwwwwwwkww..',
            '..wpwwwwwwwwpw..',
            '..wwwwwkkwwwww..',
            '...wWwwwwwwWw...',
            '.w.wwwwwwwwww.w.',
            'bbbbbbbbbbbbbbbb',
            'gggggggggggggggg',
            'GGGGGGGGGGGGGGGG',
            '................',
            '................'
        ])
    },
    // コザラッパ: 頭の皿を落とした河童の子 (皿のところは はげている)
    kozarappa: {
        w: 16, h: 16,
        palette: { o: '#1e3a1e', g: '#5ab04a', G: '#8ad07a', s: '#e8d8a0', y: '#ffd84a', k: '#10162a', w: '#ffffff', t: '#7a5a2a' },
        frames: bob([
            '................',
            '.....oooooo.....',
            '....ogsssssgo...',
            '...oggGsssGggo..',
            '..oggggggggggo..',
            '..ogwkggggwkgo..',
            '..oggggyyggggo..',
            '..oggGyyyyGggo..',
            '...oggggggggo...',
            '..ttoGGGGGGottt.',
            '.gtoggggggggotg.',
            '..toggggggggot..',
            '...ogggoogggo...',
            '...oGGo..oGGo...',
            '...ooo....ooo...',
            '................'
        ])
    },
    // ハシシタボウズ: 橋の下から のぞく坊主。黄色く光る目 (待機 1 でまばたき)
    hashishita: {
        w: 16, h: 16,
        palette: { N: '#b07a48', n: '#8a5a2a', o: '#1a1424', P: '#6a5a9a', p: '#4a3a6a', s: '#2a2238', k: '#ffe040', w: '#ffffff', b: '#3a5a8a' },
        frames: blink([
            'NNNNNNNNNNNNNNNN',
            'nnnnnnnnnnnnnnnn',
            '.n............n.',
            '.n...oooooo...n.',
            '.n..oPPPpppo..n.',
            '.n.oPPppppppo.n.',
            '.n.opsssssspo.n.',
            '.n.opsksskspo.n.',
            '.n.opsswwsspo.n.',
            '.n.oppppppppo.n.',
            '.n.oPpppppppo.n.',
            '.n..opppppo...n.',
            '.n..o.o.o.o...n.',
            '.n............n.',
            'bbbbbbbbbbbbbbbb',
            '................'
        ], 'k', 's')
    },
    // トモオカ: 鬼鬼団の 幹部 (6 章の ボス。新キャラ・2026-10-29)。赤い 鬼・1 本角・緑の はちまき・とらがらの パンツ。
    //   バトルでは 攻撃される たびに 右腕が 大きく なる (battle-view.js の drawArm)
    tomooka: {
        w: 18, h: 18,
        palette: { o: '#2a1418', s: '#c84a3a', S: '#a03228', y: '#f0e0a0', g: '#3a8a4a', k: '#111111', w: '#ffffff', t: '#ffd040', b: '#2a2a2a' },
        frames: bob([
            '........yy........',
            '.......yyyy.......',
            '.....oooooooo.....',
            '....osssssssso....',
            '...osgggggggggo...',
            '...ossskwsskwsso..',
            '...osssssssssso...',
            '...osswwwwwwsso...',
            '....osssssssso....',
            '..oooossssssoooo..',
            '.ossssssssssssssso',
            '.osSsssbbbbsssSso.',
            '.osS.ttbttbtt.Sso.',
            '.oso.tbttbttb.oso.',
            '..o..tttttttt..o..',
            '.....oo....oo.....',
            '.....ss....ss.....',
            '....ooo....ooo....'
        ])
    }
};
