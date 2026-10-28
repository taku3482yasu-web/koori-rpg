// =====================================================================
// 入力: キーボード・ゲームパッド・画面のボタン (スマホ)・下画面のタッチを 1 つにまとめる
// ---------------------------------------------------------------------
// ボタン: up down left right a b x y l r start (+ sp1 sp2 sp3 はキーボードの 1・2・3、tab は Tab キー (X と 同時に 押される)、fast は F キー)
// input.wheel: そのコマの マウスホイール (下へ +1 / 上へ -1。画面の 上で 回したとき)
// input.held.a は押している間 true、input.pressed.a はそのコマで押されたときだけ true
// 下画面のタッチは input.touch (x, y は下画面のドット。down / justDown / justUp)
// =====================================================================
import { setKeyMode } from './keys.js';

const BUTTONS = ['up', 'down', 'left', 'right', 'a', 'b', 'x', 'y', 'l', 'r', 'start', 'sp1', 'sp2', 'sp3', 'tab', 'fast', 'help'];
// PC: 左手の WASD (か 矢印) で 動き、右手で ボタン。J=A (決定)・K=B (戻る)・I=X・U=Y・Q=L・E=R (2026-10-26 ユーザー指定)
const KEYS = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyJ: 'a', Enter: 'a', Space: 'a', KeyK: 'b', Escape: 'b', Backspace: 'b', KeyI: 'x', Tab: 'x', KeyU: 'y',
    KeyQ: 'l', KeyE: 'r', ShiftLeft: 'start', ShiftRight: 'start', KeyP: 'start', Digit1: 'sp1', Digit2: 'sp2', Digit3: 'sp3', KeyF: 'fast', KeyH: 'help', Digit4: 'help'
};
// いっしょに 押される ボタン: Tab は メニューを 開く (X) と、メニューの 中では タブの 切りかえ (tab) (2026-10-28 ユーザー指定)
const ALSO = { Tab: 'tab' };
// 標準のゲームパッド (下 0・右 1・左 2・上 3)。携帯機と同じく 右が A・下が B・左が Y・上が X
const PAD = { 1: 'a', 0: 'b', 2: 'y', 3: 'x', 4: 'l', 5: 'r', 6: 'l', 7: 'r', 8: 'help', 9: 'start', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };

export function createInput({ bottomCanvas = null, topCanvas = null, padRoot = null, onPadChange = () => {} } = {}) {
    // 上画面の マウス (PC でレンズを動かす)。x, y は上画面の ドット。moved はそのコマで動いたとき
    const mouse = { x: 200, y: 120, moved: false, inside: false };
    let mouseMoved = false;
    if (topCanvas) {
        topCanvas.addEventListener('pointermove', e => {
            if (e.pointerType !== 'mouse') return;
            const r = topCanvas.getBoundingClientRect();
            mouse.x = (e.clientX - r.left) / r.width * 400;
            mouse.y = (e.clientY - r.top) / r.height * 240;
            mouse.inside = true;
            mouseMoved = true;
        });
        topCanvas.addEventListener('pointerleave', () => { mouse.inside = false; });
    }
    const sources = { key: {}, pad: {}, touchBtn: {}, fake: {} };
    const held = {}, pressed = {}, prev = {};
    const touch = { down: false, justDown: false, justUp: false, x: 0, y: 0, startX: 0, startY: 0 };
    let touchDown = false, touchUpQueued = false, touchDownQueued = false;
    let lastKind = null;
    let wheelAcc = 0, wheel = 0;
    const usePad = (kind, show) => {
        if (lastKind === kind) return;
        lastKind = kind;
        setKeyMode(kind);
        if (typeof document !== 'undefined') document.body.classList.toggle('nopad', !show);
        onPadChange();
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', e => {
            const b = KEYS[e.code];
            if (!b) return;
            e.preventDefault();
            sources.key[b] = true;
            if (ALSO[e.code]) sources.key[ALSO[e.code]] = true;
            usePad('key', false);
        });
        window.addEventListener('keyup', e => {
            const b = KEYS[e.code];
            if (b) sources.key[b] = false;
            if (ALSO[e.code]) sources.key[ALSO[e.code]] = false;
        });
        window.addEventListener('blur', () => { sources.key = {}; sources.touchBtn = {}; });
        // マウスホイール (2026-10-28 ユーザー指定: 一覧を スクロール)。ゲームの 画面の 上だけ
        window.addEventListener('wheel', e => {
            if (!e.target || e.target.tagName !== 'CANVAS') return;
            e.preventDefault();
            wheelAcc += e.deltaY;
        }, { passive: false });
        window.addEventListener('touchstart', () => usePad('touch', true), { passive: true });
    }

    if (padRoot) {
        const active = new Map();
        const set = (el, v) => {
            sources.touchBtn[el.dataset.btn] = v;
            el.classList.toggle('on', v);
        };
        padRoot.addEventListener('pointerdown', e => {
            const el = e.target.closest('[data-btn]');
            if (!el) return;
            e.preventDefault();
            active.set(e.pointerId, el);
            set(el, true);
        });
        // 十字キーは、指をすべらせたらとなりのボタンに移る
        padRoot.addEventListener('pointermove', e => {
            const old = active.get(e.pointerId);
            if (!old || !old.closest('#dpad')) return;
            const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-btn]');
            if (el && el !== old && el.closest('#dpad')) {
                set(old, false);
                set(el, true);
                active.set(e.pointerId, el);
            }
        });
        const up = e => {
            const el = active.get(e.pointerId);
            if (el) { set(el, false); active.delete(e.pointerId); }
        };
        padRoot.addEventListener('pointerup', up);
        padRoot.addEventListener('pointercancel', up);
    }

    if (bottomCanvas) {
        const pos = e => {
            const r = bottomCanvas.getBoundingClientRect();
            return { x: (e.clientX - r.left) / r.width * 320, y: (e.clientY - r.top) / r.height * 240 };
        };
        bottomCanvas.addEventListener('pointerdown', e => {
            e.preventDefault();
            bottomCanvas.setPointerCapture?.(e.pointerId);
            const p = pos(e);
            touch.x = touch.startX = p.x;
            touch.y = touch.startY = p.y;
            touchDown = true;
            touchDownQueued = true;
            if (e.pointerType === 'touch') usePad('touch', true);
        });
        bottomCanvas.addEventListener('pointermove', e => {
            if (!touchDown) return;
            const p = pos(e);
            touch.x = p.x;
            touch.y = p.y;
        });
        const up = () => {
            if (touchDown) { touchDown = false; touchUpQueued = true; }
        };
        bottomCanvas.addEventListener('pointerup', up);
        bottomCanvas.addEventListener('pointercancel', up);
    }

    function pollPad() {
        sources.pad = {};
        const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
        for (const gp of pads) {
            if (!gp) continue;
            gp.buttons.forEach((btn, i) => {
                if (btn.pressed && PAD[i]) { sources.pad[PAD[i]] = true; usePad('pad', false); }
            });
            const [ax = 0, ay = 0] = gp.axes;
            if (ax < -0.5) sources.pad.left = true;
            if (ax > 0.5) sources.pad.right = true;
            if (ay < -0.5) sources.pad.up = true;
            if (ay > 0.5) sources.pad.down = true;
        }
    }

    // 1 コマに 1 回呼ぶ (場面の update の前)
    function update() {
        pollPad();
        for (const b of BUTTONS) {
            const now = Boolean(sources.key[b] || sources.pad[b] || sources.touchBtn[b] || sources.fake[b]);
            pressed[b] = now && !prev[b];
            held[b] = now;
            prev[b] = now;
        }
        touch.justDown = touchDownQueued;
        touch.justUp = touchUpQueued && !touchDownQueued;
        touch.down = touchDown || touchDownQueued;
        touchDownQueued = false;
        touchUpQueued = false;
        mouse.moved = mouseMoved;
        mouseMoved = false;
        // ホイールは 1 コマに 1 行ぶん まで (たくさん 回しても 少しずつ)
        wheel = Math.abs(wheelAcc) >= 40 ? Math.sign(wheelAcc) : 0;
        if (wheel) wheelAcc -= wheel * Math.min(Math.abs(wheelAcc), 100);
        else if (Math.abs(wheelAcc) < 40) wheelAcc *= 0.9;
        api.wheel = wheel;
    }

    // 自動テスト用: ボタンを押す・はなす、下画面をさわる
    const press = (b, v = true) => { sources.fake[b] = v; };
    const fakeTouch = (x, y, phase) => {
        touch.x = x;
        touch.y = y;
        if (phase === 'down') { touch.startX = x; touch.startY = y; touchDown = true; touchDownQueued = true; }
        if (phase === 'up') { touchDown = false; touchUpQueued = true; }
    };

    const fakeWheel = dy => { wheelAcc += dy; };
    const api = { held, pressed, touch, mouse, wheel: 0, update, press, fakeTouch, fakeWheel, usesTouch: () => lastKind === 'touch' };
    return api;
}
