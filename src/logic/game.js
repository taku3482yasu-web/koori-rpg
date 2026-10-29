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
//   clear5   5 章 クリア。なかまを あつめる (順番は story.js)
// =====================================================================
import { NAKAMA, NAKAMA_IDS, BOSSES, HERO_ID, idsInArea, rivalTeam, RIVAL_LV, evolveOf } from '../data/nakama.js';
import { SPOTS, START } from '../data/map.js';
import { ITEMS } from '../data/items.js';
import { expFor, expReward, gainExp, moneyReward } from './units.js';
import { reached } from './story.js';
import { MYSTERIES, SEALS, MONS } from '../data/map.js';

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
export function spotKinds(g, spot) {
    return spot.kinds.filter(k =>
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
export function encounter(g, source, rng, first = null) {
    const kinds = spotKinds(g, source);
    const [lo, hi] = source.lv || (reached(g, 'clear') ? [4, 9] : [2, 5]);
    const lead = first || { id: rng.weighted(kinds).id, lv: lo + rng.int(hi - lo + 1) };
    const enemies = [{ id: lead.id, lv: lead.lv }];
    const more = () => ({ id: rng.weighted(kinds).id, lv: Math.max(1, lead.lv - 1) });
    if (kinds.length && rng.chance(0.25)) {
        enemies.push(more());
        if (rng.chance(0.4)) enemies.unshift(more());
    }
    enemies.forEach(e => { g.zukan.seen[e.id] = true; });
    return enemies;
}

// ボス: nushi (1 章・石の川橋) / kage (2 章・学校の ろうか) / himuro (3 章・ダム) / urashima4 (4 章・海岸どうくつ)
export const bossEnemies = (id = 'nushi') => [{ id, lv: BOSSES[id].lv }];
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
        out.befriend = { id, medal: addMedal(g, id, bossId === 'nushi' ? 6 : BOSSES[bossId].lv - 2), forced: true };
        if (bossId === 'nushi') { g.story = 'clear'; g.chapter = 2; }
        if (bossId === 'kage') { g.story = 'clear2'; g.chapter = 3; }
        if (bossId === 'himuro') { g.story = 'clear3'; g.chapter = 4; }
        if (bossId === 'urashima4') { g.story = 'clear4'; g.chapter = 5; }
        if (bossId === 'daishi5') { g.story = 'clear5'; g.chapter = 6; }
        return out;
    }
    // 1 回の バトルで 仲間に なりたがるのは 1 体まで。仲間に するかは 結果画面で えらぶ (2026-10-28 ユーザー指定。acceptBefriend)
    const ids = [...new Set(battle.enemies.map(e => e.id))];
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
        default: {
            // 5 章 クリアの あと: なかま あつめ
            const got = area => idsInArea(area).filter(id => g.zukan.friends[id]).length;
            const part = (area, name) => `${name} ${got(area)}/${idsInArea(area).length}`;
            return `なかまを あつめよう　${part('ishinokawa', '石の川')}・${part('shoutengai', '商店街')}・${part('school', '学校')}・${part('yama', '山')}・${part('umi', '海')}・${part('tera', '寺')}`;
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
export const trainLines = g => [...(reached(g, 'umi') ? ['umi'] : []), ...(reached(g, 'tera') ? ['tera'] : [])];

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
