// =====================================================================
// ゲームの 進み具合 (セーブに 入る 中身)・ストーリー・出会い・仲間になる (画面に ふれない)
// ---------------------------------------------------------------------
// 1 章の 流れ (story):
//   intro    家の前から。神社へ 行くと ふるカワに 会い、おなかまウォッチ・レンズ・ダイチョウエンキンの メダルを もらう
//   friends  なかまを 3 体 ふやす
//   bridge   石の川橋の ヌシを たおす (たおすと ハシシタボウズが なかまに なり、東へ 渡れる)
//   clear    1 章 クリア。ここから 2 章「学校の七不思議」: 夕方・夜に 小学校へ 行く
//   school   夜の 学校に 入った。七不思議を 7 つ たしかめる → 8 つ目の ふしぎ (ボス) を たおす
//   clear2   2 章 クリア。ここから 3 章「ダムの水が消える」: 町の 北の 山道から 山へ
//   yama     山に 入った。奥の院で 言いつたえを 読む (flags.oku) → 氷の 封印を 3 つ とく → ダムの ヌシ (ボス) を たおす
//   clear3   3 章 クリア。ここから 4 章「海辺の どうくつと ライバル探検隊」: 家の 前の ともいしと 話す
//   umi      商店街の 石の川駅から 電車で 海辺の 町へ 行ける
//   umibe    海辺の 町に 着いた。ライバル探検隊が どうくつの 通路を ふさぐ → 勝つ (flags.rival4) → 奥の 浦の島重蔵 (ボス)
//   clear4   4 章 クリア。ここから 5 章「ネット寺の のろい」: 家の 前の ともいしと 話すと ダイシの 手紙
//   tera     石の川駅から 電車で ネット寺へ 行ける
//   netdera  ネット寺に 着いた。黒い 紋の 3 体を 助ける (g.mysteries・なかまに なる) → 紋に のまれた ダイシ (ボス)
//   clear5   5 章 クリア。ここから 6 章「忍びの屋敷と 消えた メダル」: 家の 前の ともいしと 話す
//   shinobi  石の川駅から 電車で 忍びの屋敷へ 行ける
//   yashiki  屋敷に 着いた。ボス 3 回: 庭の ズミタニ (flags.zumi6) → 奥の 間の おにおに (flags.oni6) → 東の 蔵の トモオカ
//   clear6   6 章 クリア。ここから 7 章「月の迷宮と 喰らう 者の 伝説」: 石の川駅から 電車で 月の迷宮へ
//   meikyu   月の迷宮に 着いた (ルナヤに まねかれる)。迷宮の いちばん 奥で 月の 鏡 (flags.mirror7) → ルナヤ (ボス)
//   clear7   7 章 クリア。ここから 8 章「金色のSE城の 決戦」: 石の川駅から 電車で 金色のSE城へ
//   oshiro   SE城に 着いた (ライバル探検隊が 門を こじあける)。幹部 3 人: 大広間の 大鬼 (flags.ooni8) → 双頭の間の 双頭鬼
//            (flags.soutou8) → 金の間の 金滅鬼 (flags.kinme8) → 玉座の 間の おにおに (ボス)
//   clear8   8 章 クリア。ここから 9 章「筋肉の山と 新しい なかま」: ともいしの 家で おにおにが なかまに
//   onijoin  石の川駅から 電車で 筋肉の山へ 行ける
//   kinniku  筋肉の山に 着いた。雪どけの 氷河の ハル麒麟 (flags.kirin9) → 山頂の 道場の ノゾエマ
//   clear9   9 章 クリア。こおりくんの 必殺技が「絶対殺すソード・レクイエム」に 進化
//   shuugeki 10 章「石の川タウン しゅうげき」: 町に もどると 黒い 霧。石の川タウンと 商店街の キャラは ぜんぶ 紋つき (「・闇」)。
//            紋つきに 5 回 勝つ (flags.dark10) と 家の 前に 幹部 タシケダ
//   clear10  10 章 クリア。ここから 11 章「ASOの壺の底」: ともいしの 家で ルキハの 城への 道の 話
//   tsuboe   石の川駅から 電車で ASOの壺の底へ 行ける
//   tsubo    ASOの壺の底に 着いた。火山の 底の バクエンリュウ・闇 (flags.baku11) → ASO の 間の 大魔王ASO と 話す
//   clear11  11 章 クリア。ここから 12 章「集結」: ともいしの 家で 黒い 空
//   shuuketsu 神社に みんなが あつまる。おにおに・鬼神が 勝負を いどむ (flags.oni12) → 家で ねると 出発の 前の 夜
//   clear12  12 章 クリア。ここから 13 章「喰らいの 城」: ともいしに 見送られて 出発
//   kuraie   山の ダムの ヒョウガリュウに 乗って 喰らいの 城へ 行ける
//   kurai    喰らいの 城に 着いた。元四天王が 外の 軍勢を ひきうける。1・2 階は 紋つき、3〜7 階は 紋つきの 幹部 (flags.fl13 = たおした 数。
//            ライバル探検隊が 加勢) → 最上階で 探検隊が 軍勢を ひきうけ、ルキハ (第 1 形態 → ニオニオーテン)
//   clear13  13 章 クリア (エンディング。本編の さいご = MAIN_END)
//   invite   14 章: 本編の あと ともいしの 家で ふるカワから 遊園地の 招待券。石の川駅から 電車で 行ける
//   park     遊園地に 着いた (昼)。アトラクションで 遊んで、駅で 帰ろうとすると ふるカワが いない → yoru
//   yoru     夜の 遊園地。アトラクションの 入り口で ふるカワの 手がかりを 3 つ (flags.clue14) → 広場の 残党の ボス
//   clear14  14 章 クリア。15 章「新たなる１日」: 無限回廊 (g.kairou)・ライバル探検隊の 仲間クエスト (flags.team_*)
// =====================================================================
import { NAKAMA, NAKAMA_IDS, BOSSES, HERO_ID, idsInArea, rivalTeam, RIVAL_LV, evolveOf, inVersion, TEAMS, TEAM_LV, teamsIn, BOSS14, KAIROU_BOSSES, FLOOR13, HELPER_LV } from '../data/nakama.js';
import { SPOTS, START, areaAt } from '../data/map.js';
import { ITEMS } from '../data/items.js';
import { expFor, expReward, gainExp, moneyReward } from './units.js';
import { reached, MAIN_END } from './story.js';
import { MYSTERIES, SEALS, MONS, PARK_CLUES } from '../data/map.js';

export const SAVE_VERSION = 1;
export const VERSIONS = { naitei: '内定', menkyo: '免許' };
export const TIMES = ['朝', '昼', '夕方', '夜'];
export const TIME_IDS = ['morning', 'day', 'evening', 'night'];
export const FRIENDS_GOAL = 3;
export const PITY_WINS = 10;          // 同じ キャラに 10 回 勝つと 必ず 仲間に なる (設計書 4.2)
const BEFRIEND_BASE = { E: 0.25, D: 0.15, C: 0.1, B: 0.06, A: 0.04, S: 0.02 };

export function newGame(version, seed = 1) {
    return {
        saveVersion: SAVE_VERSION,
        version,
        chapter: 1,
        story: 'intro',
        friendsAtWatch: 0,
        day: 1,
        time: 0,
        weather: 'sun',
        pos: { x: START.x * 16 + 8, y: START.y * 16 + 12, dir: 'down' },
        money: 300,
        items: { onigiri: 3, melonpan: 1 },
        medals: [],
        watch: [null, null, null, null, null, null],
        zukan: { seen: {}, friends: {} },
        wins: {},
        nextUid: 1,
        seed,
        playTime: 0,
        spotCooldown: {},
        gifts: {},          // 話せる キャラから 道具を もらった 日 (1 日 1 回)
        mysteries: {},      // たしかめた 七不思議 (2 章)・といた 氷の 封印 (3 章)
        flags: {},          // ストーリーの できごと (oku: 奥の院で 言いつたえを 読んだ。3 章)
        quests: {}          // 町の 依頼 (logic/quests.js)
    };
}

// 古い セーブを 今の 形に 直す (足りない 項目を 足す)
export function migrate(save) {
    const base = newGame(save.version);
    const g = { ...base, ...save, zukan: { ...base.zukan, ...save.zukan }, spotCooldown: {} };
    // こおりくんの メダルが ない セーブ (2026-10-27 より 前) は、なかまの いちばん 高い Lv で 足す
    if (g.story !== 'intro' && !heroMedal(g)) addHero(g, Math.max(5, ...g.medals.map(m => m.lv)));
    return g;
}

export const hasWatch = g => g.story !== 'intro';
export const timeId = g => TIME_IDS[g.time];
export const friendCount = g => Object.keys(g.zukan.friends).length;

// ----- メダル -----
export function addMedal(g, id, lv) {
    const medal = { uid: `m${g.nextUid++}`, id, lv, exp: expFor(lv) };
    g.medals.push(medal);
    g.zukan.friends[id] = true;
    g.zukan.seen[id] = true;
    // ウォッチに あきが あれば 自動で セット
    const free = g.watch.indexOf(null);
    if (free >= 0) g.watch[free] = medal.uid;
    return medal;
}
export const medalByUid = (g, uid) => g.medals.find(m => m.uid === uid) || null;

// こおりくんの メダル (2026-10-27 ユーザー指定: バトルに こおりくんも 出られる)。メダル帳の いちばん はじめ・図鑑には のらない
//   ウォッチに あきが あれば 自動で セット。はずすことも できる
export const heroMedal = g => g.medals.find(m => m.id === HERO_ID) || null;
export function addHero(g, lv = 5) {
    const medal = { uid: 'hero', id: HERO_ID, lv, exp: expFor(lv) };
    g.medals.unshift(medal);
    const free = g.watch.indexOf(null);
    if (free >= 0) g.watch[free] = medal.uid;
    return medal;
}
export const watchMedals = g => g.watch.map(uid => (uid ? medalByUid(g, uid) : null));

// ----- 絆レベル (設計書 4.3。2026-10-29) -----
// 同じ キャラを もう 1 体 なかまに すると 絆レベルが 1 上がる (最大 5)。必殺技の 威力が 1 つにつき +10%
export const BOND_MAX = 5;
export const bondLevel = (g, id) => (id === HERO_ID ? 0 : Math.min(BOND_MAX, Math.max(0, g.medals.filter(m => m.id === id).length - 1)));

// ----- 進化 (設計書 4.3。2026-10-29) -----
// 決まった Lv に なったら 進化先の キャラに なる (メダル・Lv・けいけんちは そのまま)。図鑑にも のる。進化したら { uid, from, to }
export function evolveMedal(g, medal) {
    const ev = evolveOf(medal.id);
    if (!ev || medal.lv < ev.lv) return null;
    const from = medal.id;
    medal.id = ev.to;
    g.zukan.friends[ev.to] = true;
    g.zukan.seen[ev.to] = true;
    return { uid: medal.uid, from, to: ev.to };
}

// ----- 時間と 天気 -----
// ベッドで ねると 時間が 進む。夜の 次は 次の日の 朝 (天気を 決めなおす)
export function advanceTime(g, rng) {
    g.time = (g.time + 1) % 4;
    if (g.time === 0) {
        g.day++;
        g.weather = rng.chance(0.3) ? 'rain' : 'sun';
    }
}

// ----- 出会い -----
// バージョン限定の キャラは その バージョンでしか 出ない (2026-10-30)
export function spotKinds(g, spot) {
    return spot.kinds.filter(k => inVersion(k.id, g.version) &&
        (!k.time || k.time.includes(timeId(g))) &&
        (!k.weather || k.weather === g.weather) &&
        (!k.after || reached(g, k.after)));
}

// かくれている 場所に 今 だれかが いるか (違和感が 見えて、レンズに 反応するか)
export function spotActive(g, spot, now) {
    return hasWatch(g) && spotKinds(g, spot).length > 0 && !((g.spotCooldown[spot.id] || 0) > now);
}

// 話しかけた キャラ (first: { id, lv }) と 戦う。ときどき 同じ 場所の キャラが もう 1 体・2 体 出る (3 体まで。2026-10-29 ユーザー指定)
//   3 体の ときは 話しかけた キャラが まんなか
export const MAX_ENEMIES = 3;
// 10 章: 石の川タウンと 商店街の キャラは ぜんぶ 紋つき (「・闇」)。Lv も 上がる
export const DARK10_LV = [41, 45];
export const DARK10_GOAL = 5;
// 13 章: 喰らいの 城の 軍勢も ぜんぶ 紋つき
export const darkTown = (g, source) => {
    const area = areaAt(source.x0 ?? source.x, source.y0 ?? source.y);
    return (g.story === 'shuugeki' && ['ishinokawa', 'shoutengai'].includes(area)) || area === 'kurai';
};
export function encounter(g, source, rng, first = null) {
    const kinds = spotKinds(g, source);
    const dark = darkTown(g, source);
    const [lo, hi] = dark && source.lv && areaAt(source.x0 ?? source.x, source.y0 ?? source.y) === 'kurai' ? source.lv : dark ? DARK10_LV : source.lv || (reached(g, 'clear') ? [8, 13] : [2, 5]);
    const lead = first ? { ...first, lv: dark ? lo + rng.int(hi - lo + 1) : first.lv } : { id: rng.weighted(kinds).id, lv: lo + rng.int(hi - lo + 1) };
    const enemies = [{ id: lead.id, lv: lead.lv }];
    const more = () => ({ id: rng.weighted(kinds).id, lv: Math.max(1, lead.lv - 1) });
    if (kinds.length && rng.chance(0.25)) {
        enemies.push(more());
        if (rng.chance(0.4)) enemies.unshift(more());
    }
    enemies.forEach(e => { g.zukan.seen[e.id] = true; if (dark) e.dark = true; });
    return enemies;
}

// ボス: nushi (1 章・石の川橋) / kage (2 章・学校の ろうか) / himuro (3 章・ダム) / urashima4 (4 章・海岸どうくつ)
export const bossEnemies = (id = 'nushi') => [{ id, lv: BOSSES[id].lv, dark: Boolean(BOSSES[id].dark && FLOOR13.some(f => f.id === id)) }];
// 13 章: つぎに たおす 階の 幹部 (ぜんぶ たおしたら null)
export const floor13Next = g => (g.story === 'kurai' ? FLOOR13[g.flags.fl13 || 0] || null : null);
// その 階で 加勢する ライバル探検隊
export const floor13Team = (f, version) => f.team[version] || f.team.naitei;
export const floor13Helpers = (f, version) => { const t = floor13Team(f, version); return { team: t, name: TEAMS[t].name, members: TEAMS[t].members, lv: HELPER_LV }; };
// 13 章 4〜6 階の 宝箱 (1 回だけ)
export function openChest13(g, chest) {
    g.flags.chest13 = g.flags.chest13 || {};
    if (g.flags.chest13[chest.id]) return null;
    g.flags.chest13[chest.id] = true;
    g.items[chest.item] = Math.min(MAX_ITEM, (g.items[chest.item] || 0) + chest.n);
    return chest;
}
// ライバル探検隊 (4 章): バージョンの チーム 3 人 (まんなかが リーダー)
export const rivalEnemies = g => {
    const team = rivalTeam(g.version);
    return team.members.map(id => ({ id, lv: RIVAL_LV + (id === team.leader ? 1 : 0) }));
};

// 仲間に なる 確率 (設計書 4.2)
export function befriendRate(g, id, food) {
    const sp = NAKAMA[id];
    if (!sp) return 0;
    if ((g.wins[id] || 0) >= PITY_WINS) return 1;
    let rate = BEFRIEND_BASE[sp.rank] ?? 0.1;
    if (food && food.target === id) rate *= food.favorite ? 2 : 1.3;
    return Math.min(0.9, rate);
}

// バトルの 結果を ゲームに 入れる。返り値は 結果画面に 出す 中身
export function applyBattleResult(g, battle, rng) {
    const out = { outcome: battle.outcome, exp: 0, money: 0, levelUps: [], evolved: [], befriend: null, boss: battle.kind === 'boss', mystery: battle.mystery || null };
    if (battle.outcome === 'flee') return out;   // にげたら なにも かわらない
    if (battle.outcome !== 'win') {
        out.money = -Math.floor(g.money * 0.1);
        g.money += out.money;
        return out;
    }
    for (const e of battle.enemies.filter(x => !x.idol)) {
        out.exp += expReward(e.id, e.lv);
        out.money += moneyReward(e.id, e.lv);
        if (NAKAMA[e.id]) g.wins[e.id] = (g.wins[e.id] || 0) + 1;
    }
    g.money += out.money;
    // ウォッチに セットした なかま 全員に けいけんち (たおれた なかまにも)
    for (const m of watchMedals(g)) {
        if (!m) continue;
        const up = gainExp(m, out.exp);
        if (!up) continue;
        const ev = evolveMedal(g, m);
        if (ev) out.evolved.push(ev);
        out.levelUps.push({ uid: m.uid, id: m.id, lv: m.lv });
    }
    // 七不思議の 正体に 勝った (2 章)
    if (out.mystery) g.mysteries[out.mystery] = true;
    // 黒い 紋の なかまを 助けた (5 章): 紋が 消えて なかまに なる
    const mon = MONS.find(m => m.id === out.mystery);
    if (mon) {
        out.befriend = { id: mon.nakama, medal: addMedal(g, mon.nakama, mon.lv), forced: true };
        out.mon = mon.id;
        return out;
    }
    // 15 章: ライバル探検隊の 仲間クエストに 勝った。チームの 3 人 ぜんいん なかまに なる
    if (battle.kind === 'team') {
        const team = battle.team;
        g.flags[`team_${team}`] = true;
        out.team = team;
        out.joined = TEAMS[team].members.map(id => addMedal(g, id, TEAM_LV - 5));
        return out;
    }
    // 15 章: 無限回廊の 階を 突破した。次の 階へ。5 階ごとに ごほうび
    if (battle.kind === 'kairou') {
        const k = kairouOf(g);
        k.floor++;
        k.best = Math.max(k.best, k.floor - 1);
        out.kairou = k.floor - 1;
        if (out.kairou % 5 === 0) {
            out.prize = KAIROU_PRIZES[(out.kairou / 5 - 1) % KAIROU_PRIZES.length];
            g.items[out.prize] = (g.items[out.prize] || 0) + 1;
        }
        return out;
    }
    // ライバル探検隊に 勝った (4 章)。なかまには ならない
    if (battle.kind === 'rival') {
        g.flags.rival4 = true;
        out.rival = true;
        return out;
    }
    if (out.boss) {
        const bossId = battle.enemies.find(e => BOSSES[e.id])?.id || 'nushi';
        const id = BOSSES[bossId].befriends;
        out.bossId = bossId;
        // なかまに ならない ボス (6 章の おにおに・トモオカ) も いる
        if (id) out.befriend = { id, medal: addMedal(g, id, bossId === 'nushi' ? 6 : BOSSES[bossId].lv - 2), forced: true };
        if (bossId === 'nushi') { g.story = 'clear'; g.chapter = 2; }
        if (bossId === 'kage') { g.story = 'clear2'; g.chapter = 3; }
        if (bossId === 'himuro') { g.story = 'clear3'; g.chapter = 4; }
        if (bossId === 'urashima4') { g.story = 'clear4'; g.chapter = 5; }
        if (bossId === 'daishi5') { g.story = 'clear5'; g.chapter = 6; }
        if (bossId === 'zumitani6') g.flags.zumi6 = true;
        if (bossId === 'onioni6') g.flags.oni6 = true;
        if (bossId === 'tomooka6') { g.story = 'clear6'; g.chapter = 7; }
        if (bossId === 'runaya7') { g.story = 'clear7'; g.chapter = 8; }
        if (bossId === 'ooni8') g.flags.ooni8 = true;
        if (bossId === 'soutou8') g.flags.soutou8 = true;
        if (bossId === 'kinme8') g.flags.kinme8 = true;
        if (bossId === 'onioni8') { g.story = 'clear8'; g.chapter = 9; }
        if (bossId === 'harukirin9') g.flags.kirin9 = true;
        if (bossId === 'nozoema9') { g.story = 'clear9'; g.chapter = 10; out.heroSpecial = true; }
        if (bossId === 'tashikeda10') { g.story = 'clear10'; g.chapter = 11; }
        if (bossId === 'bakuen11') g.flags.baku11 = true;
        if (bossId === 'onioni12') { g.flags.oni12 = true; out.oniSpecial = true; }
        if (bossId === 'aso15') g.flags.aso15 = true;
        const fl = FLOOR13.find(f => f.id === bossId);
        if (fl) { g.flags.fl13 = Math.max(g.flags.fl13 || 0, FLOOR13.indexOf(fl) + 1); out.floor13 = fl.floor; }
        if (bossId === 'rukiha13') { g.story = 'clear13'; g.chapter = 14; out.ending = true; }
        if (bossId === BOSS14[g.version]) { g.story = 'clear14'; g.chapter = 15; }
        return out;
    }
    // 10 章: 紋つきに 勝つと 紋が とける (5 回で 幹部が 出る)
    if (g.story === 'shuugeki' && battle.enemies.some(e => e.dark)) {
        g.flags.dark10 = (g.flags.dark10 || 0) + 1;
        out.dark = g.flags.dark10;
    }
    // 1 回の バトルで 仲間に なりたがるのは 1 体まで。仲間に するかは 結果画面で えらぶ (2026-10-28 ユーザー指定。acceptBefriend)
    // 紋つき (・闇) の 敵は なかまに ならない (2026-10-30 ユーザー指定)
    const ids = [...new Set(battle.enemies.filter(e => !e.dark).map(e => e.id))];
    for (const id of ids) {
        if (rng.chance(befriendRate(g, id, battle.food))) {
            out.befriend = { id, lv: battle.enemies.find(e => e.id === id).lv, medal: null };
            break;
        }
    }
    out.storyChanged = updateStory(g);
    return out;
}

// 仲間に なりたそうな キャラを 仲間に する (結果画面で「なかまに する」を えらんだ とき)。メダルを 返す
//   えらばなかったら 何も しない (勝った 回数も そのまま)
export function acceptBefriend(g, out) {
    const b = out.befriend;
    if (!b) return null;
    if (b.medal) return b.medal;
    b.medal = addMedal(g, b.id, b.lv);
    g.wins[b.id] = 0;
    out.storyChanged = updateStory(g) || out.storyChanged;
    return b.medal;
}

// ストーリーの 進み (仲間の 数で 進む ところ)
export function updateStory(g) {
    if (g.story === 'friends' && g.medals.length - g.friendsAtWatch >= FRIENDS_GOAL) {
        g.story = 'bridge';
        return 'bridge';
    }
    return null;
}

// 神社で ふるカワに 会ったとき
export function receiveWatch(g) {
    if (g.story !== 'intro') return null;
    const medal = addMedal(g, 'daichouenkin', 5);
    addHero(g, 5);
    g.story = 'friends';
    g.friendsAtWatch = g.medals.length;
    return medal;
}

// 今の 目的 (下画面に 出す)
export function objective(g) {
    switch (g.story) {
        case 'intro': return '石の川神社に 行ってみよう';
        case 'friends': return `レンズで さがして、なかまを ふやそう (${Math.min(FRIENDS_GOAL, g.medals.length - g.friendsAtWatch)}/${FRIENDS_GOAL})`;
        case 'bridge': return '石の川橋の ヌシを なんとかしよう';
        // 2 章「学校の七不思議」
        case 'clear': return '石の川小学校の 七不思議の うわさを たしかめよう (学校は 夕方・夜だけ 開く)';
        case 'school': {
            const n = MYSTERIES.filter(m => g.mysteries[m.id]).length;
            return n < MYSTERIES.length ? `学校の 七不思議を たしかめよう (${n}/${MYSTERIES.length})` : 'ろうかの おくの 黒い 影を おいかけよう';
        }
        // 3 章「ダムの水が消える」
        case 'clear2': return '山の ダムの 水が 消えたらしい。町の 北の はしの 山道から 山へ 行ってみよう';
        case 'yama': {
            if (!g.flags.oku) return '山の 奥の院を 調べてみよう (山道を 北へ 行って 西)';
            const n = sealsSolved(g);
            return n < SEALS.length ? `山の どこかに ある 氷の 封印を とこう (${n}/${SEALS.length})` : 'ダムの 湖の 底の 氷の 城へ 行こう';
        }
        // 4 章「海辺の どうくつと ライバル探検隊」
        case 'clear3': return 'こおりくんの 家の 前の ともいしと 話そう';
        case 'umi': return '商店街の 西の はしの 石の川駅から、電車で 海辺の 町へ 行こう';
        case 'umibe': return g.flags.rival4 ? '浦の島の海岸どうくつの いちばん 奥へ 行こう'
            : '浦の島の海岸どうくつの 奥へ すすもう (ライバル探検隊が 先に 行った)';
        // 5 章「ネット寺の のろい」
        case 'clear4': return 'こおりくんの 家の 前の ともいしと 話そう';
        case 'tera': return '石の川駅から、電車で ネット寺へ 行こう';
        case 'netdera': {
            const n = monsSaved(g);
            return n < MONS.length ? `ネット寺の 黒い 紋の なかまを 助けよう (${n}/${MONS.length})` : '本堂の 前の ダイシの ようすが へんだ……！';
        }
        // 6 章「忍びの屋敷と 消えた メダル」
        case 'clear5': return 'こおりくんの 家の 前の ともいしと 話そう';
        case 'shinobi': return '石の川駅から、電車で 忍びの屋敷へ 行こう';
        case 'yashiki': return !g.flags.zumi6 ? '忍びの屋敷の 庭で ズミタニに 会おう'
            : !g.flags.oni6 ? '屋敷の いちばん 奥の「奥の間」へ 行こう' : '東の 蔵で 鬼鬼団の 幹部を たおして メダルを とりもどそう';
        // 7 章「月の迷宮と 喰らう 者の 伝説」
        case 'clear6': return '石の川駅から、電車で 月の迷宮へ 行こう';
        case 'meikyu': return '月の迷宮の いちばん 奥の「月の 鏡」を めざそう';
        // 8 章「金色のSE城の 決戦」
        case 'clear7': return '石の川駅から、電車で 金色のSE城へ 行こう';
        case 'oshiro': return !g.flags.ooni8 ? 'SE城の 大広間で 幹部の 大鬼を たおそう'
            : !g.flags.soutou8 ? '双頭の間で 幹部の 双頭鬼を たおそう'
            : !g.flags.kinme8 ? '金の間で 幹部の 金滅鬼を たおそう' : '玉座の 間で おにおにを とりもどそう';
        // 9 章「筋肉の山と 新しい なかま」
        case 'clear8': return '家の 前の ともいしと 話そう';
        case 'onijoin': return '石の川駅から、電車で 筋肉の山へ 行こう';
        case 'kinniku': return !g.flags.kirin9 ? '雪どけの 氷河の ハル麒麟を こえよう' : '山頂の 道場で ノゾエマに 会おう';
        case 'clear9': return '石の川タウンへ 帰ろう';
        // 10 章「石の川タウン しゅうげき」
        case 'shuugeki': return (g.flags.dark10 || 0) < DARK10_GOAL
            ? `紋つきの なかまを 助けよう (${g.flags.dark10 || 0}/${DARK10_GOAL})` : '家の 前の 幹部から ともいしを まもろう';
        case 'clear10': return '家の 前の ともいしと 話そう';
        // 11 章「ASOの壺の底」
        case 'tsuboe': return '石の川駅から、電車で ASOの壺の底へ 行こう';
        case 'tsubo': return !g.flags.baku11 ? '火山の 底へ おりよう' : 'おくの ASOの間へ 行こう';
        case 'clear11': return '家の 前の ともいしと 話そう';
        // 12 章「集結」
        case 'shuuketsu': return !g.flags.oni12 ? '神社に 行こう。みんなが あつまっている' : '家に 帰って ねよう (出発の 前の 夜)';
        case 'clear12': return '家の 前の ともいしと 話そう';
        // 13 章「喰らいの 城」
        case 'kuraie': return '山の ダムの ヒョウガリュウに 乗って、喰らいの 城へ 行こう';
        case 'kurai': return floor13Next(g) ? `城を のぼろう。${floor13Next(g).floor} 階で 幹部が まっている` : '喰らいの 城の 最上階で ルキハを たおそう';
        case 'clear13': return '家の 前の ともいしと 話そう';
        // 14 章 (バージョンで ちがう)
        case 'invite': return `石の川駅から、電車で ${g.version === 'menkyo' ? 'メンキョシティ' : 'ナイテイパーク'}へ 行こう`;
        case 'park': return 'アトラクションで 遊ぼう。帰るときは 遊園地前駅へ';
        case 'yoru': return cluesFound(g) < PARK_CLUES.length
            ? `夜の 遊園地で ふるカワの 手がかりを さがそう (${cluesFound(g)}/${PARK_CLUES.length})` : '広場の まんなかへ 行こう';
        default: {
            // 15 章「新たなる１日」・それまでの 章の クリアの あと: なかま あつめ
            const here = area => idsInArea(area).filter(id => inVersion(id, g.version));   // ほかの バージョンの キャラは 数えない
            const got = area => here(area).filter(id => g.zukan.friends[id]).length;
            const part = (area, name) => `${name} ${got(area)}/${here(area).length}`;
            return `なかまを あつめよう　${part('ishinokawa', '石の川')}・${part('shoutengai', '商店街')}・${part('school', '学校')}・${part('yama', '山')}・${part('umi', '海')}・${part('tera', '寺')}・${part('yashiki', '屋敷')}・${part('moon', '月')}・${part('shiro', '城')}`;
        }
    }
}

// 4 章の はじまり: 3 章 クリアの あと ともいしと 話すと 電車で 海辺の 町へ 行けるように なる。はじめて なら true
export function startChapter4(g) {
    if (g.story !== 'clear3') return false;
    g.story = 'umi';
    return true;
}
// 海辺の 町に はじめて 着いた (ライバル探検隊と 出会う)。はじめて なら true
export function arriveUmi(g) {
    if (g.story !== 'umi') return false;
    g.story = 'umibe';
    return true;
}
// 電車に のれるか (4 章)
export const canRideTrain = g => reached(g, 'umi');
// 電車の 行き先 (石の川駅から): 海辺の 町 (4 章〜)・ネット寺 (5 章〜)
export const trainLines = g => [...(reached(g, 'umi') ? ['umi'] : []), ...(reached(g, 'tera') ? ['tera'] : []), ...(reached(g, 'shinobi') ? ['yashiki'] : []), ...(reached(g, 'clear6') ? ['moon'] : []), ...(reached(g, 'clear7') ? ['shiro'] : []), ...(reached(g, 'onijoin') ? ['kinniku'] : []), ...(reached(g, 'tsuboe') ? ['tsubo'] : []), ...(reached(g, 'invite') ? ['park'] : [])];

// ----- 9 章 (2026-10-30) -----
// 8 章 クリアの あと ともいしの 家で: おにおにが なかまに なる。はじめて なら おにおにの メダル
export function startChapter9(g) {
    if (g.story !== 'clear8') return null;
    g.story = 'onijoin';
    return addMedal(g, 'onioni', 35);
}
export function arriveKinniku(g) {
    if (g.story !== 'onijoin') return false;
    g.story = 'kinniku';
    return true;
}
// 10 章の はじまり: 9 章 クリアの あと 石の川タウンに もどると 黒い 霧。はじめて なら true
export function startChapter10(g) {
    if (g.story !== 'clear9') return false;
    g.story = 'shuugeki';
    g.flags.dark10 = 0;
    return true;
}
// ----- 11 章 (2026-10-30) -----
// 10 章 クリアの あと ともいしの 家で: ルキハの 城への 道は ASOの壺の底に ある
export function startChapter11(g) {
    if (g.story !== 'clear10') return false;
    g.story = 'tsuboe';
    return true;
}
export function arriveTsubo(g) {
    if (g.story !== 'tsuboe') return false;
    g.story = 'tsubo';
    return true;
}
// ASO の 間で ASO と 話すと 11 章 クリア
export function meetAso(g) {
    if (g.story !== 'tsubo' || !g.flags.baku11) return false;
    g.story = 'clear11';
    g.chapter = 12;
    return true;
}
// ----- 13 章 (2026-10-30) -----
export function startChapter13(g) {
    if (g.story !== 'clear12') return false;
    g.story = 'kuraie';
    return true;
}
export function arriveKurai(g) {
    if (g.story !== 'kuraie') return false;
    g.story = 'kurai';
    return true;
}
// ----- 12 章 (2026-10-30) -----
export function startChapter12(g) {
    if (g.story !== 'clear11') return false;
    g.story = 'shuuketsu';
    return true;
}
// おにおに・鬼神に 勝った あと 家で ねると 12 章 クリア (出発の 前の 夜)
export function nightBefore(g) {
    if (g.story !== 'shuuketsu' || !g.flags.oni12) return false;
    g.story = 'clear12';
    g.chapter = 13;
    return true;
}
// 大魔王ASO と 勝負できるか (14 章 クリアの あと、ASO の 間で)
export const canFightAso = g => reached(g, 'clear14') && !g.flags.aso15;
// こおりくんの 必殺技が 進化しているか (9 章 クリアから「絶対殺すソード・レクイエム」)
export const heroUpgraded = g => reached(g, 'clear9');
// なかまの 必殺技が 進化しているか: こおりくん (9 章 クリア)・おにおに (12 章で 勝負に 勝つ)
export const specialUpgraded = (g, id) => (id === HERO_ID ? heroUpgraded(g) : id === 'onioni' ? Boolean(g.flags.oni12) : false);

// 金色のSE城に はじめて 着いた (8 章の はじまり)。はじめて なら true
export function arriveShiro(g) {
    if (g.story !== 'clear7') return false;
    g.story = 'oshiro';
    return true;
}

// ----- 14 章 (2026-10-30。ストーリー工房の 14 章 = 内定・15 章 (no 14) = 免許) -----
// 本編の あと ともいしの 家で 招待券を もらう。はじめて なら true
export function startChapter14(g) {
    if (g.story !== MAIN_END) return false;
    g.story = 'invite';
    return true;
}
// 遊園地に はじめて 着いた。昼に なる
export function arrivePark(g) {
    if (g.story !== 'invite') return false;
    g.story = 'park';
    g.time = 1;
    return true;
}
// 駅で 帰ろうとすると ふるカワが いない。夜に なる
export function parkNight(g) {
    if (g.story !== 'park') return false;
    g.story = 'yoru';
    g.time = 3;
    if (!g.flags.clue14) g.flags.clue14 = {};
    return true;
}
export const cluesFound = g => PARK_CLUES.filter(c => g.flags.clue14 && g.flags.clue14[c.id]).length;
// アトラクションの 入り口で 手がかりを しらべる。はじめて 見つけたら その 手がかり
export function findClue(g, attrId) {
    const c = PARK_CLUES.find(x => x.id === attrId);
    if (g.story !== 'yoru' || !c || g.flags.clue14[c.id]) return null;
    g.flags.clue14[c.id] = true;
    return c;
}
// 14 章の ボス (バージョンで ちがう)
export const boss14Enemies = g => bossEnemies(BOSS14[g.version] || BOSS14.naitei);

// ----- 15 章「新たなる１日」(2026-10-30) -----
// 無限回廊: 1 階ごとに これまでの ボスと 順番に 戦う。階が 上がるほど Lv が 上がる (強化ボス)。5 階ごとに ごほうび
export const KAIROU_PRIZES = ['gattaidango', 'luckycoin', 'tsukishizuku', 'makimono'];
export function kairouOf(g) {
    if (!g.kairou) g.kairou = { floor: 1, best: 0 };
    return g.kairou;
}
export function kairouEnemies(g) {
    const floor = kairouOf(g).floor;
    const key = KAIROU_BOSSES[(floor - 1) % KAIROU_BOSSES.length];
    const id = key === 'boss14' ? (BOSS14[g.version] || BOSS14.naitei) : key;
    return [{ id, lv: Math.min(99, BOSSES[id].lv + 12 + floor * 2) }];
}
// ライバル探検隊の 仲間クエスト: その バージョンの チーム (まだ 勝って いない)
export const teamsLeft = g => teamsIn(g.version).filter(k => !g.flags[`team_${k}`]);
export const teamEnemies = team => TEAMS[team].members.map(id => ({ id, lv: TEAM_LV + (id === TEAMS[team].leader ? 2 : 0) }));

// 月の迷宮に はじめて 着いた (7 章の はじまり)。はじめて なら true
export function arriveMoon(g) {
    if (g.story !== 'clear6') return false;
    g.story = 'meikyu';
    return true;
}

// 6 章の はじまり: 5 章 クリアの あと ともいしと 話す。はじめて なら true
export function startChapter6(g) {
    if (g.story !== 'clear5') return false;
    g.story = 'shinobi';
    return true;
}
// 忍びの屋敷に はじめて 着いた。はじめて なら true
export function arriveYashiki(g) {
    if (g.story !== 'shinobi') return false;
    g.story = 'yashiki';
    return true;
}

// 5 章の はじまり: 4 章 クリアの あと ともいしと 話すと ダイシの 手紙。はじめて なら true
export function startChapter5(g) {
    if (g.story !== 'clear4') return false;
    g.story = 'tera';
    return true;
}
// ネット寺に はじめて 着いた。はじめて なら true
export function arriveTera(g) {
    if (g.story !== 'tera') return false;
    g.story = 'netdera';
    return true;
}
// 黒い 紋の なかまを 何体 助けたか (5 章)
export const monsSaved = g => MONS.filter(m => g.mysteries && g.mysteries[m.id]).length;
export const allMonsSaved = g => monsSaved(g) >= MONS.length;

export const spotById = id => SPOTS.find(s => s.id === id);

// 氷の 封印を いくつ といたか (3 章)
export const sealsSolved = g => SEALS.filter(s => g.mysteries && g.mysteries[s.id]).length;
export const allSealsSolved = g => sealsSolved(g) >= SEALS.length;

// 奥の院で 言いつたえを 読んだ (3 章)。はじめて なら true
export function readLegend(g) {
    if (g.story !== 'yama' || g.flags.oku) return false;
    g.flags.oku = true;
    return true;
}

// 駄菓子屋で 買う。1 種類 99 こ まで (2026-10-28 ユーザー指定: 何こ 買うか えらべる)
export const MAX_ITEM = 99;
export const maxBuy = (g, id) => Math.max(0, Math.min(Math.floor(g.money / ITEMS[id].price), MAX_ITEM - (g.items[id] || 0)));
export function buyItem(g, id, n) {
    if (!(n >= 1) || n > maxBuy(g, id)) return false;
    g.money -= ITEMS[id].price * n;
    g.items[id] = (g.items[id] || 0) + n;
    return true;
}

// 話せる キャラ (map.js の FRIENDS) から 道具を もらう。今日 もう もらっていたら null
export function takeGift(g, friend) {
    if (!friend.gift || g.gifts[friend.id] === g.day) return null;
    g.gifts[friend.id] = g.day;
    g.items[friend.gift.item] = (g.items[friend.gift.item] || 0) + friend.gift.n;
    return friend.gift;
}
