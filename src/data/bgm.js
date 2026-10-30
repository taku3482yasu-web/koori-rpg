// =====================================================================
// BGM の 楽譜 (2026-10-30 ユーザー指定: 町ごと・ボスごとの 戦闘 BGM)
// ---------------------------------------------------------------------
// 効果音と 同じく 音の ファイルは 使わず、core/bgm.js が WebAudio で 鳴らす。
// 1 曲 = 8 小節を くりかえす。1 小節は steps こ (ふつう 8 = 8 分音符。6 は 3 拍子・6/8 の ノリ)
//
//   root: メロディの「1」の 音 (MIDI の 番号。60 = ド)。ベースは 2 オクターブ 下、和音は 1 オクターブ 下
//   mode: 音階 (MODES)。メロディと 和音は この 音階の 度数で 書く
//   melody: 度数を 空白で 区切る。1 こ = 1 step。' で 1 オクターブ 上・, で 下・# b で 半音。
//           - は 前の 音を のばす・. は 休み。| は 見やすくする ための 区切り (読みとばす)
//   chords: 1 小節に 1 つ、和音の 根音の 度数 (音階の 3 和音)
//   bass:   1 小節ぶんの 形 (r 根音・o 根音の 1 オクターブ 上・f 5 度・- のばす・. 休み)
//   arp:    和音を ばらして 鳴らす 形 (0・1・2 = 和音の 1・3・5 度の 音・3 = 根音の 1 オクターブ 上)。なしでも よい
//   drums:  k キック・s スネア・h ハイハット・x キック + ハイハット・b 木魚 (お寺)・. なし
//   lead:   メロディの 音色 (square・triangle・sine・sawtooth)
// =====================================================================
export const MODES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    harmonic: [0, 2, 3, 5, 7, 8, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],   // 和風 (みやこぶし) にも 使う
    lydian: [0, 2, 4, 6, 7, 9, 11]
};

export const SONGS = {
    // ----- タイトル -----
    title: {
        name: 'こおりくんの 大冒険', bpm: 116, root: 72, mode: 'major', lead: 'square',
        melody: "5, - 1 2 3 - 5 - | 4 - 3 2 2 - . 5, | 6, - 1 3 6 - 5 - | 4 - 3 4 6 - - . | 5 - 1' 7 6 - 5 - | 4 3 2 - 5 - 7, - | 6, 1 4 6 5 - 3 1 | 2 - - 5, 2 - 7, -",
        chords: '1 5 6 4 1 5 4 5', bass: 'r . o . f . o .', arp: '0 . 2 . 1 . 2 .', drums: 'k h s h k k s h'
    },

    // ----- 町 (地区) ごと。地区の 名前は nakama.js の AREAS -----
    ishinokawa: {
        name: '石の川タウンの 夏休み', bpm: 112, root: 67, mode: 'major', lead: 'square',
        melody: "1 . 3 5 1' - 5 . | 6 - 4 6 5 - . . | 3 . 5 1' 7 - 6 5 | 2 - 3 4 5 - - . | 1 . 3 5 1' - 2' 1' | 7 6 4 6 1' - 6 - | 5 . 3 . 2 - 5 . | 1 - - . 5, . 7, .",
        chords: '1 4 1 5 1 4 5 1', bass: 'r . f . o . f .', arp: '. 1 . 2 . 1 . 2', drums: 'k h s h k h s h'
    },
    shoutengai: {
        name: 'ネオンの 商店街', bpm: 128, root: 65, mode: 'mixolydian', lead: 'square',
        melody: "1' . 1' 7 5 . 4 5 | . 7 - 5 4 - 2 . | 4 . 6 1' 6 . 4 6 | 5 - 3 1 2 - . . | 1' . 1' 7 5 . 4 5 | . 7 - 5 4 - 7 1' | 2' . 1' 7 6 . 4 6 | 5 - - . 5 . 7 .",
        chords: '1 7 4 1 1 7 4 5', bass: 'r . r o . o f .', arp: '. 0 . 1 . 2 . 1', drums: 'k h s h k s s h'
    },
    school: {
        name: '夜の 石の川小学校', bpm: 92, root: 69, mode: 'harmonic', lead: 'triangle',
        melody: "1 . 3 . 5 - 4 3 | 3 - - . . . . . | 6, . 1 . 4 - 3 2 | 7, - - - . . . . | 1' . 7 . 6 - 5 4 | 3 - 6 - . . 1 . | 2 . 4 . 6 - 5 4 | 7, - 2 - 5, - - .",
        chords: '1 6 4 5 1 6 2 5', bass: 'r . . . r . . .', arp: '0 1 2 1 0 1 2 1', drums: '. . . . h . . .'
    },
    yama: {
        name: '山と 氷の ダム', bpm: 104, root: 62, mode: 'dorian', lead: 'square',
        melody: "1' - 5 - 1' 2' 3' - | 2' - 1' 6 5 - - . | 4 5 6 - 5 4 3 - | 1 - 2 - 3 - - . | 5 - 3 5 6 - 5 3 | 4 - 6 1' 6 - - 4 | 7, - 2 4 3 - 2 1 | 1 - - - . . 5, .",
        chords: '1 4 1 7 3 4 7 1', bass: 'r - o - f - o -', arp: '0 1 2 3 2 1 0 1', drums: 'k . h . s . h h'
    },
    umi: {
        name: '海辺の 町', bpm: 100, root: 70, mode: 'major', lead: 'triangle',
        melody: "3 - 5 - 6 5 3 - | 1 - 2 3 2 - . . | 6, 1 2 - 1 6, 5, - | 2 - - 3 5 - . . | 3 - 5 - 6 1' 6 5 | 3 - 2 1 6, - 1 - | 4 - 6 - 5 - 3 2 | 1 - - - . . . .",
        chords: '1 6 2 5 1 6 4 5', bass: 'r . . f o . f .', arp: '. . 2 . . 1 . .', drums: 'k . h k . . s h'
    },
    tera: {
        name: 'ネット寺', bpm: 88, root: 62, mode: 'phrygian', lead: 'triangle',
        melody: "1' - - 6 5 - 4 - | 2 - 4 - 5 - - . | 6 - 5 6 1' - 6 5 | 4 - - 2 1 - - . | 5 - 6 1' 2' - 1' 6 | 5 - 4 - 5 6 5 - | 4 - 2 - 4 5 2 - | 1 - - - . . . .",
        chords: '1 2 6 1 4 6 2 1', bass: 'r - - - f - - -', drums: 'k . . b . . b .'
    },
    yashiki: {
        name: '忍びの屋敷', bpm: 138, root: 64, mode: 'phrygian', lead: 'square',
        melody: "1 . 1 2 4 . 5 . | 6 5 4 2 1 - . . | 1 . 1 2 4 . 6 . | 5 - 4 2 4 - . . | 1' . 6 . 5 . 6 1' | 2' - 1' 6 5 - - . | 4 . 5 6 5 4 2 4 | 1 - - . 1 . . .",
        chords: '1 1 2 1 6 7 2 1', bass: 'r r o r r o r o', drums: 'k h s h k k s h'
    },
    moon: {
        name: '月の迷宮', bpm: 80, root: 65, mode: 'lydian', lead: 'sine',
        melody: "5 - - - 3 - 2 - | 4 - - - 3 - - . | 5 - 6 - 7 - 1' - | 2' - - - 1' - - . | 3' - 2' - 7 - 5 - | 6 - - 4 3 - - . | 2 - 3 - 4 - 6 - | 5 - - - . . . .",
        chords: '1 2 1 2 3 2 7 1', bass: 'r - - - - - - -', arp: '0 1 2 3 0 1 2 3', drums: '. . . . . . . .'
    },

    shiro: {
        name: '金色のSE城', bpm: 118, root: 69, mode: 'minor', lead: 'square',
        melody: "1 . 1 2 3 . 5 . | 6 - 5 - 3 - . . | 1' . 7 6 5 . 3 . | 5 - - - . . . . | 3 . 3 5 6 . 1' . | 7 - 6 - 5 - 3 - | 4 . 3 2 1 . 2 . | 1 - - - 5, - - .",
        chords: '1 4 6 5 3 7 4 1', bass: 'r . o . r . o .', drums: 'k . k s . k s .'
    },

    shuugeki: {
        name: '黒い 霧の 町', bpm: 96, root: 67, mode: 'harmonic', lead: 'triangle',
        melody: "1 . 3 . 5 . 3 . | 7, - - - . . . . | 1 . 3 . 6 . 5 . | 4 - 3 - . . . . | 6 . 5 . 4 . 3 . | 2 - 1 - 7, - . . | 1 . 2 . 3 . 4 . | 5 - - - 7, - - .",
        chords: '1 5 1 4 6 5 1 5', bass: 'r - - - r - - -', arp: '0 1 2 1 0 1 2 1', drums: 'k . . . s . . .'
    },
    tsubo: {
        name: 'ASOの壺の底', bpm: 88, root: 62, mode: 'phrygian', lead: 'sawtooth',
        melody: "1 - - 2 1 - - . | 5, - - - . . . . | 1 - - 2 4 - 2 . | 1 - - - . . . . | 4 - - 5 6 - 5 . | 4 - 2 - 1 - . . | 2 - 1 - 7, - 6, . | 1 - - - . . . .",
        chords: '1 6 1 2 4 2 7 1', bass: 'r - - - o - - -', drums: 'k . . . k . s .'
    },
    kinniku: {
        name: '筋肉の山', bpm: 108, root: 62, mode: 'mixolydian', lead: 'square',
        melody: "1 . 1 5, 1 . 2 3 | 4 - 3 - 2 - . . | 5 . 5 4 5 . 6 7 | 1' - - - 7 - 5 . | 6 . 6 5 4 . 3 4 | 5 - 4 - 3 - 1 . | 2 . 3 4 5 . 4 3 | 2 - - - 5, - - .",
        chords: '1 4 5 1 4 1 5 1', bass: 'r . r . o . r .', drums: 'k . s . k k s .'
    },
    park: {
        name: 'ようこそ 遊園地へ', bpm: 132, root: 72, mode: 'major', lead: 'square',
        melody: "5 . 5 6 5 . 3 . | 1' . 7 6 5 - . . | 4 . 4 5 6 . 1' . | 7 - 6 - 5 - . . | 3 . 5 1' 7 . 6 5 | 6 . 4 6 5 . 3 1 | 2 . 3 4 5 . 7, 2 | 1 - - - . . 5, .",
        chords: '1 4 4 5 1 4 2 5', bass: 'r . f . r . f .', arp: '. 2 . 1 . 2 . 1', drums: 'k h s h k k s h'
    },

    // ----- ふつうの 戦闘・ライバル探検隊 -----
    battle: {
        name: 'なかまと バトル', bpm: 152, root: 69, mode: 'minor', lead: 'square',
        melody: "1 . 1 . 3 . 5 4 | 5 . 4 . 3 2 1 2 | 3 . 3 . 6 . 5 3 | 4 . 5 . 2 - . . | 1' . 7 . 5 . 3 5 | 7 . 6 . 5 4 3 2 | 4 . 6 . 1' . 6 4 | 5 - 4 - 7, - 2 -",
        chords: '1 7 6 7 1 7 4 5', bass: 'r o r o r o r o', drums: 'k h s h k k s h'
    },
    rival: {
        name: 'ライバル探検隊', bpm: 156, root: 64, mode: 'dorian', lead: 'square',
        melody: "5 . 5 6 . 5 3 . | 4 - 6 - 5 - 3 2 | 5 . 5 6 . 5 1' . | 7 - 6 - 4 - . . | 2' - 1' 7 . 6 7 . | 1' - - 5 3 - 5 . | 6 . 6 5 4 . 6 . | 5 - 7, 2 5 - . .",
        chords: '1 4 1 4 7 1 4 5', bass: 'r . o r . r o .', drums: 'k h s k k h s h'
    },

    // ----- ボスごとの 戦闘 BGM (nakama.js の BOSSES の id) -----
    nushi: {
        name: '足音 百かぞえ (ヌシ)', bpm: 132, root: 60, mode: 'harmonic', lead: 'sawtooth',
        melody: "1 . 1 . 1 . 3 2 | 1 . 7, . 6, - . . | 1 . 1 . 1 . 4 3 | 2 - 7, - 5, - . . | 5 . 5 6 5 . 3 . | 4 . 4 5 4 . 2 . | 3 . 3 4 3 . 1 . | 7, - 2 - 5 - 7 -",
        chords: '1 1 6 5 1 1 4 5', bass: 'r . r . r . r .', drums: 'k . s . k . s k'
    },
    kage: {
        name: 'ろうかを 走る 影 (ルナシャドウ)', bpm: 144, root: 71, mode: 'phrygian', lead: 'square',
        melody: "1 2 1 . 5 . 4 . | 2 1 2 . 1 - . . | 1 2 1 . 6 . 5 . | 4 2 4 . 5 - . . | 1' . 7 6 5 . 6 5 | 4 . 2 1 2 - . . | 6, . 1 2 4 . 2 1 | 2 - - 1 - - . .",
        chords: '1 2 1 2 4 3 2 1', bass: 'r . . r . . r .', drums: 'k . . s . . k s'
    },
    himuro: {
        name: '氷河の 咆哮 (ダムの主)', bpm: 138, root: 62, mode: 'harmonic', lead: 'square',
        melody: "1' - 7 - 1' 2' 3' - | 2' - 1' - 7 - 5 - | 6 - 5 - 6 7 1' - | 7 - - - 5 - - . | 3' - 2' - 1' - 6 - | 1' - 7 6 5 - 3 - | 4 - 5 6 2' - 1' 7 | 7 - - - 5 - 7 -",
        chords: '1 6 4 5 1 6 2 5', bass: 'r o r o r o r o', arp: '0 1 2 1 0 1 2 1', drums: 'k h s h k k s h'
    },
    urashima4: {
        name: '黒い 紋と 玉手箱 (浦の島重蔵)', bpm: 140, root: 67, mode: 'harmonic', lead: 'square', steps: 6,
        melody: "1 - 3 5 - 3 | 1' - 7 6 - 5 | 6 - 1' 4 - 6 | 5 - - 7, - - | 1 - 3 5 - 1' | 3' - 2' 1' - 6 | 4 - 6 1' - 7 | 7 - - 5 - -",
        chords: '1 6 4 5 1 6 4 5', bass: 'r - o f - o', drums: 'k h h s h h'
    },
    daishi5: {
        name: '鬼の面と お経 (ダイシ)', bpm: 120, root: 62, mode: 'phrygian', lead: 'sawtooth',
        melody: "1 - 1 2 4 - 5 - | 6 - 5 4 5 - - . | 1' - 6 5 6 - 5 4 | 2 - - - 1 - - . | 5 . 5 6 1' . 2' 1' | 6 - 5 - 4 - 2 - | 4 . 5 6 5 . 4 2 | 1 - - - 1 . 2 .",
        chords: '1 1 2 1 6 6 2 1', bass: 'r . r . o . r .', drums: 'k b s b k b s b'
    },
    zumitani6: {
        name: '影分身 (ズミタニ)', bpm: 168, root: 64, mode: 'minor', lead: 'square',
        melody: "1 3 4 5 7 5 4 3 | 4 5 4 3 1 - . . | 1 3 4 5 1' 7 5 4 | 5 - 3 - 4 - . . | 1' . 1' 7 5 . 5 4 | 3 . 3 4 5 - . . | 6 . 6 5 4 . 4 3 | 2 - 5, - 7, - 2 -",
        chords: '1 1 7 6 1 1 4 5', bass: 'r o r o r o r o', drums: 'k h s h k h s s'
    },
    onioni6: {
        name: '光の 消えた 目 (おにおに)', bpm: 128, root: 65, mode: 'minor', lead: 'square',
        melody: "5 - - 4 3 - 1 - | 3 - - 2 1 - 6, - | 1 - 3 - 5 - 1' - | 7 - - - . . 5 . | 1' - 7 - 6 - 5 - | 6 - 5 - 4 - 3 - | 4 - 3 - 4 - 6 - | 5 - - - 7, - - .",
        chords: '1 6 3 7 1 6 4 5', bass: 'r - o - r - o -', arp: '0 1 2 1 0 1 2 1', drums: 'k . s . k k s .'
    },
    tomooka6: {
        name: '幹部の 右腕 (トモオカ)', bpm: 150, root: 70, mode: 'phrygian', lead: 'sawtooth',
        melody: "1 . . 1 2 . 1 . | 5 . . 4 2 - . . | 1 . . 1 2 . 4 . | 5 . 6 . 5 - . . | 1' . 7 . 6 . 5 . | 6 . 5 . 4 . 2 . | 1 . 2 . 4 . 5 6 | 5 - - - 2 - 1 -",
        chords: '1 2 1 7 6 2 1 1', bass: 'r . . r . . r r', drums: 'k . . s . . k s'
    },
    runaya7: {
        name: '満ちていく 月 (ルナヤ)', bpm: 132, root: 61, mode: 'harmonic', lead: 'triangle', steps: 6,
        melody: "5 - - 1' - 7 | 6 - 5 4 - - | 3 - - 6 - 5 | 5 - - - - . | 1' - 7 6 - 5 | 4 - 3 4 - 6 | 5 - 4 3 - 2 | 7, - - 2 - -",
        chords: '1 6 4 5 1 6 2 5', bass: 'r - - f - -', arp: '0 1 2 3 2 1', drums: 'k . h s . h'
    },
    ooni8: {
        name: '大地 ゆらし (大鬼)', bpm: 120, root: 57, mode: 'phrygian', lead: 'sawtooth',
        melody: "1 - . 1 - . 2 - | 1 - - - . . . . | 1 - . 1 - . 4 - | 3 - 2 - 1 - . . | 5 - . 5 - . 6 - | 5 - 4 - 2 - . . | 4 - 5 - 6 - 7 - | 1' - - - 5 - - .",
        chords: '1 1 1 2 6 6 4 1', bass: 'r - . r - . r .', drums: 'k . . k . . s .'
    },
    soutou8: {
        name: 'ふたつの 頭 (双頭鬼)', bpm: 146, root: 64, mode: 'harmonic', lead: 'square',
        melody: "5 4 3 . 1, 2, 3, . | 6 5 4 . 2, 3, 4, . | 1' 7 6 . 3, 4, 5, . | 7 - - . 7, - - . | 5 4 3 . 1, 2, 3, . | 6 5 4 . 4, 5, 6, . | 7 6 5 . 5, 6, 7, . | 1' - - . 1 - - .",
        chords: '1 4 6 5 1 4 5 1', bass: 'r o r o r o r o', drums: 'k h s h k k s h'
    },
    kinme8: {
        name: '黄金の なぐりあい (金滅鬼)', bpm: 164, root: 66, mode: 'minor', lead: 'square',
        melody: "1 . 1 3 5 . 4 3 | 4 . 4 5 6 . 5 4 | 5 . 5 6 7 . 6 5 | 1' - 7 - 5 - . . | 3' . 2' 1' 7 . 1' 2' | 3' - 2' - 1' - 5 - | 6 . 5 4 3 . 2 3 | 5 - - 7, 5 - - .",
        chords: '1 4 5 1 3 7 4 5', bass: 'r o r o r o r o', drums: 'x h s h x h s s'
    },
    onioni8: {
        name: '紋に のまれた ともだち (おにおに)', bpm: 158, root: 65, mode: 'harmonic', lead: 'square',
        melody: "1 . 3 . 5 . 1' 7 | 6 - 5 - 4 - 3 - | 4 . 6 . 1' . 3' 2' | 1' - 7 - 5 - . . | 6 . 6 7 1' . 7 6 | 5 . 5 6 7 . 6 5 | 4 . 3 4 6 . 1' 2' | 7 - - - 5 - 7 -",
        chords: '1 6 4 5 6 1 4 5', bass: 'r o r o r o r o', arp: '0 1 2 1 0 1 2 1', drums: 'k h s h k k s h'
    },
    saaraha14: {
        name: '内定とりけし (サアラハ)', bpm: 148, root: 63, mode: 'harmonic', lead: 'sawtooth',
        melody: "1 . 2 3 . 2 1 . | 7, - 1 - 5, - . . | 1 . 2 3 . 5 4 . | 3 - 2 - 7, - . . | 6 . 5 6 . 5 3 . | 4 - 3 - 2 - 1 - | 6, . 7, 1 . 2 3 . | 7, - - - 5, - 7, -",
        chords: '1 5 1 5 6 4 6 5', bass: 'r o r o r o r o', arp: '0 1 2 1 0 1 2 1', drums: 'k h s h k h s s'
    },
    rihama14: {
        name: '暴走 信号無視 (リハマ)', bpm: 172, root: 64, mode: 'mixolydian', lead: 'square',
        melody: "1 1 1 . 5 . 4 . | 7, 7, 7, . 4 . 3 . | 1 1 1 . 5 . 6 . | 7 - 6 - 5 - . . | 1' . 7 . 6 . 5 . | 4 . 3 . 2 . 1 . | 4 4 4 . 5 5 5 . | 6 - 7 - 1' - 5 -",
        chords: '1 7 1 5 4 1 4 5', bass: 'r r o r r r o r', drums: 'x h s h x h s s'
    },
    bakuen11: {
        name: '火山の 底の 竜 (バクエンリュウ)', bpm: 136, root: 60, mode: 'harmonic', lead: 'sawtooth',
        melody: "1 . 1 . 2 3 2 . | 1 . 7, . 6, - . . | 1 . 1 . 3 4 3 . | 2 - - - 5, - . . | 6 . 6 . 7 1' 7 . | 6 . 5 . 4 - . . | 3 . 4 . 5 6 7 . | 1' - - - 5 - - .",
        chords: '1 5 1 5 6 4 2 5', bass: 'r r o r r r o r', arp: '0 1 2 1 0 1 2 1', drums: 'k . s . k k s .'
    },
    tashikeda10: {
        name: '私はハッキングが好きだ！ (タシケダ)', bpm: 160, root: 64, mode: 'phrygian', lead: 'square',
        melody: "1 1 2 1 5 . 4 . | 2 2 1 2 1 - . . | 1 1 2 1 6 . 5 . | 4 4 2 4 5 - . . | 1' . 7 . 6 6 5 . | 4 . 2 . 1 1 2 . | 4 4 5 6 5 4 2 1 | 2 - 1 - 2 - 5, -",
        chords: '1 2 1 2 6 4 2 1', bass: 'r o r o r o r o', drums: 'x h s h x h s s'
    },
    harukirin9: {
        name: '春の 目ざめ (ハル麒麟)', bpm: 140, root: 69, mode: 'lydian', lead: 'triangle',
        melody: "5 . 3 . 5 6 5 . | 4 - 3 - 2 - . . | 1' . 7 . 6 5 6 . | 7 - - - . . . . | 3' . 2' . 1' 7 6 . | 5 - 4 - 3 - 2 . | 1 . 2 . 3 4 5 . | 6 - 7 - 1' - 5 -",
        chords: '1 2 4 5 1 2 4 5', bass: 'r o r o r o r o', arp: '0 1 2 3 2 1 0 1', drums: 'k h s h k h s h'
    },
    nozoema9: {
        name: '四天王最強 (ノゾエマ)', bpm: 154, root: 62, mode: 'harmonic', lead: 'sawtooth',
        melody: "1 . 1 . 1 2 3 . | 5 - 4 - 3 - 2 . | 1 . 1 . 1 2 3 . | 7, - - - 5, - . . | 6 . 6 . 6 7 1' . | 2' - 1' - 7 - 6 . | 5 . 5 6 7 . 1' 2' | 7 - - - 5 - 7 -",
        chords: '1 4 1 5 6 2 4 5', bass: 'r r o r r r o r', drums: 'x h s h x h s s'
    },
    // 曲が まだ ない ボス (10 章 から 先) は これ
    boss: {
        name: 'ボス バトル', bpm: 150, root: 69, mode: 'harmonic', lead: 'square',
        melody: "1 . 3 . 5 . 1' . | 7 - 6 - 5 - . . | 4 . 6 . 1' . 3' . | 2' - 1' - 7 - . . | 1' . 7 6 5 . 6 7 | 1' - 5 - 3 - . . | 4 . 4 5 6 . 7 1' | 7 - - - 5 - 7 -",
        chords: '1 6 4 5 1 6 2 5', bass: 'r o r o r o r o', drums: 'k h s h k k s h'
    }
};

const tokens = s => (s || '').split(/\s+/).filter(t => t && t !== '|');

// 度数 → 半音の 数 (1 = 0)
function degree(tok, mode) {
    const m = /^([#b]?)([1-7])([',]*)$/.exec(tok);
    if (!m) return null;
    const scale = MODES[mode];
    let semi = scale[Number(m[2]) - 1] + (m[1] === '#' ? 1 : m[1] === 'b' ? -1 : 0);
    for (const c of m[3]) semi += c === "'" ? 12 : -12;
    return semi;
}
// 音階の 3 和音 (根音から 1 つ とばしで 3 つ)。半音の 数で 返す
function triad(root, mode) {
    const scale = MODES[mode];
    return [0, 2, 4].map(k => scale[(root - 1 + k) % 7] + (root - 1 + k >= 7 ? 12 : 0));
}

// 楽譜を 鳴らす 音の 列に する。{ steps, total, stepSec, notes: [{ step, len, midi, voice }], hits: [{ step, kind }] }
export function compileSong(song) {
    const steps = song.steps || 8;
    const chords = tokens(song.chords).map(Number);
    const total = chords.length * steps;
    const stepSec = 60 / song.bpm / 2;   // 1 step = 8 分音符
    const notes = [];
    const hold = (list, i) => { let n = 1; while (list[(i + n) % list.length] === '-' && i + n < list.length) n++; return n; };
    // メロディ
    const mel = tokens(song.melody);
    mel.forEach((t, i) => {
        const d = degree(t, song.mode);
        if (d !== null) notes.push({ step: i, len: hold(mel, i), midi: song.root + d, voice: 'lead' });
    });
    // ベースと 和音: 1 小節の 形を 小節ごとに くりかえす
    for (const [voice, pat] of [['bass', tokens(song.bass)], ['arp', tokens(song.arp)]]) {
        if (!pat.length) continue;
        for (let s = 0; s < total; s++) {
            const t = pat[s % pat.length];
            const ch = triad(chords[Math.floor(s / steps)], song.mode);
            let midi = null;
            if (voice === 'bass') {
                const base = song.root - 24 + ch[0];
                midi = t === 'r' ? base : t === 'o' ? base + 12 : t === 'f' ? base + 7 : null;
            } else {
                midi = /^[0-2]$/.test(t) ? song.root - 12 + ch[Number(t)] : t === '3' ? song.root + ch[0] : null;
            }
            if (midi !== null) notes.push({ step: s, len: voice === 'bass' ? hold(pat, s % pat.length) : 1, midi, voice });
        }
    }
    const hits = [];
    const dr = tokens(song.drums);
    if (dr.length) for (let s = 0; s < total; s++) {
        const t = dr[s % dr.length];
        if (t === 'x') hits.push({ step: s, kind: 'k' }, { step: s, kind: 'h' });
        else if (t !== '.') hits.push({ step: s, kind: t });
    }
    return { steps, total, stepSec, notes, hits };
}

// いま 鳴らす 曲。scene: 場面の 名前 / area: 町の 地区 / battle: バトル (kind・ボスの id・おわったか)
//   バトルが おわったら 止める (勝ち・負けの 効果音を 聞かせる)。結果画面も 止める
export function bgmFor({ scene, area, battle, story = null }) {
    if (scene === 'title') return 'title';
    // 10 章: 黒い 霧の 町 (石の川タウン・商店街)
    if (story === 'shuugeki' && (area === 'ishinokawa' || area === 'shoutengai') && scene !== 'battle') return 'shuugeki';
    if (scene === 'field' || scene === 'menu' || scene === 'fusion') return SONGS[area] ? area : 'ishinokawa';
    if (scene === 'battle' && battle) {
        if (battle.outcome) return null;
        if (battle.kind === 'boss' || battle.kind === 'kairou') return SONGS[battle.bossId] ? battle.bossId : 'boss';
        if (battle.kind === 'rival' || battle.kind === 'team') return 'rival';
        return 'battle';
    }
    return null;
}
