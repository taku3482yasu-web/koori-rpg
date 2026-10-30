// =====================================================================
// 合体の館の 画面 (2026-10-30 ユーザー指定): 上画面に 材料 2 つと できる もの、下画面に 材料の 一覧
// ---------------------------------------------------------------------
// 1 つ目を えらぶ (A) → 2 つ目を えらぶ (A) → できる ものが わかったら A で 合体。B で 1 つ もどる (さいごは 町へ)
// 合体の 中身は logic/fusion.js、レシピは data/fusion.js
// =====================================================================
import { ART } from '../art/index.js';
import { unitOf } from '../data/nakama.js';
import { ITEMS } from '../data/items.js';
import { COLORS, drawArt, panel, text, button, hit, roundRect } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { btn } from '../core/keys.js';
import { medalByUid } from '../logic/game.js';
import { fusionParts, canFuse, fuse } from '../logic/fusion.js';

const ROW_H = 20, ROWS = 8, LIST_TOP = 30;
const FUSE_BTN = { x: 200, y: 200, w: 112, h: 30, label: '合体する！' };
const BACK_BTN = { x: 8, y: 200, w: 80, h: 30, label: 'もどる' };

export function createFusion(app) {
    const g = app.g;
    let t = 0, index = 0, a = null, b = null, result = null, resultT = 0;
    const same = (p, q) => p && q && p.type === q.type && (p.type === 'medal' ? p.uid === q.uid : p.id === q.id);
    const nameOf = p => (p.type === 'medal' ? unitOf(medalByUid(g, p.uid).id).name : ITEMS[p.id].name);
    const scroll = len => Math.max(0, Math.min(len - ROWS, index - Math.floor(ROWS / 2)));

    function pick(p) {
        if (!a) { a = p; sfx('ok'); return; }
        if (same(a, p) && p.type === 'medal') { sfx('cancel'); return; }
        b = p;
        sfx(canFuse(g, a, b) ? 'ok' : 'cancel');
    }
    function back() {
        if (b) b = null;
        else if (a) a = null;
        else { app.save(); app.go('field'); }
        sfx('cancel');
    }
    function doFuse() {
        if (!a || !b || !canFuse(g, a, b)) { sfx('cancel'); return; }
        result = fuse(g, a, b);
        resultT = t;
        a = b = null;
        index = 0;
        sfx('friend');
        app.save();
    }

    function update(dt, input) {
        t += dt;
        g.playTime += dt;
        const tc = input.touch;
        if (result) {
            if (t - resultT > 0.6 && (input.pressed.a || input.pressed.b || tc.justDown)) { result = null; sfx('ok'); }
            return;
        }
        const list = fusionParts(g);
        if (index >= list.length) index = Math.max(0, list.length - 1);
        if (input.pressed.b || input.pressed.x) { back(); return; }
        if (input.pressed.up && list.length) { index = (index + list.length - 1) % list.length; sfx('cursor'); }
        if (input.pressed.down && list.length) { index = (index + 1) % list.length; sfx('cursor'); }
        if (input.wheel && list.length) { index = Math.max(0, Math.min(list.length - 1, index + input.wheel)); sfx('cursor'); }
        if (input.pressed.a) {
            if (a && b) doFuse();
            else if (list[index]) pick(list[index]);
        }
        if (tc.justDown) {
            if (hit(BACK_BTN, tc.x, tc.y)) { back(); return; }
            if (a && b && hit(FUSE_BTN, tc.x, tc.y)) { doFuse(); return; }
            const top = scroll(list.length);
            for (let k = 0; k < ROWS && top + k < list.length; k++) {
                if (!hit({ x: 8, y: LIST_TOP + k * ROW_H, w: 304, h: ROW_H }, tc.x, tc.y)) continue;
                if (index === top + k && !(a && b)) pick(list[index]); else { index = top + k; sfx('cursor'); }
            }
        }
    }

    // 材料・できた ものの 絵 (なかまは ドット絵、アイテムは 丸い しるし)
    function drawPart(ctx, code, x, y, scale = 3) {
        const [kind, id] = code.split(':');
        if (kind === 'n') { drawArt(ctx, ART[unitOf(id).art], Math.floor(t * 2), x, y, { scale: ART[unitOf(id).art].h > 24 ? scale * 0.6 : scale }); return; }
        const it = ITEMS[id];
        ctx.fillStyle = it.material ? '#8a5ac0' : '#c08a3a';
        ctx.beginPath(); ctx.arc(x, y - 20, 18, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffe0a0'; ctx.lineWidth = 2; ctx.stroke();
        text(ctx, it.name[0], x, y - 13, { size: 18, align: 'center', bold: true });
    }
    const codeOfPart = p => (p.type === 'medal' ? `n:${medalByUid(g, p.uid).id}` : `i:${p.id}`);
    const resultName = code => (code.startsWith('n:') ? unitOf(code.slice(2)).name : ITEMS[code.slice(2)].name);

    function drawTop(ctx) {
        ctx.fillStyle = '#1a1030';
        ctx.fillRect(0, 0, 400, 240);
        // 魔法陣
        ctx.strokeStyle = `rgba(200, 160, 255, ${0.35 + 0.15 * Math.sin(t * 2)})`;
        ctx.lineWidth = 2;
        for (const r of [96, 70]) { ctx.beginPath(); ctx.ellipse(200, 170, r * 1.6, r * 0.45, 0, 0, Math.PI * 2); ctx.stroke(); }
        text(ctx, '合体の館', 200, 26, { size: 18, align: 'center', bold: true, color: '#e0c8ff' });
        if (result) {
            const code = `${result.kind === 'item' ? 'i' : 'n'}:${result.id}`;
            const k = Math.min(1, (t - resultT) / 0.5);
            ctx.fillStyle = `rgba(255, 240, 200, ${0.5 * (1 - k)})`; ctx.fillRect(0, 0, 400, 240);
            drawPart(ctx, code, 200, 160, 5);
            text(ctx, `${resultName(code)}が できた！`, 200, 200, { size: 18, align: 'center', bold: true, color: COLORS.accent });
            if (result.medal) text(ctx, `Lv${result.medal.lv}`, 200, 222, { size: 12, align: 'center', color: COLORS.sub });
            return;
        }
        const slots = [[a, 90], [b, 210]];
        for (const [p, x] of slots) {
            panel(ctx, x - 50, 50, 100, 120, { fill: 'rgba(255,255,255,0.06)', edge: p ? '#c8a8ff' : COLORS.panelEdge });
            if (p) { drawPart(ctx, codeOfPart(p), x, 140); text(ctx, nameOf(p), x, 162, { size: 11, align: 'center', maxWidth: 96 }); }
            else text(ctx, p === a ? '1 つ目' : '2 つ目', x, 112, { size: 12, align: 'center', color: COLORS.dim });
        }
        text(ctx, '＋', 150, 116, { size: 20, align: 'center', bold: true });
        text(ctx, '＝', 278, 116, { size: 20, align: 'center', bold: true });
        const r = a && b ? canFuse(g, a, b) : null;
        panel(ctx, 296, 50, 96, 120, { fill: 'rgba(255,255,255,0.06)', edge: r ? COLORS.accent : COLORS.panelEdge });
        if (r) {
            const known = g.zukan.fused && g.zukan.fused[r.to];
            drawPart(ctx, r.to, 344, 140);
            text(ctx, known ? resultName(r.to) : '？？？', 344, 162, { size: 11, align: 'center', maxWidth: 92, color: COLORS.accent });
        } else text(ctx, a && b ? '合体 できない' : '？', 344, 112, { size: a && b ? 11 : 20, align: 'center', color: COLORS.dim });
        text(ctx, a && b ? (r ? `${btn('a')} で 合体！ 使った ものは なくなる` : 'べつの 組み合わせを ためそう') : 'キャラ・アイテムを 2 つ えらぼう', 200, 200, { size: 12, align: 'center', color: COLORS.sub });
    }

    function drawBottom(ctx) {
        ctx.fillStyle = '#16203a';
        ctx.fillRect(0, 0, 320, 240);
        const list = fusionParts(g);
        text(ctx, a ? (b ? 'この 2 つで 合体する？' : '2 つ目を えらぶ') : '1 つ目を えらぶ', 8, 20, { size: 12, bold: true, color: '#e0c8ff' });
        text(ctx, `${list.length ? index + 1 : 0}/${list.length}`, 312, 20, { size: 10.5, align: 'right', color: COLORS.dim });
        const top = scroll(list.length);
        for (let k = 0; k < ROWS && top + k < list.length; k++) {
            const p = list[top + k], y = LIST_TOP + k * ROW_H;
            const chosen = same(p, a) || same(p, b);
            if (top + k === index) { roundRect(ctx, 8, y, 304, ROW_H - 2, 4); ctx.fillStyle = '#5a3a8a'; ctx.fill(); }
            if (p.type === 'medal') {
                const m = medalByUid(g, p.uid), inWatch = g.watch.indexOf(m.uid);
                text(ctx, `${chosen ? '◆ ' : ''}${unitOf(m.id).name}`, 16, y + 14, { size: 12, color: chosen ? COLORS.accent : COLORS.ink });
                text(ctx, `Lv${m.lv}${inWatch >= 0 ? `  [${inWatch + 1}]` : ''}`, 304, y + 14, { size: 11, align: 'right', color: COLORS.sub });
            } else {
                text(ctx, `${chosen ? '◆ ' : ''}${ITEMS[p.id].name}`, 16, y + 14, { size: 12, color: chosen ? COLORS.accent : COLORS.ink });
                if (ITEMS[p.id].material) text(ctx, '合成', 200, y + 14, { size: 10, color: '#c8a8ff' });
                text(ctx, `×${g.items[p.id]}`, 304, y + 14, { size: 11, align: 'right', color: COLORS.sub });
            }
        }
        button(ctx, BACK_BTN, { size: 11 });
        if (a && b) button(ctx, FUSE_BTN, { active: Boolean(canFuse(g, a, b)), disabled: !canFuse(g, a, b), size: 12 });
        text(ctx, `${btn('b')} もどる`, 160, 222, { size: 10, align: 'center', color: COLORS.dim });
    }

    return { name: 'fusion', update, drawTop, drawBottom, debug: { pick, doFuse, state: () => ({ a, b, result, index }) } };
}
