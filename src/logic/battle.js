// =====================================================================
// バトル (設計書 3 章): なかまは 自動で 戦い、プレイヤーは 輪を 回す・必殺技を 打つ・道具を 使う
// ---------------------------------------------------------------------
// なかまが 自分で えらぶ コマンドは 5 つ (2026-10-27 ユーザー指定): 通常攻撃・わざ・さぼり・まもり・術。
//   えらびやすさは 役割で 変わる (ACTION_W)。まもりは 次に 動くまで 受ける ダメージが 半分
// 画面に ふれない。view/battle-view.js が 毎コマ step(dt) を 呼び、events を 読んで 絵と 音を 出す。
//
//   wheel: おなかまウォッチに セットした 6 枚 (null は あき)。前の 3 体 = wheel[rot], wheel[rot+1], wheel[rot+2]
//   なかまは spd で 決まる 間かくで 動く。ゲージ (100) が たまると 必殺技が 打てる (ミニゲームの 結果で 威力が 変わる)
//   後ろの なかまは 少しずつ HP が 戻る。前の 3 体が 全員 たおれたら 2 秒後に 自動で 半分 回す
//   ボスは 大技の 前に 予告 (telegraph) を 出す。そのあいだに 輪を 回して 守りの 強い なかまを 前に 出せる
//   とりつき (2 章。設計書 3.4): ねむり・のろい・こんらん・どく・いたずら・めくらまし は ぜんぶ「とりつき」(2026-10-30 ユーザー指定)。
//     いたずらの とりつきは なまけたり 味方を 攻めたり する。めくらましの とりつきは 攻撃が 当たりにくい。
//     輪で 後ろに 回して「おはらい」(ミニゲーム) で ぜんぶ 治す。時間でも ぬける
//   ロックオン (設計書 3.2): プレイヤーが ねらう 敵を えらぶ。味方の 1 体ねらいの 攻撃は その 敵へ。
//     ねらった 敵には 6 秒ごとに 2 秒「弱点の 光」が 出て、そのあいだに 当てると ダメージ +20%
//   はじまり (2026-10-29 ユーザー指定): intro の バトルは「○○が あらわれた！」で 止まって 待つ (waiting)。
//     たたかう (begin)・どうぐ・おやつ の どれかで 始まる。にげる (flee) は 特別な バトル (ボス・七不思議) では できない
//   部位の ある ボス (2 章の 影): 右手・左手・頭を ロックオンで ねらって こわす。頭を こわすと チャンスタイム
//     (ボスが 決まった 回数 うごけない)。おわると 部位が もとに もどる
//   氷の 偶像 (3 章の ダムの主。2026-10-29 ユーザー指定): ボスの わざ「氷の偶像」で 左右 どちらかに 偶像を 1 体 作る。
//     2 体 そろうと 必殺技の ため (charge) に 入る。ためて いる あいだに 偶像を こわすと 必殺技は 止まる。チャンスタイムは なし
//   しかけの 部位 (gims。4 章・5 章。2026-10-29 ユーザー指定): 出ている ときだけ ロックオンできる 部位。こわすと しかけが うごく
//     4 章 浦の島重蔵: 玉手箱 (いつも) をこわすと 玉手箱の わざと 必殺技が 使えなくなるが、けむり (smoke) で 味方の 攻撃が
//       当たりにくくなる (時間で 消える)。こうらに こもる (shell) と 体への ダメージが へるが、そのあいだ だけ 出る 頭を こわすと
//       ひっくり返って チャンスタイム
//     5 章 ダイシ: 攻撃を うけつづける (rage) と 鬼の顔 (oni。こうげきが 上がり わざが かわる)。鬼の顔の あいだ だけ 出る 鬼の面を
//       こわすと 仏の顔に もどる。必殺技は お経を となえきると 打つ (chant)。となえている あいだ だけ うしろの 鐘を ねらえて、
//       だれかが 当てると 鐘が 鳴り、おどろいた ダイシが チャンスタイム (鐘は ボスに ダメージを あたえない)
//   影分身 (6 章の ズミタニ): わざ「かげぶんしん」で 分身を 出し、決まった 秒ごとに 瞬間移動で 位置を 入れかえる (b.clones)。
//     分身が いる あいだは ロックオンした あいてにしか 当たらない。本物なら 分身が 消えて ダメージ アップ、
//     分身なら しっぱい: 当てた なかまに しかえし (ダメージと とりつき)
//   右腕 (6 章の トモオカ): 体を 攻撃される たびに 右腕が 1 段 大きく なり、限界で 防御不能の 必殺技を ためる (b.armCharge)。
//     右腕を ねらって 当てると、決まった ダメージごとに 1 段ずつ しぼむ (体への ダメージは へる)
//   満ちていく 月 (7 章の ルナヤ): 右腕と 同じ しくみで、growEvery 秒ごとに 1 段 満ちる (体を たたいても 満ちない)
//   もの忘れ (7 章の ルナヤ): repeat の 確率で 同じ わざを もう いちど 使う
//   8 章 金色のSE城 (2026-10-30 ユーザー指定):
//     大鬼: わざは ぜんぶ 全体攻撃。足 (gims の chance) に 当てつづけて こわすと 転んで チャンスタイム → 足は もとに もどる
//     双頭鬼: 右の 頭 (とりつき) と 左の 頭 (術)。頭を こわすと その 頭の わざ (move の gim) が 使えない。
//       両方 こわす (gims の group が ぜんぶ こわれる) と チャンスタイム → おわると 頭は もとに もどる
//     金滅鬼: めくらましの とりつき を つかう。チャンスタイムは ない
//     おにおに: 必殺技を ためる あいだ (b.burst) に 決まった ダメージを あたえると 紋が 暴発 (自爆): 味方に ダメージ + チャンスタイム。
//       2 回目からの ためでは ガードして、うける ダメージが へる (guardCut)
// =====================================================================
import { CHART } from '../data/nakama.js';
import { ITEMS } from '../data/items.js';
import { speciesOf, statsAt } from './units.js';

export const GAUGE_MAX = 100;
const STATUS_TIME = { sleep: 5, slow: 8, confuse: 7, poison: 8, possess: 25, blind: 10 };
// とりつきの 種類 (どれも おはらいで 治る)
export const STATUS_NAMES = { sleep: 'ねむり', slow: 'のろい', confuse: 'こんらん', poison: 'どく', possess: 'いたずら', blind: 'めくらまし' };
export const toritsukiName = k => `${STATUS_NAMES[k]}の とりつき`;
export const isPossessed = u => Object.keys(u.status).length > 0;
export const BLIND_MISS = 0.4;  // めくらましの とりつき: 攻撃が 4 わり 当たらない
const RESCUE_COOLDOWN = 3;     // おはらいに しっぱい したら 3 秒 待つ
export const WEAK_EVERY = 6, WEAK_TIME = 2, WEAK_BONUS = 1.2;
export const PART_ORDER = ['rhand', 'lhand', 'head'];
export const HEAD_GUARD = 0.15;   // 手が のこっている うちに 頭を ねらうと 手で ガードされる (ダメージ 15%。2026-10-28 ユーザー指定)
const BACK_REGEN = 0.004;      // 後ろに いる あいだ、1 秒に 最大HP の 0.4% 戻る (5 秒で 2%)
const ROTATE_COOLDOWN = 0.35;
const ITEM_COOLDOWN = 4;

let uidSeq = 0;
function makeUnit({ uid, id, lv, bond = 0 }, side) {
    const sp = speciesOf(id);
    const st = statsAt(id, lv);
    return {
        uid: uid ?? `${side}-${++uidSeq}`,
        id, lv, side, bond,
        name: sp.name, element: sp.element, role: sp.role, art: sp.art, scale: sp.scale || 1,
        waza: sp.waza, jutsu: sp.jutsu, special: sp.special || null, bigMove: sp.bigMove || null, boss: Boolean(sp.bigMove), hero: Boolean(sp.hero),
        max: st.hp, hp: st.hp, s: st,
        timer: 0, gauge: 0, status: {}, buffs: {}, ko: false, guarding: false,
        bossMoves: sp.moves || null, chanceTurns: sp.chanceTurns || 3,
        // しかけの 部位 (4 章・5 章): 出ている ときだけ ロックオンできる 部位
        gims: sp.gims ? Object.fromEntries(Object.entries(sp.gims).map(([k, p]) => [k, { ...p, max: Math.max(1, Math.round(st.hp * p.hp)), hp: Math.max(1, Math.round(st.hp * p.hp)), broken: false }])) : null,
        oniDef: sp.oni || null, oni: false, rage: 0, shell: 0, baseMoves: null, shellCut: sp.shellCut ?? 0.15,
        cloneDef: sp.clones || null, armDef: sp.arm || null, armLv: sp.arm ? sp.arm.start : 0, armDmg: 0, armT: 0, repeat: sp.repeat || 0,
        parts: sp.parts ? Object.fromEntries(Object.entries(sp.parts).map(([k, p]) => [k, { ...p, max: Math.round(st.hp * p.hp), hp: Math.round(st.hp * p.hp), broken: false }])) : null
    };
}

// ----- 部位 (部位の ある ボス) -----
export const handsBroken = u => Boolean(u.parts) && u.parts.rhand.broken && u.parts.lhand.broken;
// 次に ねらう 部位 (こわれていない 手 → 頭)
export const nextPart = u => PART_ORDER.find(k => u.parts[k] && !u.parts[k].broken && (k !== 'head' || handsBroken(u))) || null;
function hitPart(b, u, key, dmg) {
    const part = u.parts[key];
    if (!part || part.broken || b.chance) return;
    if (key === 'head' && !handsBroken(u)) { emit(b, 'partGuard', { target: u.uid, part: key }); return; }
    part.hp = Math.max(0, part.hp - dmg);
    if (part.hp > 0) return;
    part.broken = true;
    emit(b, 'partBreak', { target: u.uid, part: key, name: part.name, move: part.move || null });
    if (key === 'head') {
        b.chance = { uid: u.uid, left: u.chanceTurns };
        u.timer = 0;
        emit(b, 'chance', { target: u.uid, turns: u.chanceTurns });
    } else b.lockPart = nextPart(u) || b.lockPart;
}
function endChance(b, u) {
    b.chance = null;
    if (u.parts) {
        for (const p of Object.values(u.parts)) { p.hp = p.max; p.broken = false; }
        if (b.lock === u.uid) b.lockPart = 'rhand';
    }
    if (u.gims) for (const p of Object.values(u.gims)) if (p.reset) { p.hp = p.max; p.broken = false; }
    emit(b, 'chanceEnd', { target: u.uid, gims: Boolean(u.gims) });
}

// ----- しかけの 部位 (4 章・5 章) -----
// いま 出ているか: always いつも / shell こうらに こもっている あいだ / oni 鬼の顔の あいだ / chant お経を となえている あいだ
export function gimOpen(b, u, key) {
    const p = u.gims && u.gims[key];
    if (!p || p.broken || u.ko) return false;
    if (p.when === 'shell') return u.shell > 0 && !(b.chance && b.chance.uid === u.uid);
    if (p.when === 'oni') return u.oni;
    if (p.when === 'chant') return Boolean(b.chant && b.chant.uid === u.uid);
    return true;
}
export const openGims = (b, u) => (u.gims ? Object.keys(u.gims).filter(k => gimOpen(b, u, k)) : []);
function hitGim(b, u, key, dmg) {
    const part = u.gims[key];
    part.hp = Math.max(0, part.hp - dmg);
    if (part.hp > 0) return;
    part.broken = true;
    if (!part.noBody) emit(b, 'partBreak', { target: u.uid, part: key, name: part.name, move: part.move || null, gim: true });
    if (b.lock === u.uid && b.lockPart === key) b.lockPart = null;
    // 8 章: こわすと チャンスタイム (大鬼の 足) / 組の 部位が ぜんぶ こわれると チャンスタイム (双頭鬼の 頭)
    if (part.chance) { startChance(b, u, part.chance); return; }
    if (part.group && Object.values(u.gims).filter(p => p.group === part.group).every(p => p.broken)) { startChance(b, u, part.group); return; }
    if (key === 'box') {
        // 玉手箱が こわれた: 玉手箱の わざと 必殺技が 使えない。けむりが 出て 味方の 攻撃が 当たりにくい
        u.bossMoves = u.bossMoves.filter(m => !m.box);
        if (u.bigMove && u.bigMove.box) u.bigMove = null;
        b.smoke = { left: part.smoke || 10, miss: part.miss || 0.45 };
        emit(b, 'smoke', { target: u.uid, time: b.smoke.left });
    } else if (key === 'head') {
        // こもった 頭を こわした: ひっくり返って チャンスタイム
        u.shell = 0;
        startChance(b, u, 'flip');
    } else if (key === 'mask') {
        // 鬼の面を こわした: 仏の顔に もどる
        leaveOni(b, u);
    } else if (key === 'bell') {
        // 鐘が 鳴った: お経が 止まり、おどろいて チャンスタイム
        b.chant = null;
        b.bossTimer = 0;
        b.warned = false;
        emit(b, 'bell', { target: u.uid });
        startChance(b, u, 'bell');
    }
}
// ----- 影分身 (6 章の ズミタニ) -----
function summonClones(b, u) {
    const c = u.cloneDef;
    clearClones(b, null);
    for (let i = 0; i < c.count; i++) {
        const cl = makeUnit({ id: u.id, lv: u.lv }, 'enemy');
        Object.assign(cl, { clone: true, owner: u.uid, boss: false, bigMove: null, bossMoves: null, special: null, gims: null, cloneDef: null, max: u.max, hp: u.hp });
        b.enemies.push(cl);
    }
    b.clones = { uid: u.uid, left: c.life, tp: c.teleport };
    shuffleClones(b);
    emit(b, 'clones', { actor: u.uid });
}
// 瞬間移動: 本物と 分身の ならびを 入れかえる (画面の 位置は ならびで 決まる)
function shuffleClones(b) {
    const group = b.enemies.filter(e => e.uid === b.clones.uid || (e.clone && e.owner === b.clones.uid));
    const rest = b.enemies.filter(e => !group.includes(e));
    for (let i = group.length - 1; i > 0; i--) { const j = Math.floor(b.rng.next() * (i + 1)); [group[i], group[j]] = [group[j], group[i]]; }
    b.enemies = [...rest, ...group];
    emit(b, 'teleport', { actor: b.clones.uid });
}
function clearClones(b, why) {
    if (!b.clones) return;
    const owner = b.clones.uid;
    b.enemies = b.enemies.filter(e => !(e.clone && e.owner === owner));
    if (b.lock && !b.enemies.some(e => e.uid === b.lock)) { b.lock = null; b.lockPart = null; }
    b.clones = null;
    if (why) emit(b, 'clonesEnd', { actor: owner, why });
}
// 分身を 攻撃して しまった: 分身は 消え、本物が 当てた なかまに しかえし
function cloneFail(b, from, clone) {
    const boss = b.enemies.find(e => e.uid === clone.owner);
    b.enemies = b.enemies.filter(e => e !== clone);
    if (b.lock === clone.uid) { b.lock = null; b.lockPart = null; }
    emit(b, 'cloneFail', { target: clone.uid, actor: from.uid });
    if (!b.enemies.some(e => e.clone)) clearClones(b, null);
    if (!boss || boss.ko) return;
    for (const fx of boss.cloneDef.counter) {
        if (fx.kind === 'attack') damage(b, boss, from, fx.power, { element: fx.element });
        else if (fx.kind === 'status') addStatus(b, from, fx.status, fx.chance);
    }
}
// ----- 右腕 (6 章の トモオカ) -----
function armGrow(b, u, n = u.armDef.perHit) {
    const a = u.armDef;
    if (u.armLv >= a.max || !n) return;
    u.armLv = Math.min(a.max, u.armLv + n);
    emit(b, 'armGrow', { target: u.uid, lv: u.armLv });
    if (u.armLv >= a.max && !b.armCharge) {
        b.armCharge = { uid: u.uid, left: a.charge };
        emit(b, 'telegraph', { actor: u.uid, name: a.move.name, warn: a.charge, arm: true });
    }
}
function armShrink(b, u, dmg) {
    const a = u.armDef;
    u.armDmg += dmg;
    const stepHp = u.max * a.step;
    let n = 0;
    while (u.armDmg >= stepHp && u.armLv > 0) { u.armDmg -= stepHp; u.armLv--; n++; }
    if (!n) return;
    emit(b, 'armShrink', { target: u.uid, lv: u.armLv });
    if (b.armCharge && b.armCharge.uid === u.uid && u.armLv < a.max) {
        b.armCharge = null;
        if (a.afterCancel !== undefined) { u.armLv = a.afterCancel; u.armDmg = 0; u.armT = 0; }   // 7 章の 月: 止めると 新月に もどる
        emit(b, 'bigCancel', { actor: u.uid, name: a.move.name, arm: true });
    }
}

function startChance(b, u, why) {
    b.chance = { uid: u.uid, left: u.chanceTurns };
    u.timer = 0;
    emit(b, 'chance', { target: u.uid, turns: u.chanceTurns, why });
}
// 鬼の顔 (5 章の ダイシ): 攻撃を うけつづけると なる。こうげきが 上がり わざが かわる
function enterOni(b, u) {
    const o = u.oniDef;
    u.oni = true;
    u.rage = 0;
    u.baseMoves = u.bossMoves;
    u.bossMoves = o.moves;
    u.buffs.atk = { amount: o.atk, t: 9999 };
    if (u.gims && u.gims.mask) { u.gims.mask.hp = u.gims.mask.max; u.gims.mask.broken = false; }
    emit(b, 'phase', { actor: u.uid, name: o.name });
    emit(b, 'skill', { actor: u.uid, name: o.name, cmd: 'boss' });
}
// 紋の 暴発 (8 章の おにおに): ため が 止まり、味方に ダメージ。おにおには 目を まわして チャンスタイム
function burstBreak(b, u) {
    const m = u.bigMove;
    b.burst = null;
    b.bossTimer = 0;
    emit(b, 'burstBreak', { actor: u.uid, name: m.burst.name });
    emit(b, 'special', { actor: u.uid, name: m.burst.name, side: 'enemy', big: true });
    applyEffects(b, u, m.burst.effects);
    startChance(b, u, 'burst');
}
function leaveOni(b, u) {
    u.oni = false;
    u.rage = 0;
    if (u.baseMoves) u.bossMoves = u.baseMoves;
    delete u.buffs.atk;
    emit(b, 'phaseEnd', { actor: u.uid, name: u.oniDef.name });
}

export function createBattle({ allies, enemies, rng, kind = 'wild', intro = false }) {
    const b = {
        kind, rng, t: 0, rot: 0, waiting: intro,
        wheel: Array.from({ length: 6 }, (_, i) => (allies[i] ? makeUnit(allies[i], 'ally') : null)),
        enemies: enemies.map(e => makeUnit(e, 'enemy')),
        events: [], outcome: null, paused: false,
        rotateCooldown: 0, itemCooldown: 0, rescueCooldown: 0, frontDownTime: 0,
        bossTimer: 0, warned: false, food: null, lock: null, lockPart: null, weakT: 0, chance: null, charge: null, smoke: null, chant: null, clones: null, armCharge: null, burst: null
    };
    // 敵は 少しずつ ずらして 動き出す
    b.enemies.forEach((e, i) => { e.timer = -0.6 - i * 0.5; });
    b.front = () => [0, 1, 2].map(i => b.wheel[(b.rot + i) % 6]);
    b.frontAlive = () => b.front().filter(u => u && !u.ko);
    b.enemiesAlive = () => b.enemies.filter(u => !u.ko);
    return b;
}

// ----- 氷の 偶像 (3 章の ダムの主) -----
export const IDOL_SLOTS = ['left', 'right'];
export const idolsOf = (b, boss) => b.enemies.filter(e => e.idol && !e.ko && e.owner === boss.uid);
// 左右の あいている ほうに 偶像を 作る。2 体 そろったら 必殺技の ため に 入る
function summonIdol(b, boss) {
    const m = boss.bigMove;
    const used = idolsOf(b, boss).map(e => e.slot);
    const free = IDOL_SLOTS.filter(s => !used.includes(s));
    if (!free.length) return;
    const slot = b.rng.pick(free);
    b.enemies = b.enemies.filter(e => !(e.idol && e.ko && e.slot === slot));   // こわれた 偶像の あとに 作る
    const idol = makeUnit({ id: boss.id, lv: boss.lv }, 'enemy');
    Object.assign(idol, { name: m.idolName, idol: true, owner: boss.uid, slot, boss: false, bigMove: null, bossMoves: null, special: null, parts: null });
    idol.max = idol.hp = Math.max(1, Math.round(boss.max * m.idolHp));
    b.enemies.push(idol);
    emit(b, 'summon', { actor: boss.uid, target: idol.uid, slot });
    if (idolsOf(b, boss).length >= IDOL_SLOTS.length && !b.charge) {
        b.charge = { uid: boss.uid, left: m.charge };
        emit(b, 'telegraph', { actor: boss.uid, name: m.name, warn: m.charge, idols: true });
    }
}
// たおれた ときの あとしまつ: 偶像が こわれたら ため を 止める・ボスが たおれたら 偶像も きえる
function afterKo(b, u) {
    if (u.idol && b.charge && b.charge.uid === u.owner) {
        b.charge = null;
        const boss = b.enemies.find(e => e.uid === u.owner);
        emit(b, 'bigCancel', { actor: u.owner, name: boss?.bigMove?.name || '' });
    }
    if (!u.idol && u.side === 'enemy') {
        for (const idol of idolsOf(b, u)) { idol.hp = 0; idol.ko = true; emit(b, 'ko', { target: idol.uid, side: 'enemy' }); }
        if (b.charge && b.charge.uid === u.uid) b.charge = null;
    }
    if (b.clones && b.clones.uid === u.uid) clearClones(b, null);
    if (b.burst && b.burst.uid === u.uid) b.burst = null;
}

const emit = (b, type, data = {}) => b.events.push({ type, t: b.t, ...data });
const buffOf = (u, stat) => (u.buffs[stat] && u.buffs[stat].t > 0 ? u.buffs[stat].amount : 0);
const interval = u => (3.0 * 20 / (u.s.spd * (1 + buffOf(u, 'spd')) + 10)) * (u.status.slow > 0 ? 1.6 : 1);
const effectOf = (element, target) => (CHART[element] && CHART[element][target]) || 1;

// ----- 攻撃・回復・状態異常 -----
// element: わざの 属性 (なければ 術は 自分の 属性・ふつうの 攻撃は ふつう)
function damage(b, from, to, power, { magic = false, mult = 1, element = null, unguardable = false } = {}) {
    if (to.ko) return 0;
    // めくらましの とりつき (8 章の 金滅鬼など): 攻撃が 当たりにくい
    if (from.status && from.status.blind > 0 && from !== to && b.rng.chance(BLIND_MISS)) {
        emit(b, 'miss', { actor: from.uid, target: to.uid, blind: true });
        return 0;
    }
    // けむり (4 章の 玉手箱を こわした あと): 味方の 攻撃が ときどき 当たらない
    if (from.side === 'ally' && to.side === 'enemy' && b.smoke && b.rng.chance(b.smoke.miss)) {
        emit(b, 'miss', { actor: from.uid, target: to.uid });
        return 0;
    }
    // 影分身 (6 章): 分身が いる あいだは ロックオンした あいてにしか 当たらない
    let cloneHit = 1;
    if (b.clones && from.side === 'ally' && (to.clone ? to.owner === b.clones.uid : to.uid === b.clones.uid)) {
        if (!b.lock) { emit(b, 'miss', { actor: from.uid, target: to.uid, clone: true }); return 0; }
        if (to.uid !== b.lock) return 0;
        if (to.clone) { cloneFail(b, from, to); return 0; }
        cloneHit = to.cloneDef.bonus;
        clearClones(b, 'found');
    }
    // しかけの 部位を ねらっている
    const gim = from.side === 'ally' && to.gims && to.uid === b.lock && b.lockPart && gimOpen(b, to, b.lockPart) ? b.lockPart : null;
    if (gim && to.gims[gim].noBody) {
        // 鐘: ボスには ダメージなし。当たれば 鳴る
        hitGim(b, to, gim, to.gims[gim].hp);
        return 0;
    }
    const A = (magic ? from.s.mag : from.s.atk) * (1 + buffOf(from, 'atk'));
    const D = to.s.def * (1 + buffOf(to, 'def'));
    const el = element || (magic ? from.element : 'ふつう');
    const eff = effectOf(el, to.element);
    const stab = el === from.element && el !== 'ふつう' ? 1.2 : 1;
    const crit = !magic && b.rng.chance(0.06);
    const guard = to.guarding && !unguardable ? 0.5 : 1;   // 防御不能の 技は まもりを むしする
    const weak = from.side === 'ally' && to.uid === b.lock && weakActive(b);
    const headGuard = from.side === 'ally' && to.parts && to.uid === b.lock && b.lockPart === 'head' && !handsBroken(to) && !b.chance;
    // こうらに こもっている あいだは 体への ダメージが ぐっと へる (頭を ねらえば ふつう)
    const shell = (to.shell > 0 && !gim ? (to.shellCut ?? 0.15) : 1) * (gim && to.gims[gim].arm ? to.armDef.bodyCut : 1) * cloneHit;
    // 8 章の おにおに: 2 回目からの ため では ガード
    const burstOn = from.side === 'ally' && b.burst && b.burst.uid === to.uid;
    const burstGuard = burstOn && b.burst.guard ? to.bigMove.guardCut : 1;
    let dmg = power * A * (40 / (40 + D)) * eff * stab * guard * (0.9 + b.rng.next() * 0.2) * mult * (crit ? 1.5 : 1) * (weak ? WEAK_BONUS : 1) * (headGuard ? HEAD_GUARD : 1) * shell * burstGuard;
    dmg = Math.max(1, Math.round(dmg));
    to.hp = Math.max(0, to.hp - dmg);
    if (to.status.sleep > 0) to.status.sleep = 0;   // たたかれると 目が さめる
    if (to.side === 'ally') to.gauge = Math.min(GAUGE_MAX, to.gauge + 4);
    emit(b, 'damage', { target: to.uid, amount: dmg, crit, eff, guard: to.guarding || headGuard || shell < 1 || burstGuard < 1, weak: weak && !headGuard, headGuard, part: gim });
    if (gim && to.hp > 0 && !to.gims[gim].arm) hitGim(b, to, gim, dmg);
    // 右腕 (6 章): 右腕に 当てると しぼみ、体に 当てると ふくらむ
    if (from.side === 'ally' && to.armDef && to.hp > 0) {
        if (gim && to.gims[gim].arm) armShrink(b, to, dmg / to.armDef.bodyCut);
        else armGrow(b, to);
    }
    // 鬼の顔に なる いかり (5 章の ダイシ)
    if (from.side === 'ally' && to.oniDef && !to.oni && to.hp > 0) {
        to.rage += dmg;
        if (to.rage >= to.max * to.oniDef.at) enterOni(b, to);
    }
    if (from.side === 'ally' && to.parts && to.uid === b.lock && b.lockPart && to.hp > 0) hitPart(b, to, b.lockPart, dmg);
    // 8 章の おにおに: ためている あいだに 決まった ダメージを あたえると 紋が 暴発
    if (burstOn && to.hp > 0) {
        b.burst.dmg += dmg;
        if (b.burst.dmg >= b.burst.need) burstBreak(b, to);
    }
    if (to.hp <= 0) {
        to.ko = true;
        to.status = {};
        emit(b, 'ko', { target: to.uid, side: to.side });
        afterKo(b, to);
    }
    return dmg;
}

function heal(b, from, to, amount) {
    if (!to || to.ko) return;
    const before = to.hp;
    to.hp = Math.min(to.max, to.hp + Math.round(amount));
    emit(b, 'heal', { target: to.uid, amount: Math.round(to.hp - before) });
}

function addStatus(b, to, status, chance) {
    if (to.ko) return;
    const resist = to.boss ? 0.4 : 1;
    if (!b.rng.chance(Math.min(0.95, chance * resist))) return;
    to.status[status] = STATUS_TIME[status];
    emit(b, 'status', { target: to.uid, status });
}

// ----- だれに 当てるか -----
function opponents(b, side) {
    return side === 'ally' ? b.enemiesAlive() : b.frontAlive();
}
function friends(b, side) {
    return side === 'ally' ? b.frontAlive() : b.enemiesAlive();
}
function pickOne(b, side) {
    const list = opponents(b, side);
    if (!list.length) return null;
    // ロックオンした 敵を ねらう
    if (side === 'ally' && b.lock) {
        const locked = list.find(u => u.uid === b.lock);
        if (locked) return locked;
    }
    // 敵は 守る役の なかまを ねらいやすい
    return b.rng.weighted(list.map(u => ({ u, w: side === 'enemy' && u.role === 'defender' ? 2 : 1 }))).u;
}

function applyEffects(b, user, effects, mult = 1) {
    let firstTarget = null;
    for (const fx of effects) {
        let targets;
        if (fx.target === 'self') targets = [user];
        else if (fx.target === 'party') targets = friends(b, user.side);
        else if (fx.target === 'lowest') {
            const list = friends(b, user.side);
            targets = list.length ? [list.reduce((a, c) => (c.hp / c.max < a.hp / a.max ? c : a))] : [];
        } else if (fx.target === 'all') targets = opponents(b, user.side);
        else {
            if (!firstTarget || firstTarget.ko) firstTarget = pickOne(b, user.side);
            targets = firstTarget ? [firstTarget] : [];
        }
        for (const to of targets) {
            if (fx.kind === 'attack') {
                for (let h = 0; h < (fx.hits || 1); h++) {
                    const dmg = damage(b, user, to, fx.power, { magic: fx.magic, mult, element: fx.element, unguardable: fx.unguardable });
                    if (fx.drain) heal(b, user, user, dmg * fx.drain);
                }
            } else if (fx.kind === 'heal') {
                heal(b, user, to, fx.power * user.s.mag * 1.6 * mult);
            } else if (fx.kind === 'status') {
                addStatus(b, to, fx.status, fx.chance * mult);
            } else if (fx.kind === 'buff') {
                to.buffs[fx.stat] = { amount: fx.amount * Math.min(1.5, mult), t: fx.time };
                emit(b, 'buff', { target: to.uid, stat: fx.stat });
            }
        }
    }
}

// ----- 1 回 動く (自動) -----
// 役割ごとの コマンドの えらびやすさ (さぼりは べつ: LOAF)。治す 役は 味方が ケガを していると わざ (回復) を 多く えらぶ
export const ACTION_W = {
    attacker: { attack: 45, waza: 25, jutsu: 20, guard: 5 },
    defender: { attack: 30, waza: 20, jutsu: 10, guard: 30 },
    healer: { attack: 30, waza: 10, jutsu: 30, guard: 10 },
    jammer: { attack: 25, waza: 35, jutsu: 30, guard: 5 },
    supporter: { attack: 35, waza: 30, jutsu: 20, guard: 10 }
};
const BOSS_W = { attack: 55, waza: 25, jutsu: 15, guard: 5 };
export const LOAF = 0.07;          // さぼる 確率 (こおりくんは さぼらない)
export const COMMAND_NAMES = { attack: '通常攻撃', waza: 'わざ', loaf: 'さぼり', guard: 'まもり', jutsu: '術' };

export function chooseCommand(b, u) {
    if (!u.hero && !u.boss && b.rng.chance(LOAF)) return 'loaf';
    // ボスは 大技 (bigMove) が あるので、ふだんは 通常攻撃が 多い
    const w = { ...(u.boss ? BOSS_W : ACTION_W[u.role] || ACTION_W.attacker) };
    const hurt = friends(b, u.side).some(f => f.hp < f.max * 0.6);
    if (u.role === 'healer') w.waza = hurt ? 200 : 0;
    // 回復の術は ケガを した 味方が いるときだけ (いれば 多めに)
    if (u.jutsu && u.jutsu.type === 'heal') w.jutsu = hurt ? w.jutsu + 20 : 0;
    return b.rng.weighted(Object.entries(w).map(([id, weight]) => ({ id, w: weight }))).id;
}

function act(b, u) {
    u.guarding = false;   // まもりは 次に 動くまで
    // チャンスタイム: ボスは うごけない (決まった 回数)
    if (b.chance && b.chance.uid === u.uid) {
        b.chance.left--;
        emit(b, 'stunned', { actor: u.uid, left: b.chance.left });
        if (b.chance.left <= 0) endChance(b, u);
        return;
    }
    if (u.status.confuse > 0 && b.rng.chance(0.5)) {
        emit(b, 'confused', { actor: u.uid });
        return;
    }
    // いたずらの とりつき: 4 わり なまける・3 わり 味方を 攻める
    if (u.status.possess > 0) {
        const r = b.rng.next();
        if (r < 0.4) { emit(b, 'possessed', { actor: u.uid, mode: 'lazy' }); return; }
        const mates = friends(b, u.side).filter(f => f !== u);
        if (r < 0.7 && mates.length) {
            const to = b.rng.pick(mates);
            emit(b, 'possessed', { actor: u.uid, mode: 'betray' });
            emit(b, 'attack', { actor: u.uid, target: to.uid });
            damage(b, u, to, 0.8);
            return;
        }
    }
    // 敵は ゲージが たまったら 必殺技
    if (u.side === 'enemy' && u.special && u.gauge >= GAUGE_MAX) {
        u.gauge = 0;
        emit(b, 'special', { actor: u.uid, name: u.special.name, side: 'enemy' });
        applyEffects(b, u, u.special.effects, 0.8);
        return;
    }
    // 部位の ある ボス: ボスの わざから えらぶ (こわれた 部位の わざは 使えない)
    // 偶像を 作る わざは 偶像が 2 体 そろって いない あいだだけ
    if (u.bossMoves) {
        if (b.chant && b.chant.uid === u.uid) { emit(b, 'chanting', { actor: u.uid }); return; }   // お経を となえている あいだは ほかの ことを しない
        if (b.burst && b.burst.uid === u.uid) { emit(b, 'charging', { actor: u.uid }); return; }   // 必殺技を ためている あいだも (8 章の おにおに)
        const list = u.bossMoves.filter(m => (!m.part || !u.parts[m.part].broken) && (!m.gim || !u.gims[m.gim].broken) && (!m.summon || (!b.charge && idolsOf(b, u).length < IDOL_SLOTS.length)) && (!m.shell || !(u.shell > 0)) && (!m.clones || !b.clones));
        if (!list.length) { emit(b, 'stunned', { actor: u.uid, left: 0 }); return; }
        const move = b.rng.weighted(list.map(m => ({ m, w: m.w }))).m;
        emit(b, 'skill', { actor: u.uid, name: move.name, cmd: 'boss' });
        if (move.summon) summonIdol(b, u);
        else if (move.shell) { u.shell = move.shell; emit(b, 'shell', { actor: u.uid, time: move.shell }); }
        else if (move.clones) summonClones(b, u);
        else {
            applyEffects(b, u, move.effects || []);
            // もの忘れ (7 章の ルナヤ): ときどき 同じ わざを もう いちど
            if (u.repeat && move.effects && move.effects.length && b.rng.chance(u.repeat)) {
                emit(b, 'repeat', { actor: u.uid, name: move.name });
                emit(b, 'skill', { actor: u.uid, name: move.name, cmd: 'boss' });
                applyEffects(b, u, move.effects);
            }
        }
        return;
    }
    const cmd = chooseCommand(b, u);
    if (cmd === 'loaf') {
        emit(b, 'loaf', { actor: u.uid });
        return;
    }
    if (cmd === 'guard') {
        u.guarding = true;
        emit(b, 'guard', { actor: u.uid });
    } else if (cmd === 'waza' || cmd === 'jutsu') {
        const move = u[cmd];
        emit(b, 'skill', { actor: u.uid, name: move.name, cmd });
        applyEffects(b, u, move.effects);
    } else {
        const to = pickOne(b, u.side);
        if (!to) return;
        emit(b, 'attack', { actor: u.uid, target: to.uid });
        damage(b, u, to, 1.0);
    }
    u.gauge = Math.min(GAUGE_MAX, u.gauge + (u.side === 'ally' ? 15 : 8));
}

function tickUnit(b, u, dt, acting) {
    for (const k of Object.keys(u.status)) {
        u.status[k] -= dt;
        if (u.status[k] <= 0) delete u.status[k];
    }
    for (const k of Object.keys(u.buffs)) {
        u.buffs[k].t -= dt;
        if (u.buffs[k].t <= 0) delete u.buffs[k];
    }
    if (u.status.poison > 0) {
        u.hp = Math.max(1, u.hp - u.max * 0.03 * dt);   // どくでは たおれない
    }
    if (!acting || u.status.sleep > 0) return;
    u.timer += dt;
    if (u.timer >= interval(u)) {
        u.timer = 0;
        act(b, u);
    }
}

function checkOutcome(b) {
    if (b.outcome) return;
    if (b.enemies.every(e => e.ko || e.idol)) {
        b.outcome = 'win';
        emit(b, 'win');
    } else if (b.wheel.filter(Boolean).every(u => u.ko)) {
        b.outcome = 'lose';
        emit(b, 'lose');
    }
}

export function step(b, dt) {
    if (b.outcome || b.paused || b.waiting) return;
    b.t += dt;
    b.rotateCooldown = Math.max(0, b.rotateCooldown - dt);
    b.itemCooldown = Math.max(0, b.itemCooldown - dt);
    b.rescueCooldown = Math.max(0, b.rescueCooldown - dt);
    if (b.lock) {
        if (b.enemiesAlive().some(e => e.uid === b.lock)) b.weakT += dt;
        else { b.lock = null; b.lockPart = null; b.weakT = 0; }
    }
    const front = b.front();
    for (const u of b.wheel) {
        if (!u || u.ko) continue;
        const isFront = front.includes(u);
        if (!isFront) u.hp = Math.min(u.max, u.hp + u.max * BACK_REGEN * dt);
        tickUnit(b, u, dt, isFront);
        if (b.outcome) return;
        checkOutcome(b);
    }
    for (const e of b.enemies) {
        if (e.ko) continue;
        if (e.clone) { const o = b.enemies.find(x => x.uid === e.owner); if (o) { e.hp = o.hp; e.max = o.max; } continue; }   // 分身は 動かない (HP は 本物と 同じに 見せる)
        tickUnit(b, e, dt, !e.idol);   // 偶像は 動かない
        if (e.shell > 0) {
            e.shell -= dt;
            if (e.shell <= 0) {
                e.shell = 0;
                if (e.gims && e.gims.head && !e.gims.head.broken) e.gims.head.hp = e.gims.head.max;
                emit(b, 'shellEnd', { actor: e.uid });
            }
        }
        if (b.lock === e.uid && b.lockPart && e.gims && !gimOpen(b, e, b.lockPart)) b.lockPart = null;
        if (e.bigMove) bossTick(b, e, dt);
        checkOutcome(b);
        if (b.outcome) return;
    }
    if (b.clones) {
        b.clones.left -= dt;
        b.clones.tp -= dt;
        if (b.clones.left <= 0) clearClones(b, 'time');
        else if (b.clones.tp <= 0) { b.clones.tp = b.enemies.find(e => e.uid === b.clones.uid)?.cloneDef.teleport || 4; shuffleClones(b); }
    }
    // 時間で 満ちる 部位 (7 章の 月)
    for (const e of b.enemies) {
        if (e.ko || !e.armDef || !e.armDef.growEvery || b.armCharge || (b.chance && b.chance.uid === e.uid)) continue;
        e.armT += dt;
        if (e.armT >= e.armDef.growEvery) { e.armT = 0; armGrow(b, e, 1); }
    }
    if (b.armCharge) {
        const u = b.enemies.find(e => e.uid === b.armCharge.uid);
        if (!u || u.ko) b.armCharge = null;
        else if (!(b.chance && b.chance.uid === u.uid)) {
            b.armCharge.left -= dt;
            if (b.armCharge.left <= 0) {
                b.armCharge = null;
                emit(b, 'special', { actor: u.uid, name: u.armDef.move.name, side: 'enemy', big: true });
                applyEffects(b, u, u.armDef.move.effects);
                u.armLv = u.armDef.after;
                u.armDmg = 0;
                emit(b, 'armShrink', { target: u.uid, lv: u.armLv });
            }
        }
    }
    if (b.smoke) {
        b.smoke.left -= dt;
        if (b.smoke.left <= 0) { b.smoke = null; emit(b, 'smokeEnd'); }
    }
    // 前の 3 体が 全員 たおれたら、少し 待って 半分 回す
    if (!b.frontAlive().length && b.wheel.some(u => u && !u.ko)) {
        b.frontDownTime += dt;
        if (b.frontDownTime > 2) {
            b.rot = (b.rot + 3) % 6;
            b.frontDownTime = 0;
            emit(b, 'rotate', { auto: true });
        }
    } else b.frontDownTime = 0;
    checkOutcome(b);
}


function bossTick(b, e, dt) {
    if (b.chance && b.chance.uid === e.uid) return;   // チャンスタイムの あいだは 大技も 止まる
    const m = e.bigMove;
    // 偶像で 必殺技を ためる ボス: ため が おわると 打つ (偶像は くだける)
    if (m.trigger === 'idols') {
        if (!b.charge || b.charge.uid !== e.uid) return;
        b.charge.left -= dt;
        if (b.charge.left > 0) return;
        b.charge = null;
        emit(b, 'special', { actor: e.uid, name: m.name, side: 'enemy', big: true });
        applyEffects(b, e, m.effects);
        for (const idol of idolsOf(b, e)) { idol.hp = 0; idol.ko = true; emit(b, 'ko', { target: idol.uid, side: 'enemy' }); }
        return;
    }
    // 必殺技を ためる あいだに 攻撃を うけきると 紋が 暴発する (8 章の おにおに)
    if (m.trigger === 'burst') {
        if (b.burst && b.burst.uid === e.uid) {
            b.burst.left -= dt;
            if (b.burst.left > 0) return;
            b.burst = null;
            b.bossTimer = 0;
            emit(b, 'special', { actor: e.uid, name: m.name, side: 'enemy', big: true });
            applyEffects(b, e, m.effects);
            return;
        }
        b.bossTimer += dt;
        if (b.bossTimer < m.every) return;
        e.burstCount = (e.burstCount || 0) + 1;
        b.burst = { uid: e.uid, left: m.charge, dmg: 0, need: Math.round(e.max * m.need), guard: e.burstCount >= 2 };
        emit(b, 'telegraph', { actor: e.uid, name: m.name, warn: m.charge, burst: true, guard: b.burst.guard });
        return;
    }
    // お経を となえきると 必殺技 (5 章の ダイシ)。となえている あいだ だけ 鐘を ねらえる
    if (m.trigger === 'chant') {
        if (b.chant && b.chant.uid === e.uid) {
            b.chant.left -= dt;
            if (b.chant.left > 0) return;
            b.chant = null;
            b.bossTimer = 0;
            const oni = e.oni && m.oni;
            emit(b, 'special', { actor: e.uid, name: oni ? m.oni.name : m.name, side: 'enemy', big: true });
            applyEffects(b, e, oni ? m.oni.effects : m.effects);
            return;
        }
        b.bossTimer += dt;
        if (b.bossTimer < m.every) return;
        b.chant = { uid: e.uid, left: m.chant };
        emit(b, 'telegraph', { actor: e.uid, name: e.oni && m.oni ? m.oni.name : m.name, warn: m.chant, chant: true });
        return;
    }
    b.bossTimer += dt;
    if (!b.warned && b.bossTimer >= m.every - m.warn) {
        b.warned = true;
        emit(b, 'telegraph', { actor: e.uid, name: m.name, warn: m.warn });
    }
    if (b.bossTimer >= m.every) {
        b.bossTimer = 0;
        b.warned = false;
        emit(b, 'special', { actor: e.uid, name: m.name, side: 'enemy', big: true });
        applyEffects(b, e, m.effects);
    }
}

// ----- プレイヤーの 操作 -----
// dir: +1 (R) / -1 (L)
export function rotate(b, dir) {
    if (b.outcome || b.paused || b.rotateCooldown > 0) return false;
    b.rot = (b.rot + (dir > 0 ? 1 : 5)) % 6;
    b.rotateCooldown = ROTATE_COOLDOWN;
    emit(b, 'rotate', { dir });
    return true;
}

export const canSpecial = (b, pos) => {
    const u = b.front()[pos];
    return Boolean(u && !u.ko && u.special && u.gauge >= GAUGE_MAX && !b.outcome && !b.paused);
};

// ミニゲームの あいだは バトルを 止める
export function startSpecial(b, pos) {
    if (!canSpecial(b, pos)) return null;
    b.paused = true;
    return b.front()[pos];
}

// mult: ミニゲームの 結果 (大成功 1.5・成功 1.0・失敗 0.5)
export function resolveSpecial(b, unit, mult) {
    b.paused = false;
    if (!unit || unit.ko) return;
    unit.gauge = 0;
    emit(b, 'special', { actor: unit.uid, name: unit.special.name, side: 'ally', mult });
    // 絆レベル (同じ キャラを 何体も なかまに した): 1 つにつき 必殺技の 威力 +10% (最大 +50%。2026-10-29)
    applyEffects(b, unit, unit.special.effects, mult * (1 + 0.1 * Math.min(5, unit.bond || 0)));
    checkOutcome(b);
}

// ロックオン: 同じ 敵 (部位) を もう いちど えらぶと はずす。part: 部位の ある ボスの 部位 (rhand・lhand・head)
export function lockOn(b, uid, part = null) {
    const e = b.enemiesAlive().find(x => x.uid === uid);
    if (b.outcome || !e) return false;
    if (e.parts && !part) part = nextPart(e) || 'head';
    if (e.gims && part && !gimOpen(b, e, part)) return false;   // 出て いない しかけは ねらえない
    const same = b.lock === uid && b.lockPart === part;
    b.lock = same ? null : uid;
    b.lockPart = same ? null : part;
    b.weakT = 0;
    emit(b, 'lock', { target: b.lock, part: b.lockPart });
    return true;
}
// 弱点の 光が 出ているか (ねらって 4 秒後から 2 秒、6 秒ごと)
export const weakActive = b => Boolean(b.lock) && b.weakT % WEAK_EVERY >= WEAK_EVERY - WEAK_TIME;

// おはらい: 後ろに いる とりつかれた なかまを ミニゲームで 治す (ミニゲームの あいだは 止める)。とりつきは ぜんぶ ぬける
const unitByUid = (b, uid) => b.wheel.find(u => u && u.uid === uid) || null;
export function canRescue(b, uid) {
    const u = unitByUid(b, uid);
    return Boolean(u && !u.ko && isPossessed(u) && !b.front().includes(u) && !b.outcome && !b.paused && b.rescueCooldown <= 0);
}
export const rescueTargets = b => b.wheel.filter(u => u && canRescue(b, u.uid));
export function startRescue(b, uid) {
    if (!canRescue(b, uid)) return null;
    b.paused = true;
    return unitByUid(b, uid);
}
// ok: ミニゲームが 成功 (しっぱいなら 治らず、少し 待つ)
export function resolveRescue(b, unit, ok) {
    b.paused = false;
    if (!unit) return;
    if (ok) unit.status = {};
    else b.rescueCooldown = RESCUE_COOLDOWN;
    emit(b, 'rescue', { target: unit.uid, ok });
}

// 道具を なかまに 使う。uid で 輪の だれにでも (後ろも) 使える (2026-10-28 ユーザー指定: 使う キャラを えらぶ)
// uid を 決めなければ、前で いちばん HP の 少ない なかま
export function useItem(b, itemId, uid = null) {
    const item = ITEMS[itemId];
    if (!item || b.outcome || b.paused || b.itemCooldown > 0) return false;
    const target = uid === null
        ? b.frontAlive().reduce((a, c) => (!a || c.hp / c.max < a.hp / a.max ? c : a), null)
        : b.wheel.find(u => u && u.uid === uid);
    if (!target || target.ko) return false;
    heal(b, target, target, item.heal);
    if (item.gauge) target.gauge = Math.min(GAUGE_MAX, target.gauge + item.gauge);
    b.itemCooldown = ITEM_COOLDOWN;
    emit(b, 'item', { target: target.uid, itemId });
    begin(b);
    return true;
}

// 食べ物を 敵に 投げる (1 回の バトルで 1 回。投げた 敵が 仲間に なりやすくなる)。uid で どの 敵か えらぶ
export function throwFood(b, itemId, uid = null) {
    if (b.food || b.kind !== 'wild' || b.outcome || b.paused || !ITEMS[itemId]) return false;
    const to = uid === null ? b.enemiesAlive()[0] : b.enemiesAlive().find(e => e.uid === uid);
    if (!to) return false;
    const fav = speciesOf(to.id).favorite === itemId;
    b.food = { itemId, target: to.id, favorite: fav };
    emit(b, 'food', { target: to.uid, itemId, favorite: fav });
    begin(b);
    return true;
}

// ----- はじまり: たたかう・にげる -----
export function begin(b) {
    if (!b.waiting || b.outcome) return false;
    b.waiting = false;
    emit(b, 'begin');
    return true;
}
// 特別な バトル (ボス・七不思議) からは にげられない
export const canFlee = b => b.kind === 'wild' && !b.mystery;
export function flee(b) {
    if (!b.waiting || b.outcome) return false;
    if (!canFlee(b)) { emit(b, 'noFlee'); return false; }
    b.outcome = 'flee';
    emit(b, 'flee');
    return true;
}
