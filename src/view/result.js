// =====================================================================
// バトルの あと: もらった けいけんち・お金・レベルアップ、仲間に なる 演出 (設計書 4.2)
// =====================================================================
import { ART } from '../art/index.js';
import { NAKAMA } from '../data/nakama.js';
import { COLORS, drawArt, panel, text, wrap } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { btn } from '../core/keys.js';

export function createResult(app, result) {
    // 出す 順: 0 けいけんち → 1 なかまに なりたそう → 2 メダルを もらった
    const pages = [result.outcome === 'win' ? 'reward' : 'lose'];
    if (result.befriend) pages.push('look', 'medal');
    let page = 0, t = 0;
    const friend = result.befriend ? NAKAMA[result.befriend.id] : null;

    function update(dt, input) {
        t += dt;
        if (t < 0.4) return;
        if (input.pressed.a || input.pressed.b || input.touch.justDown) {
            page++;
            t = 0;
            if (pages[page] === 'medal') sfx('watch');
            else if (pages[page] === 'look') sfx('friend');
            else sfx('cursor');
            if (page >= pages.length) app.backToField(result);
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
            text(ctx, 'バトルに かった！', 200, 40, { size: 20, align: 'center', bold: true, color: COLORS.accent });
            text(ctx, `けいけんち ${result.exp}　お金 ${result.money}円`, 200, 78, { size: 14, align: 'center' });
            result.levelUps.slice(0, 6).forEach((u, i) => {
                const x = 60 + (i % 3) * 140, y = 150 + Math.floor(i / 3) * 70;
                drawArt(ctx, ART[NAKAMA[u.id].art], Math.floor(t * 3), x, y, { scale: 2.5 });
                text(ctx, `${NAKAMA[u.id].name}`, x, y + 14, { size: 10.5, align: 'center' });
                text(ctx, `Lv${u.lv} に アップ！`, x, y + 28, { size: 11, align: 'center', bold: true, color: COLORS.accent });
            });
            if (!result.levelUps.length) text(ctx, 'なかまが 少し 強くなった。', 200, 150, { size: 13, align: 'center', color: COLORS.sub });
        } else if (kind === 'lose') {
            text(ctx, 'まけてしまった……', 200, 110, { size: 20, align: 'center', bold: true, color: '#a0b0d0' });
            text(ctx, '家に もどって 体勢を たてなおそう。', 200, 140, { size: 13, align: 'center' });
        } else if (kind === 'look' || kind === 'medal') {
            // 光の 輪
            ctx.strokeStyle = `rgba(255, 216, 74, ${0.3 + 0.2 * Math.sin(t * 6)})`;
            ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(200, 120, 50 + i * 22 + (t * 30) % 22, 0, Math.PI * 2);
                ctx.stroke();
            }
            if (kind === 'look') {
                drawArt(ctx, ART[friend.art], Math.floor(t * 4), 200, 170 + Math.abs(Math.sin(t * 5)) * -8, { scale: 5 });
                panel(ctx, 20, 186, 360, 46);
                wrap(ctx, `${friend.name}が なかまに なりたそうに こちらを 見ている！ 「${friend.line}」`, 340, 13).slice(0, 2).forEach((r, i) => text(ctx, r, 30, 204 + i * 18, { size: 13 }));
            } else {
                // メダル
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
                text(ctx, result.befriend.medal && app.g.watch.includes(result.befriend.medal.uid) ? 'ウォッチに セットした。' : 'メダル帳に しまった。(メニューで ウォッチに セットできる)', 200, 224, { size: 11, align: 'center', color: COLORS.sub });
            }
        }
    }

    function drawBottom(ctx) {
        ctx.fillStyle = '#16203a';
        ctx.fillRect(0, 0, 320, 240);
        const kind = pages[page];
        if ((kind === 'look' || kind === 'medal') && friend) {
            panel(ctx, 10, 10, 300, 180);
            text(ctx, `No.${String(friend.no).padStart(3, '0')} ${friend.name}`, 20, 32, { size: 14, bold: true });
            text(ctx, `${friend.rank}ランク　${friend.element}　${friend.title}`, 20, 52, { size: 11, color: COLORS.sub });
            wrap(ctx, friend.desc, 280, 12).slice(0, 6).forEach((r, i) => text(ctx, r, 20, 76 + i * 17, { size: 12 }));
        }
        if (Math.floor(t * 2) % 2 || t < 0.4) text(ctx, `${btn('a')} か タップで つぎへ`, 160, 222, { size: 12, align: 'center', color: COLORS.sub });
    }

    return { name: 'result', update, drawTop, drawBottom };
}
