// =====================================================================
// 2 画面の用意: 上画面 400×240・下画面 320×240 (ドット)
// ---------------------------------------------------------------------
// 文字をきれいに出すため、キャンバスの中身は 3 倍の細かさで持ち、絵はドットの座標のまま描く (ctx を 3 倍に拡大)。
// 画面の大きさ (--u) は、窓の幅と高さに合わせて決める。スマホではボタンの場所を下にとる
// =====================================================================
export const TOP_W = 400, TOP_H = 240, BOTTOM_W = 320, BOTTOM_H = 240;
const DETAIL = 3;
const PAD_MIN = 210;   // スマホのボタンにとる高さ (px)

export function setupScreens(topCanvas, bottomCanvas) {
    const prepare = (canvas, w, h) => {
        canvas.width = w * DETAIL;
        canvas.height = h * DETAIL;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(DETAIL, 0, 0, DETAIL, 0, 0);
        ctx.imageSmoothingEnabled = false;
        return ctx;
    };
    const top = prepare(topCanvas, TOP_W, TOP_H);
    const bottom = prepare(bottomCanvas, BOTTOM_W, BOTTOM_H);

    function layout() {
        const padShown = !document.body.classList.contains('nopad');
        const height = window.innerHeight, width = window.innerWidth;
        const deviceH = 6 + TOP_H + 8 + BOTTOM_H;
        const u = Math.max(0.5, Math.min(width / 412, (height - (padShown ? PAD_MIN : 12)) / deviceH));
        document.documentElement.style.setProperty('--u', `${u}px`);
        document.documentElement.style.setProperty('--padh', `${Math.max(PAD_MIN, height - deviceH * u)}px`);
    }
    window.addEventListener('resize', layout);
    layout();
    return { top, bottom, layout };
}
