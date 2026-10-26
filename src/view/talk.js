// =====================================================================
// 会話: 上画面に 立ち絵と ふきだし、下画面に 「つぎへ」か 選択肢 (設計書 7 章)
// ---------------------------------------------------------------------
// app.talk([{ who, art, text }], { choices: ['はい', 'いいえ'], done: index => {} })
// 文字は 1 文字ずつ 出る。A か 下画面の タップで 進む (出ている 途中なら 全部 出す)
// =====================================================================
import { ART } from '../art/index.js';
import { COLORS, drawArt, panel, text, wrap, button, hit } from '../core/draw.js';
import { sfx } from '../core/sound.js';

export function createTalk() {
    let lines = [], index = 0, shown = 0, opts = {}, cursor = 0, active = false;
    const choiceButtons = () => (opts.choices || []).map((label, i) => ({ x: 40, y: 40 + i * 44, w: 240, h: 36, label }));

    function open(list, options = {}) {
        lines = list;
        index = 0;
        shown = 0;
        cursor = 0;
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
            const bs = choiceButtons();
            if (input.pressed.up) { cursor = (cursor + bs.length - 1) % bs.length; sfx('cursor'); }
            if (input.pressed.down) { cursor = (cursor + 1) % bs.length; sfx('cursor'); }
            if (input.touch.justDown) {
                const i = bs.findIndex(b => hit(b, input.touch.x, input.touch.y));
                if (i >= 0) { sfx('ok'); finish(i); return; }
            }
            if (input.pressed.a) { sfx('ok'); finish(cursor); return; }
            if (input.pressed.b) { sfx('cancel'); finish(bs.length - 1); }
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
            choiceButtons().forEach((b, i) => button(ctx, b, { active: i === cursor }));
        } else {
            ctx.fillStyle = '#16203a';
            ctx.fillRect(0, 206, 320, 34);
            text(ctx, 'A か タップで つぎへ', 160, 228, { size: 11, align: 'center', color: COLORS.sub });
        }
    }

    return { open, update, drawTop, drawBottom, isActive: () => active };
}
