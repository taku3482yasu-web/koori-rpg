// =====================================================================
// メニュー (設計書 7 章): 上画面に えらんだ ものの 絵と 説明、下画面に 一覧
// ---------------------------------------------------------------------
// タブ: へんせい (ウォッチに メダルを セット) / なかま (すべての なかまを 見る) / 図鑑 / もちもの / いらい / セーブ
//   (2026-10-28 ユーザー指定: 編成と なかまの 確認を 分ける。いらいは 町の 依頼 (2026-10-28))
// タブの 切りかえ: L・R (Q・E)・Tab キー・タブの タップ。十字キー 左右でも (へんせいは 場所の えらびに 使うので のぞく)
// へんせい: 6 つの 場所から 1 つ えらび (A)、メダル帳から 入れる メダルを えらぶ (A)。Y で はずす
// 一覧は 十字キー・マウスホイール で スクロール
// =====================================================================
import { ART } from '../art/index.js';
import { NAKAMA, NAKAMA_IDS, ROLES, JUTSU_RANK_NAMES, unitOf, evolveOf } from '../data/nakama.js';
import { ITEMS } from '../data/items.js';
import { SPOTS, ROAMS } from '../data/map.js';
import { COLORS, drawArt, panel, text, wrap, fitSize, button, hit, bar, roundRect } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { btn, isKeyboard } from '../core/keys.js';
import { medalByUid, friendCount, bondLevel } from '../logic/game.js';
import { statsAt, expFor } from '../logic/units.js';
import { questList, questState, questProgress, questReady } from '../logic/quests.js';
import { FRIENDS } from '../data/map.js';

const TABS = ['へんせい', 'なかま', '図鑑', 'もちもの', 'いらい', 'セーブ'];
const TAB_BTN = TABS.map((label, i) => ({ x: 4 + i * 52, y: 4, w: 49, h: 26, label }));
const T_QUEST = 4, T_SAVE = 5;
const NT = TABS.length;
const SLOT_BTN = Array.from({ length: 6 }, (_, i) => ({ x: 8 + (i % 3) * 102, y: 38 + Math.floor(i / 3) * 44, w: 98, h: 40 }));
const LIST_TOP = 132, ROW_H = 20, ROWS = 5;
const ZUKAN_ROWS = 9;

export function createMenu(app) {
    const g = app.g;
    let tab = 0, t = 0;
    let slot = 0, picking = false, listIndex = 0;    // ウォッチ
    let zIndex = 0;                                 // 図鑑
    let nIndex = 0;                                 // なかま
    let iIndex = 0;                                 // もちもの
    let qIndex = 0;                                 // いらい
    let saved = 0;

    const box = () => g.medals;
    const scroll = (index, rows, len) => Math.max(0, Math.min(len - rows, index - Math.floor(rows / 2)));

    function setMedal(uid) {
        const other = g.watch.indexOf(uid);
        if (other >= 0) g.watch[other] = g.watch[slot];
        g.watch[slot] = uid;
        sfx('watch');
    }

    function update(dt, input) {
        t += dt;
        g.playTime += dt;
        const tc = input.touch;
        const switchTab = d => { tab = (tab + d + NT) % NT; picking = false; sfx('cursor'); };
        // Tab キー (X と いっしょに 押される) は タブの 切りかえ。メニューは 閉じない
        if (input.pressed.tab) { switchTab(1); return; }
        if (input.pressed.l) { switchTab(-1); return; }
        if (input.pressed.r) { switchTab(1); return; }
        if (tab !== 0 && input.pressed.left) { switchTab(-1); return; }
        if (tab !== 0 && input.pressed.right) { switchTab(1); return; }
        if (tc.justDown) {
            const i = TAB_BTN.findIndex(b => hit(b, tc.x, tc.y));
            if (i >= 0) { tab = i; picking = false; sfx('cursor'); return; }
            if (tc.y > 214 && tc.x > 230) { sfx('cancel'); app.go('field'); return; }
        }
        if ((input.pressed.b && !picking) || input.pressed.x || input.pressed.start) { sfx('cancel'); app.go('field'); return; }
        if (tab === 0) updateWatch(input);
        else if (tab === 1) nIndex = moveList(input, nIndex, box().length, k => ({ x: 8, y: 36 + k * ROW_H, w: 304, h: ROW_H }), scroll(nIndex, ZUKAN_ROWS, box().length), ZUKAN_ROWS);
        else if (tab === 2) zIndex = moveList(input, zIndex, NAKAMA_IDS.length, k => ({ x: 8, y: 36 + k * ROW_H, w: 304, h: ROW_H }), scroll(zIndex, ZUKAN_ROWS, NAKAMA_IDS.length), ZUKAN_ROWS);
        else if (tab === 3) iIndex = moveList(input, iIndex, Object.keys(ITEMS).length, k => ({ x: 8, y: 36 + k * ROW_H, w: 304, h: ROW_H }), 0, 9);
        else if (tab === T_QUEST) qIndex = moveList(input, qIndex, questList(g).length, k => ({ x: 8, y: 36 + k * ROW_H, w: 304, h: ROW_H }), scroll(qIndex, ZUKAN_ROWS, questList(g).length), ZUKAN_ROWS);
        else if (tab === T_SAVE) {
            if (input.pressed.a || (tc.justDown && hit(SAVE_BTN, tc.x, tc.y))) { app.save(); saved = t; sfx('ok'); }
        }
    }
    const SAVE_BTN = { x: 80, y: 120, w: 160, h: 44, label: 'セーブする' };

    function moveList(input, index, len, rowRect, top, rows) {
        if (!len) return 0;
        if (input.pressed.up) { index = (index + len - 1) % len; sfx('cursor'); }
        if (input.pressed.down) { index = (index + 1) % len; sfx('cursor'); }
        if (input.wheel) { index = Math.max(0, Math.min(len - 1, index + input.wheel)); sfx('cursor'); }
        if (input.touch.justDown) {
            for (let k = 0; k < rows && top + k < len; k++) if (hit(rowRect(k), input.touch.x, input.touch.y)) { index = top + k; sfx('cursor'); }
        }
        return index;
    }

    function updateWatch(input) {
        const tc = input.touch;
        const list = box();
        if (!picking) {
            if (input.pressed.left) { slot = (slot + 5) % 6; sfx('cursor'); }
            if (input.pressed.right) { slot = (slot + 1) % 6; sfx('cursor'); }
            if (input.pressed.up || input.pressed.down) { slot = (slot + 3) % 6; sfx('cursor'); }
            if (input.pressed.a && list.length) { picking = true; listIndex = 0; sfx('ok'); }
            if (input.pressed.y) removeFromSlot();
            if (tc.justDown) {
                const i = SLOT_BTN.findIndex(b => hit(b, tc.x, tc.y));
                if (i >= 0) { slot = i; picking = list.length > 0; listIndex = 0; sfx('ok'); }
            }
            return;
        }
        if (input.pressed.b) { picking = false; sfx('cancel'); return; }
        if (input.pressed.up) { listIndex = (listIndex + list.length - 1) % list.length; sfx('cursor'); }
        if (input.pressed.down) { listIndex = (listIndex + 1) % list.length; sfx('cursor'); }
        if (input.wheel) { listIndex = Math.max(0, Math.min(list.length - 1, listIndex + input.wheel)); sfx('cursor'); }
        if (input.pressed.a) { setMedal(list[listIndex].uid); picking = false; }
        if (tc.justDown) {
            const top = scroll(listIndex, ROWS, list.length);
            for (let k = 0; k < ROWS && top + k < list.length; k++) {
                if (hit({ x: 8, y: LIST_TOP + k * ROW_H, w: 304, h: ROW_H }, tc.x, tc.y)) {
                    if (listIndex === top + k) { setMedal(list[top + k].uid); picking = false; } else { listIndex = top + k; sfx('cursor'); }
                }
            }
        }
    }
    function removeFromSlot() {
        if (g.watch.filter(Boolean).length <= 1 || !g.watch[slot]) { sfx('cancel'); return; }
        g.watch[slot] = null;
        sfx('cancel');
    }

    // ----- 上画面: えらんでいる なかまの 絵と 説明 -----
    function drawNakama(ctx, id, medal, { known = true } = {}) {
        const n = unitOf(id);
        panel(ctx, 10, 10, 150, 220, { fill: 'rgba(255,255,255,0.06)' });
        const big = ART[n.art].h > 24 ? 3.4 : 6;   // 人の 絵の ように 背の 高い 絵は 小さく
        if (known) drawArt(ctx, ART[n.art], Math.floor(t * 2), 85, 130, { scale: big });
        else drawArt(ctx, ART[n.art], 0, 85, 130, { scale: big, tint: '#0a0f20' });
        text(ctx, n.hero ? 'しゅじんこう' : `No.${String(n.no).padStart(3, '0')}`, 20, 30, { size: 11, color: COLORS.sub });
        text(ctx, known ? n.name : '？？？', 170, 30, { size: 17, bold: true });
        if (!known) {
            text(ctx, 'まだ 会っていない', 170, 56, { size: 12, color: COLORS.sub });
            return;
        }
        text(ctx, `${n.rank}ランク　${n.element}　${ROLES[n.role]}`, 170, 50, { size: 11.5, color: COLORS.sub });
        text(ctx, n.title, 170, 70, { size: 12, color: COLORS.accent });
        const ds = fitSize(ctx, n.desc, 215, 11.5, 4, 9);
        wrap(ctx, n.desc, 215, ds).slice(0, 4).forEach((r, i) => text(ctx, r, 170, 90 + i * (ds + 3.5), { size: ds }));
        // バトルで 使う わざ・術・必殺技 (2026-10-27)
        text(ctx, `わざ: ${n.waza.name}　術: ${n.jutsu.name} (${JUTSU_RANK_NAMES[n.jutsu.tier]})`, 170, 150, { size: 11, maxWidth: 220 });
        const bond = known && !n.hero ? bondLevel(g, id) : 0;
        text(ctx, `必殺技: ${n.special.name}${bond ? `　絆Lv${bond} (威力 +${bond * 10}%)` : ''}`, 170, 166, { size: 11, maxWidth: 220 });
        // 進化 (2026-10-29): 進化する Lv と 進化先
        const ev = evolveOf(id);
        if (n.favorite) text(ctx, `好物: ${ITEMS[n.favorite].name}${ev ? `　Lv${ev.lv}で ${NAKAMA[ev.to].name}に 進化` : n.evo ? `　${NAKAMA[n.evo].name}が 進化した すがた` : ''}`, 170, 182, { size: 11, maxWidth: 220 });
        if (medal) {
            const s = statsAt(id, medal.lv);
            text(ctx, `Lv${medal.lv}  HP${s.hp} こうげき${s.atk} ぼうぎょ${s.def}`, 170, 196, { size: 11 });
            text(ctx, `すばやさ${s.spd} ようじゅつ${s.mag}`, 170, 211, { size: 11 });
            const need = expFor(medal.lv + 1) - expFor(medal.lv);
            bar(ctx, 170, 218, 210, 4, (medal.exp - expFor(medal.lv)) / need, COLORS.ice);
        } else {
            const where = [...SPOTS, ...ROAMS].filter(s => s.kinds.some(k => k.id === id)).map(s => s.label);
            text(ctx, `いる場所: ${g.zukan.friends[id] || g.zukan.seen[id] ? where.join('・') : '？？？'}`, 170, 200, { size: 11, maxWidth: 220 });
        }
    }

    function drawTop(ctx) {
        ctx.fillStyle = '#0f1a36';
        ctx.fillRect(0, 0, 400, 240);
        if (tab === 0) {
            const uid = picking ? box()[listIndex]?.uid : g.watch[slot];
            const m = uid ? medalByUid(g, uid) : null;
            if (m) drawNakama(ctx, m.id, m);
            else text(ctx, 'この 場所は あいている', 200, 120, { size: 14, align: 'center', color: COLORS.sub });
        } else if (tab === 1) {
            const m = box()[nIndex];
            if (m) drawNakama(ctx, m.id, m);
        } else if (tab === 2) {
            const id = NAKAMA_IDS[zIndex];
            drawNakama(ctx, id, null, { known: Boolean(g.zukan.seen[id] || g.zukan.friends[id]) });
        } else if (tab === 3) {
            const id = Object.keys(ITEMS)[iIndex];
            text(ctx, ITEMS[id].name, 200, 80, { size: 20, align: 'center', bold: true });
            wrap(ctx, ITEMS[id].desc, 340, 13).forEach((r, i) => text(ctx, r, 30, 120 + i * 20, { size: 13 }));
            text(ctx, `もっている数: ${g.items[id] || 0}`, 200, 200, { size: 13, align: 'center', color: COLORS.accent });
        } else if (tab === T_QUEST) {
            drawQuestTop(ctx);
        } else {
            drawArt(ctx, ART.koori, Math.floor(t * 2), 200, 120, { scale: 5 });
            text(ctx, `${app.versionName}`, 200, 40, { size: 16, align: 'center', bold: true, color: COLORS.accent });
            text(ctx, `${g.day}日目　なかま ${g.medals.length}　図鑑 ${friendCount(g)}/${NAKAMA_IDS.length}　${g.money}円`, 200, 160, { size: 13, align: 'center' });
            text(ctx, `あそんだ時間 ${Math.floor(g.playTime / 3600)}時間${Math.floor(g.playTime / 60) % 60}分`, 200, 182, { size: 12, align: 'center', color: COLORS.sub });
        }
    }

    function drawBottom(ctx) {
        ctx.fillStyle = '#16203a';
        ctx.fillRect(0, 0, 320, 240);
        TAB_BTN.forEach((b, i) => button(ctx, b, { active: i === tab, size: 10.5 }));
        if (tab === 0) drawWatch(ctx);
        else if (tab === 1) drawAll(ctx);
        else if (tab === 2) drawZukan(ctx);
        else if (tab === 3) drawItems(ctx);
        else if (tab === T_QUEST) drawQuests(ctx);
        else {
            button(ctx, SAVE_BTN);
            text(ctx, 'ページを 閉じたときも 自動で セーブします', 160, 186, { size: 11, align: 'center', color: COLORS.sub });
            if (saved && t - saved < 1.5) text(ctx, 'セーブした！', 160, 104, { size: 14, align: 'center', bold: true, color: COLORS.accent });
        }
        text(ctx, `${btn('l')}${btn('r')}${isKeyboard() ? '・[Tab]' : ''} タブ`, 8, 232, { size: 10.5, color: COLORS.dim });
        text(ctx, `${btn('b')} もどる`, 312, 232, { size: 10.5, align: 'right', color: COLORS.dim });
    }

    // なかま: もっている メダル すべて (ウォッチに 入っている なかまは 場所の 番号)
    function drawAll(ctx) {
        const list = box();
        const top = scroll(nIndex, ZUKAN_ROWS, list.length);
        for (let k = 0; k < ZUKAN_ROWS && top + k < list.length; k++) {
            const m = list[top + k], y = 36 + k * ROW_H;
            if (top + k === nIndex) { roundRect(ctx, 8, y, 304, ROW_H - 2, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
            const inWatch = g.watch.indexOf(m.uid);
            text(ctx, unitOf(m.id).name, 16, y + 14, { size: 12 });
            text(ctx, ROLES[unitOf(m.id).role] || '', 170, y + 14, { size: 10.5, color: COLORS.sub });
            text(ctx, `Lv${m.lv}${inWatch >= 0 ? `  [${inWatch + 1}]` : ''}`, 304, y + 14, { size: 11, align: 'right', color: inWatch >= 0 ? COLORS.accent : COLORS.sub });
        }
        text(ctx, `なかま ${list.length} 体　[ ] は ウォッチの 場所${list.length > ZUKAN_ROWS ? `　${nIndex + 1}/${list.length}` : ''}`, 8, 220, { size: 10, color: COLORS.sub });
    }

    function drawWatch(ctx) {
        SLOT_BTN.forEach((b, i) => {
            const m = g.watch[i] ? medalByUid(g, g.watch[i]) : null;
            panel(ctx, b.x, b.y, b.w, b.h, { fill: i === slot ? '#2d5aa8' : 'rgba(26,36,64,0.95)', edge: i === slot ? COLORS.accent : i < 3 ? '#ffd84a66' : COLORS.panelEdge });
            if (!m) { text(ctx, 'あき', b.x + b.w / 2, b.y + 25, { size: 11, align: 'center', color: COLORS.dim }); return; }
            drawArt(ctx, ART[unitOf(m.id).art], 0, b.x + 18, b.y + 34, { scale: 1.6 });
            text(ctx, unitOf(m.id).name, b.x + 36, b.y + 17, { size: 10, bold: true, maxWidth: b.w - 40 });
            text(ctx, `Lv${m.lv}`, b.x + 36, b.y + 32, { size: 10, color: COLORS.sub });
        });
        if (!picking) {
            text(ctx, '上の 3 つが はじめに 前に 出る', 8, 140, { size: 9.5, color: COLORS.dim });
            text(ctx, `${btn('a')}・タップ: メダルを 入れる　${btn('y')} はずす`, 160, 160, { size: 11, align: 'center', color: COLORS.sub });
            text(ctx, `メダル帳: ${g.medals.length} 枚`, 160, 180, { size: 11, align: 'center', color: COLORS.sub });
            return;
        }
        const list = box();
        const top = scroll(listIndex, ROWS, list.length);
        for (let k = 0; k < ROWS && top + k < list.length; k++) {
            const m = list[top + k], y = LIST_TOP + k * ROW_H;
            if (top + k === listIndex) { roundRect(ctx, 8, y, 304, ROW_H - 2, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
            const inWatch = g.watch.indexOf(m.uid);
            text(ctx, `${unitOf(m.id).name}`, 16, y + 14, { size: 12 });
            text(ctx, `Lv${m.lv}${inWatch >= 0 ? `  [${inWatch + 1}]` : ''}`, 304, y + 14, { size: 11, align: 'right', color: COLORS.sub });
        }
    }

    function drawZukan(ctx) {
        const top = scroll(zIndex, ZUKAN_ROWS, NAKAMA_IDS.length);
        for (let k = 0; k < ZUKAN_ROWS && top + k < NAKAMA_IDS.length; k++) {
            const id = NAKAMA_IDS[top + k], y = 36 + k * ROW_H;
            if (top + k === zIndex) { roundRect(ctx, 8, y, 304, ROW_H - 2, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
            const seen = g.zukan.seen[id] || g.zukan.friends[id];
            text(ctx, `${String(NAKAMA[id].no).padStart(3, '0')}  ${seen ? NAKAMA[id].name : '？？？'}`, 16, y + 14, { size: 12, color: seen ? COLORS.ink : COLORS.dim });
            if (g.zukan.friends[id]) text(ctx, 'なかま', 304, y + 14, { size: 10.5, align: 'right', color: COLORS.accent, bold: true });
        }
        text(ctx, `なかまに した: ${friendCount(g)} / ${NAKAMA_IDS.length}`, 8, 221, { size: 10.5, color: COLORS.sub });
    }

    // いらい: うけた 依頼 (できた ものは ♪)・おわった 依頼
    function drawQuests(ctx) {
        const list = questList(g);
        if (!list.length) {
            text(ctx, 'まだ 依頼を うけていない', 160, 100, { size: 13, align: 'center', color: COLORS.sub });
            text(ctx, '町の「…」の ふきだしの キャラに 話しかけよう', 160, 122, { size: 11, align: 'center', color: COLORS.dim });
            return;
        }
        const top = scroll(qIndex, ZUKAN_ROWS, list.length);
        list.slice(top, top + ZUKAN_ROWS).forEach((q, k) => {
            const y = 36 + k * ROW_H, done = questState(g, q.id) === 'done', p = questProgress(g, q);
            if (top + k === qIndex) { roundRect(ctx, 8, y, 304, ROW_H - 2, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
            text(ctx, q.title, 16, y + 14, { size: 12, color: done ? COLORS.dim : COLORS.ink, maxWidth: 200 });
            text(ctx, done ? 'おわり' : questReady(g, q) ? '♪ できた！' : `${p.now}/${p.need}`, 304, y + 14, { size: 10.5, align: 'right', bold: !done, color: done ? COLORS.dim : questReady(g, q) ? '#ff9ad8' : COLORS.accent });
        });
        text(ctx, `うけている ${list.filter(q => questState(g, q.id) === 'active').length}・おわった ${list.filter(q => questState(g, q.id) === 'done').length}`, 8, 221, { size: 10.5, color: COLORS.sub });
    }
    function drawQuestTop(ctx) {
        const q = questList(g)[qIndex];
        if (!q) { text(ctx, '町の キャラの おねがいを きいて あげよう', 200, 120, { size: 14, align: 'center', color: COLORS.sub }); return; }
        const f = FRIENDS.find(x => x.id === q.from), n = NAKAMA[f.kind];
        drawArt(ctx, ART[n.art], Math.floor(t * 2), 60, 110, { scale: 4 });
        text(ctx, n.name, 60, 134, { size: 11, align: 'center', color: COLORS.sub });
        text(ctx, q.title, 120, 40, { size: 17, bold: true, color: COLORS.accent, maxWidth: 270 });
        text(ctx, `場所: ${f.label}`, 120, 62, { size: 11.5, color: COLORS.sub });
        const s = fitSize(ctx, q.ask, 265, 12, 4, 9.5);
        wrap(ctx, q.ask, 265, s).slice(0, 4).forEach((r, i) => text(ctx, r, 120, 86 + i * (s + 5), { size: s }));
        const p = questProgress(g, q), done = questState(g, q.id) === 'done';
        const r = q.reward, reward = [r.money ? `${r.money}円` : '', r.item ? `${ITEMS[r.item].name} ${r.n}こ` : ''].filter(Boolean).join('・');
        text(ctx, done ? 'おわった 依頼' : questReady(g, q) ? `できた！ ${n.name}に 話しかけよう` : `すすみ: ${p.now} / ${p.need}`, 120, 178, { size: 13, bold: true, color: done ? COLORS.dim : questReady(g, q) ? '#ff9ad8' : COLORS.ink });
        text(ctx, `お礼: ${reward}`, 120, 200, { size: 12, color: COLORS.accent });
    }

    function drawItems(ctx) {
        Object.keys(ITEMS).forEach((id, k) => {
            const y = 36 + k * ROW_H;
            if (k === iIndex) { roundRect(ctx, 8, y, 304, ROW_H - 2, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
            text(ctx, ITEMS[id].name, 16, y + 14, { size: 12 });
            text(ctx, `×${g.items[id] || 0}`, 304, y + 14, { size: 12, align: 'right' });
        });
        text(ctx, `お金: ${g.money}円 (駄菓子屋で 買える)`, 8, 200, { size: 11, color: COLORS.sub });
    }

    return { name: 'menu', update, drawTop, drawBottom };
}
