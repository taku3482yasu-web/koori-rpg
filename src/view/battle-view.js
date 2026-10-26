// =====================================================================
// バトルの 場面 (設計書 3 章・7 章): 上画面で 戦い、下画面で ウォッチの 輪を 回す
// ---------------------------------------------------------------------
// 操作: L・R か 輪を なぞる → 回す / 十字キー左右 + A か 絵の タップ → 必殺技 (れんだの ミニゲーム)
//       Y → どうぐ (なかまを 回復) / X → おやつ (敵に 投げる。仲間に なりやすくなる)
// =====================================================================
import { ART } from '../art/index.js';
import { backArt } from '../art/back.js';
import { ITEMS } from '../data/items.js';
import { ELEMENT_COLORS } from '../data/nakama.js';
import { COLORS, drawArt, panel, text, bar, button, hit, roundRect } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { btn } from '../core/keys.js';
import { step, rotate, canSpecial, startSpecial, resolveSpecial, useItem, throwFood, GAUGE_MAX, STATUS_NAMES } from '../logic/battle.js';

const WHEEL = { x: 100, y: 126, r: 70 };
const SP_BTN = [0, 1, 2].map(i => ({ x: 204, y: 10 + i * 52, w: 110, h: 46 }));
const ITEM_BTN = { x: 204, y: 172, w: 52, h: 30, label: 'どうぐ' };
const FOOD_BTN = { x: 262, y: 172, w: 52, h: 30, label: 'おやつ' };
// 味方は 手前 (下) に 大きく、うしろ姿で。敵は 奥 (上) に (2026-10-26 ユーザー指定)
const ALLY_POS = [{ x: 78, y: 234 }, { x: 200, y: 242 }, { x: 322, y: 234 }];
const ALLY_SCALE = 4;
const HORIZON = 70;
const MASH_TIME = 3;
const RIVER = ['kawara', 'kawaraN', 'kawaraS', 'hashiue', 'hashishita', 'kawakami', 'bridge'];

export function createBattleView(app, battle, place) {
    const g = app.g;
    let t = 0, endT = 0;
    let shownRot = battle.rot;     // 輪の 回る アニメーション
    let cursor = 0;                // 必殺技を えらぶ カーソル (前の 3 体)
    let menu = null;               // { kind: 'item' | 'food', index }
    let mg = null;                 // れんだの ミニゲーム
    let drag = null;
    let banner = null;             // { text, color, until }
    let warn = null;               // ボスの 予告 { name, until }
    const pops = [];               // ダメージの 数字
    const flash = {};              // uid → 光る 時間

    const enemyPos = i => {
        const n = battle.enemies.length;
        if (n === 1) return battle.enemies[0].boss ? { x: 200, y: 142, scale: 5 } : { x: 200, y: 132, scale: 3.5 };
        return [{ x: 140, y: 126, scale: 3 }, { x: 262, y: 136, scale: 3 }][i];
    };
    function posOf(uid) {
        const fi = battle.front().findIndex(u => u && u.uid === uid);
        if (fi >= 0) return ALLY_POS[fi];
        const ei = battle.enemies.findIndex(u => u.uid === uid);
        return ei >= 0 ? enemyPos(ei) : null;
    }
    const nameOf = uid => [...battle.wheel, ...battle.enemies].find(u => u && u.uid === uid)?.name || '';

    function readEvents() {
        for (const e of battle.events.splice(0)) {
            if (e.type === 'damage') {
                const p = posOf(e.target);
                if (p) pops.push({ x: p.x + (Math.random() * 16 - 8), y: p.y - 40, text: String(e.amount), color: e.eff > 1 ? '#ffd84a' : e.eff < 1 ? '#a0a0b0' : '#ffffff', big: e.crit || e.eff > 1, until: t + 0.9 });
                flash[e.target] = t + 0.15;
                sfx(e.amount > 30 ? 'big' : 'hit');
            } else if (e.type === 'heal' && e.amount > 0) {
                const p = posOf(e.target);
                if (p) pops.push({ x: p.x, y: p.y - 40, text: `+${e.amount}`, color: '#7aff8a', until: t + 0.9 });
            } else if (e.type === 'status') {
                const p = posOf(e.target);
                if (p) pops.push({ x: p.x, y: p.y - 56, text: STATUS_NAMES[e.status], color: '#ff9ad8', until: t + 1 });
            } else if (e.type === 'special') {
                banner = { text: `${nameOf(e.actor)}の「${e.name}」！`, color: e.side === 'ally' ? COLORS.accent : '#ff6a6a', until: t + 1.4 };
                sfx('special');
                if (e.big) warn = null;
            } else if (e.type === 'telegraph') {
                warn = { name: e.name, until: t + e.warn };
                sfx('cancel');
            } else if (e.type === 'food') {
                banner = { text: e.favorite ? `${ITEMS[e.itemId].name}を 投げた！ とても よろこんでいる！` : `${ITEMS[e.itemId].name}を 投げた！`, color: '#ff9ad8', until: t + 1.6 };
                sfx(e.favorite ? 'friend' : 'ok');
            } else if (e.type === 'item') sfx('heal');
            else if (e.type === 'rotate') sfx('rotate');
            else if (e.type === 'win') sfx('win');
            else if (e.type === 'lose') sfx('lose');
        }
    }

    // ----- 必殺技 -----
    function trySpecial(pos) {
        if (!canSpecial(battle, pos)) { sfx('cancel'); return; }
        const unit = startSpecial(battle, pos);
        mg = { unit, t: 0, count: 0, done: null };
        sfx('ok');
    }
    function updateMinigame(dt, input) {
        mg.t += dt;
        if (mg.done) {
            if (mg.t > MASH_TIME + 0.8) {
                resolveSpecial(battle, mg.unit, mg.done.mult);
                mg = null;
            }
            return;
        }
        if (input.pressed.a || input.touch.justDown || input.pressed.sp1 || input.pressed.sp2 || input.pressed.sp3) { mg.count++; sfx('mash'); }
        if (mg.t >= MASH_TIME) {
            const mult = mg.count >= 15 ? 1.5 : mg.count >= 8 ? 1 : 0.5;
            mg.done = { mult, label: mult > 1 ? '大成功！' : mult === 1 ? '成功！' : 'しっぱい…' };
        }
    }

    // ----- どうぐ・おやつ -----
    const owned = () => Object.keys(ITEMS).filter(id => (g.items[id] || 0) > 0);
    function useMenu(id) {
        const ok = menu.kind === 'item' ? useItem(battle, id) : throwFood(battle, id);
        if (ok) { g.items[id]--; menu = null; } else sfx('cancel');
    }
    function updateMenu(input) {
        const list = owned();
        if (input.pressed.b || (menu.kind === 'item' && input.pressed.y) || (menu.kind === 'food' && input.pressed.x)) { menu = null; sfx('cancel'); return; }
        if (!list.length) return;
        if (input.pressed.up) { menu.index = (menu.index + list.length - 1) % list.length; sfx('cursor'); }
        if (input.pressed.down) { menu.index = (menu.index + 1) % list.length; sfx('cursor'); }
        menu.index = Math.min(menu.index, list.length - 1);
        if (input.pressed.a) useMenu(list[menu.index]);
        if (input.touch.justDown) {
            const i = list.findIndex((_, k) => hit(menuRow(k), input.touch.x, input.touch.y));
            if (i >= 0) useMenu(list[i]);
            else if (!hit({ x: 20, y: 20, w: 280, h: 200 }, input.touch.x, input.touch.y)) menu = null;
        }
    }
    const menuRow = k => ({ x: 30, y: 46 + k * 28, w: 260, h: 24 });

    function update(dt, input) {
        t += dt;
        g.playTime += dt;
        if (mg) { updateMinigame(dt, input); readEvents(); return; }
        step(battle, dt);
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
        if (menu) { updateMenu(input); return; }

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

        // タッチ: 輪を なぞる・必殺技・どうぐ
        const tc = input.touch;
        if (tc.justDown) {
            const sp = SP_BTN.findIndex(bn => hit(bn, tc.x, tc.y));
            if (sp >= 0) { cursor = sp; trySpecial(sp); } else if (hit(ITEM_BTN, tc.x, tc.y)) { menu = { kind: 'item', index: 0 }; sfx('ok'); } else if (hit(FOOD_BTN, tc.x, tc.y) && battle.kind === 'wild') { menu = { kind: 'food', index: 0 }; sfx('ok'); } else if (Math.hypot(tc.x - WHEEL.x, tc.y - WHEEL.y) < WHEEL.r + 30) {
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
    function drawBackground(ctx) {
        const river = RIVER.includes(place);
        const sky = g.time === 3 ? ['#141a3a', '#2a2a5a'] : g.time === 2 ? ['#f08a4a', '#f8c070'] : ['#7ac8f8', '#c8ecff'];
        const grad = ctx.createLinearGradient(0, 0, 0, HORIZON);
        grad.addColorStop(0, sky[0]);
        grad.addColorStop(1, sky[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, HORIZON);
        // 遠くの 町
        ctx.fillStyle = 'rgba(40, 60, 90, 0.25)';
        [[20, 34, 40], [70, 46, 30], [300, 28, 50], [360, 44, 30]].forEach(([x, y, w]) => ctx.fillRect(x, y, w, HORIZON - y));
        // 地面 (手前ほど 明るく)
        const ground = river ? ['#2a6aa8', '#4aa0e0'] : place === 'park' ? ['#c8b880', '#f0e0a8'] : ['#4a9a3a', '#7ad05a'];
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
        if (!u) return;
        const lit = (flash[u.uid] || 0) > t;
        const sleeping = u.status.sleep > 0;
        const bobY = u.ko ? 0 : Math.sin(t * 3 + p.x) * 1.5;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 2, 8 * scale / 3 * 2, 3 * scale / 3 * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        const art = back ? backArt(ART[u.art]) : ART[u.art];
        drawArt(ctx, art, sleeping || u.ko ? 0 : Math.floor(t * 2), p.x, p.y + bobY, { scale, flip, alpha: u.ko ? 0.35 : 1, tint: lit ? '#ffffff' : null });
        const w = 44, head = p.y - art.h * scale;
        // 名前と HP は 頭の 上 (手前の 味方と 奥の 敵の 名前が 重ならないように)
        const barY = head - 10, nameY = head - 14;
        bar(ctx, p.x - w / 2, barY, w, 4, u.hp / u.max, u.hp / u.max < 0.3 ? COLORS.hpLow : COLORS.hp);
        text(ctx, `${u.name} Lv${u.lv}`, p.x, nameY, { size: 9.5, align: 'center' });
        const marks = Object.keys(u.status).map(k => STATUS_NAMES[k]);
        if (u.ko) marks.push('たおれた');
        if (marks.length) text(ctx, marks.join(' '), p.x, head - 26, { size: 9.5, align: 'center', color: '#ff9ad8', bold: true });
    }

    function drawTop(ctx) {
        drawBackground(ctx);
        battle.enemies.forEach((e, i) => drawUnit(ctx, e, enemyPos(i), { scale: enemyPos(i).scale }));
        battle.front().forEach((u, i) => drawUnit(ctx, u, ALLY_POS[i], { scale: ALLY_SCALE, back: true }));
        for (let i = pops.length - 1; i >= 0; i--) {
            const p = pops[i];
            if (p.until < t) { pops.splice(i, 1); continue; }
            const k = 1 - (p.until - t) / 0.9;
            text(ctx, p.text, p.x, p.y - k * 14, { size: p.big ? 16 : 13, align: 'center', bold: true, color: p.color });
        }
        if (warn && warn.until > t) {
            panel(ctx, 30, 8, 340, 40, { fill: 'rgba(120, 10, 20, 0.9)', edge: '#ff6a6a' });
            text(ctx, `!! 大技「${warn.name}」が くる！`, 200, 25, { size: 13, align: 'center', bold: true });
            text(ctx, `輪を まわして じょうぶな なかまを 前に！ (${Math.max(0, warn.until - t).toFixed(1)})`, 200, 41, { size: 11, align: 'center', color: '#ffd0d0' });
        } else if (banner && banner.until > t) {
            panel(ctx, 40, 12, 320, 26, { fill: 'rgba(16,22,42,0.9)', edge: banner.color });
            text(ctx, banner.text, 200, 30, { size: 13, align: 'center', bold: true, color: banner.color });
        }
        if (battle.outcome) {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(0, 0, 400, 240);
            text(ctx, battle.outcome === 'win' ? 'かった！' : 'まけた……', 200, 128, { size: 34, align: 'center', bold: true, color: battle.outcome === 'win' ? COLORS.accent : '#a0b0d0' });
        }
        if (mg) drawMinigameTop(ctx);
    }

    function drawMinigameTop(ctx) {
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
        text(ctx, `必殺技「${u.special.name}」`, 200, 36, { size: 18, align: 'center', bold: true, color: COLORS.accent });
        if (mg.done) text(ctx, mg.done.label, 200, 216, { size: 26, align: 'center', bold: true, color: mg.done.mult > 1 ? COLORS.accent : '#ffffff' });
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
        // 時計
        panel(ctx, WHEEL.x - 34, WHEEL.y - 22, 68, 44, { fill: '#1b3a6b', edge: '#bff0ff', r: 20 });
        text(ctx, 'おなかま', WHEEL.x, WHEEL.y - 2, { size: 10, align: 'center', bold: true });
        text(ctx, 'ウォッチ', WHEEL.x, WHEEL.y + 12, { size: 10, align: 'center', bold: true });
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
            text(ctx, u.name.length > 6 ? `${u.name.slice(0, 6)}…` : u.name, b.x + 34, b.y + 16, { size: 10, bold: true });
            bar(ctx, b.x + 34, b.y + 22, 70, 6, u.gauge / GAUGE_MAX, COLORS.gauge);
            text(ctx, ready ? `必殺技！ (${i + 1})` : u.ko ? 'たおれている' : 'ゲージ', b.x + 34, b.y + 40, { size: 9.5, color: ready ? '#ffffff' : COLORS.dim, bold: ready });
        });
        button(ctx, ITEM_BTN, { size: 11 });
        button(ctx, FOOD_BTN, { size: 11, disabled: battle.kind !== 'wild' || Boolean(battle.food) });
        text(ctx, btn('y'), ITEM_BTN.x + ITEM_BTN.w / 2, 216, { size: 9.5, align: 'center', color: COLORS.dim });
        text(ctx, btn('x'), FOOD_BTN.x + FOOD_BTN.w / 2, 216, { size: 9.5, align: 'center', color: COLORS.dim });
        if (battle.itemCooldown > 0) text(ctx, `どうぐ まで ${battle.itemCooldown.toFixed(1)}`, 259, 232, { size: 9.5, align: 'center', color: COLORS.dim });
    }

    function drawMenu(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, 320, 240);
        panel(ctx, 20, 14, 280, 212);
        text(ctx, menu.kind === 'item' ? 'どうぐ: HP の 少ない なかまに 使う' : 'おやつ: 敵に 投げる (好物なら 大よろこび)', 160, 34, { size: 11.5, align: 'center', bold: true, color: COLORS.accent });
        const list = owned();
        if (!list.length) text(ctx, 'なにも もっていない', 160, 110, { size: 13, align: 'center', color: COLORS.sub });
        list.forEach((id, k) => {
            const r = menuRow(k);
            if (k === menu.index) { roundRect(ctx, r.x, r.y, r.w, r.h, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
            text(ctx, `${ITEMS[id].name}`, r.x + 10, r.y + 17, { size: 13 });
            text(ctx, `×${g.items[id]}`, r.x + r.w - 10, r.y + 17, { size: 13, align: 'right' });
        });
        text(ctx, `${btn('b')} で とじる`, 160, 220, { size: 10, align: 'center', color: COLORS.dim });
    }

    function drawBottom(ctx) {
        ctx.fillStyle = '#16203a';
        ctx.fillRect(0, 0, 320, 240);
        if (mg) {
            const left = Math.max(0, MASH_TIME - mg.t);
            text(ctx, mg.done ? '' : `${btn('a')} か 画面を れんだ！`, 160, 34, { size: 18, align: 'center', bold: true, color: COLORS.accent });
            const pulse = mg.done ? 1 : 1 + 0.06 * Math.sin(t * 30);
            const w = 200 * pulse, h = 110 * pulse;
            panel(ctx, 160 - w / 2, 120 - h / 2, w, h, { fill: '#b03048', edge: '#ffd0d8', r: 20, lineWidth: 3 });
            text(ctx, `${mg.count}`, 160, 136, { size: 40, align: 'center', bold: true });
            bar(ctx, 40, 196, 240, 10, left / MASH_TIME, COLORS.accent);
            text(ctx, '15回で 大成功 / 8回で 成功', 160, 226, { size: 11, align: 'center', color: COLORS.sub });
            return;
        }
        drawWheel(ctx);
        drawSpecialButtons(ctx);
        if (menu) drawMenu(ctx);
    }

    return { name: 'battle', update, drawTop, drawBottom, battle };
}
