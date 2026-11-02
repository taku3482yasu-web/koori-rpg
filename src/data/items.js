// =====================================================================
// 道具 (1 章は 食べ物だけ)。駄菓子屋で 買える
// ---------------------------------------------------------------------
// バトルで なかまに 使うと HP が 回復する。敵に 投げると 仲間に なりやすくなる (好物なら もっと)
// 合成アイテム (material。2026-10-30): 合体の館 (data/fusion.js) で 作って、キャラと 合体させる。バトルでは 使えない
//   onlyFusion: 合体でしか 手に 入らない
// 店ごとの 品物 (2026-11-02 ユーザー指定で ふやした): 駄菓子屋・八百屋・お面屋・本屋 (商店街)・海の家 (4 章)・ネット寺の 授与所 (5 章 クリア)
//   ききめ: heal / healPct (最大 HP の わりあい)・gauge・cure (とりつきを ぬく)・buff { stat, amount, time (秒) }・
//           revive (たおれた なかまを 復活。最大 HP の わりあい)・all (前の なかま ぜんぶ)
//   notFood: 食べ物では ないので おやつとして 投げられない
// =====================================================================
export const ITEMS = {
    onigiri: { name: 'おにぎり', heal: 60, price: 60, desc: 'なかま 1 体の HP を 60 回復。お米が好きな なかまの 好物' },
    melonpan: { name: 'メロンパン', heal: 50, price: 50, desc: 'なかま 1 体の HP を 50 回復。パンが好きな なかまの 好物' },
    choco: { name: 'チョコ', heal: 30, gauge: 30, price: 40, desc: 'HP を 30 回復し、必殺技ゲージが 30 たまる。あまいもの好きの 好物' },
    cider: { name: 'サイダー', heal: 40, price: 40, desc: 'なかま 1 体の HP を 40 回復。シュワシュワ好きの 好物' },
    kyuuri: { name: 'きゅうり', heal: 35, price: 30, desc: 'なかま 1 体の HP を 35 回復。やさい好きの 好物' },
    niboshi: { name: 'にぼし', heal: 35, price: 30, desc: 'なかま 1 体の HP を 35 回復。さかな好きの 好物' },
    // 八百屋 (商店街): やさい・くだもの。回復と 力の つく もの
    tomato: { name: 'トマト', heal: 80, price: 80, desc: 'なかま 1 体の HP を 80 回復。真っ赤で あまい' },
    daikon: { name: '大根', heal: 30, cure: true, price: 120, desc: 'HP を 30 回復し、とりつきを ぜんぶ ぬく。からい ほど よく きく' },
    banana: { name: 'バナナ', buff: { stat: 'spd', amount: 0.3, time: 20 }, price: 150, desc: 'なかま 1 体の すばやさが 20 秒 アップ' },
    ninniku: { name: 'にんにく', buff: { stat: 'atk', amount: 0.3, time: 20 }, price: 180, desc: 'なかま 1 体の こうげきが 20 秒 アップ' },
    ringo: { name: 'りんご', healPct: 0.4, price: 200, desc: 'なかま 1 体の HP を 最大の 4 わり 回復' },
    suika: { name: 'すいか', heal: 80, all: true, price: 350, desc: '前の なかま ぜんぶの HP を 80 回復。みんなで わけて 食べる' },
    // お面屋 (商店街): つけると 力が わく お祭りの お面。1 回 使うと こわれる
    hyottoko: { name: 'ひょっとこの お面', buff: { stat: 'def', amount: 0.4, time: 25 }, notFood: true, price: 250, desc: 'なかま 1 体の まもりが 25 秒 アップ' },
    kitsunemen: { name: 'きつねの お面', buff: { stat: 'mag', amount: 0.4, time: 25 }, notFood: true, price: 250, desc: 'なかま 1 体の ようじゅつが 25 秒 アップ' },
    tengumen: { name: '天狗の お面', buff: { stat: 'spd', amount: 0.4, time: 25 }, notFood: true, price: 250, desc: 'なかま 1 体の すばやさが 25 秒 アップ' },
    onimen: { name: '鬼の お面', buff: { stat: 'atk', amount: 0.5, time: 25 }, notFood: true, price: 400, desc: 'なかま 1 体の こうげきが 25 秒 大きく アップ' },
    okamemen: { name: 'おかめの お面', revive: 0.5, notFood: true, price: 500, desc: 'たおれた なかま 1 体を HP 半分で 復活させる。わらう 門には 福 きたる' },
    // 海の家 (4 章): 夏の 食べ物
    ramune: { name: 'ラムネ', heal: 60, gauge: 20, price: 90, desc: 'HP を 60 回復し、必殺技ゲージが 20 たまる' },
    yakisoba: { name: 'やきそば', heal: 150, price: 150, desc: 'なかま 1 体の HP を 150 回復。ソースの いい におい' },
    kakigoori: { name: 'かき氷', heal: 50, gauge: 20, all: true, price: 280, desc: '前の なかま ぜんぶの HP を 50 回復し、ゲージが 20 たまる' },
    ikayaki: { name: 'いか焼き', healPct: 0.6, price: 300, desc: 'なかま 1 体の HP を 最大の 6 わり 回復' },
    // ネット寺の 授与所 (5 章 クリア): お札・お守り・数珠
    ofuda: { name: 'おはらいの お札', cure: true, all: true, notFood: true, price: 200, desc: '前の なかま ぜんぶの とりつきを ぬく' },
    omamori: { name: '筋肉の お守り', buff: { stat: 'def', amount: 0.3, time: 20 }, all: true, notFood: true, price: 450, desc: '前の なかま ぜんぶの まもりが 20 秒 アップ' },
    kiyomizu: { name: '清めの 水', revive: 0.3, cure: true, notFood: true, price: 350, desc: 'たおれた なかま 1 体を HP 3 わりで 復活させる' },
    juzu: { name: '復活の 数珠', revive: 1, notFood: true, price: 1200, desc: 'たおれた なかま 1 体を HP 満タンで 復活させる' },
    // 本屋 (商店街): 性格の 本 (2026-11-02)。メニューの もちもので なかまに 読ませると 性格が かわる。バトルでは 使えない
    book_isamashii: { name: '性格の本「いさましい」', book: 'isamashii', notFood: true, price: 800, desc: '読ませると 性格が「いさましい」に なる。通常攻撃が ふえ、こうげきが のびやすい' },
    book_shinchou: { name: '性格の本「しんちょう」', book: 'shinchou', notFood: true, price: 800, desc: '読ませると 性格が「しんちょう」に なる。まもりが ふえ、ぼうぎょと HP が のびやすい' },
    book_kashikoi: { name: '性格の本「かしこい」', book: 'kashikoi', notFood: true, price: 800, desc: '読ませると 性格が「かしこい」に なる。術が ふえ、ようじゅつが のびやすい' },
    book_sekkachi: { name: '性格の本「せっかち」', book: 'sekkachi', notFood: true, price: 800, desc: '読ませると 性格が「せっかち」に なる。わざが ふえ、すばやさが のびやすい' },
    book_nekketsu: { name: '性格の本「ねっけつ」', book: 'nekketsu', notFood: true, price: 800, desc: '読ませると 性格が「ねっけつ」に なる。攻撃も わざも ふえる' },
    book_yasashii: { name: '性格の本「やさしい」', book: 'yasashii', notFood: true, price: 800, desc: '読ませると 性格が「やさしい」に なる。まもりと 術が ふえる' },
    book_nonki: { name: '性格の本「のんき」', book: 'nonki', notFood: true, price: 500, desc: '読ませると 性格が「のんき」に なる。ときどき さぼるが HP が のびやすい' },
    book_kimagure: { name: '性格の本「きまぐれ」', book: 'kimagure', notFood: true, price: 500, desc: '読ませると 性格が「きまぐれ」に なる。なにを するか わからない' },
    // 合体の館で 作る (2026-10-30)
    gattaidango: { name: '合体だんご', heal: 120, gauge: 50, onlyFusion: true, desc: 'HP を 120 回復し、必殺技ゲージが 50 たまる。合体の館で しか 作れない おやつ' },
    hoshikakera: { name: '星のかけら', material: true, onlyFusion: true, desc: '合成アイテム。キラキラ 光る。チョコと サイダーを 合体させて 作る' },
    kesshou: { name: '氷の結晶', material: true, onlyFusion: true, desc: '合成アイテム。とけない 氷。サイダーと きゅうりを 合体させて 作る' },
    onitsuno: { name: '鬼の角', material: true, onlyFusion: true, desc: '合成アイテム。勇ましい 角。おにぎりと にぼしを 合体させて 作る' },
    tsukishizuku: { name: '月のしずく', material: true, onlyFusion: true, desc: '合成アイテム。月の 光が とけた しずく' },
    ougonmame: { name: '黄金の豆', material: true, onlyFusion: true, desc: '合成アイテム。金ピカの 豆。鬼には よく 効かない' },
    luckycoin: { name: 'ラッキーコイン', material: true, onlyFusion: true, desc: '合成アイテム。なにか いい ことが ありそうな コイン' },
    makimono: { name: '伝説の巻物', material: true, onlyFusion: true, desc: '合成アイテム。ハリー王国に つたわる 巻物' }
};
export const ITEM_IDS = Object.keys(ITEMS);
export const SHOP = ['onigiri', 'melonpan', 'choco', 'cider', 'kyuuri', 'niboshi'];
// 店ごとの 品物と 店の 人 (2026-11-02)。SHOP は 駄菓子屋
export const SHOPS = {
    dagashi: { who: '駄菓子屋の おばあちゃん', greet: 'いらっしゃい。なにに するかね？', items: SHOP },
    yaoya: { who: '八百屋の おじさん', greet: 'へい らっしゃい！ とれたての やさいだよ！', items: ['tomato', 'daikon', 'banana', 'ninniku', 'ringo', 'suika'] },
    omenya: { who: 'お面屋の おねえさん', greet: 'いらっしゃい。つけると 力が わく お祭りの お面だよ。', items: ['hyottoko', 'kitsunemen', 'tengumen', 'onimen', 'okamemen'] },
    uminoie: { who: '海の家の おじさん', greet: 'いらっしゃい！ 海の家だよ。なんに する？', items: ['ramune', 'yakisoba', 'kakigoori', 'ikayaki', 'onigiri', 'cider'] },
    honya: { who: '本屋の おじさん', greet: 'いらっしゃい。読むと 性格が かわる ふしぎな 本が あるよ。', items: ['book_isamashii', 'book_shinchou', 'book_kashikoi', 'book_sekkachi', 'book_nekketsu', 'book_yasashii', 'book_nonki', 'book_kimagure'] },
    juyosho: { who: 'ネット寺の お坊さん', greet: 'ようこそ 授与所へ。ありがたい 品を そろえて おります。', items: ['ofuda', 'omamori', 'kiyomizu', 'juzu'] }
};
