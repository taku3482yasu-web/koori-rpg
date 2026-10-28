// =====================================================================
// 町の 依頼 (設計書 6 章「サブクエスト」。2026-10-28 に 8 個から 始めた。のちに 40 個まで ふやす)
// ---------------------------------------------------------------------
// 話せる キャラ (map.js の FRIENDS) が たのむ。話しかけると「うける / あとで」を えらべる。
// たのまれた ことが できたら、もう いちど 話しかけると お礼が もらえる。1 人 1 つずつ 順番に
//   from: たのむ キャラ (FRIENDS の id) / after: ストーリーが ここまで 進んだら (story.js)
//   need: { kind: 'item', item, n } 道具を わたす / { kind: 'befriend', id } その キャラを なかまに する
//         { kind: 'friends', n } なかまを n 種類 / { kind: 'mysteries', n } 七不思議を n こ たしかめる
//   reward: { money, item, n } / ask: たのむ ときの 文 / thanks: お礼の 文
// =====================================================================
export const QUESTS = [
    { id: 'q_niboshi', from: 'f_kogame', after: 'friends', title: 'にぼしを 2 こ', need: { kind: 'item', item: 'niboshi', n: 2 },
        reward: { money: 150, item: 'kyuuri', n: 3 }, ask: 'ねえ、こおりくん。にぼしを 2 こ もってきて くれない？ 甲羅が じょうぶに なるんだって。', thanks: 'わあ、にぼしだ！ ありがとう。お礼に きゅうりを あげるね。' },
    { id: 'q_donguriko', from: 'f_pekorisu', after: 'friends', title: 'ドングリコを なかまに', need: { kind: 'befriend', id: 'donguriko' },
        reward: { item: 'melonpan', n: 3 }, ask: 'ドングリコと どんぐりの 数くらべを したいんだ。川原の 木の あたりに いるから、なかまに して つれてきてよ！', thanks: 'ドングリコだ！ 数くらべは……ま、まけた。お礼の メロンパン！' },
    { id: 'q_yofukashi', from: 'f_nemuridake', after: 'friends', title: '夜ふかしの ともだち', need: { kind: 'befriend', id: 'yofukashi' },
        reward: { money: 200, item: 'choco', n: 2 }, ask: 'ふぁ～……。夜の 神社に いる ヨフカシと、いっしょに 夜ふかし したいなあ……。なかまに できたら おしえて……。', thanks: 'ヨフカシ、来てくれたんだ……。今夜は いっしょに ……ぐう。（チョコを もらった）' },
    { id: 'q_ten', from: 'f_kunaisuzume', after: 'friends', title: 'なかまを 10 種類', need: { kind: 'friends', n: 10 },
        reward: { money: 500 }, ask: 'チュンッ！ なかまを 10 種類 あつめたら、修行の しあげに お金を あげるぞ！', thanks: 'チュンッ！ 10 種類 あつめたな！ 約束の おこづかいだ！' },
    { id: 'q_rousokubi', from: 'f_mokugyoro', after: 'clear', title: 'ロウソクビを みせて', need: { kind: 'befriend', id: 'rousokubi' },
        reward: { money: 300, item: 'onigiri', n: 3 }, ask: 'ポク……。お寺の 裏で ゆれる ろうそくの 正体、なかまに したら 見せて おくれ。', thanks: 'おお、この 子 じゃったか。お寺の 火の 番を してくれて おったんじゃな。お礼じゃ。' },
    { id: 'q_gachapon', from: 'f_saikoron', after: 'clear', title: 'ガチャポンを なかまに', need: { kind: 'befriend', id: 'gachapon' },
        reward: { money: 300, item: 'choco', n: 3 }, ask: 'ころころ～。八百屋の 横の ガチャ、中に だれか いるよ！ なかまに したら 見せて！', thanks: 'ほんとに いた！ 当たりは チョコ 3 こ！ ころころ～。' },
    { id: 'q_cider', from: 'f_kinmenkoinu', after: 'clear', title: 'サイダーを 3 本', need: { kind: 'item', item: 'cider', n: 3 },
        reward: { money: 300 }, ask: 'ワン！ 交番の おまわりさんが のどが かわいたって。サイダーを 3 本 もってきて くれる？', thanks: 'ワン！ おまわりさんが よろこんでたよ。きんピカの おこづかい！' },
    { id: 'q_mysteries', from: 'f_gomibakon', after: 'school', title: '学校の うわさを 3 つ', need: { kind: 'mysteries', n: 3 },
        reward: { item: 'onigiri', n: 5 }, ask: '夜の 学校から へんな 音が するって、ゴミ出しの ときに 聞いたよ。七不思議を 3 つ たしかめたら おしえて！', thanks: 'ほんとうに 七不思議が いたんだ！ こわかった？ お礼の おにぎり！' }
];
