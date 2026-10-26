// =====================================================================
// タイトル: 上画面に タイトルと バージョン (内定・免許)、下画面で バージョンと はじめから / つづきから を えらぶ
// =====================================================================
import { ART } from '../art/index.js';
import { COLORS, drawArt, text, button, hit, panel } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { hasSave } from '../core/save.js';
import { VERSIONS } from '../logic/game.js';

const VERSION_IDS = Object.keys(VERSIONS);
const VBTN = VERSION_IDS.map((id, i) => ({ x: 20 + i * 146, y: 30, w: 134, h: 46, label: `${VERSIONS[id]}バージョン`, id }));
const ACT = [
    { x: 60, y: 104, w: 200, h: 40, label: 'つづきから', act: 'continue' },
    { x: 60, y: 152, w: 200, h: 40, label: 'はじめから', act: 'new' }
];
const CAST = ['koori', 'furukawa', 'daichouenkin', 'ishikoron', 'kozarappa', 'haribaby', 'kogame', 'hashishita'];

export function createTitle(app) {
    let t = 0, v = VERSION_IDS.indexOf(app.version), row = 0, confirm = false;
    const canContinue = () => hasSave(VERSION_IDS[v]);

    function choose(act) {
        const id = VERSION_IDS[v];
        if (act === 'continue') {
            if (!canContinue()) { sfx('cancel'); return; }
            sfx('ok');
            app.start(id, false);
        } else if (act === 'new' && canContinue()) {
            // セーブが あるときは 消して いいか 聞く (はい → 'new-ok')
            confirm = true;
            sfx('cursor');
        } else {
            sfx('ok');
            app.start(id, true);
        }
    }

    function update(dt, input) {
        t += dt;
        const tc = input.touch;
        if (confirm) {
            if (input.pressed.a || (tc.justDown && hit(YES, tc.x, tc.y))) { confirm = false; choose('new-ok'); return; }
            if (input.pressed.b || (tc.justDown && hit(NO, tc.x, tc.y))) { confirm = false; sfx('cancel'); }
            return;
        }
        if (input.pressed.left || input.pressed.right || input.pressed.l || input.pressed.r) { v = 1 - v; app.setVersion(VERSION_IDS[v]); sfx('cursor'); }
        if (input.pressed.up || input.pressed.down) { row = 1 - row; sfx('cursor'); }
        if (input.pressed.a || input.pressed.start) choose(ACT[canContinue() ? row : 1].act);
        if (tc.justDown) {
            const vi = VBTN.findIndex(b => hit(b, tc.x, tc.y));
            if (vi >= 0) { v = vi; app.setVersion(VERSION_IDS[v]); sfx('cursor'); }
            const ai = ACT.findIndex(b => hit(b, tc.x, tc.y));
            if (ai >= 0) choose(ACT[ai].act);
        }
    }
    const YES = { x: 40, y: 150, w: 110, h: 40, label: 'はい' };
    const NO = { x: 170, y: 150, w: 110, h: 40, label: 'いいえ' };

    function drawTop(ctx) {
        const naitei = VERSION_IDS[v] === 'naitei';
        const grad = ctx.createLinearGradient(0, 0, 0, 240);
        grad.addColorStop(0, naitei ? '#16285a' : '#1d4a2c');
        grad.addColorStop(1, naitei ? '#4a6ab0' : '#5aa06a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 240);
        // きらきら
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.3 * Math.sin(t * 2 + i)})`;
            ctx.fillRect((i * 71) % 400, (i * 37) % 120, 2, 2);
        }
        text(ctx, 'こおりくんの大冒険', 200, 46, { size: 26, align: 'center', bold: true, color: '#bff0ff' });
        text(ctx, '～大集合だヨ！おともだち！～', 200, 74, { size: 17, align: 'center', bold: true, color: '#ffffff' });
        panel(ctx, 140, 84, 120, 30, { fill: naitei ? '#d8a840' : '#e06a2a', edge: '#ffffff', r: 8, lineWidth: 2 });
        text(ctx, VERSIONS[VERSION_IDS[v]], 200, 106, { size: 20, align: 'center', bold: true, color: '#ffffff' });
        CAST.forEach((id, i) => {
            const x = 40 + i * 46;
            drawArt(ctx, ART[id], Math.floor(t * 2 + i), x, 200 + Math.sin(t * 3 + i) * 3, { scale: id === 'koori' ? 3 : 2.4 });
        });
        if (Math.floor(t * 2) % 2) text(ctx, 'PRESS A', 200, 230, { size: 11, align: 'center', color: COLORS.sub });
    }

    function drawBottom(ctx) {
        ctx.fillStyle = '#16203a';
        ctx.fillRect(0, 0, 320, 240);
        text(ctx, 'バージョンを えらぶ', 160, 20, { size: 11, align: 'center', color: COLORS.sub });
        VBTN.forEach((b, i) => button(ctx, b, { active: i === v }));
        ACT.forEach((b, i) => button(ctx, b, { active: (canContinue() ? row : 1) === i, disabled: b.act === 'continue' && !canContinue() }));
        text(ctx, '十字キー・タップで えらぶ / A (PC は J か Enter) で 決定', 160, 222, { size: 10.5, align: 'center', color: COLORS.dim });
        if (confirm) {
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(0, 0, 320, 240);
            text(ctx, `${VERSIONS[VERSION_IDS[v]]}バージョンの セーブが 消えます。`, 160, 96, { size: 13, align: 'center', bold: true });
            text(ctx, 'はじめから で いい？', 160, 120, { size: 13, align: 'center' });
            button(ctx, YES);
            button(ctx, NO);
        }
    }

    return { name: 'title', update, drawTop, drawBottom };
}
