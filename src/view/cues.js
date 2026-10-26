// =====================================================================
// かくれている キャラの「違和感」(2026-10-26 ユーザー指定)
// ---------------------------------------------------------------------
// ふだんの 画面でも「なにか へん」と 気づけるように、場所ごとに ちょっと おかしな 絵を 出す。
// (x, y) は その マスの まんなか (上画面の 座標)。t は 時間 (秒)。ときどき「？」も 出す
// =====================================================================
import { text } from '../core/draw.js';

const r = (ctx, x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
const blink = t => (t % 3.2) < 0.15;    // ときどき まばたき

const CUES = {
    // 川原の 石ころの 中に、目の ある 石が まじっていて、ときどき ゆれる
    eyeStone(ctx, x, y, t) {
        const wob = (t % 4) < 0.5 ? Math.sin(t * 40) * 1 : 0;
        r(ctx, x - 6 + wob, y - 2, 12, 7, '#9a9aa4');
        r(ctx, x - 5 + wob, y - 3, 10, 1, '#b4b4bc');
        r(ctx, x - 5 + wob, y + 5, 10, 1, '#6a6a74');
        if (!blink(t)) {
            r(ctx, x - 3 + wob, y, 2, 2, '#10162a');
            r(ctx, x + 2 + wob, y, 2, 2, '#10162a');
        }
    },
    // お地蔵さんの うしろから しましまの しっぽが 出ていて、ふりふり している
    jizoTail(ctx, x, y, t) {
        const sw = Math.sin(t * 5) * 3;
        r(ctx, x + 4, y + 2 + sw * 0.2, 5, 5, '#b07a3a');
        r(ctx, x + 8, y + sw * 0.5, 4, 5, '#4a2a10');
        r(ctx, x + 11, y - 2 + sw * 0.8, 4, 5, '#b07a3a');
        r(ctx, x + 14, y - 4 + sw, 3, 4, '#4a2a10');
    },
    // 車の 下から トゲが のぞいて、ぴくぴく している
    carNeedles(ctx, x, y, t) {
        const up = Math.floor(t * 4) % 2;
        for (let i = 0; i < 5; i++) r(ctx, x - 8 + i * 4, y + 3 - up - (i % 2), 1, 4, '#c8a070');
        r(ctx, x - 9, y + 6, 20, 1, 'rgba(0,0,0,0.3)');
    },
    // 川に 糸が たれていて、うきが 川の 流れと 反対に 動く
    fishLine(ctx, x, y, t) {
        const bx = x + 18 + Math.sin(t * 1.3) * 5, by = y + 4 + Math.sin(t * 3) * 1.5;
        ctx.strokeStyle = 'rgba(240,240,240,0.8)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x + 2, y - 10);
        ctx.quadraticCurveTo(x + 10, y - 8, bx, by);
        ctx.stroke();
        r(ctx, bx - 1.5, by - 2, 3, 2, '#ff4a4a');
        r(ctx, bx - 1.5, by, 3, 1, '#ffffff');
        const ring = (t * 12) % 10;
        ctx.strokeStyle = `rgba(255,255,255,${0.6 - ring / 18})`;
        ctx.beginPath();
        ctx.ellipse(bx, by + 2, ring, ring / 3, 0, 0, Math.PI * 2);
        ctx.stroke();
    },
    // くらがりに 光る 目が 2 つ
    nightEyes(ctx, x, y, t) {
        if (blink(t)) return;
        const dx = Math.sin(t * 0.7) * 2;
        r(ctx, x - 4 + dx, y - 2, 3, 3, '#ffe040');
        r(ctx, x + 2 + dx, y - 2, 3, 3, '#ffe040');
        r(ctx, x - 3 + dx, y - 1, 1, 1, '#10162a');
        r(ctx, x + 3 + dx, y - 1, 1, 1, '#10162a');
    },
    // だれも いないのに ろうそくの 火が ゆらゆら 浮いている
    candle(ctx, x, y, t) {
        const fy = y - 6 + Math.sin(t * 2) * 2;
        r(ctx, x - 1, fy + 3, 3, 6, '#f0f0e0');
        const h = 3 + (Math.floor(t * 8) % 2);
        r(ctx, x, fy + 3 - h, 1, h, '#ffb030');
        r(ctx, x - 1, fy + 1 - h / 2, 3, 2, '#ff7a20');
        ctx.fillStyle = 'rgba(255, 180, 60, 0.18)';
        ctx.beginPath();
        ctx.arc(x, fy, 9, 0, Math.PI * 2);
        ctx.fill();
    },
    // 橋の 下の かげから 目が のぞく
    glowEyes(ctx, x, y, t) {
        r(ctx, x - 8, y - 4, 16, 8, 'rgba(20, 16, 40, 0.55)');
        if (!blink(t)) {
            r(ctx, x - 4, y - 1, 2, 2, '#ffe040');
            r(ctx, x + 2, y - 1, 2, 2, '#ffe040');
        }
    }
};

export function drawCue(ctx, spot, x, y, t) {
    if (x < -40 || x > 440 || y < -40 || y > 280) return;
    CUES[spot.cue]?.(ctx, x, y, t);
    // 4 秒に 1 回「？」が うかぶ
    const k = (t + spot.x * 0.37) % 4;
    if (k < 1) text(ctx, '？', x, y - 14 - k * 6, { size: 10, align: 'center', bold: true, color: `rgba(255, 240, 160, ${1 - k})`, shadow: false });
}
