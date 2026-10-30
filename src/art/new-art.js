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
    },
    // ルキハ (第 1 形態): 人と 同じ すがたの 男。けれど 右目は 赤黒く にごり、首すじに うろこ、右手の 指先は 黒く ねじれている
    //   (2026-10-29 ユーザー指定。ラスボス。第 2 形態 ニオニオーテンは まだ)
    rukiha: {
        w: 24, h: 35,
        palette: { h: '#2a2438', H: '#4a3e60', s: '#e8d0c0', S: '#c8a898', e: '#2a2a3a', r: '#6a0a18', R: '#e02040', l: '#a06070',
            g: '#3a5a48', G: '#6a9a78', c: '#2a2040', C: '#3e3060', p: '#7a3ac0', w: '#d8d0e0', k: '#0a0a10', b: '#1a1420' },
        frames: [
            [
                '........................',
                '........hhhhhhhh........',
                '......hhhHHHhhhhhh......',
                '.....hhHHHhhhhhhhhh.....',
                '....hhhhhhhhhhhhhhhh....',
                '....hhhhssssssssshhh....',
                '....hhhssssssssrsssh....',
                '....hsssesssssrRsssh....',
                '....hsssssssssrrrssh....',
                '....hsssssssSssssssh....',
                '.....sssssslllSssss.....',
                '......ssssssssssss......',
                '.......gssssssssg.......',
                '........gGssssGg........',
                '...ccccccgGwwGgcccccc...',
                '..cccccccgwwwwgccccccc..',
                '..ccCcccccwwwwcccccCcc..',
                '.ccCCcccccpwwpcccccCCcc.',
                '.ccC.cccccpwwpccccc.Ccc.',
                '.ccC.cccccpwwpccccc.Ccc.',
                '.ccC.cccccpwwpccccc.Ccc.',
                '.ccC.cccccpwwpccccc.Ccc.',
                '.ccC.ccccccppcccccc.Ccc.',
                '.sss.cccccccccccccc.kkkk',
                '.ss..cccccccccccccc.k.kk',
                '.....ccccccCCcccccc.k..k',
                '.....ccccccCCcccccc.....',
                '.....cccccccccccccc.....',
                '.....cccccc..cccccc.....',
                '.....cccccc..cccccc.....',
                '......ccccc..ccccc......',
                '......pppcc..ccppp......',
                '.......bbb....bbb.......',
                '.......bbb....bbb.......',
                '......bbbb....bbbb......'
            ],
            [
                '........................',
                '........hhhhhhhh........',
                '......hhhHHHhhhhhh......',
                '.....hhHHHhhhhhhhhh.....',
                '....hhhhhhhhhhhhhhhh....',
                '....hhhhssssssssshhh....',
                '....hhhssssssssrsssh....',
                '....hsssssssssrRsssh....',
                '....hsssssssssrrrssh....',
                '....hsssssssSssssssh....',
                '.....sssssslllSssss.....',
                '......ssssssssssss......',
                '.......gssssssssg.......',
                '........gGssssGg........',
                '...ccccccgGwwGgcccccc...',
                '..cccccccgwwwwgccccccc..',
                '..ccCcccccwwwwcccccCcc..',
                '.ccCCcccccpwwpcccccCCcc.',
                '.ccC.cccccpwwpccccc.Ccc.',
                '.ccC.cccccpwwpccccc.Ccc.',
                '.ccC.cccccpwwpccccc.Ccc.',
                '.ccC.cccccpwwpccccc.Ccc.',
                '.ccC.ccccccppcccccc.Ccc.',
                '.sss.cccccccccccccc.kkkk',
                '.ss..cccccccccccccc.k.kk',
                '.....ccccccCCcccccc.k..k',
                '.....ccccccCCcccccc.....',
                '.....cccccccccccccc.....',
                '.....cccccc..cccccc.....',
                '.....cccccc..cccccc.....',
                '......ccccc..ccccc......',
                '......pppcc..ccppp......',
                '.......bbb....bbb.......',
                '.......bbb....bbb.......',
                '......bbbb....bbbb......'
            ]
        ]
    },
    // 大鬼 (8 章の 鬼鬼団 幹部。新キャラ・2026-10-30 ユーザー指定): 体が でかい 赤茶の 鬼。2 本角・きばの ある 口・とらがらの パンツ。
    //   バトルでは 足を ねらえる (足に 当てつづけると 転んで チャンスタイム)
    ooni: {
        w: 24, h: 24,
        palette: { o: '#2a1010', s: '#9a3a2a', S: '#702818', y: '#f0e0a0', k: '#111111', e: '#ffe040', w: '#ffffff', t: '#ffd040', b: '#2a2a2a' },
        frames: bob([
            '........................',
            '..yy................yy..',
            '..yyy..............yyy..',
            '...yyy..oooooooo..yyy...',
            '....yyooSssssssSooyy....',
            '.....osssssssssssso.....',
            '....osskksssssskksso....',
            '....osseeksssskeesso....',
            '....ossssssSSsssssso....',
            '....osskkkkkkkkkksso....',
            '....osskwkkkkkkwksso....',
            '.....osssssssssssso.....',
            'oooossssssssssssssssoooo',
            'osssssssssssssssssssssso',
            'osSssssssssssssssssssSso',
            'osS.ssssssssssssssss.Sso',
            'osS.sssssSSSSSSsssss.Sso',
            'oss.tbttbttbbttbttbt.sso',
            '.oo.tttttttttttttttt.oo.',
            '....tttttttttttttttt....',
            '....ssssss....ssssss....',
            '....ssssss....ssssss....',
            '...osssssso..osssssso...',
            '..ooooooooo..ooooooooo..'
        ])
    },
    // 双頭鬼 (8 章の 鬼鬼団 幹部。新キャラ・2026-10-30 ユーザー指定): 頭が 2 つの 鬼。右の 頭 (見ている 人の 左・むらさき) は とりつき、
    //   左の 頭 (見ている 人の 右・青) は 術を 使う。頭は ねらって こわせる
    soutouki: {
        w: 26, h: 18,
        palette: { o: '#1a1a24', p: '#8a4ac0', u: '#3a7ad0', s: '#5a6a5a', S: '#3a4a3a', y: '#f0e0a0', k: '#111111', w: '#ffffff', t: '#ffd040', b: '#2a2a2a' },
        frames: bob([
            '....y....y......y....y....',
            '....yy..yy......yy..yy....',
            '....oooooo......oooooo....',
            '...oppppppo....ouuuuuuo...',
            '...opkppkpo....oukuukuo...',
            '...oppppppo....ouuuuuuo...',
            '...opwkkwpo....ouwkkwuo...',
            '....oppppo......ouuuuo....',
            '.....oppo........ouuo.....',
            '.....oooooooooooooooo.....',
            '....osssssssssssssssso....',
            '...osssssssssssssssssso...',
            '..osSssssssssssssssssSso..',
            '..osS.ttbttbttbttbtt.Sso..',
            '..oo..tttttttttttttt..oo..',
            '......ssss......ssss......',
            '......ssss......ssss......',
            '.....oooooo....oooooo.....'
        ])
    },
    // サアラハ (14 章 内定版の ボス。ルキハの 軍勢の 残党。新キャラ・2026-10-30 Claude の 案): 黒い スーツに むらさきの 仮面、
    //   手には「内定通知」の 紙。胸に 黒い 紋
    saaraha: {
        w: 18, h: 19,
        palette: { o: '#0a0a14', h: '#2a1a3a', m: '#6a2a9a', R: '#ff3040', s: '#e8d0c0', w: '#f0f0f0', k: '#1a1a24', p: '#a040e0', y: '#fff0b0', b: '#000000' },
        frames: bob([
            '.......oooo.......',
            '.....oohhhhoo.....',
            '....ohhhhhhhho....',
            '....ohmmmmmmho....',
            '....ohmRmmRmho....',
            '....ohmmmmmmho....',
            '.....osssssso.....',
            '......oswwso......',
            '....ookkwwkkoo....',
            '...okkkkwwkkkko...',
            '..okkkkpwwpkkkko..',
            '..okkkkkppkkkkko..',
            '..okk.kkkkkk.kko..',
            '..oss.kkkkkk.yyo..',
            '......kkkkkk.yy...',
            '......kkk.kkk.....',
            '......kkk.kkk.....',
            '......kkk.kkk.....',
            '.....bbbb.bbbb....'
        ])
    },
    // リハマ (14 章 免許版の ボス。ルキハの 軍勢の 残党。新キャラ・2026-10-30 Claude の 案): 赤い ヘルメットに 黒い ライダースーツ、黄色い ライン
    rihama: {
        w: 18, h: 19,
        palette: { o: '#0a0a10', h: '#8a1020', v: '#102030', R: '#ff3040', k: '#1a1a1a', y: '#ffd040', p: '#a040e0', g: '#808890', b: '#000000' },
        frames: bob([
            '.....oooooooo.....',
            '....ohhhhhhhho....',
            '...ohhhhhhhhhho...',
            '...ohvvvvvvvvho...',
            '...ohvvRvvRvvho...',
            '...ohhhhhhhhhho...',
            '....ohhhhhhhho....',
            '......okkkko......',
            '....ookkkkkkoo....',
            '...okkkyykkkkko...',
            '..okkkyykkpkkkko..',
            '..okkyykkpppkkko..',
            '..okk.kkkkkk.kko..',
            '..ogg.kkkkkk.ggo..',
            '......kkkkkk......',
            '......kkk.kkk.....',
            '......kkk.kkk.....',
            '......kkk.kkk.....',
            '.....bbbb.bbbb....'
        ])
    },
    // タシケダ (10 章の ボス。ルキハの 軍勢の 幹部。新キャラ・2026-10-30): フードを かぶった ハッカー。緑に 光る めがねと ノートパソコン、むねに むらさきの 紋
    tashikeda: {
        w: 18, h: 20,
        palette: { o: '#0a0a14', h: '#3a2a5a', s: '#e8d0c0', G: '#4aff8a', m: '#8a3040', k: '#2a2a34', p: '#a040e0', l: '#c0c8d0', c: '#103020', b: '#000000' },
        frames: blink([
            '......oooooo......',
            '....oohhhhhhoo....',
            '...ohhhhhhhhhho...',
            '..ohhsssssssshho..',
            '..ohhsGGssGGshho..',
            '..ohhsssssssshho..',
            '..ohhsssmmssshho..',
            '...ohssssssssho...',
            '....oohhhhhhoo....',
            '...okkkkkkkkkko...',
            '..okkkkpkkpkkkko..',
            '..okkkkkppkkkkko..',
            '.ollllllllllllllo.',
            '.olcccccccccccclo.',
            '.olcGcGcGcGcGcclo.',
            '.ollllllllllllllo.',
            '....kkkk..kkkk....',
            '....kkkk..kkkk....',
            '...bbbbb..bbbbb...',
            '..................'
        ], 'G', 's')
    },
    // バクエンリュウ (11 章の ボス。火山の 底に ねむる 竜。新キャラ・2026-10-30): マグマの 体に 黄色く 光る ひび。むねに 黒い 紋 (むらさき)
    bakuenryu: {
        w: 26, h: 19,
        palette: { o: '#1a0804', r: '#a82010', R: '#ff5020', y: '#ffd040', k: '#140404', e: '#ffff80', p: '#a040e0' },
        frames: bob([
            '.oo....................oo.',
            '.oRo..................oRo.',
            '..oRo....oooooooo....oRo..',
            '...oRoorrrrrrrrrrrrooRo...',
            '....orrrrrrrrrrrrrrrro....',
            '...orreerrrrrrrrrreerro...',
            '...orrekrrrrrrrrrrkerro...',
            '...orrrrrrryRRyrrrrrrro...',
            '...orrkkkkkkkkkkkkkkrro...',
            '...orrkRkRkRkRkRkRkRrro...',
            '....orrrrrrrrrrrrrrrro....',
            '.oo..orrRRyyRRyyRRrro..oo.',
            '.oRo.orRRyRRRRRRyRRro.oRo.',
            '.oRRoorRyRRRppRRRyRrooRRo.',
            '.oRRRorRRyRRRRRRyRRroRRRo.',
            '..ooo.rRRRRyyyyRRRRr.ooo..',
            '......orRRRRRRRRRRro......',
            '.......orro....orro.......',
            '.......oyyo....oyyo.......'
        ])
    },
    // ろうかの カゲ (2 章の ボスの すがた。2026-10-30): ルナシャドウが 大きく なった 影。左右に 大きな 手 (右手 = 見ている 人の 左)、
    //   頭に 黄色い 目と 赤い 口。部位 (右手・左手・頭) は この 絵の 上で ねらう (nakama.js の parts の rect)
    kageboss: {
        w: 30, h: 21,
        palette: { o: '#0a0818', a: '#1a1430', y: '#ffe080', b: '#c03040' },
        frames: bob([
            '.............oooo.............',
            '...........oaaaaaao...........',
            '..........oaaaaaaaao..........',
            '..........oayyaayyao..........',
            'y.y.y.....oayyaayyao.....y.y.y',
            'a.a.a.....oaaaaaaaao.....a.a.a',
            'a.a.a.....oaabbbbaao.....a.a.a',
            'aaaaa......oaaaaaao......aaaaa',
            'aaaaaa.....oaaaaaao.....aaaaaa',
            '.aaaaa....oaaaaaaaao....aaaaa.',
            '..aaaa...oaaaaaaaaaao...aaaa..',
            '...aaaa.oaaaaaaaaaaaao.aaaa...',
            '....aaaaoaaaaaaaaaaaaoaaaa....',
            '........oaaaaaaaaaaaao........',
            '........oaaaaaaaaaaaao........',
            '.......oaaaaaaaaaaaaaao.......',
            '.......oaaaaaaaaaaaaaao.......',
            '......oaaaaaaaaaaaaaaaao......',
            '......oaaaaaaaaaaaaaaaao......',
            '.....oaaa.aaa.aaa.aaa.aao.....',
            '.....aa...aa...aa...aa..a.....'
        ])
    },
    // ルキハ・ニオニオーテン (13 章。ルキハの 第 2 形態。新キャラ・2026-10-30): 喰らってきた 生き物の つぎはぎの キメラ。
    //   左に 竜の 翼・右に 大きな 鬼の 腕・うろこの 体 (むらさきの 紋)・けものの 足・鳥の くちばし。上の まんなかに ぐちゃぐちゃの ルキハの 顔。
    //   部位 (翼・腕・体・足・頭) は この 絵の 上で ねらう (nakama.js の rect)
    niolioten: {
        w: 32, h: 28,
        palette: { o: '#0a0408', w: '#3a1a4a', W: '#6a3a8a', h: '#2a2438', s: '#c8a898', S: '#8a5a6a', r: '#e02040', m: '#3a0a10', y: '#e0a020',
            b: '#2a2a3a', B: '#4a4a6a', c: '#a040e0', a: '#a02020', A: '#ffd040', l: '#5a3a2a', L: '#8a5a3a', k: '#e0e0e0' },
        frames: bob([
            '........oo......................',
            '.......owWo.oooooooo............',
            '......owwWoohhhhhhhho...........',
            '.....oWWWWoohhhhhhhho...........',
            '....owwwwWoohssssssso...........',
            '...owwwwwWoosrrsssshoo..........',
            '..owwwwwwWoosSsssrssyyo.........',
            '.oWWWWWWWWoossmmmmssyooooooo....',
            'owwwwwwwwWoosssmssSsooaaaaaao...',
            'wwwwwwwwwWbbBbbBbbBbbBaaaaaao...',
            'wwwwwwwwwWbBbbBbbBbbBbaaaaaAo...',
            'WWWWWWWWWWBbbBbbBbbBbbaaaaaao...',
            'wwwwwwwwwWbbBbbBbbBbbBaaaaaao...',
            'wwwwwwwwwWbBbbBcccbbBbaaaaaaooo.',
            'wwwwwwwwwWBbbBcccbbBbbaaaaaaaaao',
            'oooooooooobbBbbBbbBbbBaaaaaaaaao',
            '.........obBbbBbbBbbBboaaaaaaaao',
            '.........oBbbBbbBbbBbboaaaaaaaao',
            '.........obbBbbBbbBbbBoaaaaaaaao',
            '.........obBbbBbbBbbBbooAoAoAoAo',
            '.........oBbbBbbBbbBbbo.o.o.o.o.',
            '........ollLllloollLlllo........',
            '........olLlllLoolLlllLo........',
            '........oLlllLlooLlllLlo........',
            '........olllLlloolllLllo........',
            '........ollLllloollLlllo........',
            '........olLlllLoolLlllLo........',
            '........okokoko.okokoko.........'
        ])
    }
};
