// =====================================================================
// 町の 依頼 (設計書 6 章「サブクエスト」。2026-10-28 に 8 個から 始めて、2026-10-30 に 40 個)
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
        reward: { item: 'onigiri', n: 5 }, ask: '夜の 学校から へんな 音が するって、ゴミ出しの ときに 聞いたよ。七不思議を 3 つ たしかめたら おしえて！', thanks: 'ほんとうに 七不思議が いたんだ！ こわかった？ お礼の おにぎり！' },
    // ----- 2026-10-30 に 32 個 足して 40 個 (ユーザー指定)。合体の館の キャラ・合成アイテムの 依頼も ある -----
    // 石の川タウン・商店街の キャラ (2 つ目・3 つ目の 依頼)
    { id: 'q_mizukirin', from: 'f_ishikoron', after: 'friends', title: 'ミズキリンを なかまに', need: { kind: 'befriend', id: 'mizukirin' },
        reward: { money: 100, item: 'kyuuri', n: 3 }, ask: '川原の ミズキリンと、どっちが よく はねるか 勝負したい。なかまに して つれてきて くれ。', thanks: 'よし、勝負だ！ ……ぴょん、ぽちゃ。……まけた。お礼の きゅうりだ。' },
    { id: 'q_iwaharry', from: 'f_ishikoron', after: 'clear', title: '岩の ハリー', need: { kind: 'befriend', id: 'iwaharry' },
        reward: { money: 500, item: 'kesshou', n: 1 }, ask: '岩みたいに かたい ハリーが いるらしい。ハリーベビーと おれみたいな 石を 合体の館で 合わせると……？', thanks: 'おお、ゴロゴロ ころがってる！ 石の なかまが ふえて うれしいぞ。' },
    { id: 'q_twenty', from: 'f_donguriko', after: 'clear', title: 'なかまを 20 種類', need: { kind: 'friends', n: 20 },
        reward: { money: 800 }, ask: 'コロコロ～。なかまを 20 種類 あつめたら、ドングリ 貯金を わけて あげる！', thanks: '20 種類！ すごーい！ ドングリ 貯金……は お金に かえておいたよ。' },
    { id: 'q_kokemusha', from: 'f_donguriko', after: 'yama', title: 'コケムシャを なかまに', need: { kind: 'befriend', id: 'kokemusha' },
        reward: { money: 300, item: 'onigiri', n: 3 }, ask: '山の 森に、コケの よろいの 武者が いるんだって。会って みたいなあ……。', thanks: 'わあ、ふかふかの コケ！ お礼の おにぎり！' },
    { id: 'q_hyougame', from: 'f_kogame', after: 'clear3', title: 'こおりの コガメ', need: { kind: 'befriend', id: 'hyougame' },
        reward: { money: 600 }, ask: 'ぼくも いつか こおりの こうらに なれるかな。ヒョウガメに 会わせて！ 合体の館でも なれるって うわさだよ。', thanks: 'これが ぼくの 未来……！ ひんやりして かっこいい！' },
    { id: 'q_pekorisuking', from: 'f_pekorisu', after: 'clear4', title: '森の 大盗賊', need: { kind: 'befriend', id: 'pekorisuking' },
        reward: { item: 'choco', n: 5 }, ask: 'おれも いつか ペコリスキングに なるんだ！ 見本を 見せて くれよ。ラッキーコインが あれば なれるらしいぞ。', thanks: 'うおお、王冠！ ……おれの メロンパンは わたさないからな！ チョコは やる！' },
    { id: 'q_nemuridakeou', from: 'f_nemuridake', after: 'clear2', title: '不眠症の 王', need: { kind: 'befriend', id: 'nemuridakeou' },
        reward: { money: 300, item: 'melonpan', n: 3 }, ask: 'ふぁ～……。ネムリダケオウさまに、よく ねむれる こつを 聞きたい……。', thanks: '……王さまも 一度も ねむれた ことが ないって……。（メロンパンを もらった）' },
    { id: 'q_thirty', from: 'f_kunaisuzume', after: 'clear3', title: 'なかまを 30 種類', need: { kind: 'friends', n: 30 },
        reward: { money: 1500 }, ask: 'チュンッ！ 修行 第二段！ なかまを 30 種類 あつめるのだ！', thanks: 'チュンッ！ 見事！ 修行の しあげの おこづかいだ！' },
    { id: 'q_fifty', from: 'f_kunaisuzume', after: 'clear5', title: 'なかまを 50 種類', need: { kind: 'friends', n: 50 },
        reward: { money: 3000, item: 'gattaidango', n: 3 }, ask: 'チュンッ！ 最後の 修行だ！ なかまを 50 種類 あつめてみせよ！', thanks: 'チュチュンッ！ おぬしは 本物の なかまマスターだ！ 秘伝の 合体だんごを やろう！' },
    { id: 'q_pachinkodaman', from: 'f_saikoron', after: 'clear', title: 'パチンコダマンを なかまに', need: { kind: 'befriend', id: 'pachinkodaman' },
        reward: { money: 400 }, ask: 'ころころ～。パチンコ店の 跡で ジャラジャラ 音が するの。正体を なかまに して 見せて！', thanks: 'やっぱり 玉の 子だった！ むかしを 思い出すなあ。お礼！' },
    { id: 'q_luckycoin', from: 'f_saikoron', after: 'clear4', title: 'ラッキーコインを 1 まい', need: { kind: 'item', item: 'luckycoin', n: 1 },
        reward: { money: 1500 }, ask: 'ころころ～。ラッキーコインって 知ってる？ 合体の館で 作れるんだって。1 まい ほしいなあ。', thanks: 'わあ、ピカピカ！ これで サイコロの 目が よく なるかも！ お礼！' },
    { id: 'q_hitodamaou', from: 'f_mokugyoro', after: 'clear3', title: '青い 炎の 王', need: { kind: 'befriend', id: 'hitodamaou' },
        reward: { item: 'onigiri', n: 5 }, ask: 'ポク……。ロウソクビが 青い 火の 王に なると 聞いた。ひとめ 見たいのう。', thanks: 'おお……りっぱに なって。お寺の 火も これで 安心じゃ。お礼じゃ。' },
    { id: 'q_daishi', from: 'f_mokugyoro', after: 'clear5', title: 'ネット寺の ダイシ', need: { kind: 'befriend', id: 'daishi' },
        reward: { money: 800 }, ask: 'ポク……。ネット寺の ダイシどのとは 古い なかまでな。元気か どうか、なかまに して つれてきて おくれ。', thanks: 'ダイシどの！ 配信の お経、毎晩 聞いて おりますぞ。……お礼じゃ。' },
    { id: 'q_kinkomimic', from: 'f_kinmenkoinu', after: 'clear2', title: '金庫の ミミック', need: { kind: 'befriend', id: 'kinkomimic' },
        reward: { money: 800 }, ask: 'ワン！ 交番に「暗証番号を 聞いてくる 金庫」の 通報が あったんだ。なかまに して つれてきて！', thanks: 'ワン！ この 金庫、暗証番号を 答えても かむんだね……。お礼！' },
    { id: 'q_ougonmame', from: 'f_kinmenkoinu', after: 'clear3', title: '黄金の豆を 1 こ', need: { kind: 'item', item: 'ougonmame', n: 1 },
        reward: { money: 1000, item: 'choco', n: 3 }, ask: 'ワン！ きんピカの 豆が ほしいワン。合体の館で 鬼の角と メロンパンを 合わせると できるって。', thanks: 'きんピカ！ ……食べられないワン？ でも うれしい！ お礼！' },
    { id: 'q_allmysteries', from: 'f_gomibakon', after: 'school', title: '七不思議を ぜんぶ', need: { kind: 'mysteries', n: 7 },
        reward: { money: 500, item: 'onigiri', n: 5 }, ask: 'のこりの 七不思議も ぜんぶ 知りたい！ 7 つ たしかめたら おしえて！', thanks: 'ぜんぶ ほんとうだったなんて……！ ゴミ出しの 夜が こわく なったよ。お礼！' },
    // 学校の キャラ
    { id: 'q_proteingolem', from: 'f_mirrormuscle', after: 'school', title: 'プロテインゴーレムを なかまに', need: { kind: 'befriend', id: 'proteingolem' },
        reward: { money: 400, item: 'cider', n: 3 }, ask: '体育館に プロテインで できた ゴーレムが いるんだ。いっしょに きたえたい！ なかまに して くれ！', thanks: '見よ、この 筋肉の そろい ぶみ！ お礼の サイダーだ！' },
    { id: 'q_muscletitan', from: 'f_mirrormuscle', after: 'clear3', title: 'プロテインの 巨人', need: { kind: 'befriend', id: 'muscletitan' },
        reward: { money: 1200 }, ask: 'プロテインゴーレムが きたえぬくと 巨人に なると 聞いた。その すがた、ひとめ 見たい！', thanks: 'で、でかい……！ 鏡に ぜんぶ うつらない！ お礼だ！' },
    // 山の キャラ
    { id: 'q_yukimidango', from: 'f_fubukipenguin', after: 'yama', title: 'ユキミダンゴを なかまに', need: { kind: 'befriend', id: 'yukimidango' },
        reward: { money: 300, item: 'kyuuri', n: 3 }, ask: 'ペンペン！ 雪渓の ユキミダンゴと お月見したいペン。なかまに して つれてきてペン！', thanks: 'お月見だペン！ ……だんごは 食べちゃ だめペン？ お礼ペン。' },
    { id: 'q_kesshou', from: 'f_fubukipenguin', after: 'clear3', title: '氷の結晶を 2 こ', need: { kind: 'item', item: 'kesshou', n: 2 },
        reward: { money: 800 }, ask: '雪渓に かざる 氷の結晶が ほしいペン。サイダーと きゅうりを 合体の館で 合わせると できるペン！', thanks: 'きれいだペン！ とけない 氷、たからものに するペン！' },
    { id: 'q_koorimodokishin', from: 'f_fubukipenguin', after: 'clear3', title: 'コオリモドキ・真', need: { kind: 'befriend', id: 'koorimodokishin' },
        reward: { money: 1500 }, ask: '山の コオリモドキが「真」の すがたに なると 聞いたペン。会って みたいペン……！', thanks: 'これが 真の すがた……！ こおりくんに そっくりペン！ お礼ペン。' },
    // 海の キャラ
    { id: 'q_niboshi5', from: 'f_asedakku', after: 'umibe', title: 'にぼしを 5 こ', need: { kind: 'item', item: 'niboshi', n: 5 },
        reward: { money: 500, item: 'cider', n: 2 }, ask: 'あせだっく～。浜辺の ネコたちに にぼしを あげたいダック。5 こ ほしいダック。', thanks: 'ネコたち よろこんでるダック！ お礼の サイダーダック！' },
    { id: 'q_ryuuguudai', from: 'f_asedakku', after: 'clear4', title: '竜宮の タイ', need: { kind: 'befriend', id: 'ryuuguudai' },
        reward: { money: 1000 }, ask: '海の 底の 竜宮から 来た タイが いるダック。会って みたいダック……。', thanks: 'おお、竜宮の かおり……。あせが ひいたダック。お礼ダック！' },
    { id: 'q_harrymimic', from: 'f_asedakku', after: 'clear4', title: '宝箱の ハリー', need: { kind: 'befriend', id: 'harrymimic' },
        reward: { money: 500, item: 'ougonmame', n: 1 }, ask: '宝箱に 化けた ハリーが いるって うわさダック。ハリーベビーと タカラミミックを 合体させると……？', thanks: 'あけたら トゲが ささったダック……！ でも うれしいダック。お礼ダック。' },
    // 寺の キャラ
    { id: 'q_bugmushi', from: 'f_loadingu', after: 'netdera', title: 'バグムシを なかまに', need: { kind: 'befriend', id: 'bugmushi' },
        reward: { money: 600 }, ask: 'よみこみが おそいのは、境内の バグムシの せいかも……。なかまに して つかまえて ください。', thanks: 'あ、よみこみが はやく なった……ような 気が します。お礼です。' },
    { id: 'q_tsukishizuku', from: 'f_loadingu', after: 'clear5', title: '月のしずくを 1 こ', need: { kind: 'item', item: 'tsukishizuku', n: 1 },
        reward: { money: 1500 }, ask: '月のしずくで 回線を みがくと はやく なるって 聞いたんです。合体の館で 作れるそうです。', thanks: 'よみこみ……かんりょう！ はじめて 言えました！ お礼です！' },
    // 屋敷の キャラ
    { id: 'q_kagebunshin', from: 'f_aoonibo', after: 'clear6', title: '分身の 達人', need: { kind: 'befriend', id: 'kagebunshin' },
        reward: { money: 1500 }, ask: 'カワリミダヌキが 分身の 達人に なったら、見はりが ふえて たすかるんだ。つれてきて くれ。', thanks: 'おお、見はりが 100 人に！ ……どれが 本物だ？ お礼だ。' },
    { id: 'q_onitsuno', from: 'f_aoonibo', after: 'clear6', title: '鬼の角を 2 こ', need: { kind: 'item', item: 'onitsuno', n: 2 },
        reward: { money: 1200, item: 'gattaidango', n: 1 }, ask: 'あおくて わるいか。……角が ほしいんだ。鬼の角を 2 こ。おにぎりと にぼしを 合体の館で 合わせると できるらしい。', thanks: 'これで おれも りっぱな 鬼だ！ 合体だんご、食べてくれ。' },
    // 月の迷宮の キャラ
    { id: 'q_kaguyausagi', from: 'f_tsukiusagi', after: 'clear7', title: '月に 帰る 兎', need: { kind: 'befriend', id: 'kaguyausagi' },
        reward: { money: 2000 }, ask: 'ぺったん。いつか 月の お姫さまの おともに なりたいの。カグヤウサギに 会わせて！', thanks: 'すてき……！ わたしも 月のしずくで がんばる！ お礼です。' },
    { id: 'q_haridora', from: 'f_tsukiusagi', after: 'clear7', title: 'トゲの 竜', need: { kind: 'befriend', id: 'haridora' },
        reward: { money: 1000, item: 'makimono', n: 1 }, ask: '月の 空を とぶ トゲの 竜を 見たの。ハリーナイトと ハリーメイジを 合体させると 生まれるって……。', thanks: 'ほんとうに 竜だ！ 背中が かゆそう……。お礼に 伝説の巻物を どうぞ。' },
    // SE城の キャラ
    { id: 'q_onigiri10', from: 'f_onigirin', after: 'oshiro', title: 'おにぎりを 10 こ', need: { kind: 'item', item: 'onigiri', n: 10 },
        reward: { money: 1000, item: 'gattaidango', n: 3 }, ask: '鬼鬼団の まかないが たりない！ おにぎりを 10 こ たのむ！ のりは パリパリで！', thanks: 'たすかった！ お礼に 合体だんごを やろう。のりは ないけどな！' },
    { id: 'q_metalking', from: 'f_onigirin', after: 'clear8', title: 'メタルキングハリー', need: { kind: 'befriend', id: 'metalkingharry' },
        reward: { money: 5000 }, ask: 'ハリー王国の 先代の 王を 知ってるか？ メタルハリーと キングハリーを 合体させると……伝説の 王が よみがえる らしい。', thanks: 'キィィィン……！ ほんとうに いたのか……！ 約束の 大金だ！' }
];
