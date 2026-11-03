// =====================================================================
// バトルの 場面 (設計書 3 章・7 章): 上画面で 戦い、下画面で ウォッチの 輪を 回す
// ---------------------------------------------------------------------
// 操作: L・R か 輪を なぞる → 回す / 十字キー左右 + A か 絵の タップ → 必殺技 (れんだの ミニゲーム)
//       Y → どうぐ (なかまを 回復) / X → おやつ (敵に 投げる。仲間に なりやすくなる)
//       F キー・START・下画面の「倍速」 → 倍速 (2026-10-28 ユーザー指定: ふだんは ゆっくり。g.fastBattle に 残る)
// どうぐ・おやつを えらんでいる あいだは バトルを 止める (2026-10-28 ユーザー指定)
// はじまり (2026-10-29 ユーザー指定): 敵だけが 出て「○○が あらわれた！」。下画面で たたかう・どうぐ・おやつ・にげる を えらぶ。
//   たたかう か どうぐ・おやつを 使うと なかまが 出てきて バトル開始。にげるは 特別な バトル (ボス・七不思議) では できない
// =====================================================================
import { ART } from '../art/index.js';
import { backArt } from '../art/back.js';
import { BACK_ART } from '../art/back-art.js';
import { specialOf, createCommand, drawPerformance, drawCutin, drawEnemyCutin, MOTION_TIME, COMMANDS, COMMAND_NAMES } from './special-fx.js';
import { drawSwirl, SWIRL_IN, SWIRL_OUT } from './transition.js';
import { skillMotion, skillPose, drawSkillFx, SKILL_KIND } from './skill-fx.js';
import { ITEMS } from '../data/items.js';
import { drawBackdrop, HORIZON } from './backdrop.js';
import { ELEMENT_COLORS } from '../data/nakama.js';
import { COLORS, drawArt, artFit, panel, text, bar, button, hit, roundRect, drawFriendMark } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { btn } from '../core/keys.js';
import { step, rotate, canSpecial, startSpecial, resolveSpecial, useItem, throwFood, itemTargets, isFood, GAUGE_MAX, STATUS_NAMES, toritsukiName, isPossessed, rescueTargets, startRescue, resolveRescue, lockOn, weakActive, PART_ORDER, chanceTime, begin, flee, canFlee, gimOpen, openGims } from '../logic/battle.js';

const WHEEL = { x: 100, y: 126, r: 70 };
const SP_BTN = [0, 1, 2].map(i => ({ x: 204, y: 10 + i * 52, w: 110, h: 46 }));
const ITEM_BTN = { x: 204, y: 172, w: 52, h: 30, label: 'どうぐ' };
const FOOD_BTN = { x: 262, y: 172, w: 52, h: 30, label: 'おやつ' };
const FAST_BTN = { x: 4, y: 4, w: 56, h: 24, label: '倍速' };
// はじまりの コマンド (2×2)
const INTRO_BTN = [
    { x: 20, y: 64, w: 136, h: 62, label: 'たたかう', key: 'fight' },
    { x: 164, y: 64, w: 136, h: 62, label: 'どうぐ', key: 'item' },
    { x: 20, y: 134, w: 136, h: 62, label: 'おやつ', key: 'food' },
    { x: 164, y: 134, w: 136, h: 62, label: 'にげる', key: 'run' }
];
const ENTER_TIME = 0.45;       // なかまが とびだしてくる 時間
// おたすけ: 後ろに とりつかれた なかまが いるとき、輪の まんなかが ボタンに なる (2 章)
const RESCUE_BTN = { x: WHEEL.x - 34, y: WHEEL.y - 22, w: 68, h: 44 };
// バトルの 進む 速さ (2026-10-28 ユーザー指定: 1 回 1 回の 行動が 速いので ゆっくり。倍速で その 2 倍)
export const BATTLE_SPEED = { normal: 0.6, fast: 1.2 };
// 強化の 名前 (必殺技などで ついた ものは 切れるまで 出す)
const BUFF_NAMES = { atk: 'こうげき↑', def: 'まもり↑', spd: 'すばやさ↑', mag: 'ようじゅつ↑' };
// 味方は 手前 (下) に 大きく、うしろ姿で。敵は 奥 (上) に (2026-10-26 ユーザー指定)
const ALLY_POS = [{ x: 78, y: 234 }, { x: 200, y: 242 }, { x: 322, y: 234 }];
const ALLY_SCALE = 4;

// opts.shot: バトル前の 画面 (はじまりの 煙の 演出で 使う。2026-11-03)
export function createBattleView(app, battle, place, opts = {}) {
    // はじまりの 演出: むらさきの 煙 (ボスは 赤い 霧) が まんなかで 渦を まき、まんなかから 晴れる。app.noSwirl で なし (テスト)
    let swirlT = app.noSwirl ? null : 0;
    const swirlBoss = battle.kind === 'boss' || battle.kind === 'kairou';
    // 敵の 必殺技の カットイン (2026-11-03): その あとの できごとは カットインが おわるまで 待たせる
    let ecut = null;   // { unit, name, boss, start, dur, held }
    const g = app.g;
    let t = 0, endT = 0;
    let shownRot = battle.rot;     // 輪の 回る アニメーション
    let cursor = 0;                // 必殺技を えらぶ カーソル (前の 3 体)
    let menu = null;               // { kind: 'item' | 'food' | 'rescue', index, top, pick: null | { id, index } (だれに 使うか えらぶ) }
    let foodShow = null;           // はじまりに おやつを 投げた ときの 反応 { text, until } (見せおわったら バトル開始)
    let mg = null;                 // 必殺技 (コマンド → カットイン → 動き)
    let drag = null;
    let banner = null;             // { text, color, until }
    const bannerQueue = [];        // 順に 出す バナー (13 章の 変身の セリフ)
    const helpFlash = {};          // 加勢した 探検隊の キャラが はねる 時間
    let warn = null;               // ボスの 予告 { name, until }
    const pops = [];               // ダメージの 数字
    let introIndex = 0;            // はじまりの コマンドの カーソル
    let enterT = battle.waiting ? null : -9;   // なかまが 出てきた 時間 (null は まだ 出ていない)
    // 「○○が あらわれた！」(2 体 いじょうは まんなかの 敵で「○○たちが」・2026-10-29 ユーザー指定。2 体なら 左)
    const appearText = (() => {
        const es = battle.enemies;
        if (es.length === 1) return `${es[0].name}が あらわれた！`;
        return `${es[Math.floor((es.length - 1) / 2)].name}たちが あらわれた！`;
    })();
    const flash = {};              // uid → 光る 時間

    const enemyPos = k => {
        const e = battle.enemies[k];
        // 氷の 偶像 (3 章の ダムの主) は ボスの 左右
        if (e && e.idol) return { x: e.slot === 'left' ? 76 : 324, y: 140, scale: 3 };
        const main = battle.enemies.filter(x => !x.idol), n = main.length, i = main.indexOf(e);
        // 部位の ある ボス (2 章の 影) は とても 大きい
        if (n === 1 && (main[0].parts || main[0].huge)) return main[0].huge ? { x: 200, y: 172, scale: 4.6 } : { x: 200, y: 156, scale: 6.5 };   // 13 章の ニオニオーテンは 名前と HP が 入る 大きさ
        // 人の 絵の ように 背の 高い ボス (4 章の 浦の島重蔵) は 名前と HP が 画面に 入るように 少し 小さく
        if (n === 1) return main[0].boss ? { x: 200, y: 142, scale: ART[main[0].art].h > 24 ? 3.6 : 5 } : { x: 200, y: 132, scale: 3.5 };
        if (n === 2) return [{ x: 140, y: 126, scale: 3 }, { x: 262, y: 136, scale: 3 }][i];
        return [{ x: 84, y: 132, scale: 2.8 }, { x: 200, y: 120, scale: 2.8 }, { x: 316, y: 132, scale: 2.8 }][i];   // 3 体 (まんなかが 奥)
    };
    // 13 章: 加勢する ライバル探検隊は 右上に ならぶ (攻撃は 受けない)
    const helperPos = i => ({ x: 312 + i * 30, y: 74 });
    function posOf(uid) {
        const fi = battle.front().findIndex(u => u && u.uid === uid);
        if (fi >= 0) return ALLY_POS[fi];
        const hi = battle.helpers ? battle.helpers.units.findIndex(u => u.uid === uid) : -1;
        if (hi >= 0) return helperPos(hi);
        const ei = battle.enemies.findIndex(u => u.uid === uid);
        return ei >= 0 ? enemyPos(ei) : null;
    }
    const nameOf = uid => [...battle.wheel, ...battle.enemies].find(u => u && u.uid === uid)?.name || '';

    // ----- 動き (2026-10-26 ユーザー指定: 攻撃した キャラが 動いて 分かるように) -----
    //   attack: 相手の ほうへ 飛びこんで もどる / skill: その場で はねて、属性の 色の 玉が 相手へ 飛ぶ
    //   special: 高く ジャンプして 着地で 衝撃波 / 当たった 相手は ゆれて 火花。ダメージの 数字は 当たった ときに 出る
    const motions = {};            // uid → { kind, start, dur, dx, dy }
    const shakes = {};             // uid → ゆれおわる 時間
    const effects = [];            // 玉・火花・衝撃波・回復の きらきら
    const later = [];              // { at, fn } 当たる ときに やること
    const HIT_DELAY = { attack: 0.14, skill: 0.32, special: 0.5, perf: 0 };
    const unitOf = uid => [...battle.wheel, ...battle.enemies].find(u => u && u.uid === uid);
    // 無限回廊の 赤黒い ボス (shade) の エフェクトは どす黒い 赤 (2026-11-02 ユーザー指定)
    const DARK_FX = ['#5a0010', '#8a0a1a', '#2a0008'];
    const tone = (uid, color) => (unitOf(uid)?.shade ? DARK_FX[Math.floor(Math.random() * DARK_FX.length)] : color);
    // 体の まんなか (足元から 半分 上)
    function centerOf(uid) {
        const p = posOf(uid), u = unitOf(uid);
        if (!p || !u) return null;
        const scale = u.side === 'ally' ? ALLY_SCALE : p.scale || 3;
        return { x: p.x, y: p.y - ART[u.art].h * scale * artFit(ART[u.art]) / 2 };
    }
    // skill: わざ・術の 動き (skill-fx.js の skillMotion)。相手の そばまで 近づく わざは 相手との きょりの near ぶん 動く
    function startMotion(uid, kind, targetUid, skill = null) {
        const spec = skill ? SKILL_KIND[skill.kind] : null;
        const dur = spec ? spec.dur : { attack: 0.34, skill: 0.42, special: 0.7 }[kind];
        let dx = 0, dy = 0;
        const a = posOf(uid), b = targetUid ? posOf(targetUid) : null;
        if (kind === 'attack' && a && b) {
            const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            dx = (b.x - a.x) / d * 26;
            dy = (b.y - a.y) / d * 26;
        } else if (spec && spec.near && a && b) {
            dx = (b.x - a.x) * spec.near;
            dy = (b.y - a.y) * spec.near;
        }
        motions[uid] = { kind, start: t, dur, dx, dy, skill };
    }
    // いま 描いている 体の まんなか (動きの ずれも 入れる)。わざの 武器を 手に 持たせる
    function actorPoint(uid) {
        const c = centerOf(uid), u = unitOf(uid);
        if (!c || !u) return null;
        const o = offsetOf(u);
        return { x: c.x + o.ox, y: c.y + o.oy };
    }
    // 食らった とき (2026-10-27 ユーザー指定): 攻撃した 相手と 反対へ はじかれ、ぺしゃっと つぶれて もどる
    //   たおれた ときは 大きく はじかれて つぶれたまま
    // やられの 動き (2026-11-03 ユーザー指定: 妖怪ウォッチの バトルの ように のけぞる)。
    //   当たった しゅんかんに 一瞬 止まり (ヒットストップ)、こうげきと 反対へ のけぞって 押され、ぷるぷる ゆれて はずみながら もどる。
    //   big (会心・じゃくてん・必殺技・大ダメージ): もっと 大きく のけぞり、とびあがって 頭の まわりに 星が まわる
    function startHurt(uid, fromUid, ko = false, big = false) {
        const a = posOf(uid), b = fromUid ? posOf(fromUid) : null;
        const u = unitOf(uid);
        let dx = 0, dy = u && u.side === 'ally' ? 1 : -1;
        if (a && b) {
            const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
            dx = (a.x - b.x) / d;
            dy = (a.y - b.y) / d;
        }
        const power = ko ? 22 : big ? 20 : 13;
        // のけぞる 向き: 押される 方へ 体を かたむける (横の 向きで きめる。まっすぐ 上下なら 左右 どちらか)
        const lean = (Math.abs(dx) > 0.2 ? Math.sign(dx) : u && u.side === 'ally' ? -1 : 1) * (big || ko ? 0.36 : 0.24);
        motions[uid] = { kind: ko ? 'ko' : 'hurt', start: t, dur: ko ? 0.9 : big ? 0.85 : 0.6, dx: dx * power, dy: dy * power, lean, big };
    }
    // ずれ (ox, oy) と のびちぢみ (sx, sy)
    function offsetOf(u) {
        let ox = 0, oy = 0, sx = 1, sy = 1, rot = 0;
        const m = motions[u.uid];
        if (m) {
            const k = (t - m.start) / m.dur;
            if (k >= 1 && m.kind !== 'ko') delete motions[u.uid];
            else if (m.kind === 'skill' && m.skill) {
                const p = skillPose(m.skill.kind, k, m.dx, m.dy);
                ox += p.ox;
                oy += p.oy;
                sx = p.sx;
                sy = p.sy;
            } else if (m.kind === 'attack') {
                const f = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65;
                ox += m.dx * f;
                oy += m.dy * f;
            } else if (m.kind === 'skill') oy -= Math.sin(Math.PI * k) * 10;
            else if (m.kind === 'special') oy -= Math.sin(Math.PI * k) * 26;
            else if (m.kind === 'hurt') {
                const sec = k * m.dur;
                if (sec < 0.07) {
                    // ヒットストップ: 当たった ところで 一瞬 かたまる (少し つぶれる)
                    ox += m.dx * 0.15; oy += m.dy * 0.15; sx = 1.1; sy = 0.9;
                } else {
                    // のけぞって 押される → ばねの ように ゆれて もどる
                    const q = (sec - 0.07) / (m.dur - 0.07);
                    const push = q < 0.22 ? Math.sin(q / 0.22 * Math.PI / 2) : Math.cos((q - 0.22) * Math.PI * 2.4) * Math.exp(-4.5 * (q - 0.22));
                    ox += m.dx * push;
                    oy += m.dy * push * 0.6;
                    rot = m.lean * push;
                    sx = 1 + 0.16 * Math.max(0, push);
                    sy = 1 - 0.2 * Math.max(0, push);
                    if (q < 0.35) ox += Math.sin(t * 90) * 2.2 * (1 - q / 0.35);   // ぷるぷる
                    if (m.big) oy -= Math.sin(Math.min(1, q / 0.55) * Math.PI) * 12;   // とびあがる
                }
            } else if (m.kind === 'ko') {
                // たおれる: 大きく のけぞって 吹っとび、ひっくりかえって つぶれる
                const f = Math.min(1, k / 0.35);
                ox += m.dx * f;
                oy += m.dy * f - Math.sin(Math.min(1, k / 0.45) * Math.PI) * 14;
                rot = m.lean * 2.6 * f;
                sy = 1 - 0.45 * Math.max(0, (k - 0.35) / 0.65);
                sx = 1 + 0.2 * Math.max(0, (k - 0.35) / 0.65);
            }
        }
        if ((shakes[u.uid] || 0) > t) ox += Math.sin(t * 70) * 2.5;
        if (u.gims || u.parts || u.huge) rot = 0;   // 部位の ある ボス・大きな ボスは かたむけない (部位が ずれる)
        return { ox, oy, sx, sy, rot };
    }
    const at = (delay, fn) => later.push({ at: t + delay, fn });

    // わざ・術の 当たる 相手: つづく できごと (次の キャラが 動くまで) の target
    const ACTS = ['attack', 'skill', 'special', 'guard', 'loaf', 'confused', 'possessed'];
    function targetsAfter(list, i) {
        const out = [];
        for (let j = i + 1; j < list.length && !ACTS.includes(list[j].type); j++) {
            if (list[j].target && !out.includes(list[j].target)) out.push(list[j].target);
        }
        return out;
    }
    function readEvents() {
        let actor = null, kind = 'attack';      // いま 動いている キャラ (つづく ダメージは その キャラの 攻撃)
        let skillHit = HIT_DELAY.skill;         // わざ・術の 当たる 時間 (わざごとの 動きで 変わる)
        let list = battle.events.splice(0);
        if (ecut) { ecut.held.push(...list); return; }
        const ci = list.findIndex(e => e.type === 'special' && e.side === 'enemy' && !e.cut);
        if (ci >= 0 && unitOf(list[ci].actor)) {
            const e = list[ci], u = unitOf(e.actor);
            e.cut = true;
            const boss = Boolean(e.big || u.boss);
            ecut = { unit: u, name: e.name, boss, start: t, dur: (boss ? 1.9 : 1.15) * (g.fastBattle ? 0.6 : 1), held: list.slice(ci), wasPaused: battle.paused };
            battle.paused = true;
            sfx(boss ? 'big' : 'special');
            list = list.slice(0, ci);
        }
        list.forEach((e, idx) => {
            if (e.type === 'begin') {
                enterT = t;
                banner = { text: 'いけっ！ なかまたち！', color: COLORS.accent, until: t + 1.2 };
                sfx('ok');
            }
            if (e.type === 'noFlee') banner = { text: 'この バトルからは にげられない！', color: '#ff6a6a', until: t + 1.4 };
            if (e.type === 'attack' || e.type === 'skill' || e.type === 'special') {
                actor = e.actor;
                kind = e.type;
                // 味方の 必殺技は 必殺技の 動き (special-fx.js) が もう 当たったところ。ふつうの 動きは つけない
                if (e.type === 'special' && e.side === 'ally' && mg) kind = 'perf';
                else if (e.type === 'skill') startSkill(e, targetsAfter(list, idx));
                else startMotion(e.actor, e.type, e.target);
                if (e.type === 'skill') skillHit = SKILL_KIND[motions[e.actor]?.skill?.kind]?.hit ?? HIT_DELAY.skill;
            }
            // わざ・術の 名前、まもり・さぼりを キャラの 上に 出す (2026-10-27 ユーザー指定の 5 つの コマンド)
            if (e.type === 'skill' || e.type === 'guard' || e.type === 'loaf') {
                const p = posOf(e.actor);
                const label = e.type === 'skill' ? e.name : e.type === 'guard' ? 'まもり' : 'さぼり…';
                const color = e.type === 'skill' ? (e.cmd === 'jutsu' ? '#c8a8ff' : '#ffe08a') : e.type === 'guard' ? '#8ad0ff' : '#a0a0b0';
                if (p) pops.push({ x: p.x, y: p.y - 62, text: label, color, small: true, until: t + 1.1 });
                // 13 章の ルキハ: 体を 変形させて こうげき
                if (e.morph && p) { pops.push({ x: p.x, y: p.y - 110, text: '体を 変形させた！', color: '#ff8ab8', small: true, until: t + 1.1 }); effects.push({ kind: 'wave', x: p.x, y: p.y - 50, start: t, dur: 0.5, color: '#a040e0' }); }
                if (e.type === 'guard') { const c = centerOf(e.actor); if (c) effects.push({ kind: 'shield', x: c.x, y: c.y, start: t, dur: 0.5 }); }
            }
            if (e.type === 'damage') {
                const p = posOf(e.target), from = centerOf(actor), to = centerOf(e.target);
                const delay = actor ? (kind === 'skill' ? skillHit : HIT_DELAY[kind]) : 0;
                const color = actor ? tone(actor, ELEMENT_COLORS[unitOf(actor)?.element] || '#ffffff') : '#ffffff';
                // わざは わざごとの 絵 (skill-fx.js) が 飛ぶ。玉は 敵の 必殺技だけ
                if (actor && kind === 'special' && from && to) effects.push({ kind: 'orb', from, to, start: t + (kind === 'special' ? 0.3 : 0.05), dur: delay - (kind === 'special' ? 0.3 : 0.05), color });
                const by = actor;
                at(delay, () => {
                    if (p) pops.push({ x: p.x + (Math.random() * 16 - 8), y: p.y - 40, text: String(e.amount), color: e.headGuard ? '#8a90a8' : e.eff > 1 ? '#ffd84a' : e.eff < 1 ? '#a0a0b0' : '#ffffff', big: e.crit || e.eff > 1, until: t + 0.9 });
                    if (p && e.weak) pops.push({ x: p.x, y: p.y - 70, text: 'じゃくてん！', color: '#ffe85a', small: true, until: t + 0.9 });
                    flash[e.target] = t + 0.15;
                    const tu = unitOf(e.target);
                    const big = Boolean(e.crit || e.eff > 1 || kind === 'special' || (tu && e.amount >= tu.max * 0.22));
                    if (!motions[e.target] || motions[e.target].kind !== 'ko') startHurt(e.target, by, tu?.ko, big);
                    if (to && big) effects.push({ kind: 'impact', x: to.x, y: to.y, start: t, dur: 0.35, color: '#fff2a0' });
                    if (to) effects.push({ kind: 'spark', x: to.x, y: to.y, start: t, dur: 0.3, color: kind === 'attack' ? tone(by, '#ffffff') : color });
                    sfx(e.amount > 30 ? 'big' : 'hit');
                });
            } else if (e.type === 'heal' && e.amount > 0) {
                const p = posOf(e.target), c = centerOf(e.target);
                at(actor && kind !== 'perf' ? (kind === 'skill' ? skillHit : 0.2) : 0, () => {
                    if (p) pops.push({ x: p.x, y: p.y - 40, text: `+${e.amount}`, color: '#7aff8a', until: t + 0.9 });
                    if (c) effects.push({ kind: 'heal', x: c.x, y: c.y, start: t, dur: 0.7 });
                });
            } else if (e.type === 'status') {
                const p = posOf(e.target);
                at(actor ? (kind === 'skill' ? skillHit : HIT_DELAY[kind]) : 0, () => { if (p) pops.push({ x: p.x, y: p.y - 56, text: toritsukiName(e.status), color: '#ff9ad8', until: t + 1 }); });
            } else if (e.type === 'special') {
                banner = { text: `${nameOf(e.actor)}の「${e.name}」！${e.great ? ' 大成功で 威力アップ！' : ''}`, color: e.side === 'ally' ? COLORS.accent : '#ff6a6a', until: t + 1.4 };
                sfx('special');
                const c = centerOf(e.actor), p = posOf(e.actor);
                if (c && p && kind !== 'perf') at(0.62, () => effects.push({ kind: 'wave', x: p.x, y: p.y, start: t, dur: 0.45, color: tone(e.actor, ELEMENT_COLORS[unitOf(e.actor)?.element] || '#ffffff') }));
                if (e.big) warn = null;
            } else if (e.type === 'partBreak') {
                // 部位を こわした (2 章の 影)
                banner = { text: `${e.name}を こわした！${e.move ? `「${e.move}」が 使えない！` : ''}`, color: COLORS.accent, until: t + 1.8 };
                sfx('big');
                const k = battle.enemies.findIndex(x => x.uid === e.target), pp = k >= 0 ? partPos(k, e.part) : null;
                if (pp) effects.push({ kind: 'wave', x: pp.x, y: pp.y + 10, start: t, dur: 0.5, color: '#ffe85a' });
            } else if (e.type === 'chance') {
                if (e.why === 'flip') banner = { text: 'ひっくり返った！ チャンス！', color: COLORS.accent, until: t + 1.8 };
                if (e.why === 'fall') banner = { text: `${nameOf(e.target)}が 転んだ！ チャンス！`, color: COLORS.accent, until: t + 1.8 };
                if (e.why === 'water') banner = { text: '水爆弾で 体が かたまった！ チャンス！', color: COLORS.accent, until: t + 2 };
                if (e.why === 'heads') banner = { text: '頭を ふたつとも こわした！ チャンス！', color: COLORS.accent, until: t + 1.8 };
                if (e.why === 'cage') banner = { text: 'おりが こわれた！ ふるカワが にげだした！ チャンス！', color: COLORS.accent, until: t + 2 };
                if (e.why === 'signal') banner = { text: '信号機を こわした！ リハマが とまった！ チャンス！', color: COLORS.accent, until: t + 1.8 };
                if (e.why === 'barrier') banner = { text: 'バリアを ぜんぶ こわした！ 必殺技を 止めた！ チャンス！', color: COLORS.accent, until: t + 2 };
                sfx('special');
            } else if (e.type === 'bind') {
                // 大魔王ASO: 拘束のリング
                banner = { text: `拘束のリング！ ${nameOf(e.target)}が うごけない！ 輪も 回せない！`, color: '#ffd040', until: t + 2 };
                sfx('cancel');
            } else if (e.type === 'unbind') {
                if (e.why === 'break') { banner = { text: 'リングを こわした！ 拘束が とけた！', color: COLORS.accent, until: t + 1.8 }; sfx('big'); }
            } else if (e.type === 'boundWheel') {
                if (t - guardTold > 1) { guardTold = t; banner = { text: '拘束のリングで 輪が 回せない！ リングを ねらえ！', color: '#ffd040', until: t + 1.4 }; sfx('cancel'); }
            } else if (e.type === 'transform') {
                banner = { text: `${e.name}に すがたを かえた！`, color: '#ff6a6a', until: t + 2.2 };
                if (e.name === 'ルキハ・ニオニオーテン') {
                    // ストーリー工房 13 章「本性」(2026-11-02: 工房の セリフ ぜんぶ。流れる あいだは バトルを 止める)
                    let at2 = t + 2.2;
                    for (const [text2, color] of [['ルキハ「くく……くくく……ああ、もう 人の まねは あきた。」', '#ff8ab8'], ['ルキハの 体が、内がわから はじけた。', '#ffffff'],
                        ['竜の 翼、けものの 脚、鳥の くちばし、鬼の 腕……喰らってきた ものが つぎはぎに ふくれあがる。', '#ffffff'], ['まんなかに、ぐちゃぐちゃに くずれた ルキハの 顔だけが のこっていた。', '#ffffff'],
                        ['ニオニオーテン「ゼンブ……オレノ……モノ……！」', '#ff6a6a'], ['ふるカワ「こおりくん、顔を ねらって！ ASOが 言ってた、あれが 本体だよ！」', COLORS.accent], ['ルキハ・ニオニオーテンが ほえた。', '#ff6a6a']]) {
                        bannerQueue.push({ text: text2, color, at: at2, until: at2 + 2.2 });
                        at2 += 2.2;
                    }
                    battle.paused = true;
                    later.push({ at: at2, fn: () => { battle.paused = false; } });
                }
                sfx('big');
                const p = posOf(e.actor);
                if (p) for (let i = 0; i < 4; i++) effects.push({ kind: 'wave', x: p.x, y: p.y - 40, start: t + i * 0.15, dur: 0.7, color: '#c88aff' });
            } else if (e.type === 'throw') {
                // 11 章: ASO が 道具を 投げた
                banner = { text: `ASOが「${e.name}」を 投げた！ ねらって 攻撃！`, color: '#ffd080', until: t + 1.6 };
                sfx('lens');
                const k = battle.enemies.findIndex(x => x.uid === e.actor), pp = k >= 0 ? partPos(k, e.slot) : null;
                if (pp) effects.push({ kind: 'wave', x: pp.x, y: pp.y, start: t, dur: 0.4, color: '#ffd080' });
            } else if (e.type === 'useItem') {
                banner = { text: e.kind === 'weapon' ? `「${e.name}」で こうげき アップ！` : e.kind === 'heal' ? `「${e.name}」で 回復！` : `「${e.name}」が はじけた！`, color: COLORS.accent, until: t + 1.6 };
                sfx(e.kind === 'heal' ? 'heal' : 'big');
            } else if (e.type === 'melt') {
                banner = { text: 'マグマの 波で 道具が とけて しまった……！', color: '#ff8a4a', until: t + 1.8 };
                sfx('cancel');
            } else if (e.type === 'immune') {
                if (t - guardTold > 1.2) {
                    guardTold = t;
                    const p = posOf(e.target);
                    const why = e.barrier ? 'バリアに はじかれた！' : e.eye === 'red' ? '赤い 目: 術は きかない！' : e.eye === 'blue' ? '青い 目: 攻撃は きかない！' : e.chimera ? 'キメラの 体に はじかれた！ 部位を ねらえ！' : 'マグマの 体で きかない！';
                    if (p) pops.push({ x: p.x, y: p.y - 120, text: why, color: e.eye === 'blue' ? '#8ad0ff' : '#ffb080', small: true, until: t + 1.1 });
                }
            } else if (e.type === 'eyes') {
                // 覇理魔様: 目の 色が かわった
                banner = e.eye === 'red' ? { text: '8 つの 目が 赤く 光った！ 攻撃しか きかない！', color: '#ff5a5a', until: t + 2 } : { text: '8 つの 目が 青く 光った！ 術しか きかない！', color: '#6ab8ff', until: t + 2 };
                sfx('lens');
            } else if (e.type === 'handRegrow') {
                banner = { text: `${e.name}が また 生えてきた……！`, color: '#ff8a8a', until: t + 1.6 };
                sfx('cancel');
            } else if (e.type === 'help') {
                // 13 章: ライバル探検隊の 加勢
                const what = { attack: '追加攻撃！', heal: 'サポートアイテム「回復の 実」！', power: 'サポートアイテム「力の 実」！ こうげき アップ', cure: 'サポートアイテム「おはらいの 札」！ とりつきが ぬけた' }[e.kind];
                banner = { text: `${e.team}の ${e.name}: ${what}`, color: '#8affc8', until: t + 1.5 };
                helpFlash[e.actor] = t + 0.5;
                sfx(e.kind === 'attack' ? 'big' : 'heal');
                const p = posOf(e.actor), q = e.target ? posOf(e.target) : null;
                if (p) effects.push({ kind: 'wave', x: p.x, y: p.y - 10, start: t, dur: 0.4, color: '#8affc8' });
                if (q) effects.push({ kind: 'wave', x: q.x, y: q.y - 40, start: t + 0.1, dur: 0.4, color: '#8affc8' });
            } else if (e.type === 'headOut') {
                // 13 章: キメラの 部位を ぜんぶ こわした → 顔が 出る
                banner = { text: `部位を ぜんぶ こわした！ ${Object.values(battle.enemies.find(x => x.uid === e.actor)?.gims || {}).find(p => p.face)?.name || '顔'}が 出た！ ねらえ！`, color: COLORS.accent, until: t + 2 };
                sfx('big');
            } else if (e.type === 'regrow') {
                banner = { text: 'キメラの 体が また ふくれあがった……！', color: '#ff6a6a', until: t + 1.8 };
                sfx('cancel');
            } else if (e.type === 'enrage') {
                banner = { text: '体が 紅く どす黒く そまった！ 攻撃が はげしく なる！', color: '#ff3a4a', until: t + 2.2 };
                sfx('big');
                const p = posOf(e.actor);
                if (p) for (let i = 0; i < 4; i++) effects.push({ kind: 'wave', x: p.x, y: p.y - 60, start: t + i * 0.15, dur: 0.7, color: '#a0001a' });
            } else if (e.type === 'eat') {
                banner = { text: `オオグライノカミツキ！ ${nameOf(e.target)}の「${e.label}」が 喰われた！`, color: '#ff6a6a', until: t + 2.2 };
                sfx('cancel');
                const p = posOf(e.target);
                if (p) pops.push({ x: p.x, y: p.y - 70, text: `${e.label}が 使えない！`, color: '#ff9ad8', until: t + 1.6 });
            } else if (e.type === 'regain') {
                banner = { text: `顔に 当てた！ ${nameOf(e.target)}の「${e.label}」を 取りもどした！`, color: COLORS.accent, until: t + 2 };
                sfx('heal');
            } else if (e.type === 'drain') {
                // 10 章の タシケダ: レベル ドレイン → 紋つきの 味方
                banner = { text: `${nameOf(e.target)}の レベルが 吸われた！ Lv${e.from} → Lv${e.to}`, color: '#ff6a9a', until: t + 2 };
                sfx('cancel');
                const p = posOf(e.target);
                if (p) pops.push({ x: p.x, y: p.y - 70, text: `Lv${e.from}→${e.to}`, color: '#ff9ad8', until: t + 1.4 });
            } else if (e.type === 'restore') {
                const p = posOf(e.target);
                if (p) pops.push({ x: p.x, y: p.y - 70, text: `レベルが もどった！ Lv${e.lv}`, color: '#7aff8a', until: t + 1.6 });
                sfx('heal');
            } else if (e.type === 'regenHeal') {
                banner = { text: `${nameOf(e.actor)}の HP が ぜんぶ もどった……！`, color: '#ff6a6a', until: t + 2 };
                sfx('heal');
            } else if (e.type === 'regenCancel') {
                banner = { text: '角を こわした！ 全回復を 止めた！', color: COLORS.accent, until: t + 2 };
                warn = null;
                sfx('big');
            } else if (e.type === 'burstBreak') {
                // 8 章の おにおに: ためている あいだに 攻撃を うけきって 紋が 暴発
                banner = { text: `紋が 暴発した！「${e.name}」！ ${nameOf(e.actor)}が 目を まわした！`, color: '#ffb84a', until: t + 2 };
                warn = null;
                sfx('big');
                const p = posOf(e.actor);
                if (p) for (let i = 0; i < 3; i++) effects.push({ kind: 'wave', x: p.x, y: p.y - 40, start: t + i * 0.12, dur: 0.6, color: '#ff6a3a' });
            } else if (e.type === 'clones') {
                // 6 章: ズミタニの 影分身
                banner = { text: 'かげぶんしん！ 本物を ロックオンして こうげき！', color: '#c8f08a', until: t + 1.8 };
                sfx('lens');
            } else if (e.type === 'teleport') {
                battle.enemies.forEach((x, i) => { if (x.clone || x.uid === e.actor) { const q = enemyPos(i); effects.push({ kind: 'wave', x: q.x, y: q.y - 20, start: t, dur: 0.35, color: '#c8f08a' }); } });
                sfx('cursor');
            } else if (e.type === 'clonesEnd') {
                if (e.why === 'found') { banner = { text: '本物を 見やぶった！ ダメージ アップ！', color: COLORS.accent, until: t + 1.6 }; sfx('big'); }
                else if (e.why === 'time') banner = { text: '分身が 消えた', color: '#c0c8e0', until: t + 1.2 };
            } else if (e.type === 'cloneFail') {
                banner = { text: 'それは 分身！ しかえしが くる！', color: '#ff6a6a', until: t + 1.6 };
                sfx('cancel');
            } else if (e.type === 'armGrow' || e.type === 'armShrink') {
                // 6 章: トモオカの 右腕・7 章: ルナヤの 月
                const k = battle.enemies.findIndex(x => x.uid === e.target), ex = battle.enemies[k];
                const key = ex && ex.gims ? Object.keys(ex.gims).find(g2 => ex.gims[g2].arm) : null, pp = key ? partPos(k, key) : null, nm = key ? ex.gims[key].name : '';
                if (pp) pops.push({ x: pp.x, y: pp.y - 30, text: e.type === 'armGrow' ? `${nm} ↑ ${e.lv}` : `${nm} ↓ ${e.lv}`, color: e.type === 'armGrow' ? '#ff8a6a' : '#9ae08a', small: true, until: t + 0.8 });
            } else if (e.type === 'repeat') {
                // 7 章: ルナヤの もの忘れ (同じ わざを もう いちど)
                const p = posOf(e.actor);
                if (p) pops.push({ x: p.x, y: p.y - 120, text: 'あら、これ もう 言ったかしら？', color: '#e0d0ff', small: true, until: t + 1.4 });
            } else if (e.type === 'smoke') {
                // 4 章: 玉手箱が こわれて けむり
                banner = { text: 'けむりが もくもく……！ 攻撃が 当たりにくい！', color: '#d0d0d8', until: t + 1.8 };
                sfx('cancel');
            } else if (e.type === 'smokeEnd') {
                banner = { text: 'けむりが 晴れた！', color: COLORS.accent, until: t + 1.2 };
            } else if (e.type === 'miss') {
                const p = posOf(e.target);
                if (p) pops.push({ x: p.x + (Math.random() - 0.5) * 40, y: p.y - 70, text: e.clone ? 'どれが 本物？' : e.blind ? 'めくらまし で ミス' : 'ミス', color: '#c0c8e0', small: true, until: t + 0.8 });
            } else if (e.type === 'shell') {
                const sig = battle.enemies.find(x => x.uid === e.actor)?.gims?.signal;
                banner = sig ? { text: '赤信号！ 体が かたい！ 信号機を ねらえ！', color: '#ff6a6a', until: t + 1.8 } : { text: 'こうらに こもった！ 頭を ねらえ！', color: '#9ae08a', until: t + 1.8 };
                sfx('cancel');
            } else if (e.type === 'shellEnd') {
                const p = posOf(e.actor);
                if (p) pops.push({ x: p.x, y: p.y - 112, text: 'こうらから 出てきた', color: '#9ae08a', small: true, until: t + 1 });
            } else if (e.type === 'phase') {
                // 5 章: 鬼の顔
                banner = { text: `${nameOf(e.actor)}が ${e.name}に なった！ 顔の 鬼の面を ねらえ！`, color: '#ff6a6a', until: t + 2 };
                sfx('big');
            } else if (e.type === 'phaseEnd') {
                banner = { text: '鬼の面を こわした！ 仏の顔に もどった！', color: COLORS.accent, until: t + 2 };
            } else if (e.type === 'bell') {
                banner = { text: 'ゴーーン！ 鐘が 鳴った！ ダイシが おどろいた！', color: '#ffe85a', until: t + 2 };
                sfx('big');
                const k = battle.enemies.findIndex(x => x.uid === e.target), pp = k >= 0 ? partPos(k, 'bell') : null;
                if (pp) for (let i = 0; i < 3; i++) effects.push({ kind: 'wave', x: pp.x, y: pp.y + 10, start: t + i * 0.15, dur: 0.6, color: '#ffe85a' });
            } else if (e.type === 'stunned') {
                const p = posOf(e.actor);
                if (p) pops.push({ x: p.x, y: p.y - 112, text: 'うごけない！', color: '#ffe85a', until: t + 1 });
            } else if (e.type === 'chanceEnd') {
                const magma = battle.enemies.find(x => x.uid === e.target)?.magma;
                banner = { text: magma ? 'マグマの 体に もどった！' : 'こわした ところが もとに もどった！', color: '#ff6a6a', until: t + 1.8 };
                sfx('cancel');
            } else if (e.type === 'partGuard') {
                // 両手を こわすまで 頭は こわせない (知らせるのは ときどき)
                if (t - guardTold > 1.5) {
                    guardTold = t;
                    const p = posOf(e.target);
                    if (p) pops.push({ x: p.x, y: p.y - 120, text: '手で ガード！ 先に 両手を こわそう', color: '#c0c8e0', small: true, until: t + 1.2 });
                }
            } else if (e.type === 'possessed') {
                // とりつき: なまける / 味方を 攻める
                const p = posOf(e.actor);
                if (p) pops.push({ x: p.x, y: p.y - 62, text: e.mode === 'lazy' ? 'いたずらの とりつき: なまけている…' : 'いたずらの とりつき: 味方を こうげき！', color: '#c88aff', small: true, until: t + 1.2 });
            } else if (e.type === 'rescue') {
                banner = { text: e.great ? `おたすけ 大成功！ とりつきが ぬけて HP も 回復！` : e.ok ? `おたすけ せいこう！ ${nameOf(e.target)}の とりつきが ぬけた！` : 'おたすけ しっぱい… もう いちど！', color: e.ok ? '#7aff8a' : '#c88aff', until: t + 1.6 };
                sfx(e.ok ? 'heal' : 'cancel');
            } else if (e.type === 'telegraph') {
                warn = { name: e.name, until: t + e.warn, idols: Boolean(e.idols), chant: Boolean(e.chant), arm: Boolean(e.arm), burst: Boolean(e.burst), regen: Boolean(e.regen), hack: Boolean(e.hack), barrier: Boolean(e.barrier) };
                sfx('cancel');
            } else if (e.type === 'summon') {
                // 氷の 偶像が できた (3 章の ダムの主)
                banner = { text: `${nameOf(e.target)}が あらわれた！`, color: '#bfeaff', until: t + 1.4 };
                sfx('lens');
                const p = posOf(e.target);
                if (p) effects.push({ kind: 'wave', x: p.x, y: p.y, start: t, dur: 0.5, color: '#bfeaff' });
            } else if (e.type === 'bigCancel') {
                warn = null;
                const armName = e.arm ? Object.values(battle.enemies.find(x => x.uid === e.actor)?.gims || {}).find(g2 => g2.arm)?.name : null;
                if (e.hack) banner = { text: 'となりの 紋つきを たおした！ ハッキングを 止めた！', color: COLORS.accent, until: t + 2 };
                else banner = { text: e.arm ? (armName === '月' ? `月が 欠けた！「${e.name}」を 止めた！` : `右腕が しぼんだ！「${e.name}」を 止めた！`) : `偶像を こわした！「${e.name}」を 止めた！`, color: COLORS.accent, until: t + 2 };
                sfx('big');
            } else if (e.type === 'food') {
                // 「○○が あらわれた！」の あとに 反応を 出す (2026-11-02 ユーザー指定: はじまりに 投げると 反応が 見えなかった)
                const name = nameOf(e.target), food = ITEMS[e.itemId].name;
                const react = e.favorite ? `${name}は ${food}を 食べた！ とても よろこんでいる！` : `${name}は ${food}を 食べた。まんざらでも なさそうだ。`;
                if (battle.waiting) foodShow = { text: react, favorite: e.favorite, until: t + 2.2 };
                else banner = { text: react, color: '#ff9ad8', until: t + 1.8 };
                const p = posOf(e.target);
                if (p) {
                    pops.push({ x: p.x, y: p.y - 60, text: e.favorite ? '♥ ♥ ♥' : '♪', color: '#ff9ad8', big: e.favorite, until: t + 2 });
                    effects.push({ kind: 'heal', x: p.x, y: p.y - 40, start: t, dur: 0.9 });
                }
                sfx(e.favorite ? 'friend' : 'ok');
            } else if (e.type === 'item') {
                banner = { text: `${ITEMS[e.itemId].name}を 使った！`, color: '#7aff8a', until: t + 1.2 };
                sfx('heal');
            } else if (e.type === 'revive') {
                const p = posOf(e.target);
                if (p) pops.push({ x: p.x, y: p.y - 70, text: '復活！', color: '#ffe85a', until: t + 1.2 });
            } else if (e.type === 'buff') {
                const p = posOf(e.target);
                if (p && BUFF_NAMES[e.stat]) pops.push({ x: p.x, y: p.y - 70, text: BUFF_NAMES[e.stat], color: '#ffb84a', small: true, until: t + 1.2 });
            }
            else if (e.type === 'rotate') sfx('rotate');
            else if (e.type === 'win') sfx('win');
            else if (e.type === 'lose') sfx('lose');
        });
    }

    // わざ・術を 使った: わざごとの 動きと 絵 (2026-10-28 ユーザー指定。コオリソードは 剣で 切りつける など)
    function startSkill(e, targets) {
        const u = unitOf(e.actor);
        if (!u) return;
        const move = u[e.cmd] || { name: e.name };
        const m = skillMotion(move, e.cmd);
        // 近づく わざは 前に いる 相手へ (回復は 自分の まわり)
        const foe = targets.map(unitOf).find(x => x && x.side !== u.side);
        startMotion(e.actor, 'skill', foe ? foe.uid : null, m);
        const p = posOf(e.actor);
        const scale = u.side === 'ally' ? ALLY_SCALE : (p && p.scale) || 3;
        const spec = SKILL_KIND[m.kind];
        const color = tone(e.actor, ELEMENT_COLORS[(move.effects || []).find(f => f.element)?.element || u.element] || '#ffffff');
        effects.push({ kind: 'skill', skill: m.kind, start: t, dur: spec.dur, fx: {
            kind: m.kind, weapon: m.weapon || null, color, start: t, dur: spec.dur, hit: spec.hit, s: scale / 1.8, seed: Math.random() * 6,
            from: () => actorPoint(e.actor),
            to: targets.map(centerOf).filter(Boolean)
        } });
    }

    // ----- 必殺技 -----
    // 流れ: cmd (キャラごとの コマンド) → result (大成功など) → cutin (カットイン) → act (キャラごとの 動き。当たる ときに 効果) → おわり
    const PHASE_TIME = { result: 0.7, cutin: 0.75 };
    function trySpecial(pos) {
        if (!canSpecial(battle, pos)) { sfx('cancel'); return; }
        const unit = startSpecial(battle, pos);
        const sp = specialOf(unit.special.fx || unit.id);   // こおりくんの 進化した 必殺技は べつの 動き
        const command = app.rng.pick(COMMANDS);   // コマンドは 毎回 ランダム
        mg = { unit, pos, sp, command, phase: 'cmd', t: 0, cmd: createCommand(command, app.rng), mult: 1, resolved: false };
        sfx('ok');
    }
    // ロックオン: 生きている 敵 (部位の ある ボスは こわれていない 部位) + 「ねらわない」を 順に
    let guardTold = -9;
    function cycleLock(dir) {
        const list = [null, ...battle.enemiesAlive().flatMap(e => (e.parts
            ? PART_ORDER.filter(k => !e.parts[k].broken).map(part => ({ uid: e.uid, part }))
            : e.gims ? [{ uid: e.uid, part: null }, ...openGims(battle, e).map(part => ({ uid: e.uid, part }))]
            : [{ uid: e.uid, part: null }]))];
        const i = list.findIndex(x => (x ? x.uid === battle.lock && x.part === battle.lockPart : !battle.lock));
        const next = list[(i + dir + list.length) % list.length];
        if (next) lockOn(battle, next.uid, next.part);
        else if (battle.lock) lockOn(battle, battle.lock, battle.lockPart);
        sfx('cursor');
    }
    // 部位の 場所 (上画面)。右手は 見ている 人の 左
    //   rect の ある 部位 (2026-10-30 ユーザー指定): ボスの ドット絵の その 部分 (ピクセルの 範囲) の まんなか
    function partPos(k, key) {
        const p = enemyPos(k), e = battle.enemies[k], art = ART[e.art];
        const fk = p.scale * artFit(art), h = art.h * fk, side = art.w * fk / 2 + 26;
        const pt = (e.gims && e.gims[key]) || (e.parts && e.parts[key]);
        if (pt && pt.rect) {
            const [x0, y0, x1, y1] = pt.rect, left = p.x - art.w * fk / 2, top = p.y - h;
            let cx = left + (x0 + x1 + 1) / 2 * fk, cy = top + (y0 + y1 + 1) / 2 * fk;
            if (pt.arm && pt.anchor) {
                const ax = left + pt.anchor[0] * fk, ay = top + pt.anchor[1] * fk, g2 = armScale(e);
                cx = ax + (cx - ax) * g2; cy = ay + (cy - ay) * g2;
            }
            return { x: cx, y: cy };
        }
        // しかけの 部位 (4 章・5 章): pos = [横 (絵の 半分の はばで), たて (絵の 高さで)]
        if (e.gims && e.gims[key]) {
            const [fx, fy] = e.gims[key].pos;
            return { x: p.x + fx * art.w * fk / 2, y: p.y + fy * h };
        }
        const bob = Math.sin(t * 3 + (key === 'lhand' ? 1.5 : 0)) * 3;
        if (key === 'rhand') return { x: p.x - side, y: p.y - h * 0.42 + bob };
        if (key === 'lhand') return { x: p.x + side, y: p.y - h * 0.42 + bob };
        return { x: p.x, y: p.y - h * 0.72 };
    }
    function hitPartAt(k, x, y) {
        const e = battle.enemies[k];
        if (e.gims) return openGims(battle, e).find(key => Math.hypot(partPos(k, key).x - x, partPos(k, key).y - y) < 26) || null;
        if (!e.parts) return null;
        return PART_ORDER.find(key => !e.parts[key].broken && Math.hypot(partPos(k, key).x - x, partPos(k, key).y - y) < 24) || null;
    }
    function hitEnemy(k, x, y) {
        const p = enemyPos(k), e = battle.enemies[k], art = ART[e.art];
        const fk = p.scale * artFit(art), w = art.w * fk / 2 + 8, h = art.h * fk;
        return x >= p.x - w && x <= p.x + w && y >= p.y - h - 10 && y <= p.y + 6;
    }
    // ねらいの 印 (回る 四すみ)。弱点の 光が 出ている ときは 黄色く 光る
    function drawLock(ctx) {
        const k = battle.enemies.findIndex(e => e.uid === battle.lock);
        if (k < 0) return;
        let p = enemyPos(k), e = battle.enemies[k], art = ART[e.art];
        const fk = p.scale * artFit(art);
        let cy = p.y - art.h * fk / 2, r = Math.max(art.w, art.h) * fk / 2 + 6;
        // 部位を ねらっている ときは その 部位に 小さな 印
        if (battle.lockPart) { const pp = partPos(k, battle.lockPart); p = { ...p, x: pp.x }; cy = pp.y; r = 24; }
        const weak = weakActive(battle);
        if (weak) {
            ctx.fillStyle = `rgba(255, 232, 90, ${0.25 + 0.2 * Math.sin(t * 14)})`;
            ctx.beginPath();
            ctx.arc(p.x, cy, r * 0.55, 0, Math.PI * 2);
            ctx.fill();
            text(ctx, '弱点！', p.x + r + 3, cy + 4, { size: 11, bold: true, color: '#ffe85a' });
        }
        ctx.strokeStyle = weak ? '#ffe85a' : '#ff5a5a';
        ctx.lineWidth = 2;
        const a0 = t * 1.5;
        for (let i = 0; i < 4; i++) {
            const a = a0 + i * Math.PI / 2;
            ctx.beginPath();
            ctx.arc(p.x, cy, r, a, a + 0.6);
            ctx.stroke();
        }
    }

    // おたすけ (2 章。2026-10-30 に いったん「おはらい」に したが、ユーザー指定で おたすけに もどした): 後ろの とりつかれた なかまを コマンドで 治す。成功 (大成功を ふくむ) で とりつきが ぜんぶ ぬける
    // とりつかれた なかまが 2 体 いじょう 後ろに いるときは、だれを おたすけ するか えらぶ (2026-11-02 ユーザー指定)
    function tryRescue() {
        const list = rescueTargets(battle);
        if (!list.length) { sfx('cancel'); return; }
        if (list.length === 1) { rescueOn(list[0].uid); return; }
        menu = { kind: 'rescue', index: 0, top: 0, pick: { id: null, index: 0 } };
        sfx('ok');
    }
    function rescueOn(uid) {
        const unit = startRescue(battle, uid);
        if (!unit) { sfx('cancel'); return; }
        const command = app.rng.pick(COMMANDS);
        mg = { rescue: true, unit, command, phase: 'cmd', t: 0, cmd: createCommand(command, app.rng), mult: 1 };
        sfx('ok');
    }
    function updateMinigame(dt, input) {
        mg.t += dt;
        if (mg.rescue) {
            if (mg.phase === 'cmd') {
                mg.cmd.update(dt, input);
                if (mg.cmd.done) { mg.mult = mg.cmd.done.mult; mg.phase = 'result'; mg.t = 0; sfx(mg.mult >= 1 ? 'special' : 'cancel'); }
            } else if (mg.t > PHASE_TIME.result) {
                resolveRescue(battle, mg.unit, mg.mult >= 1, mg.mult > 1);
                mg = null;
            }
            return;
        }
        if (mg.phase === 'cmd') {
            mg.cmd.update(dt, input);
            if (mg.cmd.done) { mg.mult = mg.cmd.done.mult; mg.phase = 'result'; mg.t = 0; sfx(mg.mult > 1 ? 'special' : 'ok'); }
        } else if (mg.phase === 'result' && mg.t > PHASE_TIME.result) {
            mg.phase = 'cutin';
            mg.t = 0;
            sfx('special');
        } else if (mg.phase === 'cutin' && mg.t > PHASE_TIME.cutin) {
            mg.phase = 'act';
            mg.t = 0;
        } else if (mg.phase === 'act') {
            const [dur, hit] = MOTION_TIME[mg.sp.motion];
            if (!mg.resolved && mg.t >= hit) {
                mg.resolved = true;
                resolveSpecial(battle, mg.unit, mg.mult);
                battle.paused = !battle.outcome;   // 動きが 終わるまで バトルは 止めておく
                readEvents();
            }
            if (mg.t >= dur) {
                battle.paused = false;
                mg = null;
            }
        }
    }

    function toggleFast() {
        g.fastBattle = !g.fastBattle;
        banner = { text: g.fastBattle ? '倍速: オン' : '倍速: オフ', color: COLORS.accent, until: t + 0.8 };
        sfx('cursor');
    }

    // ----- どうぐ・おやつ -----
    // 品物を えらんで から、使う 相手を えらぶ (2026-10-28 ユーザー指定)。どうぐは 輪の なかま (前 → 後ろ)、おやつは 敵
    const owned = () => Object.keys(ITEMS).filter(id => (g.items[id] || 0) > 0 && (menu.kind === 'food' ? isFood(ITEMS[id]) : !ITEMS[id].material && !ITEMS[id].book));   // 合成アイテムは バトルで 使えない・お面などは 投げられない
    const menuTargets = () => {
        if (menu.kind === 'rescue') return rescueTargets(battle);
        if (menu.kind === 'food') return battle.enemiesAlive();
        const ok = itemTargets(battle, menu.pick.id);
        return [0, 1, 2, 3, 4, 5].map(i => battle.wheel[(battle.rot + i) % 6]).filter(u => ok.includes(u));
    };
    // どうぐ・おやつを 開く。どうぐは 次に 使える ように なるまで、おやつは 1 回 投げたら 開かない (2026-11-02 ユーザー指定)
    function openMenu(kind) {
        if (kind === 'item' && battle.itemCooldown > 0) {
            banner = { text: `どうぐは あと ${battle.itemCooldown.toFixed(1)} 秒 まってね`, color: '#ff9a9a', until: t + 1.2 };
            sfx('cancel');
            return;
        }
        if (kind === 'food' && battle.kind !== 'wild') { banner = { text: 'この あいてには おやつを 投げられない', color: '#ff6a6a', until: t + 1.2 }; sfx('cancel'); return; }
        if (kind === 'food' && battle.food) { banner = { text: 'おやつは 1 回の バトルで 1 回だけ', color: '#ff9a9a', until: t + 1.2 }; sfx('cancel'); return; }
        menu = { kind, index: 0, top: 0 };
        sfx('ok');
    }
    function useMenu(id, uid) {
        if (menu.kind === 'rescue') { menu = null; rescueOn(uid); return; }
        const ok = menu.kind === 'item' ? useItem(battle, id, uid) : throwFood(battle, id, uid, { start: !battle.waiting });
        if (ok) { g.items[id]--; menu = null; sfx('ok'); } else sfx('cancel');
    }
    function pickItem(id) {
        const it = ITEMS[id];
        if (menu.kind === 'item' && it.all) { useMenu(id, null); return; }   // 前の なかま ぜんぶに きく
        menu.pick = { id, index: 0 };
        const list = menuTargets();
        if (!list.length) {
            menu.pick = null;
            banner = { text: it.revive ? 'たおれている なかまが いない' : '使える なかまが いない', color: '#ff9a9a', until: t + 1.2 };
            sfx('cancel');
            return;
        }
        if (list.length === 1) { useMenu(id, list[0].uid); return; }
        // どうぐは HP の 少ない なかまに カーソルを 合わせて おく
        menu.pick.index = menu.kind === 'item' && !it.revive ? list.reduce((a, u, i) => (u.hp / u.max < list[a].hp / list[a].max ? i : a), 0) : 0;
        sfx('ok');
    }
    function closePick() {
        menu.pick = null;
        if (menu.kind === 'rescue') menu = null;
        sfx('cancel');
    }
    function updatePick(input) {
        const list = menuTargets();
        if (input.pressed.b) { closePick(); return; }
        if (!list.length) { menu = null; return; }
        const p = menu.pick;
        p.index = Math.min(p.index, list.length - 1);
        if (input.pressed.up || input.pressed.left) { p.index = (p.index + list.length - 1) % list.length; sfx('cursor'); }
        if (input.pressed.down || input.pressed.right) { p.index = (p.index + 1) % list.length; sfx('cursor'); }
        if (input.pressed.a || (menu.kind === 'rescue' && input.pressed.help)) { useMenu(p.id, list[p.index].uid); return; }
        if (input.touch.justDown) {
            const i = list.findIndex((_, k) => hit(menuRow(k), input.touch.x, input.touch.y));
            if (i >= 0) useMenu(p.id, list[i].uid);
            else if (!hit({ x: 20, y: 14, w: 280, h: 212 }, input.touch.x, input.touch.y)) closePick();
        }
    }
    // 品物が 多いときは 5 つずつ 見せて、カーソルに 合わせて ずらす
    const MENU_ROWS = 5;
    const SCROLL_UP = { x: 250, y: 22, w: 46, h: 22 }, SCROLL_DOWN = { x: 250, y: 184, w: 46, h: 22 };
    function updateMenu(input) {
        if (menu.pick) { updatePick(input); return; }
        const list = owned();
        if (input.pressed.b || (menu.kind === 'item' && input.pressed.y) || (menu.kind === 'food' && input.pressed.x)) { menu = null; sfx('cancel'); return; }
        if (!list.length) { if (input.touch.justDown) menu = null; return; }
        if (input.pressed.up) { menu.index = (menu.index + list.length - 1) % list.length; sfx('cursor'); }
        if (input.pressed.down) { menu.index = (menu.index + 1) % list.length; sfx('cursor'); }
        menu.index = Math.min(menu.index, list.length - 1);
        menu.top = Math.max(0, Math.min(menu.top || 0, list.length - MENU_ROWS));
        if (menu.index < menu.top) menu.top = menu.index;
        if (menu.index >= menu.top + MENU_ROWS) menu.top = menu.index - MENU_ROWS + 1;
        if (input.pressed.a) { pickItem(list[menu.index]); return; }
        if (input.touch.justDown) {
            const { x, y } = input.touch;
            if (list.length > MENU_ROWS && hit(SCROLL_UP, x, y)) { menu.top = Math.max(0, menu.top - 1); menu.index = Math.min(menu.index, menu.top + MENU_ROWS - 1); sfx('cursor'); return; }
            if (list.length > MENU_ROWS && hit(SCROLL_DOWN, x, y)) { menu.top = Math.min(list.length - MENU_ROWS, menu.top + 1); menu.index = Math.max(menu.index, menu.top); sfx('cursor'); return; }
            const k = [0, 1, 2, 3, 4].findIndex(r => hit(menuRow(r), x, y));
            if (k >= 0 && list[menu.top + k]) { menu.index = menu.top + k; pickItem(list[menu.index]); }
            else if (!hit({ x: 20, y: 20, w: 280, h: 200 }, x, y)) menu = null;
        }
    }
    const menuRow = k => ({ x: 30, y: 46 + k * 28, w: 260, h: 24 });

    // 当たる 時間に なった ことを する (ダメージの 数字・ゆれ・火花)
    function runLater() {
        for (let i = later.length - 1; i >= 0; i--) {
            if (later[i].at <= t) { const f = later[i].fn; later.splice(i, 1); f(); }
        }
    }

    function drawEffects(ctx) {
        for (let i = effects.length - 1; i >= 0; i--) {
            const fx = effects[i];
            const k = (t - fx.start) / fx.dur;
            if (k >= 1) { effects.splice(i, 1); continue; }
            if (k < 0) continue;
            if (fx.kind === 'orb') {
                // 玉: 少し 山なりに 飛ぶ
                const x = fx.from.x + (fx.to.x - fx.from.x) * k, y = fx.from.y + (fx.to.y - fx.from.y) * k - Math.sin(Math.PI * k) * 18;
                ctx.fillStyle = fx.color;
                ctx.globalAlpha = 0.35;
                ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(x - 1, y - 1, 1.5, 0, Math.PI * 2); ctx.fill();
            } else if (fx.kind === 'impact') {
                // 大きい やられの 衝撃: ギザギザの 星形が ひろがって 消える
                ctx.globalAlpha = 1 - k;
                ctx.fillStyle = fx.color;
                ctx.beginPath();
                for (let a = 0; a < 16; a++) {
                    const r = (a % 2 ? 7 : 18) * (0.6 + k * 0.8), ang = a * Math.PI / 8;
                    const x = fx.x + Math.cos(ang) * r, y = fx.y + Math.sin(ang) * r;
                    if (a) ctx.lineTo(x, y); else ctx.moveTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1;
            } else if (fx.kind === 'spark') {
                // 火花: 8 方向に 線が 飛び出す
                ctx.strokeStyle = fx.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 1 - k;
                ctx.beginPath();
                for (let a = 0; a < 8; a++) {
                    const ang = a * Math.PI / 4 + 0.3, r0 = 4 + k * 8, r1 = 10 + k * 16;
                    ctx.moveTo(fx.x + Math.cos(ang) * r0, fx.y + Math.sin(ang) * r0);
                    ctx.lineTo(fx.x + Math.cos(ang) * r1, fx.y + Math.sin(ang) * r1);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            } else if (fx.kind === 'wave') {
                // 着地の 衝撃波: 地面に 広がる 輪
                ctx.strokeStyle = fx.color;
                ctx.lineWidth = 3 * (1 - k) + 1;
                ctx.globalAlpha = 1 - k;
                ctx.beginPath();
                ctx.ellipse(fx.x, fx.y, 14 + k * 70, 4 + k * 18, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            } else if (fx.kind === 'skill') {
                drawSkillFx(ctx, fx.fx, t);
            } else if (fx.kind === 'shield') {
                // まもり: 青い 盾が 前に 出る
                ctx.globalAlpha = 1 - k;
                drawShield(ctx, fx.x, fx.y, 1 + k * 0.6);
                ctx.globalAlpha = 1;
            } else if (fx.kind === 'heal') {
                // 回復: みどりの きらきらが のぼる
                ctx.fillStyle = '#7aff8a';
                ctx.globalAlpha = 1 - k;
                for (let n = 0; n < 6; n++) {
                    const sx = fx.x + Math.sin(n * 2.1) * 16, sy = fx.y + 16 - k * 34 - (n % 3) * 6;
                    ctx.fillRect(sx - 1, sy - 3, 2, 6);
                    ctx.fillRect(sx - 3, sy - 1, 6, 2);
                }
                ctx.globalAlpha = 1;
            }
        }
    }

    function chooseIntro(key) {
        if (key === 'fight') begin(battle);
        else if (key === 'item') openMenu('item');
        else if (key === 'food') openMenu('food');
        else if (key === 'run') {
            if (flee(battle)) { banner = { text: 'うまく にげきれた！', color: '#8ad0ff', until: t + 1.6 }; sfx('ok'); } else sfx('cancel');
        }
    }
    function updateIntro(input) {
        const i = introIndex;
        if (input.pressed.left || input.pressed.right) { introIndex = i ^ 1; sfx('cursor'); }
        if (input.pressed.up || input.pressed.down) { introIndex = i ^ 2; sfx('cursor'); }
        if (input.pressed.a) chooseIntro(INTRO_BTN[introIndex].key);
        else if (input.pressed.y) chooseIntro('item');
        else if (input.pressed.x) chooseIntro('food');
        const tc = input.touch;
        if (tc.justDown) {
            const k = INTRO_BTN.findIndex(bn => hit(bn, tc.x, tc.y));
            if (k >= 0) { introIndex = k; chooseIntro(INTRO_BTN[k].key); }
        }
    }

    function update(dt, input) {
        // はじまりの 煙: 画面が おおわれて いる あいだは 止まる
        if (swirlT !== null) {
            swirlT += dt;
            if (swirlT >= SWIRL_IN + SWIRL_OUT) swirlT = null;
            else if (swirlT < SWIRL_IN + 0.2) return;
        }
        t += dt;
        g.playTime += dt;
        runLater();
        // 敵の 必殺技の カットイン: おわったら 待たせた できごとを 流す
        if (ecut) {
            if (t - ecut.start < ecut.dur) return;
            const held = ecut.held;
            battle.paused = ecut.wasPaused;
            ecut = null;
            battle.events.unshift(...held);
            readEvents();
        }
        if (mg) { updateMinigame(dt, input); readEvents(); return; }
        // はじまり: たたかう・どうぐ・おやつ・にげる を えらぶ あいだは バトルは 止まっている
        if (battle.waiting && !battle.outcome) {
            if (foodShow) {
                // おやつの 反応を 見せてから バトル開始 (A・タッチで とばせる)
                if (t >= foodShow.until || input.pressed.a || input.touch.justDown) { foodShow = null; begin(battle); }
            } else if (menu) updateMenu(input);
            else updateIntro(input);
            readEvents();
            return;
        }
        if (input.pressed.fast || input.pressed.start || (input.touch.justDown && hit(FAST_BTN, input.touch.x, input.touch.y) && !menu)) toggleFast();
        // どうぐ・おやつを えらんでいる あいだは バトルを 止める
        if (menu) { updateMenu(input); return; }
        step(battle, dt * (g.fastBattle ? BATTLE_SPEED.fast : BATTLE_SPEED.normal));
        readEvents();
        // 輪の アニメーション (近い ほうへ 回る)
        let diff = battle.rot - shownRot;
        if (diff > 3) diff -= 6;
        if (diff < -3) diff += 6;
        shownRot += diff * Math.min(1, dt * 14);
        if (Math.abs(diff) < 0.01) shownRot = battle.rot;

        if (battle.outcome) {
            endT += dt;
            if (endT > 1.6) app.endBattle(battle);
            return;
        }
        if (input.pressed.l) rotate(battle, -1);
        if (input.pressed.r) rotate(battle, 1);
        if (input.pressed.left) { cursor = (cursor + 2) % 3; sfx('cursor'); }
        if (input.pressed.right) { cursor = (cursor + 1) % 3; sfx('cursor'); }
        if (input.pressed.a) trySpecial(cursor);
        if (input.pressed.sp1) trySpecial(0);
        if (input.pressed.sp2) trySpecial(1);
        if (input.pressed.sp3) trySpecial(2);
        if (input.pressed.y) openMenu('item');
        if (input.pressed.x && battle.kind === 'wild') openMenu('food');
        if (input.pressed.help) tryRescue();
        // ロックオン: 上下で ねらう 敵を かえる (はしまで 行くと はずす)・上画面の 敵を タップ
        if (input.pressed.up || input.pressed.down) cycleLock(input.pressed.down ? 1 : -1);
        if (input.topTap) {
            const { x, y } = input.topTap;
            const pk = battle.enemies.findIndex((e, k) => !e.ko && hitPartAt(k, x, y));
            const i = battle.enemies.findIndex((e, k) => !e.ko && hitEnemy(k, x, y));
            if (pk >= 0) { if (lockOn(battle, battle.enemies[pk].uid, hitPartAt(pk, x, y))) sfx('cursor'); }
            else if (i >= 0 && lockOn(battle, battle.enemies[i].uid)) sfx('cursor');
        }

        // タッチ: 輪を なぞる・必殺技・どうぐ
        const tc = input.touch;
        if (tc.justDown) {
            const sp = SP_BTN.findIndex(bn => hit(bn, tc.x, tc.y));
            if (rescueTargets(battle).length && hit(RESCUE_BTN, tc.x, tc.y)) tryRescue();
            else if (sp >= 0) { cursor = sp; trySpecial(sp); } else if (hit(ITEM_BTN, tc.x, tc.y)) openMenu('item'); else if (hit(FOOD_BTN, tc.x, tc.y) && battle.kind === 'wild') openMenu('food'); else if (Math.hypot(tc.x - WHEEL.x, tc.y - WHEEL.y) < WHEEL.r + 30) {
                drag = { a: Math.atan2(tc.y - WHEEL.y, tc.x - WHEEL.x), acc: 0 };
            }
        }
        if (drag && tc.down) {
            const a = Math.atan2(tc.y - WHEEL.y, tc.x - WHEEL.x);
            let d = a - drag.a;
            if (d > Math.PI) d -= Math.PI * 2;
            if (d < -Math.PI) d += Math.PI * 2;
            drag.acc += d;
            drag.a = a;
            // 時計回りに なぞると R (前の なかまが 右へ 流れる)
            if (drag.acc > 0.6) { if (rotate(battle, -1)) drag.acc = 0; }
            if (drag.acc < -0.6) { if (rotate(battle, 1)) drag.acc = 0; }
        }
        if (!tc.down) drag = null;
    }

    // ----- 描く: 上画面 -----
    // back: うしろ姿 (味方)
    function drawUnit(ctx, u, p, { scale = 3, flip = false, back = false } = {}) {
        if (!u || (u.idol && u.ko)) return;   // こわれた 偶像は きえる
        const lit = (flash[u.uid] || 0) > t;
        const sleeping = u.status.sleep > 0;
        const bobY = u.ko ? 0 : Math.sin(t * 3 + p.x) * 1.5;
        // 動き (飛びこむ・はねる) の ぶん ずらす。影は 地面に 残す (ジャンプが 分かるように)
        const { ox, oy, sx, sy, rot } = offsetOf(u);
        const ground = { x: p.x + ox, y: Math.max(p.y, p.y + oy) };
        p = { ...p, x: p.x + ox, y: p.y + oy };
        const lift = Math.max(0, ground.y - p.y);
        ctx.fillStyle = `rgba(0,0,0,${0.25 * Math.max(0.4, 1 - lift / 40)})`;
        ctx.beginPath();
        ctx.ellipse(ground.x, ground.y + 2, 8 * scale / 3 * 2, 3 * scale / 3 * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // うしろ姿: 描いた 絵 (back-art.js) が なければ 顔を 消して 作る (back.js)
        const art = back ? BACK_ART[u.art] || backArt(ART[u.art]) : ART[u.art];
        // 紋つき (「・闇」): 黒い もや (とりつきの むらさきと 見分けられるように 黒っぽく)
        if (u.dark && !u.ko) {
            const fk = scale * artFit(art);
            ctx.fillStyle = `rgba(30, 6, 40, ${0.4 + 0.12 * Math.sin(t * 4 + p.x)})`;
            ctx.beginPath(); ctx.ellipse(p.x, p.y - art.h * fk / 2, art.w * fk / 2 + 8, art.h * fk / 2 + 8, 0, 0, Math.PI * 2); ctx.fill();
        }
        if (rot) { ctx.save(); ctx.translate(p.x, p.y + bobY); ctx.rotate(rot); ctx.translate(-p.x, -(p.y + bobY)); }
        drawArt(ctx, art, sleeping || u.ko ? 0 : Math.floor(t * 2), p.x, p.y + bobY, { scale, flip, alpha: u.ko ? 0.35 : u.idol ? 0.75 : 1, tint: lit ? '#ffffff' : null, sx, sy });
        if (rot) ctx.restore();
        // 大きく やられた: 頭の まわりを 星が まわる (ピヨピヨ)
        const hm = motions[u.uid];
        if (hm && hm.kind === 'hurt' && hm.big && !u.ko) {
            const hk = (t - hm.start) / hm.dur, top = p.y - art.h * scale * artFit(art) - 4;
            ctx.globalAlpha = Math.max(0, 1 - hk);
            for (let i = 0; i < 3; i++) {
                const a = t * 9 + i * Math.PI * 2 / 3;
                text(ctx, '★', p.x + Math.cos(a) * 12, top + Math.sin(a) * 4, { size: 9, align: 'center', color: '#ffe85a', shadow: false });
            }
            ctx.globalAlpha = 1;
        }
        // 13 章の ニオニオーテン: HP 半分から 体全体が 紅く どす黒く なる
        if (u.enraged && !u.ko) {
            drawArt(ctx, art, Math.floor(t * 2), p.x, p.y + bobY, { scale, flip, alpha: 0.42 + 0.1 * Math.sin(t * 6), tint: '#7a0010', sx, sy });
        }
        // 喰われた コマンドの ある なかま: 歯がたの しるし
        if (u.eaten && !u.ko) text(ctx, `${{ attack: 'こうげき', waza: 'わざ', jutsu: '術', guard: 'まもり' }[u.eaten]}× 喰われた`, p.x, p.y + 12, { size: 9, align: 'center', bold: true, color: '#ff6a6a' });
        // 拘束のリング (大魔王ASO) で うごけない なかま: 金色の 輪で しばられる
        if (!u.ko && u.bound) {
            const fk = scale * artFit(art);
            ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 3;
            for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(p.x, p.y + bobY - art.h * fk * (0.35 + i * 0.3), art.w * fk / 2 + 6, 6, 0, 0, Math.PI * 2); ctx.stroke(); }
        }
        // とりつき中は むらさきの もや・レベルダウン中 (10 章の レベル ドレイン) は 青い もやが まとわりつく (2026-10-30 ユーザー指定)
        if (!u.ko && u.shade) drawMist(ctx, p.x, p.y + bobY, art, scale, [120, 0, 20], 3.1);   // 無限回廊の 赤黒い ボス
        if (!u.ko && isPossessed(u)) drawMist(ctx, p.x, p.y + bobY, art, scale, [190, 90, 255], 0);
        if (!u.ko && u.drained) drawMist(ctx, p.x, p.y + bobY, art, scale, [80, 170, 255], 1.7);
        // 氷の 偶像: 水色の 氷を 重ねる
        if (u.idol) drawArt(ctx, art, 0, p.x, p.y + bobY, { scale, flip, alpha: 0.45 + Math.sin(t * 4) * 0.08, tint: '#cdf2ff', sx, sy });
        // HP ゲージ: ボスは 長く (2026-10-30 ユーザー指定。ほかの 敵と ならぶ ときは 少し みじかく)
        const w = u.parts || (u.boss && u.side === 'enemy') ? (battle.enemies.filter(x => !x.idol && !x.ko).length > 1 ? 100 : 150) : 44, head = p.y - art.h * scale * artFit(art);
        // 名前と HP は 頭の 上 (手前の 味方と 奥の 敵の 名前が 重ならないように)
        const barY = head - 10, nameY = head - 14;
        // チャンスタイムで うごけない ボス: 頭の まわりを 星が ぐるぐる (ピヨピヨの わっか。おわると 消える。2026-10-30 ユーザー指定)
        if (!u.ko && battle.chance && battle.chance.uid === u.uid && !battle.outcome) {
            const rx = Math.min(70, art.w * scale * artFit(art) * 0.32 + 14), cy = head + 14;
            for (let i = 0; i < 6; i++) {
                const a = t * 3 + i * Math.PI / 3, front = Math.sin(a) > 0;
                const x = p.x + Math.cos(a) * rx, y = cy + Math.sin(a) * 7;
                if (i % 2) {
                    // ひよこ
                    ctx.fillStyle = '#ffe85a'; ctx.beginPath(); ctx.arc(x, y, front ? 4.5 : 3.5, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ff9a3a'; ctx.fillRect(x + 3, y - 1, 3, 2);
                    ctx.fillStyle = '#000'; ctx.fillRect(x + 1, y - 2, 1, 1);
                } else text(ctx, '★', x, y + 4, { size: front ? 13 : 10, align: 'center', color: front ? '#ffe85a' : '#c8a83a' });
            }
            text(ctx, 'ピヨピヨ', p.x + rx + 8, cy - 6, { size: 9, bold: true, color: '#ffe85a' });
        }
        bar(ctx, p.x - w / 2, barY, w, 4, u.hp / u.max, u.hp / u.max < 0.3 ? COLORS.hpLow : COLORS.hp);
        text(ctx, u.idol ? u.name : `${u.name} Lv${u.lv}`, p.x, nameY, { size: 9.5, align: 'center' });
        // もう 仲間に した 敵は HP の 右に 金の メダル (2026-10-28 ユーザー指定)
        if (u.side === 'enemy' && g.zukan.friends[u.id]) drawFriendMark(ctx, p.x + w / 2 + 8, barY + 3, 5);
        const marks = Object.keys(u.status).map(k => `とりつき:${STATUS_NAMES[k]}`);
        if (u.ko) marks.push('たおれた');
        if (marks.length) text(ctx, marks.join(' '), p.x, head - 26, { size: 9.5, align: 'center', color: '#ff9ad8', bold: true });
        // まもり (次に 動くまで) と、必殺技などの 強化 (切れるまで) を 出しつづける (2026-10-28 ユーザー指定)
        if (u.ko) return;
        const guards = [];
        if (u.guarding) guards.push('まもり');
        for (const [k, b] of Object.entries(u.buffs)) if (b.t > 0 && BUFF_NAMES[k]) guards.push(b.amount < 0 ? BUFF_NAMES[k].replace('↑', '↓') : BUFF_NAMES[k]);
        if (u.guarding) {
            // 体を つつむ 青い 光と、名前の 左に 盾の マーク
            ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 5);
            ctx.strokeStyle = '#8ad0ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const fk = scale * artFit(art);
            ctx.ellipse(p.x, p.y - art.h * fk / 2, art.w * fk / 2 + 4, art.h * fk / 2 + 4, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            drawShield(ctx, p.x - w / 2 - 8, barY + 1, 0.55);
        }
        if (guards.length) text(ctx, guards.join(' '), p.x, head - (marks.length ? 38 : 26), { size: 9.5, align: 'center', color: '#8ad0ff', bold: true });
    }

    // 部位の ある ボスの 両手と 部位の HP (こわれた 手は うすく、頭は ひびが 入る)
    function drawParts(ctx, e, k) {
        for (const key of ['rhand', 'lhand']) {
            const pt = e.parts[key], q = partPos(k, key);
            // 絵の 手の ところを 光らせる (こわれたら かげる)
            drawRegion(ctx, e, k, pt.rect, pt.broken ? { tint: '#000000', alpha: 0.6 } : { tint: '#ffe85a', alpha: 0.18 + 0.12 * Math.sin(t * 5) });
            if (pt.broken) text(ctx, '×', q.x, q.y + 10, { size: 22, align: 'center', bold: true, color: '#ff6a6a' });
            else bar(ctx, q.x - 16, q.y + 20, 32, 4, pt.hp / pt.max, '#ffb84a');
            text(ctx, pt.name, q.x, q.y + 34, { size: 9, align: 'center', bold: true, color: pt.broken ? COLORS.dim : '#ffe0b0' });
        }
        const head = e.parts.head, q = partPos(k, 'head');
        drawRegion(ctx, e, k, head.rect, head.broken ? { tint: '#000000', alpha: 0.5 } : handsBrokenView(e) ? { tint: '#ffe85a', alpha: 0.18 + 0.12 * Math.sin(t * 5) } : { tint: '#9a9ab0', alpha: 0.12 });
        if (head.broken) {
            ctx.strokeStyle = '#ffe85a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(q.x - 22, q.y - 10); ctx.lineTo(q.x - 6, q.y); ctx.lineTo(q.x - 14, q.y + 10);
            ctx.moveTo(q.x + 20, q.y - 12); ctx.lineTo(q.x + 8, q.y + 2);
            ctx.stroke();
            // 目が まわる 星
            for (let i = 0; i < 3; i++) {
                const a = t * 4 + i * Math.PI * 2 / 3;
                text(ctx, '★', q.x + Math.cos(a) * 30, q.y - 26 + Math.sin(a) * 8, { size: 11, align: 'center', color: '#ffe85a' });
            }
        } else {
            // 頭の 右よこ (ボスの 名前と 重ならないように)
            const hx = q.x + 40;
            bar(ctx, hx, q.y - 6, 40, 4, head.hp / head.max, e.parts.rhand.broken && e.parts.lhand.broken ? '#ffb84a' : '#7a7a90');
            text(ctx, e.parts.rhand.broken && e.parts.lhand.broken ? '頭' : '頭 (手で ガード)', hx, q.y - 10, { size: 9, bold: true, color: '#ffe0b0' });
        }
    }

    // しかけの 部位 (4 章・5 章): 玉手箱・こうら・頭・鬼の面・鐘。ねらえる ときは 名前と HP
    function drawGims(ctx, e, k) {
        const p = enemyPos(k), art = ART[e.art], fk = p.scale * artFit(art), h = art.h * fk, w = art.w * fk;
        const label = (key, q, dy = 22) => {
            const pt = e.gims[key];
            if (!gimOpen(battle, e, key)) return;
            if (!pt.noBody && !pt.face) bar(ctx, q.x - 16, q.y + dy, 32, 4, pt.hp / pt.max, '#ffb84a');   // 顔 (13 章) は ボスの HP で
            text(ctx, pt.name, q.x, q.y + dy + 13, { size: 9.5, align: 'center', bold: true, color: '#ffe0b0' });
        };
        // マグマの 体 (11 章の バクエンリュウ): ふだんは だいだいに ゆらめき、水爆弾で かたまると 灰色の 岩
        if (e.magma) {
            const hard = battle.chance && battle.chance.uid === e.uid;
            ctx.fillStyle = hard ? 'rgba(110, 110, 120, 0.55)' : `rgba(255, 110, 30, ${0.14 + 0.08 * Math.sin(t * 5)})`;
            ctx.beginPath(); ctx.ellipse(p.x, p.y - h / 2, w * 0.55, h * 0.55, 0, 0, Math.PI * 2); ctx.fill();
            text(ctx, hard ? 'かたまった！ 攻撃が きく！' : 'マグマの 体', p.x, p.y - h - 22, { size: 10, align: 'center', bold: true, color: hard ? '#e0e0e0' : '#ffb080' });
        }
        // キメラ (13 章): 部位の のこり / 顔が 出ている 時間
        if (e.chimera) {
            const left = Object.values(e.gims).filter(pt => pt.chimeraPart && !pt.broken).length;
            text(ctx, e.headOut ? `顔が 出ている！ (${Math.max(0, e.headT).toFixed(1)})` : `キメラの 部位 のこり ${left}`, p.x + w / 2 + 6, p.y - h * 0.15, { size: 10, bold: true, color: e.headOut ? '#ffe85a' : '#ffb0c0' });
        }
        // 赤信号 (14 章の リハマ): 体が 赤く 光る
        if (e.shell > 0 && e.gims.signal) {
            ctx.strokeStyle = `rgba(255, 40, 40, ${0.5 + 0.3 * Math.sin(t * 10)})`;
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.ellipse(p.x, p.y - h / 2, w * 0.6, h * 0.58, 0, 0, Math.PI * 2); ctx.stroke();
            text(ctx, `赤信号 ${Math.ceil(e.shell)}`, p.x, p.y - h * 0.3, { size: 11, align: 'center', bold: true, color: '#ffd0d0' });
        }
        // こうら (こもっている あいだ): 緑の ドームと 頭の すきま
        else if (e.shell > 0) {
            ctx.fillStyle = 'rgba(40, 110, 50, 0.92)';
            ctx.beginPath(); ctx.ellipse(p.x, p.y - h * 0.38, w * 0.62, h * 0.42, 0, Math.PI, 0); ctx.fill();
            ctx.fillRect(p.x - w * 0.62, p.y - h * 0.38, w * 1.24, h * 0.36);
            ctx.strokeStyle = '#9ae08a'; ctx.lineWidth = 2;
            for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(p.x + i * w * 0.22, p.y - h * 0.72); ctx.lineTo(p.x + i * w * 0.26, p.y - h * 0.05); ctx.stroke(); }
            text(ctx, `こうら ${Math.ceil(e.shell)}`, p.x, p.y - h * 0.3, { size: 11, align: 'center', bold: true, color: '#e0ffd0' });
        }
        // 覇理魔様: 目の 色 (赤 = 攻撃だけ きく・青 = 術だけ きく)
        if (e.eyeDef && !e.ko) text(ctx, e.eye === 'red' ? '赤い目: 攻撃だけ きく' : '青い目: 術だけ きく', p.x, p.y + 14, { size: 10, align: 'center', bold: true, color: e.eye === 'red' ? '#ff6a6a' : '#7ac0ff' });
        // 鬼の顔: 赤い オーラ
        if (e.oni) {
            ctx.strokeStyle = `rgba(255, 60, 60, ${0.4 + 0.25 * Math.sin(t * 6)})`;
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.ellipse(p.x, p.y - h / 2, w * 0.6, h * 0.58, 0, 0, Math.PI * 2); ctx.stroke();
        }
        for (const key of Object.keys(e.gims)) {
            const pt = e.gims[key], q = partPos(k, key), open = gimOpen(battle, e, key);
            if (pt.rect) { drawBodyPart(ctx, e, k, key, pt, q, open, label); continue; }
            if (key === 'moon') {            } else if (key === 'moon') {
                // 空の 月 (7 章): 段が 上がるほど 満ちる。満月が 近いと 光る
                const lv = e.armLv, mx = e.armDef.max, hot = lv >= mx - 1;
                ctx.fillStyle = hot ? `rgba(255, 240, 140, ${0.3 + 0.2 * Math.sin(t * 8)})` : 'rgba(255,255,255,0.08)';
                ctx.beginPath(); ctx.arc(q.x, q.y, 24, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#2a2450'; ctx.beginPath(); ctx.arc(q.x, q.y, 16, 0, Math.PI * 2); ctx.fill();
                ctx.save(); ctx.beginPath(); ctx.arc(q.x, q.y, 16, 0, Math.PI * 2); ctx.clip();
                ctx.fillStyle = '#ffe89a'; ctx.fillRect(q.x + 16 - 32 * lv / mx, q.y - 16, 32 * lv / mx, 32);
                ctx.restore();
                bar(ctx, q.x - 20, q.y + 22, 40, 4, lv / mx, hot ? '#ffe85a' : '#9a9ad8');
                text(ctx, `月 ${lv}/${mx}`, q.x, q.y + 35, { size: 9.5, align: 'center', bold: true, color: '#ffe0b0' });
            } else if (pt.barrier) {
                // 覇理魔様の バリア: 赤い 六角形の かけら
                if (!open) continue;
                const pulse = 0.6 + 0.3 * Math.sin(t * 6 + q.x);
                ctx.fillStyle = `rgba(200, 30, 50, ${0.35 * pulse})`;
                ctx.strokeStyle = `rgba(255, 140, 60, ${pulse})`; ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; ctx.lineTo(q.x + Math.cos(a) * 15, q.y + Math.sin(a) * 15); }
                ctx.closePath(); ctx.fill(); ctx.stroke();
                label(key, q, 18);
            } else if (pt.ring) {
                // 拘束のリング (大魔王ASO): 金色の 輪が 浮いて まわる
                const bob = Math.sin(t * 3) * 3, y0 = q.y + bob;
                ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.ellipse(q.x, y0, 16, 8 + 4 * Math.sin(t * 4), 0, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = '#fff0a0'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.ellipse(q.x, y0, 11, 5, t, 0, Math.PI * 2); ctx.stroke();
                label(key, q, 18);
            } else if (pt.thrown) {
                // ASO が 投げた 道具 (11 章): 剣・回復の 実・水爆弾
                const bounce = Math.sin(t * 4 + q.x) * 2, y0 = q.y + bounce;
                ctx.fillStyle = 'rgba(255, 232, 140, 0.25)'; ctx.beginPath(); ctx.arc(q.x, y0, 18, 0, Math.PI * 2); ctx.fill();
                if (pt.kind === 'weapon') {
                    ctx.fillStyle = '#d8e0f0'; ctx.fillRect(q.x - 2, y0 - 16, 4, 22);
                    ctx.fillStyle = '#ffd040'; ctx.fillRect(q.x - 7, y0 + 4, 14, 3);
                    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(q.x - 2, y0 + 7, 4, 7);
                } else if (pt.kind === 'heal') {
                    ctx.fillStyle = '#ff5a6a'; ctx.beginPath(); ctx.arc(q.x, y0 + 2, 9, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#5ad06a'; ctx.fillRect(q.x - 1, y0 - 12, 3, 6); ctx.fillRect(q.x + 1, y0 - 11, 6, 3);
                } else {
                    ctx.fillStyle = '#3a8ae0'; ctx.beginPath(); ctx.arc(q.x, y0 + 2, 10, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#bff0ff'; ctx.fillRect(q.x - 4, y0 - 3, 3, 3);
                    ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q.x, y0 - 8); ctx.lineTo(q.x + 5, y0 - 14); ctx.stroke();
                    ctx.fillStyle = '#ffd040'; ctx.fillRect(q.x + 4, y0 - 16, 3, 3);
                }
                text(ctx, pt.name, q.x, y0 + 28, { size: 9.5, align: 'center', bold: true, color: '#ffe0b0' });
            } else if (key === 'cage' && !pt.broken) {
                // ふるカワの おり (14 章の サアラハ): 黒い おりの 中に ふるカワ
                drawArt(ctx, ART.furukawa, Math.floor(t * 2), q.x, q.y + 14, { scale: 1.6 });
                ctx.strokeStyle = '#3a2a4a'; ctx.lineWidth = 2;
                for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(q.x + i * 7, q.y - 22); ctx.lineTo(q.x + i * 7, q.y + 16); ctx.stroke(); }
                ctx.strokeRect(q.x - 16, q.y - 22, 32, 38);
                label(key, q, 22);
            } else if (key === 'signal') {
                // 信号機 (14 章の リハマ): 赤信号の あいだだけ 赤が 光って ねらえる
                ctx.fillStyle = '#2a2a2a'; ctx.fillRect(q.x - 8, q.y - 22, 16, 40); ctx.fillRect(q.x - 2, q.y + 18, 4, 30);
                ctx.fillStyle = open ? `rgba(255, 50, 50, ${0.75 + 0.25 * Math.sin(t * 10)})` : '#4a1a1a'; ctx.beginPath(); ctx.arc(q.x, q.y - 14, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#4a4a1a'; ctx.beginPath(); ctx.arc(q.x, q.y - 2, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = open ? '#1a3a1a' : '#4aff6a'; ctx.beginPath(); ctx.arc(q.x, q.y + 10, 5, 0, Math.PI * 2); ctx.fill();
                if (open) label(key, q, 24);
            } else if (key === 'bell') {
                // 鐘 (いつも うしろに ある。お経の あいだ だけ 光って ねらえる)
                const swing = open ? Math.sin(t * 5) * 0.08 : 0;
                ctx.save(); ctx.translate(q.x, q.y - 26); ctx.rotate(swing);
                ctx.fillStyle = '#5a4020'; ctx.fillRect(-20, -6, 40, 4);
                ctx.fillStyle = open ? '#d8a840' : '#7a6a4a';
                ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(10, -2); ctx.lineTo(14, 26); ctx.lineTo(-14, 26); ctx.fill();
                ctx.fillStyle = open ? '#ffe080' : '#9a8a6a'; ctx.fillRect(-14, 22, 28, 4);
                ctx.restore();
                if (open) { ctx.strokeStyle = `rgba(255, 232, 90, ${0.5 + 0.3 * Math.sin(t * 8)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y - 12, 24, 0, Math.PI * 2); ctx.stroke(); }
                label(key, q, 10);
            }
        }
    }

    // まとわりつく もや: 体の まわりを ゆらゆら 回る 小さな もやの つぶ と うすい 光。rgb: 色・phase: 2 つ 重なっても ずれるように
    function drawMist(ctx, x, y, art, scale, [r, g2, b2], phase) {
        const fk = scale * artFit(art), w = art.w * fk / 2, h = art.h * fk, cy = y - h / 2;
        ctx.fillStyle = `rgba(${r}, ${g2}, ${b2}, ${0.14 + 0.06 * Math.sin(t * 3 + phase)})`;
        ctx.beginPath(); ctx.ellipse(x, cy, w + 6, h / 2 + 6, 0, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 7; i++) {
            const a = t * 1.6 + i * Math.PI * 2 / 7 + phase;
            const px = x + Math.cos(a) * (w + 4), py = cy + Math.sin(a * 1.3) * (h / 2) - ((t * 18 + i * 9) % 14);
            ctx.fillStyle = `rgba(${r}, ${g2}, ${b2}, ${0.45 + 0.2 * Math.sin(t * 5 + i)})`;
            ctx.beginPath(); ctx.ellipse(px, py, 5 + (i % 3), 3.5, a, 0, Math.PI * 2); ctx.fill();
        }
    }

    // ----- ボスの 体の 部位 (2026-10-30 ユーザー指定: 別の 絵を 足さず、ドット絵の その 部分を ねらう) -----
    // ボスの ドット絵の うち rect (ピクセルの 範囲) だけを 描く。tint: その 色で ぬる / なし: もとの 色。gscale・anchor: 肩を 中心に 大きく 描く
    function drawRegion(ctx, e, k, [x0, y0, x1, y1], { tint = null, alpha = 1, gscale = 1, anchor = null } = {}) {
        const p = enemyPos(k), art = ART[e.art], fk = p.scale * artFit(art);
        const { ox, oy } = offsetOf(e);
        const x = p.x + ox, y = p.y + oy + (e.ko ? 0 : Math.sin(t * 3 + p.x) * 1.5);
        const rows = art.frames[(e.status.sleep > 0 || e.ko ? 0 : Math.floor(t * 2)) % art.frames.length];
        const left = Math.round(x - art.w * fk / 2), top = Math.round(y - art.h * fk);
        ctx.save();
        if (anchor && gscale !== 1) {
            const ax = left + anchor[0] * fk, ay = top + anchor[1] * fk;
            ctx.translate(ax, ay); ctx.scale(gscale, gscale); ctx.translate(-ax, -ay);
        }
        ctx.globalAlpha *= alpha;
        for (let ry = y0; ry <= y1; ry++) {
            const row = rows[ry] || '';
            for (let rx = x0; rx <= x1; rx++) {
                const ch = row[rx];
                if (!ch || ch === '.') continue;
                ctx.fillStyle = tint || art.palette[ch];
                ctx.fillRect(left + rx * fk, top + ry * fk, fk + 0.05, fk + 0.05);
            }
        }
        ctx.restore();
    }
    // 加勢する ライバル探検隊 (右上。チームの 名前と 3 人)
    function drawHelpers(ctx) {
        const h = battle.helpers;
        panel(ctx, 292, 40, 104, 46, { fill: 'rgba(16, 60, 40, 0.75)', edge: '#8affc8' });
        text(ctx, h.name, 344, 52, { size: 9, align: 'center', bold: true, color: '#8affc8', maxWidth: 98 });
        h.units.forEach((u, i) => {
            const p = helperPos(i), jump = (helpFlash[u.uid] || 0) > t ? 6 : 0;
            drawArt(ctx, ART[u.art], Math.floor(t * 2), p.x, p.y + 6 - jump, { scale: 1.2 });
        });
        text(ctx, `加勢まで ${Math.max(0, h.t).toFixed(1)}`, 344, 96, { size: 8.5, align: 'center', color: '#c8ffe0' });
    }
    const handsBrokenView = e => e.parts.rhand.broken && e.parts.lhand.broken;
    // 右腕 (6 章の トモオカ) の 大きさ: 段が 上がるほど ドット絵の 腕が 大きく なる
    const armScale = e => 1 + (e.armLv || 0) * 0.12;
    // 体の 部位 1 つ: ねらえる ときは その 部分が 光る・こわれたら かげる。右腕は ドット絵の 腕 そのものが 大きく なる
    function drawBodyPart(ctx, e, k, key, pt, q, open, label) {
        if (pt.arm) {
            const lv = e.armLv, mx = e.armDef.max, hot = lv >= mx - 2;
            drawRegion(ctx, e, k, pt.rect, { gscale: armScale(e), anchor: pt.anchor });
            if (hot) drawRegion(ctx, e, k, pt.rect, { gscale: armScale(e), anchor: pt.anchor, tint: '#ff3a2a', alpha: 0.3 + 0.25 * Math.sin(t * 10) });
            bar(ctx, q.x - 22, q.y + 20, 44, 4, lv / mx, hot ? '#ff4a3a' : '#ffb84a');
            text(ctx, `${pt.name} ${lv}/${mx}`, q.x, q.y + 33, { size: 9.5, align: 'center', bold: true, color: hot ? '#ff9a8a' : '#ffe0b0' });
            return;
        }
        if (pt.broken) {
            drawRegion(ctx, e, k, pt.rect, { tint: '#000000', alpha: 0.6 });
            text(ctx, pt.regrow ? `× ${Math.ceil(pt.regrowT || 0)}` : '×', q.x, q.y + 8, { size: pt.regrow ? 14 : 20, align: 'center', bold: true, color: '#ff6a6a' });
            return;
        }
        if (!open) return;
        // こうらに こもった 浦の島重蔵: こうらの 上に 頭を 出す
        if (key === 'head' && e.shell > 0) drawRegion(ctx, e, k, pt.rect);
        // 鬼の面は 赤・双頭鬼の 頭は むらさき / 青・ハル麒麟の 角は ためている あいだ ピンク・ほかは 黄色
        const regen = key === 'horn' && battle.regen && battle.regen.uid === e.uid;
        const color = key === 'mask' ? '#ff2a3a' : key === 'rhead' ? '#c88aff' : key === 'lhead' ? '#78b4ff' : regen ? '#ff8ab8' : '#ffe85a';
        drawRegion(ctx, e, k, pt.rect, { tint: color, alpha: (key === 'mask' || regen ? 0.45 : 0.22) + 0.12 * Math.sin(t * (regen ? 10 : 5)) });
        // 覇理魔様の 手は 数が 多いので、ねらっている 手だけ 名前を 出す
        if (pt.regrow && !(battle.lock === e.uid && battle.lockPart === key)) return;
        label(key, q, 14);
    }

    // 盾 (まもり)。(x, y) は まんなか
    function drawShield(ctx, x, y, s = 1) {
        ctx.fillStyle = 'rgba(138, 208, 255, 0.55)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 10 * s, y - 11 * s);
        ctx.lineTo(x + 10 * s, y - 11 * s);
        ctx.lineTo(x + 10 * s, y + 2 * s);
        ctx.lineTo(x, y + 12 * s);
        ctx.lineTo(x - 10 * s, y + 2 * s);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    function drawTop(ctx) {
        drawBackdrop(ctx, place, t, g.time);
        battle.enemies.forEach((e, i) => drawUnit(ctx, e, enemyPos(i), { scale: enemyPos(i).scale }));
        battle.enemies.forEach((e, i) => { if (e.parts && !e.ko) drawParts(ctx, e, i); if (e.gims && !e.ko) drawGims(ctx, e, i); });
        // けむり (4 章): 敵の まわりを 白い もやが ただよう
        if (battle.smoke) {
            for (let i = 0; i < 9; i++) {
                const x = (i * 53 + t * 18) % 460 - 30, y = 50 + (i % 3) * 30 + Math.sin(t + i) * 6;
                ctx.fillStyle = `rgba(220, 220, 228, ${0.35 + 0.1 * Math.sin(t * 2 + i)})`;
                ctx.beginPath(); ctx.ellipse(x, y, 46, 20, 0, 0, Math.PI * 2); ctx.fill();
            }
        }
        // 必殺技の 動きの あいだは、その キャラは 動きの ほうで 描く
        // なかまは「たたかう」まで 出てこない。出てくる ときは 下から とびだす
        if (enterT !== null) battle.front().forEach((u, i) => {
            if (mg && mg.phase === 'act' && u === mg.unit) return;
            const k = Math.min(1, Math.max(0, (t - enterT - i * 0.1) / ENTER_TIME));
            if (k <= 0) return;
            const p = ALLY_POS[i];
            drawUnit(ctx, u, k < 1 ? { x: p.x, y: p.y + (1 - k) * (1 - k) * 140 - Math.sin(Math.PI * k) * 18 } : p, { scale: ALLY_SCALE, back: true });
        });
        if (mg && mg.phase === 'act') drawAct(ctx);
        if (battle.helpers) drawHelpers(ctx);
        drawEffects(ctx);
        if (!battle.outcome) drawLock(ctx);
        drawPickArrow(ctx);
        for (let i = pops.length - 1; i >= 0; i--) {
            const p = pops[i];
            if (p.until < t) { pops.splice(i, 1); continue; }
            const k = 1 - (p.until - t) / 0.9;
            text(ctx, p.text, p.x, p.y - k * 14, { size: p.big ? 16 : p.small ? 10.5 : 13, align: 'center', bold: true, color: p.color });
        }
        // チャンスタイム: 左上に 小さく (ボスの HP が 見えるように。うごけない ことは 頭の ピヨピヨで。2026-10-30 ユーザー指定)
        if (battle.chance && !battle.outcome) {
            panel(ctx, 4, 4, 112, 20, { fill: 'rgba(90, 40, 0, 0.85)', edge: '#ffe85a' });
            text(ctx, `チャンス！ あと ${chanceTime(battle).toFixed(1)} 秒`, 60, 18, { size: 10, align: 'center', bold: true, color: Math.floor(t * 6) % 2 ? '#ffe85a' : '#ffa83a' });
        }
        // 予約した バナー (変身の セリフ)
        if (bannerQueue.length && bannerQueue[0].at <= t && !(banner && banner.until > t)) banner = bannerQueue.shift();
        if (battle.armCharge && !battle.outcome) {
            // 右腕が 限界 (6 章): 防御不能の 大技を ためている
            const moonBoss = battle.enemies.find(x => x.uid === battle.armCharge.uid)?.gims?.moon;
            panel(ctx, 30, 8, 340, 40, { fill: 'rgba(120, 10, 20, 0.92)', edge: '#ffb84a' });
            text(ctx, moonBoss ? `!! 満月！「${warn ? warn.name : ''}」を ためている！` : `!! 防御不能「${warn ? warn.name : ''}」を ためている！`, 200, 25, { size: 13, align: 'center', bold: true });
            text(ctx, `${moonBoss ? '空の 月を ねらって 欠けさせろ！' : '右腕を ねらって しぼませろ！'} (${Math.max(0, battle.armCharge.left).toFixed(1)})`, 200, 41, { size: 11, align: 'center', color: '#ffd0d0' });
        } else if (battle.chant && !battle.outcome) {
            // お経 (5 章): となえきると 必殺技。鐘を 鳴らせば 止まる
            panel(ctx, 30, 8, 340, 40, { fill: 'rgba(90, 20, 90, 0.9)', edge: '#ffe85a' });
            text(ctx, `お経を となえている……「${warn ? warn.name : ''}」が くる！`, 200, 25, { size: 13, align: 'center', bold: true });
            text(ctx, `うしろの 鐘を ねらって 鳴らせ！ (${Math.max(0, battle.chant.left).toFixed(1)})`, 200, 41, { size: 11, align: 'center', color: '#ffe0a0' });
        } else if (battle.hack && !battle.outcome) {
            // 10 章の タシケダ: 左右に 紋つきが そろうと ハッキング。予告の あいだに 1 体 たおせば 止まる
            panel(ctx, 30, 8, 340, 40, { fill: 'rgba(20, 60, 30, 0.92)', edge: '#4aff8a' });
            text(ctx, `!! 「${warn ? warn.name : ''}」が くる！`, 200, 25, { size: 13, align: 'center', bold: true });
            text(ctx, `となりの 紋つきを 1 体 たおせば 止まる！ (${Math.max(0, battle.hack.left).toFixed(1)})`, 200, 41, { size: 11, align: 'center', color: '#c8ffd8' });
        } else if (battle.regen && !battle.outcome) {
            // 9 章の ハル麒麟: ためおわると 角が のこっていれば 全回復
            panel(ctx, 30, 8, 340, 40, { fill: 'rgba(40, 110, 60, 0.92)', edge: '#ffb0c8' });
            text(ctx, `!! 「${warn ? warn.name : '春の 目ざめ'}」を ためている！ 全回復される！`, 200, 25, { size: 13, align: 'center', bold: true });
            text(ctx, `角を ねらって こわせ！ (${Math.max(0, battle.regen.left).toFixed(1)})`, 200, 41, { size: 11, align: 'center', color: '#e0ffe0' });
        } else if (battle.burst && !battle.outcome) {
            // 8 章の おにおに: ためている あいだに 決まった ダメージを あたえると 紋が 暴発する。2 回目からは ガード
            const bu = battle.burst;
            panel(ctx, 30, 8, 340, 44, { fill: 'rgba(120, 30, 10, 0.92)', edge: bu.guard ? '#8ad0ff' : '#ffb84a' });
            text(ctx, `!! 「${warn ? warn.name : ''}」を ためている！${bu.guard ? ' (ガード中)' : ''}`, 200, 23, { size: 13, align: 'center', bold: true });
            bar(ctx, 60, 30, 200, 6, Math.min(1, bu.dmg / bu.need), '#ffb84a');
            text(ctx, `${bu.guard ? 'ガードで ダメージが へる！' : ''}攻撃を 当てて 止めろ！ (${Math.max(0, bu.left).toFixed(1)})`, 200, 47, { size: 10, align: 'center', color: '#ffd0d0' });
            text(ctx, `${Math.floor(bu.dmg)}/${bu.need}`, 300, 37, { size: 10, align: 'center', bold: true, color: '#ffe0b0' });
        } else if (battle.smoke && !battle.outcome && !(warn && warn.until > t)) {
            panel(ctx, 90, 8, 220, 24, { fill: 'rgba(60, 60, 70, 0.85)', edge: '#d0d0d8' });
            text(ctx, `けむりで 攻撃が 当たりにくい (${Math.ceil(battle.smoke.left)})`, 200, 25, { size: 11, align: 'center', bold: true });
        } else if (warn && warn.idols && battle.charge && !battle.outcome) {
            // 偶像で ためる 必殺技: こわせば 止まる
            panel(ctx, 30, 8, 340, 40, { fill: 'rgba(120, 10, 20, 0.9)', edge: '#ff6a6a' });
            text(ctx, `!! 必殺技「${warn.name}」を ためている！`, 200, 25, { size: 13, align: 'center', bold: true });
            text(ctx, `氷の偶像を こわせば 止められる！ (${Math.max(0, battle.charge.left).toFixed(1)})`, 200, 41, { size: 11, align: 'center', color: '#ffd0d0' });
        } else if (battle.barrier && !battle.outcome) {
            // 覇理魔様: バリアを はって 必殺技を ためている。バリアを 4 つ こわすと 止まる
            const bu = battle.enemies.find(x => x.uid === battle.barrier.uid), left = bu ? Object.values(bu.gims).filter(p => p.barrier && !p.broken).length : 0;
            panel(ctx, 30, 8, 340, 40, { fill: 'rgba(70, 0, 20, 0.92)', edge: '#ff8a20' });
            text(ctx, `!! バリアを はって「${warn ? warn.name : ''}」を ためている！`, 200, 25, { size: 13, align: 'center', bold: true });
            text(ctx, `バリアを ぜんぶ こわせ！ のこり ${left} (${Math.max(0, battle.barrier.left).toFixed(1)})`, 200, 41, { size: 11, align: 'center', color: '#ffd0b0' });
        } else if (warn && !warn.idols && !warn.chant && !warn.arm && !warn.burst && !warn.regen && !warn.hack && !warn.barrier && warn.until > t) {
            panel(ctx, 30, 8, 340, 40, { fill: 'rgba(120, 10, 20, 0.9)', edge: '#ff6a6a' });
            text(ctx, `!! 大技「${warn.name}」が くる！`, 200, 25, { size: 13, align: 'center', bold: true });
            text(ctx, `輪を まわして じょうぶな なかまを 前に！ (${Math.max(0, warn.until - t).toFixed(1)})`, 200, 41, { size: 11, align: 'center', color: '#ffd0d0' });
        } else if (banner && banner.until > t) {
            panel(ctx, 40, 12, 320, 26, { fill: 'rgba(16,22,42,0.9)', edge: banner.color });
            text(ctx, banner.text, 200, 30, { size: 13, align: 'center', bold: true, color: banner.color, maxWidth: 312 });
        }
        if (battle.waiting && !battle.outcome) {
            panel(ctx, 30, 176, 340, 50, { fill: 'rgba(16,22,42,0.92)', edge: '#ffffff' });
            if (foodShow) text(ctx, foodShow.text, 200, 206, { size: 13, align: 'center', bold: true, maxWidth: 324, color: foodShow.favorite ? '#ff9ad8' : '#ffffff' });
            else text(ctx, appearText, 200, 208, { size: 16, align: 'center', bold: true, maxWidth: 320 });
        }
        // 最後の 一撃の 動きが 見えるように、少し 待ってから「かった！」
        if (battle.outcome && battle.outcome !== 'flee' && endT > 0.5) {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(0, 0, 400, 240);
            text(ctx, battle.outcome === 'win' ? 'かった！' : 'まけた……', 200, 128, { size: 34, align: 'center', bold: true, color: battle.outcome === 'win' ? COLORS.accent : '#a0b0d0' });
        }
        if (mg) drawMinigameTop(ctx);
        if (ecut) drawEnemyCutin(ctx, ecut.unit, ecut.name, Math.min(1, (t - ecut.start) / ecut.dur), ecut.boss, t);
        if (swirlT !== null) drawSwirl(ctx, swirlT, opts.shot, swirlBoss);
    }

    function drawMinigameTop(ctx) {
        if (mg.phase === 'cutin') { drawCutin(ctx, mg.unit, mg.sp, mg.t / PHASE_TIME.cutin); return; }
        if (mg.phase === 'act') return;
        ctx.fillStyle = 'rgba(10, 14, 40, 0.8)';
        ctx.fillRect(0, 0, 400, 240);
        const u = mg.unit;
        // 集中線
        ctx.strokeStyle = 'rgba(255, 216, 74, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 24; i++) {
            const a = i / 24 * Math.PI * 2 + t;
            ctx.moveTo(200 + Math.cos(a) * 60, 130 + Math.sin(a) * 60);
            ctx.lineTo(200 + Math.cos(a) * 240, 130 + Math.sin(a) * 240);
        }
        ctx.stroke();
        drawArt(ctx, ART[u.art], Math.floor(t * 8), 200, 170 + Math.sin(t * 20) * 2, { scale: 6 });
        text(ctx, mg.rescue ? `おたすけ: ${u.name}の とりつきを はらえ！` : `必殺技「${u.special.name}」`, 200, 30, { size: mg.rescue ? 16 : 18, align: 'center', bold: true, color: mg.rescue ? '#e0b0ff' : COLORS.accent });
        text(ctx, COMMAND_NAMES[mg.command], 200, 52, { size: 13, align: 'center', bold: true });
        if (mg.phase === 'result') text(ctx, mg.cmd.done.label + (mg.mult > 1 ? (mg.rescue ? ' HP 回復！' : ' 威力アップ！') : ''), 200, 216, { size: 26, align: 'center', bold: true, color: mg.mult > 1 ? COLORS.accent : '#ffffff', maxWidth: 380 });
    }

    // キャラごとの 必殺技の 動き (味方の 場所 → いちばん 前の 敵)
    function drawAct(ctx) {
        const a = ALLY_POS[mg.pos];
        const target = battle.enemiesAlive()[0] || battle.enemies[0];
        const e = centerOf(target.uid) || { x: 200, y: 110 };
        const [dur] = MOTION_TIME[mg.sp.motion];
        const art = BACK_ART[mg.unit.art] || backArt(ART[mg.unit.art]);
        const drawActor = (x, y, o) => drawArt(ctx, art, Math.floor(t * 8), x, y, { scale: o.scale || ALLY_SCALE, flip: o.flip, alpha: o.alpha ?? 1, sx: o.sx || 1, sy: o.sy || 1 });
        const allies = battle.front().map((u, i) => (u && !u.ko ? ALLY_POS[i] : null)).filter(Boolean);
        drawPerformance(ctx, mg.sp, a, e, Math.min(1, mg.t / dur), t, drawActor, allies);
    }

    // ----- 描く: 下画面 -----
    function drawWheel(ctx) {
        ctx.strokeStyle = 'rgba(127, 211, 247, 0.35)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(WHEEL.x, WHEEL.y, WHEEL.r, 0, Math.PI * 2);
        ctx.stroke();
        // 前の 3 つの 場所
        ctx.strokeStyle = 'rgba(255, 216, 74, 0.5)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(WHEEL.x, WHEEL.y, WHEEL.r, -Math.PI * 5 / 6 - 0.4, -Math.PI / 6 + 0.4);
        ctx.stroke();
        text(ctx, 'まえ', WHEEL.x, WHEEL.y - WHEEL.r - 12, { size: 10, align: 'center', color: COLORS.accent, bold: true });
        // 時計 (とりつかれた なかまが 後ろに いると「おたすけ」ボタン)
        if (rescueTargets(battle).length) {
            panel(ctx, RESCUE_BTN.x, RESCUE_BTN.y, RESCUE_BTN.w, RESCUE_BTN.h, { fill: Math.floor(t * 4) % 2 ? '#7a3aa8' : '#5a2a88', edge: '#e0b0ff', r: 20 });
            text(ctx, 'おたすけ！', WHEEL.x, WHEEL.y + 2, { size: 11, align: 'center', bold: true });
            text(ctx, btn('help'), WHEEL.x, WHEEL.y + 15, { size: 9, align: 'center', color: '#e0d0ff' });
        } else {
            panel(ctx, WHEEL.x - 34, WHEEL.y - 22, 68, 44, { fill: '#1b3a6b', edge: '#bff0ff', r: 20 });
            text(ctx, 'おなかま', WHEEL.x, WHEEL.y - 2, { size: 10, align: 'center', bold: true });
            text(ctx, 'ウォッチ', WHEEL.x, WHEEL.y + 12, { size: 10, align: 'center', bold: true });
        }
        battle.wheel.forEach((u, i) => {
            const pos = ((i - shownRot) % 6 + 6) % 6;
            const ang = (-150 + pos * 60) * Math.PI / 180;
            const x = WHEEL.x + Math.cos(ang) * WHEEL.r, y = WHEEL.y + Math.sin(ang) * WHEEL.r;
            const front = Math.round(pos) % 6 < 3;
            ctx.beginPath();
            ctx.arc(x, y, 21, 0, Math.PI * 2);
            ctx.fillStyle = u ? (front ? '#2a3a66' : '#1a2240') : '#10162a';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = u ? ELEMENT_COLORS[u.element] : '#3a4060';
            ctx.stroke();
            if (!u) return;
            drawArt(ctx, ART[u.art], 0, x, y + 13, { scale: 1.6, alpha: u.ko ? 0.3 : front ? 1 : 0.7 });
            bar(ctx, x - 16, y + 15, 32, 3, u.hp / u.max, u.hp / u.max < 0.3 ? COLORS.hpLow : COLORS.hp);
            if (u.ko) text(ctx, '×', x, y + 6, { size: 22, align: 'center', bold: true, color: '#ff6a6a' });
            // とりつかれている なかまには むらさきの 印 (とりつきの 種類は ぜんぶ)
            if (!u.ko && isPossessed(u)) {
                ctx.strokeStyle = '#c88aff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 24 + Math.sin(t * 6) * 1.5, 0, Math.PI * 2);
                ctx.stroke();
                text(ctx, 'とりつき', x, y - 24, { size: 8.5, align: 'center', bold: true, color: '#e0b0ff' });
            }
            // レベルダウン中 (10 章) の なかまには 青い 印
            if (!u.ko && u.drained) {
                ctx.strokeStyle = '#5aaaff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 27 + Math.sin(t * 6) * 1.5, 0, Math.PI * 2);
                ctx.stroke();
                text(ctx, `Lv${u.lv}`, x, y + 32, { size: 8.5, align: 'center', bold: true, color: '#9ad0ff' });
            }
        });
        text(ctx, `${btn('l')} ◀ なぞって回す ▶ ${btn('r')}`, WHEEL.x, 232, { size: 10.5, align: 'center', color: COLORS.sub });
    }

    function drawSpecialButtons(ctx) {
        battle.front().forEach((u, i) => {
            const b = SP_BTN[i];
            const ready = canSpecial(battle, i);
            panel(ctx, b.x, b.y, b.w, b.h, {
                fill: ready ? (Math.floor(t * 4) % 2 ? '#7a2a6a' : '#5a1a50') : 'rgba(26,36,64,0.95)',
                edge: i === cursor ? COLORS.accent : ready ? '#ff9ad8' : '#3a4a70'
            });
            if (!u) { text(ctx, '(あき)', b.x + b.w / 2, b.y + 28, { size: 11, align: 'center', color: COLORS.dim }); return; }
            drawArt(ctx, ART[u.art], 0, b.x + 18, b.y + 34, { scale: 1.5, alpha: u.ko ? 0.3 : 1 });
            text(ctx, u.name, b.x + 34, b.y + 16, { size: 10, bold: true, maxWidth: b.w - 38 });
            bar(ctx, b.x + 34, b.y + 22, 70, 6, u.gauge / GAUGE_MAX, COLORS.gauge);
            text(ctx, ready ? `必殺技！ (${i + 1})` : u.ko ? 'たおれている' : 'ゲージ', b.x + 34, b.y + 40, { size: 9.5, color: ready ? '#ffffff' : COLORS.dim, bold: ready });
        });
        button(ctx, ITEM_BTN, { size: 11 });
        button(ctx, FOOD_BTN, { size: 11, disabled: battle.kind !== 'wild' || Boolean(battle.food) });
        text(ctx, btn('y'), ITEM_BTN.x + ITEM_BTN.w / 2, 216, { size: 9.5, align: 'center', color: COLORS.dim });
        text(ctx, btn('x'), FOOD_BTN.x + FOOD_BTN.w / 2, 216, { size: 9.5, align: 'center', color: COLORS.dim });
        if (battle.itemCooldown > 0) text(ctx, `どうぐ まで ${battle.itemCooldown.toFixed(1)}`, 259, 232, { size: 9.5, align: 'center', color: COLORS.dim });
    }

    // はじまりの コマンド
    function drawIntro(ctx) {
        text(ctx, 'どうする？', 160, 40, { size: 16, align: 'center', bold: true, color: COLORS.accent });
        INTRO_BTN.forEach((bn, k) => {
            const off = (bn.key === 'run' && !canFlee(battle)) || (bn.key === 'food' && battle.kind !== 'wild');
            const on = k === introIndex;
            panel(ctx, bn.x, bn.y, bn.w, bn.h, { fill: on ? '#2d5aa8' : 'rgba(26,36,64,0.95)', edge: on ? COLORS.accent : '#3a4a70' });
            text(ctx, bn.label, bn.x + bn.w / 2, bn.y + 36, { size: 18, align: 'center', bold: true, color: off ? COLORS.dim : '#ffffff' });
            const note = bn.key === 'item' ? btn('y') : bn.key === 'food' ? (off ? '投げられない' : btn('x')) : bn.key === 'run' && off ? 'にげられない' : '';
            if (note) text(ctx, note, bn.x + bn.w / 2, bn.y + 54, { size: 9.5, align: 'center', color: COLORS.dim });
        });
        text(ctx, `十字キーで えらんで ${btn('a')}　どうぐ・おやつを 使うと バトル開始`, 160, 222, { size: 9.5, align: 'center', color: COLORS.dim, maxWidth: 300 });
    }

    function drawMenu(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, 320, 240);
        panel(ctx, 20, 14, 280, 212);
        if (menu.pick) { drawPick(ctx); return; }
        text(ctx, menu.kind === 'item' ? 'どうぐ: なかまに 使う' : 'おやつ: 敵に 投げる (好物なら 大よろこび)', 160, 34, { size: 11.5, align: 'center', bold: true, color: COLORS.accent });
        const list = owned(), top = menu.top || 0;
        if (!list.length) text(ctx, 'なにも もっていない', 160, 110, { size: 13, align: 'center', color: COLORS.sub });
        list.slice(top, top + MENU_ROWS).forEach((id, k) => {
            const r = menuRow(k);
            if (top + k === menu.index) { roundRect(ctx, r.x, r.y, r.w, r.h, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
            text(ctx, `${ITEMS[id].name}`, r.x + 10, r.y + 17, { size: 13 });
            text(ctx, `×${g.items[id]}`, r.x + r.w - 10, r.y + 17, { size: 13, align: 'right' });
        });
        if (top > 0) text(ctx, '▲', SCROLL_UP.x + SCROLL_UP.w / 2, SCROLL_UP.y + 16, { size: 12, align: 'center', color: COLORS.accent });
        if (top + MENU_ROWS < list.length) text(ctx, '▼', SCROLL_DOWN.x + SCROLL_DOWN.w / 2, SCROLL_DOWN.y + 16, { size: 12, align: 'center', color: COLORS.accent });
        const cur = list[menu.index];
        if (cur) text(ctx, ITEMS[cur].desc, 160, 200, { size: 9.5, align: 'center', color: COLORS.sub, maxWidth: 270 });
        text(ctx, `${btn('b')} で とじる　(えらんでいる あいだ バトルは 止まる)`, 160, 220, { size: 10, align: 'center', color: COLORS.dim });
    }

    // だれに 使うか (名前・Lv・HP。どうぐは 前 / 後ろ も)
    function drawPick(ctx) {
        const item = ITEMS[menu.pick.id], list = menuTargets();
        text(ctx, menu.kind === 'rescue' ? 'だれを おたすけ する？' : menu.kind === 'item' ? `${item.name}を だれに 使う？` : `${item.name}を どの 敵に 投げる？`, 160, 34, { size: 11.5, align: 'center', bold: true, color: COLORS.accent });
        const front = battle.front();
        list.forEach((u, k) => {
            const r = menuRow(k);
            if (k === menu.pick.index) { roundRect(ctx, r.x, r.y, r.w, r.h, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
            if (menu.kind !== 'food') text(ctx, front.includes(u) ? 'まえ' : 'うしろ', r.x + 8, r.y + 16, { size: 9.5, color: front.includes(u) ? COLORS.accent : COLORS.sub, bold: true });
            text(ctx, `${u.name} Lv${u.lv}`, r.x + 44, r.y + 17, { size: 12, maxWidth: 120 });
            if (u.side === 'enemy' && g.zukan.friends[u.id]) drawFriendMark(ctx, r.x + 36, r.y + 12, 4);
            bar(ctx, r.x + 170, r.y + 9, 60, 6, u.hp / u.max, u.hp / u.max < 0.3 ? COLORS.hpLow : COLORS.hp);
            text(ctx, `${Math.ceil(u.hp)}`, r.x + r.w - 6, r.y + 17, { size: 10, align: 'right', color: COLORS.sub });
        });
        text(ctx, menu.kind === 'rescue' ? `${btn('a')} で おたすけ・${btn('b')} で やめる` : `${btn('a')} で 使う・${btn('b')} で もどる`, 160, 220, { size: 10, align: 'center', color: COLORS.dim });
    }

    // 上画面: えらんでいる 相手の 頭の 上に ▼
    function drawPickArrow(ctx) {
        if (!menu || !menu.pick) return;
        const u = menuTargets()[menu.pick.index];
        if (!u) return;
        const ei = battle.enemies.indexOf(u), fi = battle.front().indexOf(u);
        const p = ei >= 0 ? enemyPos(ei) : fi >= 0 && enterT !== null ? ALLY_POS[fi] : null;
        if (!p) return;
        const scale = ei >= 0 ? p.scale : ALLY_SCALE;
        const y = p.y - ART[u.art].h * scale * artFit(ART[u.art]) - 30 + Math.sin(t * 8) * 2;
        text(ctx, '▼', p.x, y, { size: 16, align: 'center', bold: true, color: COLORS.accent });
    }

    function drawBottom(ctx) {
        ctx.fillStyle = '#16203a';
        ctx.fillRect(0, 0, 320, 240);
        if (mg && (mg.phase === 'cmd' || mg.phase === 'result')) {
            mg.cmd.drawBottom(ctx, t);
            if (mg.phase === 'result') {
                ctx.fillStyle = 'rgba(0,0,0,0.55)';
                ctx.fillRect(0, 0, 320, 240);
                text(ctx, mg.cmd.done.label, 160, 130, { size: 30, align: 'center', bold: true, color: mg.mult > 1 ? COLORS.accent : '#ffffff' });
                if (mg.mult > 1) text(ctx, mg.rescue ? 'とりつきが ぬけて HP も 少し 回復' : '必殺技の 威力が アップ！', 160, 160, { size: 13, align: 'center', bold: true, color: COLORS.accent });
            }
            return;
        }
        if (battle.waiting || battle.outcome === 'flee') {
            drawIntro(ctx);
            if (menu) drawMenu(ctx);
            return;
        }
        drawWheel(ctx);
        drawSpecialButtons(ctx);
        button(ctx, { ...FAST_BTN, label: g.fastBattle ? '倍速 ON' : '倍速' }, { active: Boolean(g.fastBattle), size: 10.5 });
        const lockedE = battle.lock && battle.lockPart ? battle.enemies.find(e => e.uid === battle.lock) : null;
        const lockedPart = lockedE ? lockedE.parts?.[battle.lockPart] || lockedE.gims?.[battle.lockPart] : null;
        text(ctx, lockedPart ? `ねらい: ${lockedPart.name} (↑↓で かえる)` : battle.lock ? 'ねらい中 (もう いちどで はずす)' : 'ねらう: ↑↓・上の 敵を タップ', 66, 17, { size: 9, color: battle.lock ? '#ff9a9a' : COLORS.dim, maxWidth: 134 });
        text(ctx, btn('fast'), FAST_BTN.x + FAST_BTN.w / 2, FAST_BTN.y + FAST_BTN.h + 10, { size: 9, align: 'center', color: COLORS.dim });
        if (menu) drawMenu(ctx);
    }

    return { name: 'battle', update, drawTop, drawBottom, battle, debug: { ecut: () => ecut, swirl: () => swirlT, motions, effects, mg: () => mg, menu: () => menu, intro: () => (battle.waiting ? introIndex : null), allyShown: () => enterT !== null, appearText: () => appearText } };
}
