// =====================================================================
// 会話: 上画面に 立ち絵と ふきだし、下画面に 「つぎへ」か 選択肢 (設計書 7 章)
// ---------------------------------------------------------------------
// app.talk([{ who, art, text }], { choices: ['はい', 'いいえ'], done: index => {} })
// 文字は 1 文字ずつ 出る。A か 下画面の タップで 進む (出ている 途中なら 全部 出す)
// 選択肢が 多いとき (駄菓子屋 など) は 下画面に 入る ぶんだけ 出して スクロールする (2026-10-28 ユーザー指定:
//   一番下が 見えなかった)。カーソル・マウスホイール・▲▼ の タップ・なぞる で 動く
// 個数を えらぶ: { count: { max, label: n => '…' }, done: n => {} } (やめると null。2026-10-28 ユーザー指定)
//   上下で 1 こ、左右・L R で 10 こ。下画面の −10 −1 ＋1 ＋10 も タップ できる
// ムービー: { movie: { place, title, cast, weather } } (2026-11-02)。上画面 ぜんぶが 舞台 (movie.js) に なり、
//   キャラが 動く。行の あいだに { do: '…' } の 動きを はさめる。START で とばせる
// =====================================================================
import { ART } from '../art/index.js';
import { COLORS, drawArt, panel, text, textWidth, wrap, fitSize, button, hit } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { btn } from '../core/keys.js';
import { createStage } from './movie.js';

export function createTalk() {
    let lines = [], index = 0, shown = 0, opts = {}, cursor = 0, active = false;
    let stage = null, started = -1, movieT = 0;    // ムービーの 舞台・動きを 始めた 行
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
    let count = 1;
    const STEPS = [-10, -1, 1, 10].map((d, i) => ({ d, x: 16 + i * 76, y: 108, w: 60, h: 36, label: d > 0 ? `＋${d}` : `−${-d}` }));
    const OK_BTN = { x: 40, y: 162, w: 116, h: 36, label: 'これに する' }, NO_BTN = { x: 164, y: 162, w: 116, h: 36, label: 'やめる' };
    // 1 こ ずつは 先頭と 最後で 一周、10 こ ずつは はしで 止まる
    const addCount = d => {
        const max = opts.count.max;
        if (Math.abs(d) === 1) count = ((count - 1 + d + max) % max) + 1;
        else count = Math.max(1, Math.min(max, count + d));
        sfx('cursor');
    };
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
        stage = options.movie ? createStage(options.movie) : null;
        lines = stage ? list : list.filter(l => !l.do);
        if (!lines.length) lines = [{ who: '', text: '' }];
        started = -1;
        movieT = 0;
        index = 0;
        shown = 0;
        cursor = 0;
        top = 0;
        drag = null;
        count = 1;
        opts = options;
        active = true;
    }
    const atLast = () => index === lines.length - 1;
    const full = () => shown >= lines[index].text.length;

    function finish(choice) {
        active = false;
        opts.done?.(choice);
    }

    // ムービー: 動きの 行を すすめる。セリフの 行は 話す キャラが 出てくるのを 待ってから 字を 出す。true なら この コマは ここまで
    function updateMovie(dt, input) {
        stage.update(dt);
        movieT += dt;
        const go = input.pressed.a || input.pressed.b || input.touch.justDown;
        const last = lines.length - 1, tail = lines[last];
        if (input.pressed.start && !(index === last && (opts.choices || opts.count))) {
            // とばす: 選択肢が あれば その 行まで、なければ おわり
            stage.finishNow();
            if ((opts.choices || opts.count) && !tail.do) { index = last; started = last; shown = tail.text.length; stage.onLine(tail); stage.finishNow(); return true; }
            sfx('cursor');
            finish(null);
            return true;
        }
        const cur = lines[index];
        if (started !== index) { started = index; if (cur.do) stage.run(cur); else stage.onLine(cur); }
        if (cur.do) {
            if (go) stage.finishNow();
            if (!stage.busy()) {
                if (index === last) finish(null);
                else { index++; shown = 0; }
            }
            return true;
        }
        if (stage.busy()) { if (go) stage.finishNow(); return true; }
        return false;
    }

    function update(dt, input) {
        if (!active) return;
        if (stage && updateMovie(dt, input)) return;
        if (!active) return;
        shown = Math.min(lines[index].text.length, shown + dt * 40);
        if (atLast() && full() && opts.count) {
            if (input.pressed.up) addCount(1);
            if (input.pressed.down) addCount(-1);
            if (input.pressed.right || input.pressed.r) addCount(10);
            if (input.pressed.left || input.pressed.l) addCount(-10);
            if (input.wheel) addCount(input.wheel < 0 ? 1 : -1);
            const tc = input.touch;
            if (tc.justDown) {
                const s = STEPS.find(b => hit(b, tc.x, tc.y));
                if (s) addCount(s.d);
                else if (hit(OK_BTN, tc.x, tc.y)) { sfx('ok'); finish(count); return; }
                else if (hit(NO_BTN, tc.x, tc.y)) { sfx('cancel'); finish(null); return; }
            }
            if (input.pressed.a) { sfx('ok'); finish(count); return; }
            if (input.pressed.b) { sfx('cancel'); finish(null); }
            return;
        }
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
        if (stage) {
            stage.draw(ctx);
            if (line.do || started !== index) return;
        } else if (line.art && ART[line.art]) {
            panel(ctx, 12, 96, 76, 70, { fill: 'rgba(255,255,255,0.12)', edge: null });
            drawArt(ctx, ART[line.art], Math.floor(t * 2) % 2, 50, 160, { scale: 4 });
        }
        panel(ctx, 8, 166, 384, 68);
        // 名前の 札は 名前に 合わせて のばす (駄菓子屋の おばあちゃん など)
        if (line.who) {
            const w = Math.max(100, textWidth(ctx, line.who, 12, true) + 20);
            panel(ctx, 14, 154, w, 20, { fill: '#1b3a6b' });
            text(ctx, line.who, 14 + w / 2, 168, { size: 12, align: 'center', bold: true });
        }
        // 長い 文は 3 行に 入るように 小さく (大きさは 全文で 決めて、出している 途中で 変えない)
        const size = fitSize(ctx, line.text, 360, 13, 3, 10);
        const rows = wrap(ctx, line.text.slice(0, Math.floor(shown)), 360, size);
        rows.slice(0, 3).forEach((r, i) => text(ctx, r, 20, 190 + i * (size + 5), { size }));
        if (full() && !(atLast() && (opts.choices || opts.count)) && Math.floor(t * 3) % 2) text(ctx, '▼', 380, 228, { size: 10, align: 'right', color: COLORS.accent });
    }

    function drawBottom(ctx) {
        if (!active) return;
        if (atLast() && full() && opts.count) {
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, 0, 320, 240);
            panel(ctx, 16, 14, 288, 84);
            text(ctx, opts.count.label(count), 160, 40, { size: 13, align: 'center', bold: true });
            text(ctx, `${count} こ`, 160, 82, { size: 30, align: 'center', bold: true, color: COLORS.accent });
            text(ctx, `▲`, 236, 64, { size: 11, align: 'center', color: COLORS.sub });
            text(ctx, `▼`, 236, 86, { size: 11, align: 'center', color: COLORS.sub });
            STEPS.forEach(b => button(ctx, b, { disabled: (b.d === -10 && count === 1) || (b.d === 10 && count === opts.count.max), size: 14 }));
            button(ctx, OK_BTN, { active: true });
            button(ctx, NO_BTN);
            ctx.fillStyle = '#16203a';
            ctx.fillRect(0, 208, 320, 32);
            text(ctx, `↑↓ 1こ ・ ←→ ${btn('l')}${btn('r')} 10こ ・ ${btn('a')} けってい`, 160, 222, { size: 10.5, align: 'center', color: COLORS.sub });
            return;
        }
        if (stage && !(atLast() && full() && opts.choices)) {
            // ムービーの あいだの 下画面: 題名と 操作
            ctx.fillStyle = '#0c1020';
            ctx.fillRect(0, 0, 320, 240);
            text(ctx, '― ストーリー ―', 160, 70, { size: 12, align: 'center', color: COLORS.sub });
            text(ctx, opts.movie.title || '', 160, 104, { size: 16, align: 'center', bold: true, color: COLORS.accent, maxWidth: 300 });
            text(ctx, `${btn('a')} か タップで つぎへ`, 160, 188, { size: 11, align: 'center', color: COLORS.sub });
            text(ctx, `${btn('start')} で ムービーを とばす`, 160, 210, { size: 10.5, align: 'center', color: COLORS.dim });
            return;
        }
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

    return { open, update, drawTop, drawBottom, isActive: () => active, isMovie: () => active && Boolean(stage) };
}
