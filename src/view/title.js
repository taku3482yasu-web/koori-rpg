// =====================================================================
// タイトル: 上画面に タイトルと バージョン (内定・免許)、下画面で バージョンと はじめから / つづきから を えらぶ
// はじめから・つづきからを えらぶと、妖怪ウォッチ 2 の ように おなかまウォッチが まわって 光り、なかまが 画面へ 飛びだしてから 始まる
//   (2026-11-03 ユーザー指定。A・タップで とばせる)。下画面の「大全」で ゲーム大全へ もどる
// =====================================================================
import { ART } from '../art/index.js';
import { COLORS, drawArt, text, button, hit, panel } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { btn, moveName } from '../core/keys.js';
import { hasSave } from '../core/save.js';
import { VERSIONS } from '../logic/game.js';

const VERSION_IDS = Object.keys(VERSIONS);
const VBTN = VERSION_IDS.map((id, i) => ({ x: 20 + i * 146, y: 30, w: 134, h: 46, label: `${VERSIONS[id]}バージョン`, id }));
const ACT = [
    { x: 60, y: 104, w: 200, h: 40, label: 'つづきから', act: 'continue' },
    { x: 60, y: 152, w: 200, h: 40, label: 'はじめから', act: 'new' }
];
const CAST = ['koori', 'furukawa', 'daichouenkin', 'ishikoron', 'kozarappa', 'haribaby', 'kogame', 'hashishita'];
// 飛びだす なかま (まんなかの ウォッチから)
const BURST = ['koori', 'furukawa', 'onioni', 'tomoishi', 'hyougaryu', 'yukiusapon', 'daichouenkin', 'haribaby', 'kogame', 'pekorisu', 'donguriko', 'mumenbachi', 'urashima', 'kinmetsuki', 'runaya', 'haridaijin'];
const LAUNCH = 2.0;   // 飛びだす 演出の 長さ (秒)
const TAIZEN = 'https://taku3482yasu-web.github.io/koori-game-taizen/';
const TAIZEN_BTN = { x: 236, y: 196, w: 76, h: 22, label: '🏠 大全' };

export function createTitle(app) {
    let t = 0, v = VERSION_IDS.indexOf(app.version), row = 0, confirm = false;
    let launch = null;   // { t, go } 飛びだす 演出 (おわったら go)
    const canContinue = () => hasSave(VERSION_IDS[v]);

    function go(fn) {
        sfx('watch');
        launch = { t: 0, go: fn };
    }
    function choose(act) {
        const id = VERSION_IDS[v];
        if (act === 'continue') {
            if (!canContinue()) { sfx('cancel'); return; }
            go(() => app.start(id, false));
        } else if (act === 'new' && canContinue()) {
            // セーブが あるときは 消して いいか 聞く (はい → 'new-ok')
            confirm = true;
            sfx('cursor');
        } else {
            go(() => app.start(id, true));
        }
    }

    function update(dt, input) {
        t += dt;
        const tc = input.touch;
        if (launch) {
            launch.t += dt;
            if (launch.t > 0.35 && launch.t < LAUNCH - 0.5 && Math.floor((launch.t - dt) * 8) !== Math.floor(launch.t * 8)) sfx('cursor');
            if (launch.t >= LAUNCH || (launch.t > 0.3 && (input.pressed.a || tc.justDown))) { const f = launch.go; launch = null; sfx('ok'); f(); }
            return;
        }
        if (confirm) {
            if (input.pressed.a || (tc.justDown && hit(YES, tc.x, tc.y))) { confirm = false; choose('new-ok'); return; }
            if (input.pressed.b || (tc.justDown && hit(NO, tc.x, tc.y))) { confirm = false; sfx('cancel'); }
            return;
        }
        if (input.pressed.left || input.pressed.right || input.pressed.l || input.pressed.r) { v = 1 - v; app.setVersion(VERSION_IDS[v]); sfx('cursor'); }
        if (input.pressed.up || input.pressed.down) { row = 1 - row; sfx('cursor'); }
        if (input.pressed.a || input.pressed.start) choose(ACT[canContinue() ? row : 1].act);
        if (tc.justDown) {
            if (hit(TAIZEN_BTN, tc.x, tc.y)) { if (window.confirm('ゲーム大全に もどる？')) window.location.href = TAIZEN; return; }
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
        if (Math.floor(t * 2) % 2) text(ctx, `${btn('a')} を おしてね`, 200, 230, { size: 11, align: 'center', color: COLORS.sub });
        if (launch) drawLaunch(ctx, launch.t);
    }

    // おなかまウォッチが まわって 光り、なかまが 画面へ 飛びだす
    function drawLaunch(ctx, lt) {
        const k = Math.min(1, lt / 0.4);
        ctx.fillStyle = `rgba(6, 10, 30, ${0.85 * k})`;
        ctx.fillRect(0, 0, 400, 240);
        // 光の すじ
        ctx.save();
        ctx.translate(200, 120);
        ctx.rotate(lt * 3);
        for (let i = 0; i < 18; i++) {
            ctx.rotate(Math.PI * 2 / 18);
            ctx.fillStyle = i % 2 ? `rgba(120, 220, 255, ${0.35 * k})` : `rgba(255, 240, 160, ${0.3 * k})`;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(320, -18); ctx.lineTo(320, 18); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        // おなかまウォッチ (まわる 輪)
        const r = 34 * Math.min(1, lt / 0.3) * (1 + 0.08 * Math.sin(lt * 20));
        ctx.save();
        ctx.translate(200, 120);
        ctx.rotate(lt * 9);
        ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#2d6cdf'; ctx.lineWidth = 6; ctx.stroke();
        ctx.fillStyle = '#ffd84a';
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.18, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        // なかまが まんなかから 手前へ 飛びだす (だんだん 大きく)
        BURST.forEach((id, i) => {
            const st = 0.35 + i * 0.07;
            const p = (lt - st) / 0.9;
            if (p <= 0 || p >= 1) return;
            const a = i * 2.399 + 0.6;
            const d = 20 + p * p * 260;
            const x = 200 + Math.cos(a) * d * 1.3, y = 120 + Math.sin(a) * d * 0.8 - Math.sin(p * Math.PI) * 20;
            ctx.globalAlpha = p < 0.85 ? 1 : (1 - p) / 0.15;
            for (let s = 1; s <= 3; s++) {   // 星の しっぽ
                ctx.fillStyle = 'rgba(255, 250, 200, 0.7)';
                ctx.fillRect(200 + Math.cos(a) * (d - s * 14) * 1.3, 120 + Math.sin(a) * (d - s * 14) * 0.8, 2, 2);
            }
            drawArt(ctx, ART[id], Math.floor(t * 6 + i), x, y + 10, { scale: 1 + p * 4.5, flip: Math.cos(a) < 0 });
            ctx.globalAlpha = 1;
        });
        text(ctx, 'いっけー！ なかまたち！', 200, 216, { size: 16, align: 'center', bold: true, color: '#ffe85a' });
        // さいごは まっしろに
        if (lt > LAUNCH - 0.35) { ctx.fillStyle = `rgba(255, 255, 255, ${(lt - (LAUNCH - 0.35)) / 0.35})`; ctx.fillRect(0, 0, 400, 240); }
    }

    function drawBottom(ctx) {
        ctx.fillStyle = '#16203a';
        ctx.fillRect(0, 0, 320, 240);
        text(ctx, 'バージョンを えらぶ', 160, 20, { size: 11, align: 'center', color: COLORS.sub });
        VBTN.forEach((b, i) => button(ctx, b, { active: i === v }));
        ACT.forEach((b, i) => button(ctx, b, { active: (canContinue() ? row : 1) === i, disabled: b.act === 'continue' && !canContinue() }));
        text(ctx, `${moveName()}・タップで えらぶ　${btn('a')} で 決定`, 140, 222, { size: 10.5, align: 'center', color: COLORS.dim });
        button(ctx, TAIZEN_BTN, { size: 10 });
        if (confirm) {
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(0, 0, 320, 240);
            text(ctx, `${VERSIONS[VERSION_IDS[v]]}バージョンの セーブが 消えます。`, 160, 96, { size: 13, align: 'center', bold: true });
            text(ctx, 'はじめから で いい？', 160, 120, { size: 13, align: 'center' });
            button(ctx, YES);
            button(ctx, NO);
        }
    }

    return { name: 'title', update, drawTop, drawBottom, debug: { launching: () => Boolean(launch) } };
}
