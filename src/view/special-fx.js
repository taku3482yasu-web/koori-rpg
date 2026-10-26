// =====================================================================
// 必殺技の コマンド (ミニゲーム) と、キャラごとの 必殺技の 動き (2026-10-27 ユーザー指定)
// ---------------------------------------------------------------------
// コマンドは 4 種類。結果で 威力が かわる (大成功 1.5 倍・成功 1 倍・しっぱい 0.5 倍)
//   mash   れんだ  : 3 秒で A か 画面を たくさん 押す (15 回で 大成功・8 回で 成功)
//   reel   目押し  : まわる リール 3 つを 止めて「こおり」を そろえる (前後 1 コマは すべって 止まる)
//   trace  なぞる  : 点を 順に なぞる。ボタンなら 矢印の 向きを 順に 押す
//   spin   ぐるぐる: 下画面を ぐるぐる なぞる。ボタンなら 上→右→下→左 の 順に 押す (4 回 まわすと 大成功)
// 必殺技の 動き (MOTIONS): dash 飛びこむ / spin 回りながら 飛ぶ / roll 転がる / rain 上から ふらせる / beam 光線 /
//   line 糸で 引っぱる / multi 何回も たたく / skip 水切りで はねる / cloud もやを 送る / aura 味方を つつむ
// =====================================================================
import { ART } from '../art/index.js';
import { COLORS, drawArt, panel, text, bar } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { btn } from '../core/keys.js';

const result = (score, great, ok) => (score >= great ? { mult: 1.5, label: '大成功！' } : score >= ok ? { mult: 1, label: '成功！' } : { mult: 0.5, label: 'しっぱい…' });

// なかまごとの コマンドと 動き (glyph: 飛ばす もの、color: その 色)
export const SPECIALS = {
    haribaby: { command: 'mash', motion: 'dash', color: '#e0b070' },
    mumenbachi: { command: 'spin', motion: 'spin', color: '#ffd040' },
    donguriko: { command: 'reel', motion: 'aura', color: '#c88a40', glyph: '◆' },
    nemuridake: { command: 'trace', motion: 'cloud', color: '#ff9ad8', glyph: 'Zz' },
    pekorisu: { command: 'mash', motion: 'dash', color: '#f0c890', drain: true },
    tsutankobu: { command: 'trace', motion: 'beam', color: '#5ad06a' },
    yofukashi: { command: 'trace', motion: 'cloud', color: '#d8a8ff', glyph: '♪' },
    kogame: { command: 'reel', motion: 'aura', color: '#9ad07a', glyph: '◆' },
    tsuribariuo: { command: 'reel', motion: 'line', color: '#dddddd' },
    mokugyoro: { command: 'mash', motion: 'multi', color: '#d0a060', glyph: 'ポク', hits: 5 },
    rousokubi: { command: 'spin', motion: 'rain', color: '#ff8a3a', glyph: '▲' },
    daichouenkin: { command: 'spin', motion: 'cloud', color: '#a8d060', glyph: '@' },
    kunaisuzume: { command: 'mash', motion: 'rain', color: '#d0d0d0', glyph: '↓' },
    kawarimidanuki: { command: 'trace', motion: 'dash', color: '#e0e0e0', puff: true },
    shinobigaeru: { command: 'trace', motion: 'rain', color: '#6ab0f0', glyph: '●' },
    ishikoron: { command: 'mash', motion: 'roll', color: '#b4b4bc' },
    mizukirin: { command: 'reel', motion: 'skip', color: '#bff0ff', hits: 8 },
    soumennagare: { command: 'spin', motion: 'aura', color: '#f8f4e8', glyph: '〜' },
    kozarappa: { command: 'reel', motion: 'aura', color: '#4aa8e0', glyph: '●' },
    hashishita: { command: 'trace', motion: 'cloud', color: '#ffe040', glyph: '1 2 3' }
};
export const specialOf = id => SPECIALS[id] || { command: 'mash', motion: 'dash', color: '#ffffff' };
export const COMMAND_NAMES = { mash: 'れんだ！', reel: '目押しで こおりを そろえろ！', trace: 'なぞれ！', spin: 'ぐるぐる まわせ！' };

// ===================== コマンド =====================
export function createCommand(type, rng) {
    if (type === 'reel') return reelCommand(rng);
    if (type === 'trace') return traceCommand(rng);
    if (type === 'spin') return spinCommand();
    return mashCommand();
}

function mashCommand() {
    const c = { type: 'mash', t: 0, count: 0, done: null, limit: 3 };
    c.update = (dt, input) => {
        c.t += dt;
        if (input.pressed.a || input.touch.justDown || input.pressed.sp1 || input.pressed.sp2 || input.pressed.sp3) { c.count++; sfx('mash'); }
        if (c.t >= c.limit) c.done = result(c.count, 15, 8);
    };
    c.drawBottom = (ctx, t) => {
        text(ctx, `${btn('a')} か 画面を れんだ！`, 160, 34, { size: 18, align: 'center', bold: true, color: COLORS.accent });
        const pulse = 1 + 0.06 * Math.sin(t * 30), w = 200 * pulse, h = 110 * pulse;
        panel(ctx, 160 - w / 2, 120 - h / 2, w, h, { fill: '#b03048', edge: '#ffd0d8', r: 20, lineWidth: 3 });
        text(ctx, `${c.count}`, 160, 136, { size: 40, align: 'center', bold: true });
        bar(ctx, 40, 196, 240, 10, Math.max(0, c.limit - c.t) / c.limit, COLORS.accent);
        text(ctx, '15回で 大成功 / 8回で 成功', 160, 226, { size: 11, align: 'center', color: COLORS.sub });
    };
    return c;
}

// 目押し: 6 つの 絵柄。0 番が こおり
const SYMBOLS = ['こおり', '7', 'BAR', 'ベル', 'チェリー', 'スイカ'];
const SYM_COLOR = ['#bff0ff', '#ff4a4a', '#e0e0e0', '#ffd84a', '#ff6a8a', '#5ad06a'];
function reelCommand(rng) {
    const c = { type: 'reel', t: 0, done: null, limit: 6, reels: [0, 1, 2].map(i => ({ pos: rng.next() * 6, stopped: false, speed: 6.5 + i * 0.9, hit: false })) };
    const stopNext = () => {
        const r = c.reels.find(x => !x.stopped);
        if (!r) return;
        // すべり: 前後 1 コマ 以内に こおりが あれば そこで 止まる
        const near = Math.round(r.pos);
        let stop = near;
        for (const d of [0, 1, -1]) if ((((near + d) % 6) + 6) % 6 === 0) { stop = near + d; break; }
        r.pos = stop;
        r.stopped = true;
        r.hit = ((stop % 6) + 6) % 6 === 0;
        sfx(r.hit ? 'ok' : 'cursor');
    };
    c.update = (dt, input) => {
        c.t += dt;
        for (const r of c.reels) if (!r.stopped) r.pos = (r.pos + r.speed * dt) % 6;
        if (input.pressed.a || input.touch.justDown) stopNext();
        if (c.t >= c.limit) while (c.reels.some(r => !r.stopped)) stopNext();
        if (c.reels.every(r => r.stopped) && !c.done) c.done = result(c.reels.filter(r => r.hit).length, 3, 2);
    };
    c.drawBottom = ctx => {
        text(ctx, `${btn('a')} か タップで 止めて「こおり」を そろえろ！`, 160, 26, { size: 12.5, align: 'center', bold: true, color: COLORS.accent });
        c.reels.forEach((r, i) => {
            const x = 50 + i * 80, y0 = 50, h = 132;
            panel(ctx, x - 34, y0, 68, h, { fill: '#f4f0e8', edge: r.stopped ? (r.hit ? COLORS.accent : '#7a86a6') : COLORS.panelEdge, r: 6, lineWidth: 3 });
            ctx.save();
            ctx.beginPath();
            ctx.rect(x - 32, y0 + 2, 64, h - 4);
            ctx.clip();
            for (let k = -2; k <= 2; k++) {
                const idx = ((Math.floor(r.pos) + k) % 6 + 6) % 6;
                const y = y0 + h / 2 + (k - (r.pos - Math.floor(r.pos))) * 44;
                if (idx === 0) drawArt(ctx, ART.koori, 0, x, y + 14, { scale: 1.8 });
                else text(ctx, SYMBOLS[idx], x, y + 6, { size: SYMBOLS[idx].length > 3 ? 11 : 16, align: 'center', bold: true, color: SYM_COLOR[idx], shadow: false });
            }
            ctx.restore();
            ctx.fillStyle = 'rgba(255, 60, 60, 0.6)';
            ctx.fillRect(x - 34, y0 + h / 2, 68, 1.5);
        });
        bar(ctx, 40, 200, 240, 8, Math.max(0, c.limit - c.t) / c.limit, COLORS.accent);
        text(ctx, '3 つ そろうと 大成功 / 2 つで 成功', 160, 226, { size: 11, align: 'center', color: COLORS.sub });
    };
    return c;
}

// なぞる: たて・よこの 線だけの 形 (ボタンでも 入れられるように)
const SHAPES = [
    [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]],
    [[0, 0], [4, 0], [4, 2], [0, 2], [0, 4], [4, 4]],
    [[4, 0], [0, 0], [0, 4], [4, 4]],
    [[0, 4], [0, 2], [2, 2], [2, 0], [4, 0]],
    [[0, 0], [0, 4], [4, 4], [4, 0]]
];
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const ARROW = { up: '↑', down: '↓', left: '←', right: '→' };
function traceCommand(rng) {
    const shape = SHAPES[rng.int(SHAPES.length)];
    const pt = ([gx, gy]) => ({ x: 90 + gx * 35, y: 50 + gy * 33 });
    const segs = shape.slice(1).map((p, i) => {
        const a = shape[i];
        const dx = Math.sign(p[0] - a[0]), dy = Math.sign(p[1] - a[1]);
        return Object.keys(DIRS).find(k => DIRS[k][0] === dx && DIRS[k][1] === dy);
    });
    const c = { type: 'trace', t: 0, done: null, limit: 4.5, reached: 1, miss: 0 };
    const finish = () => { c.done = result((c.reached - 1) / segs.length, 1, 0.6); };
    c.update = (dt, input) => {
        c.t += dt;
        // ボタン: 次の 矢印の 向き
        for (const d of Object.keys(DIRS)) {
            if (!input.pressed[d]) continue;
            if (segs[c.reached - 1] === d) { c.reached++; sfx('cursor'); } else { c.miss = c.t; sfx('cancel'); }
        }
        // タッチ: 次の 点に 指が 来たら
        if (input.touch.down && c.reached < shape.length) {
            const p = pt(shape[c.reached]);
            if (Math.hypot(input.touch.x - p.x, input.touch.y - p.y) < 16) { c.reached++; sfx('cursor'); }
        }
        if (c.reached >= shape.length || c.t >= c.limit) finish();
    };
    c.drawBottom = (ctx, t) => {
        text(ctx, 'なぞれ！ (ボタンなら 矢印の 向きを 順に)', 160, 24, { size: 12.5, align: 'center', bold: true, color: COLORS.accent });
        ctx.lineCap = 'round';
        for (let i = 1; i < shape.length; i++) {
            const a = pt(shape[i - 1]), b = pt(shape[i]);
            ctx.strokeStyle = i < c.reached ? COLORS.accent : 'rgba(255,255,255,0.25)';
            ctx.lineWidth = i < c.reached ? 6 : 4;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        shape.forEach((g, i) => {
            const p = pt(g);
            const next = i === c.reached;
            ctx.fillStyle = i < c.reached ? COLORS.accent : next ? (Math.floor(t * 6) % 2 ? '#ffffff' : '#ff9ad8') : '#7a86a6';
            ctx.beginPath(); ctx.arc(p.x, p.y, next ? 8 : 6, 0, Math.PI * 2); ctx.fill();
        });
        const shake = c.t - c.miss < 0.2 ? Math.sin(t * 80) * 3 : 0;
        const next = segs[c.reached - 1];
        if (next) text(ctx, `つぎ: ${ARROW[next]}`, 160 + shake, 210, { size: 15, align: 'center', bold: true });
        bar(ctx, 40, 222, 240, 8, Math.max(0, c.limit - c.t) / c.limit, COLORS.accent);
    };
    return c;
}

function spinCommand() {
    const ORDER = ['up', 'right', 'down', 'left'];
    const c = { type: 'spin', t: 0, done: null, limit: 3, turns: 0, angle: 0, last: null, step: 0 };
    const CX = 160, CY = 120;
    c.update = (dt, input) => {
        c.t += dt;
        // ボタン: 上→右→下→左 の 順に 押すと 4 分の 1 回転
        for (const d of ORDER) {
            if (!input.pressed[d]) continue;
            if (d === ORDER[c.step % 4]) { c.step++; c.angle += Math.PI / 2; sfx('mash'); }
        }
        // タッチ: 中心の まわりを まわした 角度
        if (input.touch.down) {
            const a = Math.atan2(input.touch.y - CY, input.touch.x - CX);
            if (c.last !== null) {
                let d = a - c.last;
                if (d > Math.PI) d -= Math.PI * 2;
                if (d < -Math.PI) d += Math.PI * 2;
                c.angle += Math.abs(d);
            }
            c.last = a;
        } else c.last = null;
        const turns = Math.floor(c.angle / (Math.PI * 2));
        if (turns > c.turns) { c.turns = turns; sfx('ok'); }
        if (c.t >= c.limit) c.done = result(c.angle / (Math.PI * 2), 4, 2);
    };
    c.drawBottom = (ctx, t) => {
        text(ctx, 'ぐるぐる まわせ！ (ボタンなら ↑→↓← の 順)', 160, 24, { size: 12.5, align: 'center', bold: true, color: COLORS.accent });
        ctx.strokeStyle = 'rgba(127,211,247,0.4)';
        ctx.lineWidth = 14;
        ctx.beginPath(); ctx.arc(CX, CY, 62, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = COLORS.accent;
        ctx.lineWidth = 14;
        ctx.beginPath(); ctx.arc(CX, CY, 62, -Math.PI / 2, -Math.PI / 2 + (c.angle % (Math.PI * 2))); ctx.stroke();
        const a = -Math.PI / 2 + c.angle;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(CX + Math.cos(a) * 62, CY + Math.sin(a) * 62, 9, 0, Math.PI * 2); ctx.fill();
        text(ctx, `${(c.angle / (Math.PI * 2)).toFixed(1)} 回`, CX, CY + 8, { size: 22, align: 'center', bold: true });
        bar(ctx, 40, 202, 240, 8, Math.max(0, c.limit - c.t) / c.limit, COLORS.accent);
        text(ctx, '4 回で 大成功 / 2 回で 成功', 160, 226, { size: 11, align: 'center', color: COLORS.sub });
    };
    return c;
}

// ===================== 必殺技の 動き =====================
// 長さと、当たる 時間 (秒)
export const MOTION_TIME = {
    dash: [1.0, 0.45], spin: [1.15, 0.65], roll: [1.0, 0.5], rain: [1.15, 0.7], beam: [1.0, 0.55], line: [1.15, 0.6],
    multi: [1.25, 0.45], skip: [1.3, 0.95], cloud: [1.15, 0.7], aura: [1.0, 0.45]
};

// 必殺技の あいだの 絵。a: 味方の 足元、e: 敵の まんなか (いちばん 前の 敵)、k: 0〜1 の 進み
// drawActor(x, y, { flip, scale, alpha, sx, sy }) で 味方を 描く
export function drawPerformance(ctx, sp, a, e, k, t, drawActor, allies) {
    const lerp = (p, q, f) => p + (q - p) * f;
    const ease = f => 1 - (1 - f) * (1 - f);
    const glyph = (s, x, y, size = 14, alpha = 1) => { ctx.globalAlpha = alpha; text(ctx, s, x, y, { size, align: 'center', bold: true, color: sp.color }); ctx.globalAlpha = 1; };
    const [dur, hit] = MOTION_TIME[sp.motion];
    const at = k * dur;   // 秒
    switch (sp.motion) {
        case 'dash': {
            if (sp.puff && at < 0.25) {
                ctx.fillStyle = `rgba(240,240,240,${1 - at * 4})`;
                for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(a.x + Math.cos(i) * 16, a.y - 30 + Math.sin(i * 2) * 10, 10 + at * 30, 0, Math.PI * 2); ctx.fill(); }
                text(ctx, 'ドロン！', a.x, a.y - 64, { size: 14, align: 'center', bold: true });
            }
            const go = at < hit ? ease(at / hit) : 1 - ease((at - hit) / (dur - hit));
            const x = lerp(a.x, e.x, go), y = lerp(a.y, e.y + 30, go);
            for (let g = 1; g <= 3; g++) if (at < hit) drawActor(lerp(a.x, e.x, Math.max(0, go - g * 0.12)), lerp(a.y, e.y + 30, Math.max(0, go - g * 0.12)), { alpha: 0.25 });
            drawActor(x, y, {});
            if (sp.drain && at > hit) glyph('♥', lerp(e.x, a.x, (at - hit) / (dur - hit)), lerp(e.y, a.y - 40, (at - hit) / (dur - hit)), 16);
            break;
        }
        case 'spin': {
            const go = Math.min(1, at / hit);
            const back = at > hit ? (at - hit) / (dur - hit) : 0;
            const x = lerp(lerp(a.x, e.x, ease(go)), a.x, back), y = lerp(lerp(a.y, e.y + 20, ease(go)), a.y, back) - Math.sin(Math.PI * go) * 30;
            ctx.strokeStyle = sp.color;
            ctx.lineWidth = 2;
            for (let r = 0; r < 3; r++) { ctx.beginPath(); ctx.arc(x, y - 30, 26 + r * 6, t * 12 + r, t * 12 + r + 2); ctx.stroke(); }
            drawActor(x, y, { flip: Math.floor(t * 16) % 2 === 0 });
            break;
        }
        case 'roll': {
            const go = at < hit ? at / hit : 1 - (at - hit) / (dur - hit);
            const x = lerp(a.x, e.x, go), y = lerp(a.y, e.y + 30, go) - Math.abs(Math.sin(at * 18)) * 6;
            drawActor(x, y, { flip: Math.floor(t * 14) % 2 === 0, sy: 0.9 + 0.1 * Math.abs(Math.cos(at * 18)) });
            ctx.fillStyle = 'rgba(200,190,170,0.5)';
            for (let i = 0; i < 4; i++) ctx.fillRect(x - 20 - i * 10, y - 4 - (i % 2) * 3, 6, 3);
            break;
        }
        case 'rain': {
            drawActor(a.x, a.y - Math.sin(Math.min(1, at / 0.4) * Math.PI) * 14, {});
            for (let i = 0; i < 10; i++) {
                const start = 0.25 + i * 0.045;
                const f = (at - start) / 0.3;
                if (f < 0 || f > 1.2) continue;
                const x = e.x - 50 + (i * 37) % 100;
                glyph(sp.glyph, x, lerp(-10, e.y + 10, Math.min(1, f)), 16, f > 1 ? 1.2 - f : 1);
            }
            drawActor(a.x, a.y, { alpha: 0 });
            break;
        }
        case 'beam': {
            drawActor(a.x, a.y, {});
            if (at > 0.2 && at < dur - 0.15) {
                const w = Math.sin(Math.min(1, (at - 0.2) / 0.5) * Math.PI) * 10 + 2;
                ctx.strokeStyle = sp.color;
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = w + 6;
                ctx.beginPath(); ctx.moveTo(a.x, a.y - 40); ctx.lineTo(e.x, e.y); ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = w / 2;
                ctx.beginPath(); ctx.moveTo(a.x, a.y - 40); ctx.lineTo(e.x, e.y); ctx.stroke();
            }
            break;
        }
        case 'line': {
            drawActor(a.x, a.y - (at > hit ? 8 : 0), {});
            const reach = Math.min(1, at / (hit * 0.8));
            const tx = lerp(a.x, e.x, reach), ty = lerp(a.y - 40, e.y, reach) - Math.sin(Math.PI * reach) * 30;
            ctx.strokeStyle = sp.color;
            ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(a.x + 6, a.y - 44); ctx.quadraticCurveTo((a.x + tx) / 2, Math.min(a.y, ty) - 50, tx, ty); ctx.stroke();
            text(ctx, 'J', tx, ty + 4, { size: 12, align: 'center', bold: true, color: '#cccccc' });
            if (at > hit) text(ctx, 'つれた～！', a.x, a.y - 76, { size: 13, align: 'center', bold: true, color: COLORS.accent });
            break;
        }
        case 'multi': {
            const go = Math.min(1, at / 0.3), back = at > dur - 0.25 ? (at - (dur - 0.25)) / 0.25 : 0;
            const x = lerp(lerp(a.x, e.x - 30, ease(go)), a.x, back), y = lerp(lerp(a.y, e.y + 30, ease(go)), a.y, back) - Math.abs(Math.sin(at * 20)) * 8;
            drawActor(x, y, {});
            const n = sp.hits || 5;
            for (let i = 0; i < n; i++) {
                const ht = hit + i * 0.09;
                if (at > ht && at < ht + 0.25) glyph(sp.glyph || '!', e.x - 20 + (i % 3) * 20, e.y - 20 - (i % 2) * 14 - (at - ht) * 40, 13);
            }
            break;
        }
        case 'skip': {
            const n = sp.hits || 8;
            const f = Math.min(1, at / hit);
            const seg = Math.min(n - 1, Math.floor(f * n)), local = f * n - seg;
            const x0 = lerp(a.x, e.x, seg / n), x1 = lerp(a.x, e.x, (seg + 1) / n);
            const y0 = lerp(a.y, e.y + 30, seg / n), y1 = lerp(a.y, e.y + 30, (seg + 1) / n);
            const h = 24 * (1 - seg / n);
            const x = at < hit ? lerp(x0, x1, local) : e.x, y = at < hit ? lerp(y0, y1, local) - Math.sin(Math.PI * local) * h : e.y + 30;
            drawActor(at < hit ? x : lerp(e.x, a.x, (at - hit) / (dur - hit)), at < hit ? y : lerp(e.y + 30, a.y, (at - hit) / (dur - hit)), { scale: 3 });
            for (let i = 1; i <= seg; i++) {
                const sx = lerp(a.x, e.x, i / n), sy = lerp(a.y, e.y + 30, i / n);
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.ellipse(sx, sy, 6 + (seg - i) * 2, 2 + (seg - i) * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
            }
            if (at < hit) text(ctx, `${seg + 1}段！`, a.x, a.y - 80, { size: 12, align: 'center', bold: true, color: COLORS.accent });
            break;
        }
        case 'cloud': {
            drawActor(a.x, a.y - Math.sin(at * 8) * 2, { sx: 1 + Math.sin(at * 10) * 0.05 });
            for (let i = 0; i < 8; i++) {
                const start = 0.15 + i * 0.06;
                const f = (at - start) / 0.55;
                if (f < 0 || f > 1.3) continue;
                const x = lerp(a.x + (i % 3 - 1) * 14, e.x + (i % 4 - 1.5) * 18, Math.min(1, f));
                const y = lerp(a.y - 40, e.y - 6 + (i % 3) * 8, Math.min(1, f)) - Math.sin(Math.PI * Math.min(1, f)) * 20;
                glyph(sp.glyph || '●', x, y, 13, f > 1 ? 1.3 - f : 1);
            }
            break;
        }
        case 'aura': {
            for (const p of allies) {
                for (let r = 0; r < 2; r++) {
                    const f = ((at * 1.6 + r * 0.5) % 1);
                    ctx.strokeStyle = sp.color;
                    ctx.globalAlpha = 1 - f;
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.ellipse(p.x, p.y, 20 + f * 22, 6 + f * 6, 0, 0, Math.PI * 2); ctx.stroke();
                    ctx.globalAlpha = 1;
                }
                if (sp.glyph && at > 0.2) glyph(sp.glyph, p.x + Math.sin(at * 6 + p.x) * 14, p.y - 30 - ((at * 40 + p.x) % 40), 12, 0.9);
            }
            drawActor(a.x, a.y - Math.sin(Math.min(1, at / 0.5) * Math.PI) * 12, {});
            break;
        }
        default:
            drawActor(a.x, a.y, {});
    }
}

// 必殺技の 前の カットイン (ななめの 帯に キャラと 技の 名前)
export function drawCutin(ctx, unit, sp, k) {
    const slide = k < 0.25 ? 1 - k / 0.25 : k > 0.85 ? -(k - 0.85) / 0.15 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, 400, 240);
    ctx.save();
    ctx.translate(slide * 400, 0);
    ctx.beginPath();
    ctx.moveTo(0, 70); ctx.lineTo(400, 40); ctx.lineTo(400, 180); ctx.lineTo(0, 210);
    ctx.closePath();
    ctx.fillStyle = sp.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(((i * 53 + k * 600) % 440) - 20, 60 + (i * 29) % 130, 30, 2);
    }
    drawArt(ctx, ART[unit.art], Math.floor(k * 12), 110, 200, { scale: 8 });
    text(ctx, '必殺技', 290, 92, { size: 14, align: 'center', bold: true, color: '#1b3a6b', shadow: false });
    text(ctx, `「${unit.special.name}」`, 270, 128, { size: 20, align: 'center', bold: true });
    text(ctx, unit.name, 290, 156, { size: 12, align: 'center', bold: true });
    ctx.restore();
}
