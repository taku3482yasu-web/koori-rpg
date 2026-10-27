// =====================================================================
// ゲームの 進み具合 (セーブに 入る 中身)・ストーリー・出会い・仲間になる (画面に ふれない)
// ---------------------------------------------------------------------
// 1 章の 流れ (story):
//   intro    家の前から。神社へ 行くと ふるカワに 会い、おなかまウォッチ・レンズ・ダイチョウエンキンの メダルを もらう
//   friends  なかまを 3 体 ふやす
//   bridge   石の川橋の ヌシを たおす (たおすと ハシシタボウズが なかまに なり、東へ 渡れる)
//   clear    1 章 クリア。石の川タウンの 20 体を あつめる
// =====================================================================
import { NAKAMA, NAKAMA_IDS, BOSSES, HERO_ID, idsInArea } from '../data/nakama.js';
import { SPOTS, START } from '../data/map.js';
import { expFor, expReward, gainExp, moneyReward } from './units.js';

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
        gifts: {}           // 話せる キャラから 道具を もらった 日 (1 日 1 回)
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
        (!k.after || g.story === k.after));
}

// かくれている 場所に 今 だれかが いるか (違和感が 見えて、レンズに 反応するか)
export function spotActive(g, spot, now) {
    return hasWatch(g) && spotKinds(g, spot).length > 0 && !((g.spotCooldown[spot.id] || 0) > now);
}

// 話しかけた キャラ (first: { id, lv }) と 戦う。ときどき 同じ 場所の キャラが もう 1 体 出る
export function encounter(g, source, rng, first = null) {
    const kinds = spotKinds(g, source);
    const [lo, hi] = source.lv || (g.story === 'clear' ? [4, 9] : [2, 5]);
    const lead = first || { id: rng.weighted(kinds).id, lv: lo + rng.int(hi - lo + 1) };
    const enemies = [{ id: lead.id, lv: lead.lv }];
    if (kinds.length && rng.chance(0.2)) {
        const other = rng.weighted(kinds);
        enemies.push({ id: other.id, lv: Math.max(1, lead.lv - 1) });
    }
    enemies.forEach(e => { g.zukan.seen[e.id] = true; });
    return enemies;
}

export const bossEnemies = () => [{ id: 'nushi', lv: 8 }];

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
    const out = { outcome: battle.outcome, exp: 0, money: 0, levelUps: [], befriend: null, boss: battle.kind === 'boss' };
    if (battle.outcome !== 'win') {
        out.money = -Math.floor(g.money * 0.1);
        g.money += out.money;
        return out;
    }
    for (const e of battle.enemies) {
        out.exp += expReward(e.id, e.lv);
        out.money += moneyReward(e.id, e.lv);
        if (NAKAMA[e.id]) g.wins[e.id] = (g.wins[e.id] || 0) + 1;
    }
    g.money += out.money;
    // ウォッチに セットした なかま 全員に けいけんち (たおれた なかまにも)
    for (const m of watchMedals(g)) {
        if (!m) continue;
        const up = gainExp(m, out.exp);
        if (up) out.levelUps.push({ uid: m.uid, id: m.id, lv: m.lv });
    }
    if (out.boss) {
        const id = BOSSES.nushi.befriends;
        out.befriend = { id, medal: addMedal(g, id, 6), forced: true };
        g.story = 'clear';
        return out;
    }
    // 1 回の バトルで 仲間に なるのは 1 体まで
    const ids = [...new Set(battle.enemies.map(e => e.id))];
    for (const id of ids) {
        if (rng.chance(befriendRate(g, id, battle.food))) {
            const lv = battle.enemies.find(e => e.id === id).lv;
            out.befriend = { id, medal: addMedal(g, id, lv) };
            g.wins[id] = 0;
            break;
        }
    }
    out.storyChanged = updateStory(g);
    return out;
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
        default: {
            // 1 章 クリアの あと: 南の 商店街が 開く (段階 2)
            const got = area => idsInArea(area).filter(id => g.zukan.friends[id]).length;
            return `なかまを あつめよう　石の川 ${got('ishinokawa')}/${idsInArea('ishinokawa').length}・商店街 ${got('shoutengai')}/${idsInArea('shoutengai').length}`;
        }
    }
}

export const spotById = id => SPOTS.find(s => s.id === id);

// 話せる キャラ (map.js の FRIENDS) から 道具を もらう。今日 もう もらっていたら null
export function takeGift(g, friend) {
    if (!friend.gift || g.gifts[friend.id] === g.day) return null;
    g.gifts[friend.id] = g.day;
    g.items[friend.gift.item] = (g.items[friend.gift.item] || 0) + friend.gift.n;
    return friend.gift;
}
