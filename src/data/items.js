// =====================================================================
// 道具 (1 章は 食べ物だけ)。駄菓子屋で 買える
// ---------------------------------------------------------------------
// バトルで なかまに 使うと HP が 回復する。敵に 投げると 仲間に なりやすくなる (好物なら もっと)
// 合成アイテム (material。2026-10-30): 合体の館 (data/fusion.js) で 作って、キャラと 合体させる。バトルでは 使えない
//   onlyFusion: 合体でしか 手に 入らない
// =====================================================================
export const ITEMS = {
    onigiri: { name: 'おにぎり', heal: 60, price: 60, desc: 'なかま 1 体の HP を 60 回復。お米が好きな なかまの 好物' },
    melonpan: { name: 'メロンパン', heal: 50, price: 50, desc: 'なかま 1 体の HP を 50 回復。パンが好きな なかまの 好物' },
    choco: { name: 'チョコ', heal: 30, gauge: 30, price: 40, desc: 'HP を 30 回復し、必殺技ゲージが 30 たまる。あまいもの好きの 好物' },
    cider: { name: 'サイダー', heal: 40, price: 40, desc: 'なかま 1 体の HP を 40 回復。シュワシュワ好きの 好物' },
    kyuuri: { name: 'きゅうり', heal: 35, price: 30, desc: 'なかま 1 体の HP を 35 回復。やさい好きの 好物' },
    niboshi: { name: 'にぼし', heal: 35, price: 30, desc: 'なかま 1 体の HP を 35 回復。さかな好きの 好物' },
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
