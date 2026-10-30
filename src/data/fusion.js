// =====================================================================
// 合体の館 (2026-10-30 ユーザー指定): 2 つを 合わせて 新しい キャラや アイテムを 作る
// ---------------------------------------------------------------------
// 商店街の「合体の館」で、キャラ と キャラ・キャラ と 合成アイテム・アイテム と アイテム を 合体できる。
// 合体でしか 手に 入らない キャラ (nakama.js の fuse: true。ハリー一族) と アイテム (items.js の onlyFusion) が ある。
//   a・b: 'n:なかまの id' (その キャラの メダル 1 枚) / 'i:アイテムの id' (その アイテム 1 こ)。順番は どちらでも よい
//   to:   できる もの ('n:…' なかま / 'i:…' アイテム)
// 合体に 使った メダルと アイテムは なくなる。できる キャラの Lv は 使った キャラの Lv の 平均 (キャラ + アイテムは その キャラの Lv)
// どの 組み合わせも 中身は Claude の 案 (ダンジョンの 進化の 道具を 合成アイテムに した)
// =====================================================================
export const RECIPES = [
    // ----- アイテム + アイテム → 合成アイテム -----
    { a: 'i:choco', b: 'i:cider', to: 'i:hoshikakera' },
    { a: 'i:cider', b: 'i:kyuuri', to: 'i:kesshou' },
    { a: 'i:onigiri', b: 'i:niboshi', to: 'i:onitsuno' },
    { a: 'i:hoshikakera', b: 'i:kesshou', to: 'i:tsukishizuku' },
    { a: 'i:onitsuno', b: 'i:melonpan', to: 'i:ougonmame' },
    { a: 'i:hoshikakera', b: 'i:ougonmame', to: 'i:luckycoin' },
    { a: 'i:tsukishizuku', b: 'i:luckycoin', to: 'i:makimono' },
    { a: 'i:onigiri', b: 'i:melonpan', to: 'i:gattaidango' },          // 合体でしか 作れない おやつ

    // ----- キャラ + 合成アイテム → キャラ (ハリー一族は 合体でしか 手に 入らない) -----
    { a: 'n:haribaby', b: 'i:onitsuno', to: 'n:harryknight' },
    { a: 'n:haribaby', b: 'i:tsukishizuku', to: 'n:harrymage' },
    { a: 'n:haribaby', b: 'i:ougonmame', to: 'n:goldharry' },
    { a: 'n:haribaby', b: 'i:kesshou', to: 'n:metalharry' },
    { a: 'n:harigeneral', b: 'i:makimono', to: 'n:haridaijin' },
    // 進化の 近道 (ダンジョンでは この 道具で 進化した)
    { a: 'n:tsukiusagi', b: 'i:tsukishizuku', to: 'n:kaguyausagi' },
    { a: 'n:pekorisu', b: 'i:luckycoin', to: 'n:pekorisuking' },
    { a: 'n:yukimidango', b: 'i:hoshikakera', to: 'n:yukimidaifuku' },
    { a: 'n:takaramimic', b: 'i:ougonmame', to: 'n:kinkomimic' },
    { a: 'n:koorimodoki', b: 'i:kesshou', to: 'n:koorimodokishin' },

    // ----- キャラ + キャラ → キャラ -----
    { a: 'n:harryknight', b: 'n:harrymage', to: 'n:haridora' },
    { a: 'n:haribaby', b: 'n:ishikoron', to: 'n:iwaharry' },
    { a: 'n:haribaby', b: 'n:takaramimic', to: 'n:harrymimic' },
    { a: 'n:haribaby', b: 'n:yoroinukegara', to: 'n:gargoharry' },
    { a: 'n:metalharry', b: 'n:kingharry', to: 'n:metalkingharry' },
    { a: 'n:kogame', b: 'n:yukimidango', to: 'n:hyougame' },
    { a: 'n:daichouenkin', b: 'n:rousokubi', to: 'n:hitodamaou' },
    { a: 'n:onibin', b: 'n:enjoubouzu', to: 'n:daienjou' }
];

// 合体の館の 主の セリフ (ヒント)。1 回 話す たびに 順番に
export const FUSION_HINTS = [
    'ハリーベビーは 合成アイテムと 合わせると、いろいろな すがたに なるらしい……。',
    'チョコと サイダーを 合わせると「星のかけら」に なるぞ。',
    'サイダーと きゅうりで「氷の結晶」、おにぎりと にぼしで「鬼の角」じゃ。',
    '星のかけらと 氷の結晶で「月のしずく」。月の キャラが よろこぶ しずくじゃ。',
    'ナイトと メイジ、ふたりの ハリーが 合わさると 竜に なると 聞く。',
    'メタルの ハリーと 王の ハリー……合わせたら どう なるかのう。'
];

// a・b ('n:…' / 'i:…') の 合体で できる もの (順番は どちらでも)。なければ null
export const findRecipe = (a, b) => RECIPES.find(r => (r.a === a && r.b === b) || (r.a === b && r.b === a)) || null;
