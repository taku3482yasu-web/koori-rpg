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
import { specialOf, createCommand, drawPerformance, drawCutin, MOTION_TIME, COMMANDS, COMMAND_NAMES } from './special-fx.js';
import { skillMotion, skillPose, drawSkillFx, SKILL_KIND } from './skill-fx.js';
import { ITEMS } from '../data/items.js';
import { ELEMENT_COLORS } from '../data/nakama.js';
import { COLORS, drawArt, artFit, panel, text, bar, button, hit, roundRect, drawFriendMark } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { btn } from '../core/keys.js';
import { step, rotate, canSpecial, startSpecial, resolveSpecial, useItem, throwFood, GAUGE_MAX, STATUS_NAMES, rescueTargets, startRescue, resolveRescue, lockOn, weakActive, PART_ORDER, begin, flee, canFlee } from '../logic/battle.js';

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
const HORIZON = 70;
const RIVER = ['kawara', 'kawaraN', 'kawaraS', 'hashiue', 'hashishita', 'kawakami', 'bridge'];

export function createBattleView(app, battle, place) {
    const g = app.g;
    let t = 0, endT = 0;
    let shownRot = battle.rot;     // 輪の 回る アニメーション
    let cursor = 0;                // 必殺技を えらぶ カーソル (前の 3 体)
    let menu = null;               // { kind: 'item' | 'food', index, pick: null | { id, index } (だれに 使うか えらぶ) }
    let mg = null;                 // 必殺技 (コマンド → カットイン → 動き)
    let drag = null;
    let banner = null;             // { text, color, until }
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
        if (n === 1 && main[0].parts) return { x: 200, y: 156, scale: 6.5 };
        // 人の 絵の ように 背の 高い ボス (4 章の 浦の島重蔵) は 名前と HP が 画面に 入るように 少し 小さく
        if (n === 1) return main[0].boss ? { x: 200, y: 142, scale: ART[main[0].art].h > 24 ? 3.6 : 5 } : { x: 200, y: 132, scale: 3.5 };
        if (n === 2) return [{ x: 140, y: 126, scale: 3 }, { x: 262, y: 136, scale: 3 }][i];
        return [{ x: 84, y: 132, scale: 2.8 }, { x: 200, y: 120, scale: 2.8 }, { x: 316, y: 132, scale: 2.8 }][i];   // 3 体 (まんなかが 奥)
    };
    function posOf(uid) {
        const fi = battle.front().findIndex(u => u && u.uid === uid);
        if (fi >= 0) return ALLY_POS[fi];
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
    function startHurt(uid, fromUid, ko = false) {
        const a = posOf(uid), b = fromUid ? posOf(fromUid) : null;
        const u = unitOf(uid);
        let dx = 0, dy = u && u.side === 'ally' ? 1 : -1;
        if (a && b) {
            const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
            dx = (a.x - b.x) / d;
            dy = (a.y - b.y) / d;
        }
        const power = ko ? 16 : 9;
        motions[uid] = { kind: ko ? 'ko' : 'hurt', start: t, dur: ko ? 0.6 : 0.4, dx: dx * power, dy: dy * power };
    }
    // ずれ (ox, oy) と のびちぢみ (sx, sy)
    function offsetOf(u) {
        let ox = 0, oy = 0, sx = 1, sy = 1;
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
                const f = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
                ox += m.dx * f;
                oy += m.dy * f;
                sy = 1 - 0.22 * f;
                sx = 1 + 0.14 * f;
            } else if (m.kind === 'ko') {
                const f = Math.min(1, k / 0.3);
                ox += m.dx * f;
                oy += m.dy * f;
                sy = 1 - 0.45 * f;
                sx = 1 + 0.2 * f;
            }
        }
        if ((shakes[u.uid] || 0) > t) ox += Math.sin(t * 70) * 2.5;
        return { ox, oy, sx, sy };
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
        const list = battle.events.splice(0);
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
                if (e.type === 'guard') { const c = centerOf(e.actor); if (c) effects.push({ kind: 'shield', x: c.x, y: c.y, start: t, dur: 0.5 }); }
            }
            if (e.type === 'damage') {
                const p = posOf(e.target), from = centerOf(actor), to = centerOf(e.target);
                const delay = actor ? (kind === 'skill' ? skillHit : HIT_DELAY[kind]) : 0;
                const color = actor ? ELEMENT_COLORS[unitOf(actor)?.element] || '#ffffff' : '#ffffff';
                // わざは わざごとの 絵 (skill-fx.js) が 飛ぶ。玉は 敵の 必殺技だけ
                if (actor && kind === 'special' && from && to) effects.push({ kind: 'orb', from, to, start: t + (kind === 'special' ? 0.3 : 0.05), dur: delay - (kind === 'special' ? 0.3 : 0.05), color });
                const by = actor;
                at(delay, () => {
                    if (p) pops.push({ x: p.x + (Math.random() * 16 - 8), y: p.y - 40, text: String(e.amount), color: e.headGuard ? '#8a90a8' : e.eff > 1 ? '#ffd84a' : e.eff < 1 ? '#a0a0b0' : '#ffffff', big: e.crit || e.eff > 1, until: t + 0.9 });
                    if (p && e.weak) pops.push({ x: p.x, y: p.y - 70, text: 'じゃくてん！', color: '#ffe85a', small: true, until: t + 0.9 });
                    flash[e.target] = t + 0.15;
                    if (!motions[e.target] || motions[e.target].kind !== 'ko') startHurt(e.target, by, unitOf(e.target)?.ko);
                    if (to) effects.push({ kind: 'spark', x: to.x, y: to.y, start: t, dur: 0.3, color: kind === 'attack' ? '#ffffff' : color });
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
                at(actor ? (kind === 'skill' ? skillHit : HIT_DELAY[kind]) : 0, () => { if (p) pops.push({ x: p.x, y: p.y - 56, text: STATUS_NAMES[e.status], color: '#ff9ad8', until: t + 1 }); });
            } else if (e.type === 'special') {
                banner = { text: `${nameOf(e.actor)}の「${e.name}」！`, color: e.side === 'ally' ? COLORS.accent : '#ff6a6a', until: t + 1.4 };
                sfx('special');
                const c = centerOf(e.actor), p = posOf(e.actor);
                if (c && p && kind !== 'perf') at(0.62, () => effects.push({ kind: 'wave', x: p.x, y: p.y, start: t, dur: 0.45, color: ELEMENT_COLORS[unitOf(e.actor)?.element] || '#ffffff' }));
                if (e.big) warn = null;
            } else if (e.type === 'partBreak') {
                // 部位を こわした (2 章の 影)
                banner = { text: `${e.name}を こわした！${e.move ? `「${e.move}」が 使えない！` : ''}`, color: COLORS.accent, until: t + 1.8 };
                sfx('big');
                const k = battle.enemies.findIndex(x => x.uid === e.target), pp = k >= 0 ? partPos(k, e.part) : null;
                if (pp) effects.push({ kind: 'wave', x: pp.x, y: pp.y + 10, start: t, dur: 0.5, color: '#ffe85a' });
            } else if (e.type === 'chance') {
                sfx('special');
            } else if (e.type === 'stunned') {
                const p = posOf(e.actor);
                if (p) pops.push({ x: p.x, y: p.y - 112, text: 'うごけない！', color: '#ffe85a', until: t + 1 });
            } else if (e.type === 'chanceEnd') {
                banner = { text: 'こわした ところが もとに もどった！', color: '#ff6a6a', until: t + 1.8 };
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
                if (p) pops.push({ x: p.x, y: p.y - 62, text: e.mode === 'lazy' ? 'とりつかれて なまけている…' : 'とりつかれて 味方を こうげき！', color: '#c88aff', small: true, until: t + 1.2 });
            } else if (e.type === 'rescue') {
                banner = { text: e.ok ? `おたすけ せいこう！ ${nameOf(e.target)}が もとに もどった！` : 'おたすけ しっぱい… すこし まってから もう いちど', color: e.ok ? '#7aff8a' : '#c88aff', until: t + 1.6 };
                sfx(e.ok ? 'heal' : 'cancel');
            } else if (e.type === 'telegraph') {
                warn = { name: e.name, until: t + e.warn, idols: Boolean(e.idols) };
                sfx('cancel');
            } else if (e.type === 'summon') {
                // 氷の 偶像が できた (3 章の ダムの主)
                banner = { text: `${nameOf(e.target)}が あらわれた！`, color: '#bfeaff', until: t + 1.4 };
                sfx('lens');
                const p = posOf(e.target);
                if (p) effects.push({ kind: 'wave', x: p.x, y: p.y, start: t, dur: 0.5, color: '#bfeaff' });
            } else if (e.type === 'bigCancel') {
                warn = null;
                banner = { text: `偶像を こわした！「${e.name}」を 止めた！`, color: COLORS.accent, until: t + 2 };
                sfx('big');
            } else if (e.type === 'food') {
                banner = { text: e.favorite ? `${ITEMS[e.itemId].name}を 投げた！ とても よろこんでいる！` : `${ITEMS[e.itemId].name}を 投げた！`, color: '#ff9ad8', until: t + 1.6 };
                sfx(e.favorite ? 'friend' : 'ok');
            } else if (e.type === 'item') sfx('heal');
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
        const color = ELEMENT_COLORS[(move.effects || []).find(f => f.element)?.element || u.element] || '#ffffff';
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
        const sp = specialOf(unit.id);
        const command = app.rng.pick(COMMANDS);   // コマンドは 毎回 ランダム
        mg = { unit, pos, sp, command, phase: 'cmd', t: 0, cmd: createCommand(command, app.rng), mult: 1, resolved: false };
        sfx('ok');
    }
    // ロックオン: 生きている 敵 (部位の ある ボスは こわれていない 部位) + 「ねらわない」を 順に
    let guardTold = -9;
    function cycleLock(dir) {
        const list = [null, ...battle.enemiesAlive().flatMap(e => (e.parts
            ? PART_ORDER.filter(k => !e.parts[k].broken).map(part => ({ uid: e.uid, part }))
            : [{ uid: e.uid, part: null }]))];
        const i = list.findIndex(x => (x ? x.uid === battle.lock && x.part === battle.lockPart : !battle.lock));
        const next = list[(i + dir + list.length) % list.length];
        if (next) lockOn(battle, next.uid, next.part);
        else if (battle.lock) lockOn(battle, battle.lock, battle.lockPart);
        sfx('cursor');
    }
    // 部位の 場所 (上画面)。右手は 見ている 人の 左
    function partPos(k, key) {
        const p = enemyPos(k), e = battle.enemies[k], art = ART[e.art];
        const fk = p.scale * artFit(art), h = art.h * fk, side = art.w * fk / 2 + 26;
        const bob = Math.sin(t * 3 + (key === 'lhand' ? 1.5 : 0)) * 3;
        if (key === 'rhand') return { x: p.x - side, y: p.y - h * 0.42 + bob };
        if (key === 'lhand') return { x: p.x + side, y: p.y - h * 0.42 + bob };
        return { x: p.x, y: p.y - h * 0.72 };
    }
    function hitPartAt(k, x, y) {
        const e = battle.enemies[k];
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

    // おたすけ (2 章): 後ろの とりつかれた なかまを コマンドで 治す。成功 (大成功を ふくむ) で 治る
    function tryRescue() {
        const u = rescueTargets(battle)[0];
        if (!u) { sfx('cancel'); return; }
        const unit = startRescue(battle, u.uid);
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
                resolveRescue(battle, mg.unit, mg.mult >= 1);
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
    const owned = () => Object.keys(ITEMS).filter(id => (g.items[id] || 0) > 0);
    const menuTargets = () => menu.kind === 'item'
        ? [0, 1, 2, 3, 4, 5].map(i => battle.wheel[(battle.rot + i) % 6]).filter(u => u && !u.ko)
        : battle.enemiesAlive();
    function useMenu(id, uid) {
        const ok = menu.kind === 'item' ? useItem(battle, id, uid) : throwFood(battle, id, uid);
        if (ok) { g.items[id]--; menu = null; sfx('ok'); } else sfx('cancel');
    }
    function pickItem(id) {
        const list = menuTargets();
        if (list.length === 1) { useMenu(id, list[0].uid); return; }
        // どうぐは HP の 少ない なかまに カーソルを 合わせて おく
        const start = menu.kind === 'item' ? list.reduce((a, u, i) => (u.hp / u.max < list[a].hp / list[a].max ? i : a), 0) : 0;
        menu.pick = { id, index: start };
        sfx('ok');
    }
    function updatePick(input) {
        const list = menuTargets();
        if (input.pressed.b) { menu.pick = null; sfx('cancel'); return; }
        if (!list.length) { menu = null; return; }
        const p = menu.pick;
        p.index = Math.min(p.index, list.length - 1);
        if (input.pressed.up || input.pressed.left) { p.index = (p.index + list.length - 1) % list.length; sfx('cursor'); }
        if (input.pressed.down || input.pressed.right) { p.index = (p.index + 1) % list.length; sfx('cursor'); }
        if (input.pressed.a) { useMenu(p.id, list[p.index].uid); return; }
        if (input.touch.justDown) {
            const i = list.findIndex((_, k) => hit(menuRow(k), input.touch.x, input.touch.y));
            if (i >= 0) useMenu(p.id, list[i].uid);
            else if (!hit({ x: 20, y: 14, w: 280, h: 212 }, input.touch.x, input.touch.y)) { menu.pick = null; sfx('cancel'); }
        }
    }
    function updateMenu(input) {
        if (menu.pick) { updatePick(input); return; }
        const list = owned();
        if (input.pressed.b || (menu.kind === 'item' && input.pressed.y) || (menu.kind === 'food' && input.pressed.x)) { menu = null; sfx('cancel'); return; }
        if (!list.length) return;
        if (input.pressed.up) { menu.index = (menu.index + list.length - 1) % list.length; sfx('cursor'); }
        if (input.pressed.down) { menu.index = (menu.index + 1) % list.length; sfx('cursor'); }
        menu.index = Math.min(menu.index, list.length - 1);
        if (input.pressed.a) pickItem(list[menu.index]);
        if (input.touch.justDown) {
            const i = list.findIndex((_, k) => hit(menuRow(k), input.touch.x, input.touch.y));
            if (i >= 0) pickItem(list[i]);
            else if (!hit({ x: 20, y: 20, w: 280, h: 200 }, input.touch.x, input.touch.y)) menu = null;
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
        else if (key === 'item') { menu = { kind: 'item', index: 0 }; sfx('ok'); }
        else if (key === 'food') {
            if (battle.kind !== 'wild') { banner = { text: 'この あいてには おやつを 投げられない', color: '#ff6a6a', until: t + 1.2 }; sfx('cancel'); return; }
            menu = { kind: 'food', index: 0 };
            sfx('ok');
        } else if (key === 'run') {
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
        t += dt;
        g.playTime += dt;
        runLater();
        if (mg) { updateMinigame(dt, input); readEvents(); return; }
        // はじまり: たたかう・どうぐ・おやつ・にげる を えらぶ あいだは バトルは 止まっている
        if (battle.waiting && !battle.outcome) {
            if (menu) updateMenu(input);
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
        if (input.pressed.y) { menu = { kind: 'item', index: 0 }; sfx('ok'); }
        if (input.pressed.x && battle.kind === 'wild') { menu = { kind: 'food', index: 0 }; sfx('ok'); }
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
            else if (sp >= 0) { cursor = sp; trySpecial(sp); } else if (hit(ITEM_BTN, tc.x, tc.y)) { menu = { kind: 'item', index: 0 }; sfx('ok'); } else if (hit(FOOD_BTN, tc.x, tc.y) && battle.kind === 'wild') { menu = { kind: 'food', index: 0 }; sfx('ok'); } else if (Math.hypot(tc.x - WHEEL.x, tc.y - WHEEL.y) < WHEEL.r + 30) {
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
    // 夜の 学校 (2 章): くらい かべと 窓、木の ゆか
    function drawSchoolBackground(ctx) {
        ctx.fillStyle = '#2a2438';
        ctx.fillRect(0, 0, 400, HORIZON);
        for (let i = 0; i < 4; i++) {
            const x = 30 + i * 96;
            ctx.fillStyle = '#141a3a';
            ctx.fillRect(x, 14, 56, 40);
            ctx.fillStyle = '#6a5a7a';
            ctx.fillRect(x + 27, 14, 2, 40);
            ctx.fillRect(x, 33, 56, 2);
        }
        ctx.fillStyle = '#fff6c8';
        ctx.beginPath();
        ctx.arc(76, 26, 6, 0, Math.PI * 2);
        ctx.fill();
        const gg = ctx.createLinearGradient(0, HORIZON, 0, 240);
        gg.addColorStop(0, '#6a4a2a');
        gg.addColorStop(1, '#b08a5a');
        ctx.fillStyle = gg;
        ctx.fillRect(0, HORIZON, 400, 240 - HORIZON);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(0, HORIZON, 400, 4);
        ctx.strokeStyle = 'rgba(60, 30, 10, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -6; i <= 6; i++) { ctx.moveTo(200 + i * 14, HORIZON); ctx.lineTo(200 + i * 90, 240); }
        ctx.stroke();
    }

    // 浦の島の海岸どうくつの 中 (4 章): くらい 岩の かべと しおだまり
    function drawCaveBackground(ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, HORIZON);
        grad.addColorStop(0, '#141820');
        grad.addColorStop(1, '#2a3440');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, HORIZON);
        // 岩の でこぼこと つらら石
        ctx.fillStyle = '#3a4654';
        for (let i = 0; i < 9; i++) ctx.fillRect(i * 46 - 8, HORIZON - 18 - (i % 3) * 9, 40, 30);
        ctx.fillStyle = '#222a34';
        for (let i = 0; i < 12; i++) { const x = i * 35 + 6; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 8, 0); ctx.lineTo(x + 4, 10 + (i % 4) * 6); ctx.fill(); }
        const gg = ctx.createLinearGradient(0, HORIZON, 0, 240);
        gg.addColorStop(0, '#3a4048');
        gg.addColorStop(1, '#6a7078');
        ctx.fillStyle = gg;
        ctx.fillRect(0, HORIZON, 400, 240 - HORIZON);
        // しおだまり (きらきら)
        ctx.fillStyle = 'rgba(60, 140, 200, 0.55)';
        ctx.beginPath(); ctx.ellipse(70, 200, 50, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(340, 170, 40, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let i = 0; i < 4; i++) ctx.fillRect(40 + i * 20 + Math.sin(t * 2 + i) * 4, 198, 6, 1);
    }

    function drawBackground(ctx) {
        if (place === 'school') { drawSchoolBackground(ctx); return; }
        if (place === 'cave') { drawCaveBackground(ctx); return; }
        const river = RIVER.includes(place);
        const sky = g.time === 3 ? ['#141a3a', '#2a2a5a'] : g.time === 2 ? ['#f08a4a', '#f8c070'] : ['#7ac8f8', '#c8ecff'];
        const grad = ctx.createLinearGradient(0, 0, 0, HORIZON);
        grad.addColorStop(0, sky[0]);
        grad.addColorStop(1, sky[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, HORIZON);
        const yama = place === 'yama' || place === 'dam';
        if (yama) {
            // 遠くの 山 (てっぺんに 雪)。3 章
            for (const [x, w, h] of [[-20, 160, 62], [90, 200, 80], [250, 190, 66], [340, 140, 50]]) {
                const top = HORIZON - h;
                ctx.fillStyle = 'rgba(50, 80, 110, 0.55)';
                ctx.beginPath(); ctx.moveTo(x, HORIZON); ctx.lineTo(x + w / 2, top); ctx.lineTo(x + w, HORIZON); ctx.fill();
                ctx.fillStyle = 'rgba(240, 248, 255, 0.85)';
                ctx.beginPath(); ctx.moveTo(x + w / 2 - w * 0.09, top + h * 0.18); ctx.lineTo(x + w / 2, top); ctx.lineTo(x + w / 2 + w * 0.09, top + h * 0.18); ctx.fill();
            }
        } else if (place === 'umi') {
            // 水平線の 海と きらきら (4 章)
            ctx.fillStyle = '#2a7ac0';
            ctx.fillRect(0, HORIZON - 22, 400, 22);
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            for (let i = 0; i < 7; i++) ctx.fillRect((i * 67 + t * 12) % 420 - 10, HORIZON - 18 + (i % 3) * 6, 10, 1);
        } else {
            // 遠くの 町
            ctx.fillStyle = 'rgba(40, 60, 90, 0.25)';
            [[20, 34, 40], [70, 46, 30], [300, 28, 50], [360, 44, 30]].forEach(([x, y, w]) => ctx.fillRect(x, y, w, HORIZON - y));
        }
        // 地面 (手前ほど 明るく)。ダムは こおった 湖の 底・海辺は 砂浜
        const ground = river ? ['#2a6aa8', '#4aa0e0'] : place === 'park' ? ['#c8b880', '#f0e0a8'] : place === 'dam' ? ['#7aa8c0', '#c8e6f2'] : place === 'umi' ? ['#d0b878', '#f0e0a8'] : ['#4a9a3a', '#7ad05a'];
        const gg = ctx.createLinearGradient(0, HORIZON, 0, 240);
        gg.addColorStop(0, ground[0]);
        gg.addColorStop(1, ground[1]);
        ctx.fillStyle = gg;
        ctx.fillRect(0, HORIZON, 400, 240 - HORIZON);
        ctx.fillStyle = river ? '#c8c0b0' : 'rgba(0,0,0,0.12)';
        ctx.fillRect(0, HORIZON, 400, 4);
        // 奥行きの 線 (まんなかの 奥に 集まる)
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -6; i <= 6; i++) { ctx.moveTo(200 + i * 12, HORIZON); ctx.lineTo(200 + i * 80, 240); }
        for (let k = 1; k <= 5; k++) { const y = HORIZON + (240 - HORIZON) * Math.pow(k / 5, 1.8); ctx.moveTo(0, y); ctx.lineTo(400, y); }
        ctx.stroke();
        if (river) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            for (let i = 0; i < 8; i++) ctx.fillRect((i * 61 + t * 20) % 420 - 20, HORIZON + 20 + (i * 17) % 140, 18, 2);
        }
    }

    // back: うしろ姿 (味方)
    function drawUnit(ctx, u, p, { scale = 3, flip = false, back = false } = {}) {
        if (!u || (u.idol && u.ko)) return;   // こわれた 偶像は きえる
        const lit = (flash[u.uid] || 0) > t;
        const sleeping = u.status.sleep > 0;
        const bobY = u.ko ? 0 : Math.sin(t * 3 + p.x) * 1.5;
        // 動き (飛びこむ・はねる) の ぶん ずらす。影は 地面に 残す (ジャンプが 分かるように)
        const { ox, oy, sx, sy } = offsetOf(u);
        const ground = { x: p.x + ox, y: Math.max(p.y, p.y + oy) };
        p = { ...p, x: p.x + ox, y: p.y + oy };
        const lift = Math.max(0, ground.y - p.y);
        ctx.fillStyle = `rgba(0,0,0,${0.25 * Math.max(0.4, 1 - lift / 40)})`;
        ctx.beginPath();
        ctx.ellipse(ground.x, ground.y + 2, 8 * scale / 3 * 2, 3 * scale / 3 * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // うしろ姿: 描いた 絵 (back-art.js) が なければ 顔を 消して 作る (back.js)
        const art = back ? BACK_ART[u.art] || backArt(ART[u.art]) : ART[u.art];
        drawArt(ctx, art, sleeping || u.ko ? 0 : Math.floor(t * 2), p.x, p.y + bobY, { scale, flip, alpha: u.ko ? 0.35 : u.idol ? 0.75 : 1, tint: lit ? '#ffffff' : null, sx, sy });
        // 氷の 偶像: 水色の 氷を 重ねる
        if (u.idol) drawArt(ctx, art, 0, p.x, p.y + bobY, { scale, flip, alpha: 0.45 + Math.sin(t * 4) * 0.08, tint: '#cdf2ff', sx, sy });
        const w = u.parts ? 150 : 44, head = p.y - art.h * scale * artFit(art);
        // 名前と HP は 頭の 上 (手前の 味方と 奥の 敵の 名前が 重ならないように)
        const barY = head - 10, nameY = head - 14;
        bar(ctx, p.x - w / 2, barY, w, 4, u.hp / u.max, u.hp / u.max < 0.3 ? COLORS.hpLow : COLORS.hp);
        text(ctx, u.idol ? u.name : `${u.name} Lv${u.lv}`, p.x, nameY, { size: 9.5, align: 'center' });
        // もう 仲間に した 敵は HP の 右に 金の メダル (2026-10-28 ユーザー指定)
        if (u.side === 'enemy' && g.zukan.friends[u.id]) drawFriendMark(ctx, p.x + w / 2 + 8, barY + 3, 5);
        const marks = Object.keys(u.status).map(k => STATUS_NAMES[k]);
        if (u.ko) marks.push('たおれた');
        if (marks.length) text(ctx, marks.join(' '), p.x, head - 26, { size: 9.5, align: 'center', color: '#ff9ad8', bold: true });
        // まもり (次に 動くまで) と、必殺技などの 強化 (切れるまで) を 出しつづける (2026-10-28 ユーザー指定)
        if (u.ko) return;
        const guards = [];
        if (u.guarding) guards.push('まもり');
        for (const [k, b] of Object.entries(u.buffs)) if (b.t > 0 && BUFF_NAMES[k]) guards.push(BUFF_NAMES[k]);
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
        const lit = (flash[e.uid] || 0) > t;
        for (const key of ['rhand', 'lhand']) {
            const pt = e.parts[key], q = partPos(k, key);
            ctx.save();
            ctx.translate(q.x, q.y);
            ctx.scale(key === 'lhand' ? -1 : 1, 1);
            ctx.globalAlpha = pt.broken ? 0.25 : 1;
            ctx.fillStyle = lit && !pt.broken ? '#ffffff' : '#1a1430';
            ctx.beginPath();
            ctx.ellipse(0, 4, 15, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            for (let i = 0; i < 3; i++) ctx.fillRect(-13 + i * 9, -16, 6, 16);
            ctx.fillRect(10, -2, 11, 6);
            ctx.fillStyle = '#ffe080';
            for (let i = 0; i < 3; i++) ctx.fillRect(-13 + i * 9, -19, 6, 3);
            ctx.restore();
            if (pt.broken) text(ctx, '×', q.x, q.y + 10, { size: 22, align: 'center', bold: true, color: '#ff6a6a' });
            else bar(ctx, q.x - 16, q.y + 20, 32, 4, pt.hp / pt.max, '#ffb84a');
            text(ctx, pt.name, q.x, q.y + 34, { size: 9, align: 'center', bold: true, color: pt.broken ? COLORS.dim : '#ffe0b0' });
        }
        const head = e.parts.head, q = partPos(k, 'head');
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
        drawBackground(ctx);
        battle.enemies.forEach((e, i) => drawUnit(ctx, e, enemyPos(i), { scale: enemyPos(i).scale }));
        battle.enemies.forEach((e, i) => { if (e.parts && !e.ko) drawParts(ctx, e, i); });
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
        drawEffects(ctx);
        if (!battle.outcome) drawLock(ctx);
        drawPickArrow(ctx);
        for (let i = pops.length - 1; i >= 0; i--) {
            const p = pops[i];
            if (p.until < t) { pops.splice(i, 1); continue; }
            const k = 1 - (p.until - t) / 0.9;
            text(ctx, p.text, p.x, p.y - k * 14, { size: p.big ? 16 : p.small ? 10.5 : 13, align: 'center', bold: true, color: p.color });
        }
        // チャンスタイム (ボスが うごけない あいだ ずっと 出す。2026-10-28 ユーザー指定)
        if (battle.chance && !battle.outcome) {
            panel(ctx, 90, 6, 220, 46, { fill: 'rgba(90, 40, 0, 0.88)', edge: '#ffe85a' });
            text(ctx, 'チャンスタイム！', 200, 32, { size: 24, align: 'center', bold: true, color: Math.floor(t * 6) % 2 ? '#ffe85a' : '#ffa83a' });
            text(ctx, `ボスが うごけない！ あと ${battle.chance.left} 回`, 200, 47, { size: 10.5, align: 'center', bold: true });
        } else if (warn && warn.idols && battle.charge && !battle.outcome) {
            // 偶像で ためる 必殺技: こわせば 止まる
            panel(ctx, 30, 8, 340, 40, { fill: 'rgba(120, 10, 20, 0.9)', edge: '#ff6a6a' });
            text(ctx, `!! 必殺技「${warn.name}」を ためている！`, 200, 25, { size: 13, align: 'center', bold: true });
            text(ctx, `氷の偶像を こわせば 止められる！ (${Math.max(0, battle.charge.left).toFixed(1)})`, 200, 41, { size: 11, align: 'center', color: '#ffd0d0' });
        } else if (warn && !warn.idols && warn.until > t) {
            panel(ctx, 30, 8, 340, 40, { fill: 'rgba(120, 10, 20, 0.9)', edge: '#ff6a6a' });
            text(ctx, `!! 大技「${warn.name}」が くる！`, 200, 25, { size: 13, align: 'center', bold: true });
            text(ctx, `輪を まわして じょうぶな なかまを 前に！ (${Math.max(0, warn.until - t).toFixed(1)})`, 200, 41, { size: 11, align: 'center', color: '#ffd0d0' });
        } else if (banner && banner.until > t) {
            panel(ctx, 40, 12, 320, 26, { fill: 'rgba(16,22,42,0.9)', edge: banner.color });
            text(ctx, banner.text, 200, 30, { size: 13, align: 'center', bold: true, color: banner.color });
        }
        if (battle.waiting && !battle.outcome) {
            panel(ctx, 30, 176, 340, 50, { fill: 'rgba(16,22,42,0.92)', edge: '#ffffff' });
            text(ctx, appearText, 200, 208, { size: 16, align: 'center', bold: true, maxWidth: 320 });
        }
        // 最後の 一撃の 動きが 見えるように、少し 待ってから「かった！」
        if (battle.outcome && battle.outcome !== 'flee' && endT > 0.5) {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(0, 0, 400, 240);
            text(ctx, battle.outcome === 'win' ? 'かった！' : 'まけた……', 200, 128, { size: 34, align: 'center', bold: true, color: battle.outcome === 'win' ? COLORS.accent : '#a0b0d0' });
        }
        if (mg) drawMinigameTop(ctx);
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
        text(ctx, mg.rescue ? `おたすけ: ${u.name}を もとに もどせ！` : `必殺技「${u.special.name}」`, 200, 30, { size: mg.rescue ? 16 : 18, align: 'center', bold: true, color: mg.rescue ? '#e0b0ff' : COLORS.accent });
        text(ctx, COMMAND_NAMES[mg.command], 200, 52, { size: 13, align: 'center', bold: true });
        if (mg.phase === 'result') text(ctx, mg.cmd.done.label, 200, 216, { size: 26, align: 'center', bold: true, color: mg.mult > 1 ? COLORS.accent : '#ffffff' });
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
            // とりつかれている なかまには むらさきの 印
            if (!u.ko && u.status.possess > 0) {
                ctx.strokeStyle = '#c88aff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 24 + Math.sin(t * 6) * 1.5, 0, Math.PI * 2);
                ctx.stroke();
                text(ctx, 'とりつき', x, y - 24, { size: 8.5, align: 'center', bold: true, color: '#e0b0ff' });
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
        const list = owned();
        if (!list.length) text(ctx, 'なにも もっていない', 160, 110, { size: 13, align: 'center', color: COLORS.sub });
        list.forEach((id, k) => {
            const r = menuRow(k);
            if (k === menu.index) { roundRect(ctx, r.x, r.y, r.w, r.h, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
            text(ctx, `${ITEMS[id].name}`, r.x + 10, r.y + 17, { size: 13 });
            text(ctx, `×${g.items[id]}`, r.x + r.w - 10, r.y + 17, { size: 13, align: 'right' });
        });
        text(ctx, `${btn('b')} で とじる　(えらんでいる あいだ バトルは 止まる)`, 160, 220, { size: 10, align: 'center', color: COLORS.dim });
    }

    // だれに 使うか (名前・Lv・HP。どうぐは 前 / 後ろ も)
    function drawPick(ctx) {
        const item = ITEMS[menu.pick.id], list = menuTargets();
        text(ctx, menu.kind === 'item' ? `${item.name}を だれに 使う？` : `${item.name}を どの 敵に 投げる？`, 160, 34, { size: 11.5, align: 'center', bold: true, color: COLORS.accent });
        const front = battle.front();
        list.forEach((u, k) => {
            const r = menuRow(k);
            if (k === menu.pick.index) { roundRect(ctx, r.x, r.y, r.w, r.h, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
            if (menu.kind === 'item') text(ctx, front.includes(u) ? 'まえ' : 'うしろ', r.x + 8, r.y + 16, { size: 9.5, color: front.includes(u) ? COLORS.accent : COLORS.sub, bold: true });
            text(ctx, `${u.name} Lv${u.lv}`, r.x + 44, r.y + 17, { size: 12, maxWidth: 120 });
            if (u.side === 'enemy' && g.zukan.friends[u.id]) drawFriendMark(ctx, r.x + 36, r.y + 12, 4);
            bar(ctx, r.x + 170, r.y + 9, 60, 6, u.hp / u.max, u.hp / u.max < 0.3 ? COLORS.hpLow : COLORS.hp);
            text(ctx, `${Math.ceil(u.hp)}`, r.x + r.w - 6, r.y + 17, { size: 10, align: 'right', color: COLORS.sub });
        });
        text(ctx, `${btn('a')} で 使う・${btn('b')} で もどる`, 160, 220, { size: 10, align: 'center', color: COLORS.dim });
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
        const lockedPart = battle.lock && battle.lockPart ? battle.enemies.find(e => e.uid === battle.lock)?.parts?.[battle.lockPart] : null;
        text(ctx, lockedPart ? `ねらい: ${lockedPart.name} (↑↓で かえる)` : battle.lock ? 'ねらい中 (もう いちどで はずす)' : 'ねらう: ↑↓・上の 敵を タップ', 66, 17, { size: 9, color: battle.lock ? '#ff9a9a' : COLORS.dim, maxWidth: 134 });
        text(ctx, btn('fast'), FAST_BTN.x + FAST_BTN.w / 2, FAST_BTN.y + FAST_BTN.h + 10, { size: 9, align: 'center', color: COLORS.dim });
        if (menu) drawMenu(ctx);
    }

    return { name: 'battle', update, drawTop, drawBottom, battle, debug: { motions, effects, mg: () => mg, menu: () => menu, intro: () => (battle.waiting ? introIndex : null), allyShown: () => enterT !== null, appearText: () => appearText } };
}
