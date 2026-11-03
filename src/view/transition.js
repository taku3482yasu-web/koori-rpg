// =====================================================================
// バトルに 入る ときの ロード演出 (2026-11-03 ユーザー指定)
// ---------------------------------------------------------------------
// むらさきの 煙が まんなかで 渦を まいて 画面を おおい、まんなかから 晴れて バトル画面に なる。ボスの ときは 赤い 霧
//   drawSmoke(ctx, time, { outer, hole, boss }): outer = 煙の ひろがり (まんなかからの 半径)・hole = まんなかの 晴れた 穴の 半径
// =====================================================================
export const SWIRL_IN = 0.7;    // 煙が 画面を おおうまで (秒)
export const SWIRL_OUT = 0.8;   // まんなかから 晴れるまで (秒)
export const FULL = 260;        // 画面ぜんぶを おおう 半径

let off = null;
const PURPLE = ['#14061f', '#2e0f4a', '#55207e', '#8a46c0', '#c08ae8'];
const RED = ['#1f0204', '#4a0810', '#86121f', '#c42a3a', '#ff7a7a'];

export function drawSmoke(ctx, time, { outer = FULL, hole = 0, boss = false } = {}) {
    if (typeof document === 'undefined') return;
    if (!off) { off = document.createElement('canvas'); off.width = 400; off.height = 240; }
    const c = off.getContext('2d');
    const col = boss ? RED : PURPLE;
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, 400, 240);
    // 下地 (まんなかが 明るい)
    const bg = c.createRadialGradient(200, 120, 0, 200, 120, FULL);
    bg.addColorStop(0, col[2]); bg.addColorStop(0.6, col[1]); bg.addColorStop(1, col[0]);
    c.fillStyle = bg;
    c.fillRect(0, 0, 400, 240);
    // 渦: 5 本の うでに 煙の かたまり
    for (let arm = 0; arm < 5; arm++) {
        for (let i = 0; i < 30; i++) {
            const r = (i / 30) * FULL;
            const a = arm * (Math.PI * 2 / 5) + time * 2.6 - r * 0.022;
            const x = 200 + Math.cos(a) * r * 1.3, y = 120 + Math.sin(a) * r * 0.75;
            c.globalAlpha = 0.35 + 0.25 * Math.sin(i * 0.7 + time * 3 + arm);
            c.fillStyle = col[2 + ((i + arm) % 3)];
            c.beginPath();
            c.arc(x, y, 10 + i * 1.6, 0, Math.PI * 2);
            c.fill();
        }
    }
    // ボスの 霧: ときどき 赤く ゆらめく
    if (boss) {
        c.globalAlpha = 0.18 + 0.12 * Math.sin(time * 9);
        c.fillStyle = '#ff2030';
        c.fillRect(0, 0, 400, 240);
    }
    c.globalAlpha = 1;
    // そとがわ (まだ 煙が きていない ところ) を けす
    if (outer < FULL) {
        c.globalCompositeOperation = 'destination-in';
        const m = c.createRadialGradient(200, 120, Math.max(0, outer - 40), 200, 120, Math.max(1, outer));
        m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = m;
        c.fillRect(0, 0, 400, 240);
    }
    // まんなかの 晴れた 穴
    if (hole > 0) {
        c.globalCompositeOperation = 'destination-out';
        const h = c.createRadialGradient(200, 120, Math.max(0, hole - 50), 200, 120, Math.max(1, hole));
        h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = h;
        c.fillRect(0, 0, 400, 240);
    }
    c.globalCompositeOperation = 'source-over';
    ctx.drawImage(off, 0, 0);
}

// st: 演出が はじまってからの 秒・shot: バトル前の 画面 (canvas)
export function drawSwirl(ctx, st, shot, boss) {
    if (st < SWIRL_IN) {
        if (shot) ctx.drawImage(shot, 0, 0, 400, 240);
        const k = st / SWIRL_IN;
        drawSmoke(ctx, st, { outer: 30 + k * k * (FULL + 40), boss });
    } else {
        const k = Math.min(1, (st - SWIRL_IN) / SWIRL_OUT);
        drawSmoke(ctx, st, { hole: k * (FULL + 60), boss });
    }
}
