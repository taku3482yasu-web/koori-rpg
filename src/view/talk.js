// =====================================================================
// 会話: 上画面に 立ち絵と ふきだし、下画面に 「つぎへ」か 選択肢 (設計書 7 章)
// ---------------------------------------------------------------------
// app.talk([{ who, art, text }], { choices: ['はい', 'いいえ'], done: index => {} })
// 文字は 1 文字ずつ 出る。A か 下画面の タップで 進む (出ている 途中なら 全部 出す)
// 選択肢が 多いとき (駄菓子屋 など) は 下画面に 入る ぶんだけ 出して スクロールする (2026-10-28 ユーザー指定:
//   一番下が 見えなかった)。カーソル・マウスホイール・▲▼ の タップ・なぞる で 動く
// =====================================================================
import { ART } from '../art/index.js';
import { COLORS, drawArt, panel, text, wrap, button, hit } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { btn } from '../core/keys.js';

export function createTalk() {
    let lines = [], index = 0, shown = 0, opts = {}, cursor = 0, active = false;
    let top = 0, drag = null;      // 選択肢の スクロール (いちばん 上に 出ている 番号)
    // 4 つまでは 大きな ボタン、それより 多いと 小さめの 行で 1 画面に 6 つ
    const VIEW = { y: 18, h: 206 };
    const layout = () => {
        const n = (opts.choices || []).length;
        return n <= 4 ? { step: 44, h: 36, rows: n, y0: 40 } : { step: 34, h: 30, rows: Math.min(n, Math.floor(VIEW.h / 34)), y0: VIEW.y + 2 };
    };
    const visible = () => {
        const L = layout();
        return (opts.choices || []).map((label, i) => ({ i, label })).slice(top, top + L.rows)
            .map(({ i, label }, k) => ({ i, x: 40, y: L.y0 + k * L.step, w: 240, h: L.h, label }));
    };
    const ARROW_UP = { x: 120, y: 0, w: 80, h: 16 }, ARROW_DOWN = { x: 120, y: 224, w: 80, h: 16 };
    const scrollTo = i => {
        const L = layout(), n = (opts.choices || []).length;
        top = Math.max(0, Math.min(n - L.rows, top));
        if (i < top) top = i;
        if (i >= top + L.rows) top = i - L.rows + 1;
    };
    const scrollBy = d => {
        const L = layout(), n = (opts.choices || []).length;
        top = Math.max(0, Math.min(n - L.rows, top + d));
        cursor = Math.max(top, Math.min(top + L.rows - 1, cursor));
    };

    function open(list, options = {}) {
        lines = list;
        index = 0;
        shown = 0;
        cursor = 0;
        top = 0;
        drag = null;
        opts = options;
        active = true;
    }
    const atLast = () => index === lines.length - 1;
    const full = () => shown >= lines[index].text.length;

    function finish(choice) {
        active = false;
        opts.done?.(choice);
    }

    function update(dt, input) {
        if (!active) return;
        shown = Math.min(lines[index].text.length, shown + dt * 40);
        const choosing = atLast() && full() && opts.choices;
        if (choosing) {
            const n = opts.choices.length;
            if (input.pressed.up) { cursor = (cursor + n - 1) % n; scrollTo(cursor); sfx('cursor'); }
            if (input.pressed.down) { cursor = (cursor + 1) % n; scrollTo(cursor); sfx('cursor'); }
            if (input.wheel) { scrollBy(input.wheel); sfx('cursor'); }
            const tc = input.touch;
            if (tc.justDown) {
                if (top > 0 && hit(ARROW_UP, tc.x, tc.y)) { scrollBy(-1); sfx('cursor'); return; }
                if (top + layout().rows < n && hit(ARROW_DOWN, tc.x, tc.y)) { scrollBy(1); sfx('cursor'); return; }
                drag = { y: tc.y, moved: 0, at: visible().find(b => hit(b, tc.x, tc.y)) };
            }
            // なぞって スクロール。動かさずに はなしたら その ボタン
            if (drag && tc.down) {
                const d = tc.y - drag.y;
                if (Math.abs(d) >= layout().step * 0.8) { scrollBy(d < 0 ? 1 : -1); drag.y = tc.y; drag.moved++; }
            }
            if (drag && tc.justUp) {
                const b = drag.at;
                drag = null;
                if (b && hit(b, tc.x, tc.y) && visible().some(v => v.i === b.i)) { sfx('ok'); finish(b.i); return; }
            }
            if (drag && drag.moved) drag.at = null;
            if (input.pressed.a) { sfx('ok'); finish(cursor); return; }
            if (input.pressed.b) { sfx('cancel'); finish(n - 1); }
            return;
        }
        if (input.pressed.a || input.pressed.b || input.touch.justDown) {
            if (!full()) shown = lines[index].text.length;
            else if (atLast()) { sfx('cursor'); finish(null); }
            else { index++; shown = 0; sfx('cursor'); }
        }
    }

    function drawTop(ctx, t) {
        if (!active) return;
        const line = lines[index];
        if (line.art && ART[line.art]) {
            panel(ctx, 12, 96, 76, 70, { fill: 'rgba(255,255,255,0.12)', edge: null });
            drawArt(ctx, ART[line.art], Math.floor(t * 2) % 2, 50, 160, { scale: 4 });
        }
        panel(ctx, 8, 166, 384, 68);
        if (line.who) {
            panel(ctx, 14, 154, 100, 20, { fill: '#1b3a6b' });
            text(ctx, line.who, 64, 168, { size: 12, align: 'center', bold: true });
        }
        const rows = wrap(ctx, line.text.slice(0, Math.floor(shown)), 360, 13);
        rows.slice(0, 3).forEach((r, i) => text(ctx, r, 20, 190 + i * 18, { size: 13 }));
        if (full() && !(atLast() && opts.choices) && Math.floor(t * 3) % 2) text(ctx, '▼', 380, 228, { size: 10, align: 'right', color: COLORS.accent });
    }

    function drawBottom(ctx) {
        if (!active) return;
        if (atLast() && full() && opts.choices) {
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, 0, 320, 240);
            visible().forEach(b => button(ctx, b, { active: b.i === cursor, size: layout().h < 36 ? 12 : 13 }));
            // まだ 上・下に ある ときは ▲▼ (タップで スクロール)
            const n = opts.choices.length;
            if (top > 0) text(ctx, `▲ あと ${top}`, 160, 13, { size: 10.5, align: 'center', color: COLORS.accent, bold: true });
            if (top + layout().rows < n) text(ctx, `▼ あと ${n - top - layout().rows}`, 160, 236, { size: 10.5, align: 'center', color: COLORS.accent, bold: true });
        } else {
            ctx.fillStyle = '#16203a';
            ctx.fillRect(0, 206, 320, 34);
            text(ctx, `${btn('a')} か タップで つぎへ`, 160, 228, { size: 11, align: 'center', color: COLORS.sub });
        }
    }

    return { open, update, drawTop, drawBottom, isActive: () => active };
}
