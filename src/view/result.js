// =====================================================================
// バトルの あと: もらった けいけんち・お金・レベルアップ、仲間に なる 演出 (設計書 4.2)
// ---------------------------------------------------------------------
// 仲間に なりたそうな キャラは「なかまに する / しない」を えらべる (2026-10-28 ユーザー指定)。
//   する → メダルを もらう / しない → さっていく。ボス (ストーリーで 仲間に なる) は えらばない
// =====================================================================
import { ART } from '../art/index.js';
import { NAKAMA, unitOf } from '../data/nakama.js';
import { COLORS, drawArt, panel, text, wrap, fitSize, button, hit } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { btn } from '../core/keys.js';
import { acceptBefriend } from '../logic/game.js';

const CHOICE_BTN = [{ x: 30, y: 196, w: 124, h: 34, label: 'なかまに する' }, { x: 166, y: 196, w: 124, h: 34, label: 'しない' }];

export function createResult(app, result) {
    // 出す 順: けいけんち → なかまに なりたそう (えらぶ) → メダルを もらった / さっていった
    const pages = [result.outcome === 'win' ? 'reward' : 'lose'];
    const forced = Boolean(result.befriend && result.befriend.forced);
    if (result.befriend) pages.push(forced ? 'look' : 'ask');
    if (forced) pages.push('medal');
    let page = 0, t = 0, choice = 0;
    const friend = result.befriend ? NAKAMA[result.befriend.id] : null;

    function next() {
        page++;
        t = 0;
        if (pages[page] === 'medal') sfx('watch');
        else if (pages[page] === 'look' || pages[page] === 'ask') sfx('friend');
        else sfx('cursor');
        if (page >= pages.length) app.backToField(result);
    }
    function decide(i) {
        if (i === 0) {
            acceptBefriend(app.g, result);
            pages.push('medal');
        } else pages.push('bye');
        next();
    }

    function update(dt, input) {
        t += dt;
        if (t < 0.4) return;
        if (pages[page] === 'ask') {
            if (input.pressed.left || input.pressed.right || input.pressed.up || input.pressed.down) { choice = 1 - choice; sfx('cursor'); }
            if (input.pressed.a) { decide(choice); return; }
            if (input.pressed.b) { choice = 1; sfx('cancel'); return; }
            if (input.touch.justDown) {
                const i = CHOICE_BTN.findIndex(b => hit(b, input.touch.x, input.touch.y));
                if (i >= 0) decide(i);
            }
            return;
        }
        if (input.pressed.a || input.pressed.b || input.touch.justDown) next();
    }

    // 光の 輪
    function rings(ctx) {
        ctx.strokeStyle = `rgba(255, 216, 74, ${0.3 + 0.2 * Math.sin(t * 6)})`;
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(200, 120, 50 + i * 22 + (t * 30) % 22, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    function drawTop(ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, 240);
        grad.addColorStop(0, '#1b3a6b');
        grad.addColorStop(1, '#0c1630');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 240);
        const kind = pages[page];
        if (kind === 'reward') {
            text(ctx, 'バトルに かった！', 200, 34, { size: 20, align: 'center', bold: true, color: COLORS.accent });
            text(ctx, `けいけんち ${result.exp}　お金 ${result.money}円`, 200, 62, { size: 14, align: 'center' });
            // レベルが 上がった なかま: 3 体ずつ 2 だん。2 だん目も 画面に おさまるように 小さめに (2026-10-28 ユーザー指定)
            result.levelUps.slice(0, 6).forEach((u, i) => {
                const x = 70 + (i % 3) * 130, y = 122 + Math.floor(i / 3) * 74;
                drawArt(ctx, ART[unitOf(u.id).art], Math.floor(t * 3), x, y, { scale: 2 });
                text(ctx, `${unitOf(u.id).name}`, x, y + 13, { size: 10.5, align: 'center' });
                text(ctx, `Lv${u.lv} に アップ！`, x, y + 27, { size: 11, align: 'center', bold: true, color: COLORS.accent });
            });
            if (!result.levelUps.length) text(ctx, 'なかまが 少し 強くなった。', 200, 140, { size: 13, align: 'center', color: COLORS.sub });
        } else if (kind === 'lose') {
            text(ctx, 'まけてしまった……', 200, 110, { size: 20, align: 'center', bold: true, color: '#a0b0d0' });
            text(ctx, '家に もどって 体勢を たてなおそう。', 200, 140, { size: 13, align: 'center' });
        } else if (kind === 'look' || kind === 'ask') {
            rings(ctx);
            drawArt(ctx, ART[friend.art], Math.floor(t * 4), 200, 170 + Math.abs(Math.sin(t * 5)) * -8, { scale: 5 });
            panel(ctx, 20, 186, 360, 46);
            const msg = `${friend.name}が なかまに なりたそうに こちらを 見ている！ 「${friend.line}」`, ms = fitSize(ctx, msg, 340, 13, 2, 9.5);
            wrap(ctx, msg, 340, ms).slice(0, 2).forEach((r, i) => text(ctx, r, 30, 202 + i * (ms + 5), { size: ms }));
        } else if (kind === 'bye') {
            drawArt(ctx, ART[friend.art], Math.floor(t * 2), 200 + t * 40, 170, { scale: 5, alpha: Math.max(0, 1 - t / 1.5) });
            panel(ctx, 20, 186, 360, 46);
            text(ctx, `${friend.name}は さみしそうに さっていった……`, 200, 214, { size: 13, align: 'center', maxWidth: 340 });
        } else if (kind === 'medal') {
            rings(ctx);
            ctx.beginPath();
            ctx.arc(200, 110, 58, 0, Math.PI * 2);
            ctx.fillStyle = '#d8a840';
            ctx.fill();
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#ffe08a';
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(200, 110, 44, 0, Math.PI * 2);
            ctx.fillStyle = '#1b3a6b';
            ctx.fill();
            drawArt(ctx, ART[friend.art], 0, 200, 134, { scale: 3 });
            panel(ctx, 20, 186, 360, 46);
            text(ctx, `${friend.name}の おなかまメダルを もらった！`, 200, 205, { size: 14, align: 'center', bold: true, color: COLORS.accent });
            text(ctx, result.befriend.medal && app.g.watch.includes(result.befriend.medal.uid) ? 'ウォッチに セットした。' : 'メダル帳に しまった。(メニューの「へんせい」で ウォッチに セットできる)', 200, 224, { size: 11, align: 'center', color: COLORS.sub });
        }
    }

    function drawBottom(ctx) {
        ctx.fillStyle = '#16203a';
        ctx.fillRect(0, 0, 320, 240);
        const kind = pages[page];
        if (friend && kind !== 'reward' && kind !== 'lose') {
            panel(ctx, 10, 10, 300, kind === 'ask' ? 178 : 180);
            text(ctx, `No.${String(friend.no).padStart(3, '0')} ${friend.name}`, 20, 32, { size: 14, bold: true });
            text(ctx, `${friend.rank}ランク　${friend.element}　${friend.title}`, 20, 52, { size: 11, color: COLORS.sub });
            wrap(ctx, friend.desc, 280, 12).slice(0, kind === 'ask' ? 5 : 6).forEach((r, i) => text(ctx, r, 20, 76 + i * 17, { size: 12 }));
        }
        if (kind === 'ask') {
            if (t >= 0.4) CHOICE_BTN.forEach((b, i) => button(ctx, b, { active: i === choice }));
            text(ctx, `なかまに する？　${btn('a')} けってい`, 160, 172, { size: 12, align: 'center', bold: true, color: COLORS.accent });
            return;
        }
        if (Math.floor(t * 2) % 2 || t < 0.4) text(ctx, `${btn('a')} か タップで つぎへ`, 160, 222, { size: 12, align: 'center', color: COLORS.sub });
    }

    return { name: 'result', update, drawTop, drawBottom, debug: { page: () => pages[page], decide } };
}
