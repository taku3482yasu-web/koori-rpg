// =====================================================================
// なかま 61 体の うしろ姿 (2026-10-26 ユーザー指定: バトルで 手前に いる 味方は 背中を 見せる。商店街の 20 体は 2026-10-27)
// ---------------------------------------------------------------------
// 前向きの 絵 (legacy-art.js・new-art.js) と 同じ 形・同じ 色。1 文字 = 1 ドット・'.' は 透明・16 × 16。
//   描いた もの: 体の うしろが 前と ちがう キャラ (トゲ・羽・しっぽ・甲羅・はちまきの むすび目 など)
//   顔を 消した もの (faceless): 石や キノコの ように 前と うしろで 形が 同じ キャラ。顔の 文字を 体の 色に 置きかえ、左右を 反転
// 待機 1 は 1 ドット 上に はねる (bob)
// =====================================================================
import { LEGACY_ART } from './legacy-art.js';
import { NEW_ART } from './new-art.js';
import { backArt } from './back.js';

const FRONT = { ...LEGACY_ART, ...NEW_ART };
const W = 16;

// 行を 16 ドットに する (短い 行は まんなかに 寄せる)
const row = r => {
    if (r.length >= W) return r;
    const left = Math.floor((W - r.length) / 2);
    return '.'.repeat(left) + r + '.'.repeat(W - r.length - left);
};
const bob = rows => [rows, [...rows.slice(1), '.'.repeat(rows[0].length)]];
const drawn = (palette, rows, { still = false } = {}) => {
    const r = rows.map(row);
    return { w: W, h: r.length, palette, frames: still ? [r, r] : bob(r) };
};
// 前向きの 絵から 顔を 消す。swap: { 顔の 文字: 体の 文字 }。rows: [から, まで) の 行だけ 置きかえる (足や 王冠は そのまま)
const faceless = (id, swap, { mirror = true, still = false, rows = [0, 99] } = {}) => {
    const f = FRONT[id];
    const r = f.frames[0].map((line, y) => {
        let s = y >= rows[0] && y < rows[1] ? [...line].map(ch => swap[ch] || ch).join('') : line;
        if (mirror) s = [...s].reverse().join('');
        return s;
    });
    return { w: f.w, h: f.h, palette: f.palette, frames: still ? [r, r] : bob(r) };
};
const pal = id => FRONT[id].palette;
// 顔を 自動で 消して (back.js) 左右を 反転 (5 章の キャラと 進化先。2026-10-29)
const auto = id => {
    const r = backArt(FRONT[id]).frames[0].map(line => [...line].reverse().join(''));
    return { w: FRONT[id].w, h: FRONT[id].h, palette: FRONT[id].palette, frames: bob(r) };
};

export const BACK_ART = {
    // ハリベビー: まるい 背中 いっぱいの トゲ
    haribaby: drawn(pal('haribaby'), [
        '', '',
        's.s.s.s',
        'sSsSsSsSs',
        'sSsSsSsSsSs',
        'sSsSsSsSsSsSs',
        'sSsSsSsSsSsSs',
        'sSsSsSsSsSsSs',
        'sSsSsSsSsSsSs',
        'sSsSsSsSsSs',
        'bbbbbbbbb',
        'b.b...b.b',
        '', '', '', ''
    ]),
    // ムメンキョバチ: 赤い 髪の うしろ・しましまの 体・広げた 羽・おしりの 針
    mumenbachi: drawn(pal('mumenbachi'), [
        '',
        'hhhh',
        'hhhhhh',
        'hhhhhh',
        'yyyyyy',
        'www..yyyyyy..www',
        '.wwwkkkkkkkkwww.',
        'yyyyyyyy',
        'kkkkkkkk',
        'yyyyyy',
        'kkkk',
        'kk',
        'k',
        '', '', ''
    ]),
    // ドングリコ: ぼうしと つるんとした 背中 (光は 左に)
    donguriko: drawn(pal('donguriko'), [
        'cc',
        'cCcCcCcC',
        'CcCcCcCcCc',
        'cccccccccc',
        'nnnnnnnn',
        'lnnnnnnnnn',
        'lnnnnnnnnn',
        'lnnnnnnnnn',
        'nnnnnnnnnn',
        'nnnnnnnn',
        'nnnnnn',
        'nnnn',
        'f....f',
        '', '', ''
    ]),
    // ネムリダケ: かさの 水玉 (左右 反転)・顔の ない 柄
    nemuridake: faceless('nemuridake', { k: 's', p: 's' }),
    // ペコリス: 耳と、背中を おおう ふさふさの しっぽ
    pekorisu: drawn(pal('pekorisu'), [
        '',
        'b......b',
        'bb....bb',
        'bbbbbbbb',
        'bbbbbbbbbb',
        'bbttttttbb',
        'bttttttttttb',
        'bccttttttttb',
        'bttttttttttb',
        'bbttttttttbb',
        'bbbttttbbb',
        'b......b',
        '', '', '', ''
    ]),
    // ツタンコブ: 顔の ない ツタ
    tsutankobu: faceless('tsutankobu', { w: 'n', k: 'n' }),
    // ヨフカシフクロウ: 耳の 羽・たたんだ 翼の もよう
    yofukashi: drawn(pal('yofukashi'), [
        '...b........b...',
        '...bb......bb...',
        '...bbbbbbbbbb...',
        '..bbbbbbbbbbbb..',
        '..bbbbbbbbbbbb..',
        '..bbbbbbbbbbbb..',
        '..bbbbbbbbbbbb..',
        '.bbblbbbbbblbbb.',
        'bbbllbbbbbbllbbb',
        '.bbllbbbbbbllbb.',
        '..bbbbblbbbbbb..',
        '...bbbblbbbbb...',
        '....yy....yy....',
        '', '', ''
    ]),
    // コガメ: こうらの もようと、ちょこんと 出た しっぽ
    kogame: drawn(pal('kogame'), [
        '', '', '', '', '', '',
        '....aaaaaaaa....',
        '...aaaaaaaaaa...',
        '...aabbaabbaa...',
        '...abbaabbaba...',
        '...aaaabbaaaa...',
        '...aabbaabbaa...',
        '...aaaaaaaaaa...',
        '...cc...c...cc..',
        '...cc.......cc..',
        ''
    ]),
    // ツリバリウオ: 背びれ・横びれ・こちらを 向いた 尾びれ
    tsuribariuo: drawn(pal('tsuribariuo'), [
        '', '', '',
        '.......bb.......',
        '......aaaa......',
        '.....aaaaaa.....',
        '....aaaaaaaa....',
        '....aaaaaaaa....',
        '...caaaaaaaac...',
        '.....aaaaaa.....',
        '......abba......',
        '.....bbbbbb.....',
        '....bbb..bbb....',
        '....bb....bb....',
        '', ''
    ]),
    // モクギョロ: 木の わっか 2 本と、反対がわに 見える ばち
    mokugyoro: drawn(pal('mokugyoro'), [
        '.eee............',
        '..e.............',
        '..e.............',
        '..e.............',
        '..eaaaaaaaaaa...',
        '..aaaaaaaaaaaa..',
        '..aaaaaaaaaaaa..',
        '..eeeeeeeeeeee..',
        '..aaaaaaaaaaaa..',
        '..aaaaaaaaaaaa..',
        '..eeeeeeeeeeee..',
        '..aaaaaaaaaaaa..',
        '..aaaaaaaaaaaa..',
        '..aaaaaaaaaaaa..',
        '', ''
    ]),
    // ロウソクビ: 顔の ない ろうそく
    rousokubi: faceless('rousokubi', { d: 'a' }),
    // ダイチョウエンキン: 顔の ない つぶつぶ
    daichouenkin: faceless('daichouenkin', { b: 'a', c: 'a' }),
    // クナイスズメ: はちまきの むすび目・たたんだ 羽・しっぽ
    kunaisuzume: drawn(pal('kunaisuzume'), [
        '', '', '', '',
        '......d...d.....',
        '....cccccccc....',
        '....aaaddaaa....',
        '...gaaaaaaaag...',
        '...ggaaaaaagg...',
        '...gggaaaaggg...',
        '...gggaaaaggg...',
        '....ggaaaagg....',
        '......aaaa......',
        '.....gaaaag.....',
        '......f..f......',
        ''
    ]),
    // カワリミダヌキ: 頭の 葉っぱ・耳・しましまの しっぽ
    kawarimidanuki: drawn(pal('kawarimidanuki'), [
        '',
        '........f.......',
        '......eeee......',
        '......eeee......',
        '......eeee......',
        '...bb......bb...',
        '...bbaaaaaabb...',
        '...aaaaaaaaaa...',
        '...aaaaaaaaaa...',
        '...aaaaaaaaaa...',
        '...aaaaaaaaaa...',
        '...aaaabbaaaa...',
        '...aaaaddaaaa...',
        '...aaaabbaaaa...',
        '....bb....bb....',
        ''
    ]),
    // シノビガエル: 目の でっぱり・赤い まきものの むすび目・背中の もよう
    shinobigaeru: drawn(pal('shinobigaeru'), [
        '', '', '', '', '',
        '...aaa....aaa...',
        '...aaa....aaa...',
        '...aaaaaaaaaa...',
        '...aaaaaaaaaa...',
        '...eeeeeeeeee...',
        '...aaaaeeaaaa...',
        '...aaaeaaeaaa...',
        '...acaaaaaaca...',
        '..fffaaaaaafff..',
        '..fff......fff..',
        ''
    ]),
    // イシコロン: 顔の ない 石 (左右 反転で 影が 左に)
    ishikoron: faceless('ishikoron', { k: 'g', w: 'g' }),
    // ミズキリン: 顔の ない 平たい 石
    mizukirin: faceless('mizukirin', { k: 's' }),
    // ソウメンナガレ: 顔の ない そうめん (とい は 動かない)
    soumennagare: faceless('soumennagare', { k: 'w', p: 'w' }),
    // コザラッパ: 皿の ない 頭のてっぺん・背中の こうら
    kozarappa: drawn({ ...pal('kozarappa'), T: '#5a3a1a' }, [
        '',
        '.....oooooo.....',
        '....ogsssssgo...',
        '...oggsssssggo..',
        '..oggggggggggo..',
        '..oggggggggggo..',
        '..oggggggggggo..',
        '..ogttttttttgo..',
        '..ottTTttTTtto..',
        '.gotTttTTttTtog.',
        '..ottTTttTTtto..',
        '..oottttttttoo..',
        '...ogggoogggo...',
        '...oGGo..oGGo...',
        '...ooo....ooo...',
        ''
    ]),
    // ハシシタボウズ: 頭巾の うしろ (橋の 板は そのまま)
    hashishita: faceless('hashishita', { s: 'p', k: 'p', w: 'p' }, { still: true }),

    // ----- 商店街の 20 体 (段階 2。2026-10-27): 顔を 消して 左右を 反転 -----
    spamdama: faceless('spamdama', { d: 'a', c: 'a' }),                    // 人魂の うしろ
    popupn: faceless('popupn', { f: 'a', d: 'a', e: 'a' }),                // 広告の 窓の うら (✕ボタンだけ 残る)
    netkozou: faceless('netkozou', { d: 'c', a: 'c' }),                    // 頭の うしろ
    kinmenkoinu: faceless('kinmenkoinu', { c: 'a' }),
    burakrasher: faceless('burakrasher', { b: 'a', c: 'a', d: 'a' }),      // テレビの うら
    hannyamen: faceless('hannyamen', { a: 'b', c: 'b', d: 'b', e: 'b', f: 'b' }),   // お面の うら (木の 色)
    makibishimushi: faceless('makibishimushi', { d: 'a' }),
    hoshikuzun: faceless('hoshikuzun', { b: 'a' }),
    richibou: faceless('richibou', { d: 'a' }),                            // 点棒の うら (点が ない)
    yopparaigarasu: faceless('yopparaigarasu', { c: 'a', d: 'a' }),
    chouchinbura: faceless('chouchinbura', { d: 'b', e: 'b' }),            // ちょうちんの うしろ
    neonkurage: faceless('neonkurage', { b: 'a' }),
    saikoron: faceless('saikoron', { d: 'a' }),                            // サイコロの うらの 目
    hakupai: faceless('hakupai', { a: 'd', b: 'd', e: 'd' }),              // 麻雀牌の うらは みどり
    maikumbo: faceless('maikumbo', { c: 'b' }),
    pachinkodaman: faceless('pachinkodaman', { c: 'a', b: 'a' }),
    neontanuki: faceless('neontanuki', { b: 'a', c: 'a', d: 'a' }),        // ネオンの 看板は そのまま
    gomibakon: faceless('gomibakon', { c: 'b' }),
    gachapon: faceless('gachapon', { b: 'd' }),
    yataiman: faceless('yataiman', { d: 'g', e: 'g' }),                    // はちまきの うしろ・頭

    // ----- 石の川小学校の 9 体 (2 章。2026-10-28): 顔を 消して 左右を 反転 -----
    fusaiyougaikotsu: faceless('fusaiyougaikotsu', { b: 'a', c: 'a', f: 'd' }),   // ずがいこつの うしろ・スーツの 背中
    mirrormuscle: faceless('mirrormuscle', { b: 'e', c: 'e', d: 'e' }),           // 鏡の うら (木の 板)
    proteingolem: faceless('proteingolem', { c: 'a' }),
    takaramimic: faceless('takaramimic', { e: 'b', d: 'a' }),                     // 宝箱の うしろ
    umibozun: faceless('umibozun', { b: 'a', c: 'a' }),
    wasurekurage: faceless('wasurekurage', { b: 'a', c: 'a' }),
    mikazukibat: faceless('mikazukibat', { b: 'a' }),
    lunashadow: faceless('lunashadow', { b: 'a' }),
    yoroinukegara: faceless('yoroinukegara', { c: 'b' }),                         // かぶとの うしろ

    // ----- 山と ダムの 11 体 (3 章。2026-10-29): 顔を 消して 左右を 反転 -----
    yukimidango: faceless('yukimidango', { d: 'a', e: 'a' }),
    yukidarumuscle: faceless('yukidarumuscle', { c: 'a', d: 'a', f: 'e' }),       // 顔と ボタン
    koorimodoki: faceless('koorimodoki', { k: 'c', p: 'c' }),
    fubukipenguin: faceless('fubukipenguin', { b: 'a', c: 'a', d: 'a', e: 'a' }, { rows: [0, 13] }),   // 白い おなかは 見えない・足は オレンジ
    tsuraracomori: faceless('tsuraracomori', { c: 'a', d: 'a' }),
    koorinokagami: faceless('koorinokagami', { d: 'b', e: 'b', c: 'b' }),         // 鏡の うら
    mandoragon: faceless('mandoragon', { g: 'c', f: 'c', h: 'c' }),
    obakekabocha: faceless('obakekabocha', { d: 'b', c: 'b' }),                   // かぼちゃの うしろ
    haetorigusan: faceless('haetorigusan', { f: 'c', e: 'd' }),
    kokemusha: faceless('kokemusha', { d: 'a', e: 'a' }),                         // かぶとの うしろ
    koorimodokishin: faceless('koorimodokishin', { e: 'c', f: 'c' }, { rows: [2, 99] }),  // 王冠は そのまま
    hyougaryu: faceless('hyougaryu', { e: 'b', g: 'f' }),                                 // 頭と つばさの うしろ

    // ----- 海辺の 町と 浦の島の海岸どうくつの 9 体 (4 章。2026-10-29): 顔を 消して 左右を 反転 -----
    tamatebakogani: faceless('tamatebakogani', { d: 'c' }),                       // 玉手箱の うしろ (金具が 見えない)
    isoginchakku: faceless('isoginchakku', { c: 'a', d: 'a' }),                   // チャックの 口が 見えない
    otohimedai: faceless('otohimedai', { c: 'a', d: 'a' }),
    asedakku: faceless('asedakku', { b: 'a', c: 'a' }, { rows: [0, 13] }),        // くちばしは 見えない・足は そのまま
    uniharry: faceless('uniharry', { c: 'a' }),
    ryuuguudai: faceless('ryuuguudai', { c: 'a', d: 'a' }),
    nakatadraco: faceless('nakatadraco', { c: 'a', b: 'a' }, { rows: [3, 99] }),  // 角は そのまま
    umibozuou: faceless('umibozuou', { b: 'a', c: 'a' }),
    urashima: faceless('urashima', { f: 'm', l: 'm', n: 'm', o: 'm', q: 'm' }, { rows: [3, 17] }),  // 白い 髪と ひげの うしろ

    // ----- ネット寺の 10 体 (5 章) と 進化先 16 体 (2026-10-29): 顔を 自動で 消して 左右を 反転 -----
    enjoubouzu: auto('enjoubouzu'),
    bugmushi: auto('bugmushi'),
    htmlmokkun: auto('htmlmokkun'),
    csspakkun: auto('csspakkun'),
    nullpon: auto('nullpon'),
    loadingu: auto('loadingu'),
    mugenloop: auto('mugenloop'),
    notfound: auto('notfound'),
    virusn: auto('virusn'),
    firewall: auto('firewall'),
    harigeneral: auto('harigeneral'),
    joubachi: auto('joubachi'),
    oodonguriko: auto('oodonguriko'),
    nemuridakeou: auto('nemuridakeou'),
    pekorisuking: auto('pekorisuking'),
    tsutankobuju: auto('tsutankobuju'),
    yoakefukurou: auto('yoakefukurou'),
    hyougame: auto('hyougame'),
    spamking: auto('spamking'),
    hitodamaou: auto('hitodamaou'),
    kagebunshin: auto('kagebunshin'),
    yukimidaifuku: auto('yukimidaifuku'),
    muscletitan: auto('muscletitan'),
    hyouzanmuscle: auto('hyouzanmuscle'),
    kinkomimic: auto('kinkomimic'),
    daichouenou: auto('daichouenou'),
    daishi: auto('daishi'),
    // ----- 忍びの屋敷の 10 体と 進化先 2 体 (6 章。2026-10-29) -----
    geninman: auto('geninman'),
    shurikenbo: auto('shurikenbo'),
    bakudanjirou: auto('bakudanjirou'),
    konin: auto('konin'),
    aoonibo: auto('aoonibo'),
    kanabone: auto('kanabone'),
    makibikonmk3: auto('makibikonmk3'),
    hyoutanoni: auto('hyoutanoni'),
    taikooni: auto('taikooni'),
    jouninman: auto('jouninman'),
    daibakudanjirou: auto('daibakudanjirou'),
    zumitani: auto('zumitani'),
    // ----- 月の迷宮の 9 体と 進化先 3 体 (7 章。2026-10-29) -----
    tsukiusagi: auto('tsukiusagi'),
    nandomoslime: auto('nandomoslime'),
    mangetsuwolf: auto('mangetsuwolf'),
    watageboushi: auto('watageboushi'),
    tatsumakitsune: auto('tatsumakitsune'),
    shakkinbourei: auto('shakkinbourei'),
    tsubomajin: auto('tsubomajin'),
    kaminarigumo: auto('kaminarigumo'),
    kaguyausagi: auto('kaguyausagi'),
    shingetsuwolf: auto('shingetsuwolf'),
    rishitoribourei: auto('rishitoribourei'),
    runaya: auto('runaya'),
    // 追加の 進化先 (2026-10-30)
    daienjou: auto('daienjou'),
    kingharry: auto('kingharry'),
    // 8 章 金色のSE城 (2026-10-30)
    tsunodaruma: auto('tsunodaruma'),
    onibin: auto('onibin'),
    onigirin: auto('onigirin'),
    setsubunmame: auto('setsubunmame'),
    goukioni: auto('goukioni'),
    kinmetsuki: auto('kinmetsuki'),
    // 合体の館の ハリー一族 (2026-10-30)
    ...Object.fromEntries(['harryknight', 'harrymage', 'gargoharry', 'iwaharry', 'haridaijin', 'haridora', 'goldharry', 'harrymimic', 'metalharry', 'metalkingharry'].map(k => [k, auto(k)])),
    // 15 章で なかまに なる ライバル探検隊 (なかまの id は r_ + 絵の 名前。うしろ姿は 絵の 名前で)
    // 9 章 筋肉の山と 雪どけの 氷河
    ...Object.fromEntries(['dumbbellkong', 'magmatcho', 'kazanmatcho', 'yukiusapon', 'tsurarabo', 'kakigoora', 'penguinknight', 'shirokumatcho', 'yukionnan',
        'sakurarisu', 'harukazedori', 'fukinoton', 'harukirin', 'nozoema', 'onioni'].map(k => [k, auto(k)])),
    ...Object.fromEntries(['asahara', 'sasaki', 'kotani', 'ishii', 'mazuda', 'naitoon', 'ueno', 'shibata', 'ikekimu', 'yahami', 'maechokkin', 'norahan', 'okagappa', 'hibikimakuri', 'yamamou'].map(k => [k, auto(k)]))
};
