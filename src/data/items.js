// =====================================================================
// 道具 (1 章は 食べ物だけ)。駄菓子屋で 買える
// ---------------------------------------------------------------------
// バトルで なかまに 使うと HP が 回復する。敵に 投げると 仲間に なりやすくなる (好物なら もっと)
// =====================================================================
export const ITEMS = {
    onigiri: { name: 'おにぎり', heal: 60, price: 60, desc: 'なかま 1 体の HP を 60 回復。お米が好きな なかまの 好物' },
    melonpan: { name: 'メロンパン', heal: 50, price: 50, desc: 'なかま 1 体の HP を 50 回復。パンが好きな なかまの 好物' },
    choco: { name: 'チョコ', heal: 30, gauge: 30, price: 40, desc: 'HP を 30 回復し、必殺技ゲージが 30 たまる。あまいもの好きの 好物' },
    cider: { name: 'サイダー', heal: 40, price: 40, desc: 'なかま 1 体の HP を 40 回復。シュワシュワ好きの 好物' },
    kyuuri: { name: 'きゅうり', heal: 35, price: 30, desc: 'なかま 1 体の HP を 35 回復。やさい好きの 好物' },
    niboshi: { name: 'にぼし', heal: 35, price: 30, desc: 'なかま 1 体の HP を 35 回復。さかな好きの 好物' }
};
export const ITEM_IDS = Object.keys(ITEMS);
export const SHOP = ['onigiri', 'melonpan', 'choco', 'cider', 'kyuuri', 'niboshi'];
