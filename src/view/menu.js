// =====================================================================
// メニュー (設計書 7 章): 上画面に えらんだ ものの 絵と 説明、下画面に 一覧
// ---------------------------------------------------------------------
// タブ: へんせい (ウォッチに メダルを セット) / なかま (すべての なかまを 見る) / 図鑑 / もちもの / いらい / ヘルプ / セーブ (BGM の オン・オフも)
//   ヘルプ (2026-11-02): ゲームの ヒント。ストーリーが すすむと 話題が ふえる (data/help.js)。まだ 見て いない ものに NEW
//   (2026-10-28 ユーザー指定: 編成と なかまの 確認を 分ける。いらいは 町の 依頼 (2026-10-28))
// タブの 切りかえ: L・R (Q・E)・Tab キー・タブの タップ。十字キー 左右でも (へんせいは 場所の えらびに 使うので のぞく)
// へんせい: 6 つの 場所から 1 つ えらび (A)、メダル帳から 入れる メダルを えらぶ (A)。Y で はずす
// なかま: なかまを えらんで A → 装備を えらぶ (2026-11-03。なかま 1 体に 1 つ。data/equips.js)
// 一覧は 十字キー・マウスホイール で スクロール
// =====================================================================
import { ART } from '../art/index.js';
import { NAKAMA, NAKAMA_IDS, ROLES, JUTSU_RANK_NAMES, unitOf, evolveOf, VERSION_ONLY } from '../data/nakama.js';
import { ITEMS } from '../data/items.js';
import { SPOTS, ROAMS } from '../data/map.js';
import { COLORS, drawArt, panel, text, wrap, fitSize, button, hit, bar, roundRect } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { bgmOn, setBgmOn } from '../core/bgm.js';
import { btn, isKeyboard, fillKeys } from '../core/keys.js';
import { medalByUid, friendCount, bondLevel, specialUpgraded, helpTopics, seeHelp, readNatureBook, setEquip, equipFree } from '../logic/game.js';
import { EQUIPS, EQUIP_IDS, equipShort } from '../data/equips.js';
import { NATURES, STYLES, styleOf } from '../data/nature.js';
import { statsAt, expFor } from '../logic/units.js';
import { questList, questState, questProgress, questReady } from '../logic/quests.js';
import { FRIENDS } from '../data/map.js';

const TABS = ['へんせい', 'なかま', '図鑑', 'もちもの', 'いらい', 'ヘルプ', 'セーブ'];
const TAB_BTN = TABS.map((label, i) => ({ x: 2 + i * 45, y: 4, w: 43, h: 26, label }));
const T_QUEST = 4, T_HELP = 5, T_SAVE = 6;
const NT = TABS.length;
const SLOT_BTN = Array.from({ length: 6 }, (_, i) => ({ x: 8 + (i % 3) * 102, y: 38 + Math.floor(i / 3) * 44, w: 98, h: 40 }));
const LIST_TOP = 132, ROW_H = 20, ROWS = 5;
const ZUKAN_ROWS = 9;
const ITEM_ROWS = 8;

export function createMenu(app) {
    const g = app.g;
    let tab = 0, t = 0;
    let slot = 0, picking = false, listIndex = 0;    // ウォッチ
    let zIndex = 0;                                 // 図鑑
    let nIndex = 0;                                 // なかま
    let iIndex = 0;                                 // もちもの
    let qIndex = 0;                                 // いらい
    let hIndex = 0;                                 // ヘルプ
    let titleAsk = false;                           // タイトルへ もどる か 聞いている
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
        // タイトルへ もどる か 聞いている あいだ (2026-11-04 ユーザー指定)
        if (titleAsk) {
            if (input.pressed.a || (tc.justDown && hit(TITLE_YES, tc.x, tc.y))) { titleAsk = false; sfx('ok'); app.go('title'); return; }
            if (input.pressed.b || (tc.justDown && hit(TITLE_NO, tc.x, tc.y))) { titleAsk = false; sfx('cancel'); }
            return;
        }
        const switchTab = d => { tab = (tab + d + NT) % NT; picking = false; bookPick = null; equipPick = null; sfx('cursor'); };
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
        if ((input.pressed.b && !picking && !bookPick && !equipPick) || input.pressed.x || input.pressed.start) { sfx('cancel'); app.go('field'); return; }
        if (tab === 0) updateWatch(input);
        else if (tab === 1) updateNakama(input);
        else if (tab === 2) zIndex = moveList(input, zIndex, NAKAMA_IDS.length, k => ({ x: 8, y: 36 + k * ROW_H, w: 304, h: ROW_H }), scroll(zIndex, ZUKAN_ROWS, NAKAMA_IDS.length), ZUKAN_ROWS);
        else if (tab === 3) updateItems(input);
        else if (tab === T_QUEST) qIndex = moveList(input, qIndex, questList(g).length, k => ({ x: 8, y: 36 + k * ROW_H, w: 304, h: ROW_H }), scroll(qIndex, ZUKAN_ROWS, questList(g).length), ZUKAN_ROWS);
        else if (tab === T_HELP) {
            const list = helpTopics(g);
            hIndex = moveList(input, hIndex, list.length, k => ({ x: 8, y: 36 + k * ROW_H, w: 304, h: ROW_H }), scroll(hIndex, ZUKAN_ROWS, list.length), ZUKAN_ROWS);
            if (list[hIndex]) seeHelp(g, list[hIndex].id);
        } else if (tab === T_SAVE) {
            if (input.pressed.up) { sIndex = (sIndex + 2) % 3; sfx('cursor'); }
            if (input.pressed.down) { sIndex = (sIndex + 1) % 3; sfx('cursor'); }
            const pick = tc.justDown ? (hit(SAVE_BTN, tc.x, tc.y) ? 0 : hit(BGM_BTN, tc.x, tc.y) ? 1 : hit(TITLE_BTN, tc.x, tc.y) ? 2 : -1) : input.pressed.a ? sIndex : -1;
            if (pick === 0) { sIndex = 0; app.save(); saved = t; sfx('ok'); }
            if (pick === 1) { sIndex = 1; setBgmOn(!bgmOn()); sfx('ok'); }
            if (pick === 2) { sIndex = 2; titleAsk = true; sfx('ok'); }
        }
    }
    // なかま: A で 装備を えらぶ (2026-11-03)
    let equipPick = null;   // { index }
    let equipNote = null;
    const equipList = () => [null, ...EQUIP_IDS.filter(id => (g.equips?.[id] || 0) > 0)];
    function updateNakama(input) {
        if (!equipPick) {
            nIndex = moveList(input, nIndex, box().length, k => ({ x: 8, y: 36 + k * ROW_H, w: 304, h: ROW_H }), scroll(nIndex, ZUKAN_ROWS, box().length), ZUKAN_ROWS);
            if (input.pressed.a && box()[nIndex]) { equipPick = { index: 0 }; sfx('ok'); }
            return;
        }
        if (input.pressed.b) { equipPick = null; sfx('cancel'); return; }
        const list = equipList();
        equipPick.index = moveList(input, equipPick.index, list.length, k => ({ x: 8, y: 52 + k * ROW_H, w: 304, h: ROW_H }), scroll(equipPick.index, ROWS + 2, list.length), ROWS + 2);
        const pickTap = input.touch.justDown && hit({ x: 8, y: 52, w: 304, h: ROW_H * (ROWS + 2) }, input.touch.x, input.touch.y);
        if (input.pressed.a || pickTap) {
            const m = box()[nIndex], id = list[equipPick.index];
            if (setEquip(g, m.uid, id)) {
                equipNote = { text: id ? `${unitOf(m.id).name}に「${EQUIPS[id].name}」を 付けた！` : `${unitOf(m.id).name}の 装備を はずした`, t };
                sfx(id ? 'heal' : 'ok');
                equipPick = null;
            } else sfx('cancel');
        }
    }
    // もちもの: 性格の 本 (2026-11-02) を えらんで A → なかまを えらんで 読ませる
    let bookPick = null;   // { itemId, index }
    const bookMedals = () => g.medals;
    function updateItems(input) {
        const ids = Object.keys(ITEMS);
        if (!bookPick) {
            iIndex = moveList(input, iIndex, ids.length, k => ({ x: 8, y: 36 + k * ROW_H, w: 304, h: ROW_H }), scroll(iIndex, ITEM_ROWS, ids.length), ITEM_ROWS);
            const id = ids[iIndex];
            if (input.pressed.a && ITEMS[id].book) {
                if ((g.items[id] || 0) > 0) { bookPick = { itemId: id, index: 0 }; sfx('ok'); } else sfx('cancel');
            }
            return;
        }
        const list = bookMedals();
        if (input.pressed.b) { bookPick = null; sfx('cancel'); return; }
        bookPick.index = moveList(input, bookPick.index, list.length, k => ({ x: 8, y: 52 + k * ROW_H, w: 304, h: ROW_H }), scroll(bookPick.index, ROWS + 2, list.length), ROWS + 2);
        const pickTap = input.touch.justDown && hit({ x: 8, y: 52, w: 304, h: ROW_H * (ROWS + 2) }, input.touch.x, input.touch.y);
        if (input.pressed.a || pickTap) {
            const m = list[bookPick.index];
            if (readNatureBook(g, m.uid, bookPick.itemId)) { bookNote = { text: `${unitOf(m.id).name}の 性格が「${NATURES[m.nature].name}」に なった！`, t }; sfx('heal'); bookPick = null; }
            else sfx('cancel');
        }
    }
    let bookNote = null;
    const SAVE_BTN = { x: 80, y: 68, w: 160, h: 38, label: 'セーブする' };
    const BGM_BTN = { x: 80, y: 112, w: 160, h: 38 };
    const TITLE_BTN = { x: 80, y: 156, w: 160, h: 38, label: 'タイトルへ もどる' };
    const TITLE_YES = { x: 40, y: 130, w: 110, h: 40, label: 'はい' };
    const TITLE_NO = { x: 170, y: 130, w: 110, h: 40, label: 'いいえ' };
    let sIndex = 0;   // セーブ タブで えらんでいる ボタン (0 セーブ・1 BGM・2 タイトルへ)

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
        // 戦い方 (キャラごと)・性格 (メダルごと)。2026-11-02
        text(ctx, `戦い方: ${STYLES[styleOf(n)].name}`, 85, 160, { size: 11, align: 'center', bold: true, color: COLORS.accent });
        text(ctx, STYLES[styleOf(n)].desc, 85, 175, { size: 9, align: 'center', color: COLORS.sub, maxWidth: 140 });
        if (medal && medal.nature && NATURES[medal.nature]) {
            text(ctx, `性格: ${NATURES[medal.nature].name}`, 85, 196, { size: 11, align: 'center', bold: true, color: '#ff9ad8' });
            const nd = wrap(ctx, NATURES[medal.nature].desc, 136, 9);
            nd.slice(0, 2).forEach((r, i) => text(ctx, r, 85, 210 + i * 11, { size: 9, align: 'center', color: COLORS.sub }));
        }
        text(ctx, `${n.rank}ランク　${n.element}　${ROLES[n.role]}${n.version ? `　${VERSION_ONLY[n.version]}だけ` : ''}`, 170, 50, { size: 11.5, color: n.version && n.version !== g.version ? '#ff9a9a' : COLORS.sub, maxWidth: 225 });
        text(ctx, n.title, 170, 70, { size: 12, color: COLORS.accent });
        const ds = fitSize(ctx, n.desc, 215, 11.5, 4, 9);
        wrap(ctx, n.desc, 215, ds).slice(0, 4).forEach((r, i) => text(ctx, r, 170, 90 + i * (ds + 3.5), { size: ds }));
        // バトルで 使う わざ・術・必殺技 (2026-10-27)
        text(ctx, `わざ: ${n.waza.name}　術: ${n.jutsu.name} (${JUTSU_RANK_NAMES[n.jutsu.tier]})`, 170, 150, { size: 11, maxWidth: 220 });
        const bond = known && !n.hero ? bondLevel(g, id) : 0;
        const special = n.special2 && specialUpgraded(g, id) ? n.special2 : n.special;   // こおりくん (9 章)・おにおに (12 章) は 進化する
        text(ctx, `必殺技: ${special.name}${bond ? `　絆Lv${bond} (威力 +${bond * 10}%)` : ''}`, 170, 166, { size: 11, maxWidth: 220 });
        // 進化 (2026-10-29): 進化する Lv と 進化先
        const ev = evolveOf(id);
        if (n.favorite) text(ctx, `好物: ${ITEMS[n.favorite].name}${ev ? `　Lv${ev.lv}で ${NAKAMA[ev.to].name}に 進化` : n.evo ? `　${NAKAMA[n.evo].name}が 進化した すがた` : ''}`, 170, 182, { size: 11, maxWidth: 220 });
        if (medal) {
            const s = statsAt(id, medal.lv, medal.nature);
            text(ctx, `Lv${medal.lv}  HP${s.hp} こうげき${s.atk} ぼうぎょ${s.def}`, 170, 196, { size: 11 });
            text(ctx, `すばやさ${s.spd} ようじゅつ${s.mag}`, 170, 211, { size: 11 });
            const need = expFor(medal.lv + 1) - expFor(medal.lv);
            bar(ctx, 170, 218, 210, 4, (medal.exp - expFor(medal.lv)) / need, COLORS.ice);
            // 装備 (2026-11-03)
            text(ctx, medal.equip ? `装備: ${EQUIPS[medal.equip].name}（${equipShort(medal.equip)}）` : '装備: なし', 170, 234, { size: 10, color: medal.equip ? COLORS.accent : COLORS.dim, maxWidth: 225 });
        } else {
            const where = [...SPOTS, ...ROAMS].filter(s => s.kinds.some(k => k.id === id)).map(s => s.label);
            const known = g.zukan.friends[id] || g.zukan.seen[id];
            const place = n.fuse ? '合体の館で 合体' : n.evo ? '進化' : known ? where.join('・') : '？？？';
            text(ctx, `いる場所: ${place}`, 170, 200, { size: 11, maxWidth: 220 });
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
        } else if (tab === 3 && bookPick) {
            const m = bookMedals()[bookPick.index];
            if (m) drawNakama(ctx, m.id, m);
        } else if (tab === 3) {
            const id = Object.keys(ITEMS)[iIndex];
            text(ctx, ITEMS[id].name, 200, 80, { size: 20, align: 'center', bold: true });
            wrap(ctx, ITEMS[id].desc, 340, 13).forEach((r, i) => text(ctx, r, 30, 120 + i * 20, { size: 13 }));
            text(ctx, `もっている数: ${g.items[id] || 0}`, 200, 200, { size: 13, align: 'center', color: COLORS.accent });
        } else if (tab === T_QUEST) {
            drawQuestTop(ctx);
        } else if (tab === T_HELP) {
            drawHelpTop(ctx);
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
        else if (tab === T_HELP) drawHelpList(ctx);
        else {
            button(ctx, SAVE_BTN, { active: sIndex === 0 });
            button(ctx, { ...BGM_BTN, label: `BGM: ${bgmOn() ? 'オン' : 'オフ'}` }, { active: sIndex === 1 });
            button(ctx, TITLE_BTN, { active: sIndex === 2 });
            text(ctx, 'ページを 閉じたときも 自動で セーブします', 160, 210, { size: 11, align: 'center', color: COLORS.sub });
            if (saved && t - saved < 1.5) text(ctx, 'セーブした！', 160, 62, { size: 14, align: 'center', bold: true, color: COLORS.accent });
        }
        text(ctx, `${btn('l')}${btn('r')}${isKeyboard() ? '・[Tab]' : ''} タブ`, 8, 232, { size: 10.5, color: COLORS.dim });
        text(ctx, `${btn('b')} もどる`, 312, 232, { size: 10.5, align: 'right', color: COLORS.dim });
        if (titleAsk) {
            panel(ctx, 20, 60, 280, 124, { fill: 'rgba(10, 14, 30, 0.97)', edge: COLORS.accent, r: 8 });
            text(ctx, 'セーブして タイトルへ もどる？', 160, 100, { size: 14, align: 'center', bold: true });
            button(ctx, TITLE_YES);
            button(ctx, TITLE_NO);
        }
    }

    // なかま: もっている メダル すべて (ウォッチに 入っている なかまは 場所の 番号)
    function drawAll(ctx) {
        if (equipPick) { drawEquipPick(ctx); return; }
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
        text(ctx, equipNote && t - equipNote.t < 2.5 ? equipNote.text : `なかま ${list.length} 体　[ ] は ウォッチの 場所　${btn('a')} 装備${list.length > ZUKAN_ROWS ? `　${nIndex + 1}/${list.length}` : ''}`, 8, 220, { size: 10, color: equipNote && t - equipNote.t < 2.5 ? COLORS.accent : COLORS.sub, maxWidth: 304 });
    }
    // 装備を えらぶ (いちばん 上は「はずす」。のこりの 数は ほかの なかまに 付けていない ぶん)
    function drawEquipPick(ctx) {
        const m = box()[nIndex], list = equipList(), top = scroll(equipPick.index, ROWS + 2, list.length);
        text(ctx, `${unitOf(m.id).name}に 付ける 装備`, 160, 46, { size: 11.5, align: 'center', bold: true, color: COLORS.accent });
        list.slice(top, top + ROWS + 2).forEach((id, k) => {
            const y = 52 + k * ROW_H;
            if (top + k === equipPick.index) { roundRect(ctx, 8, y, 304, ROW_H - 2, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
            if (!id) { text(ctx, '（はずす）', 16, y + 14, { size: 12, color: COLORS.sub }); return; }
            const mine = m.equip === id;
            text(ctx, `${mine ? '★' : ''}${EQUIPS[id].name}`, 16, y + 14, { size: 12, maxWidth: 130, color: mine ? COLORS.accent : '#ffffff' });
            text(ctx, equipShort(id), 150, y + 14, { size: 9.5, color: COLORS.sub, maxWidth: 130 });
            text(ctx, `×${equipFree(g, id)}`, 304, y + 14, { size: 11, align: 'right', color: equipFree(g, id) > 0 || mine ? '#ffffff' : COLORS.dim });
        });
        if (!list[1]) text(ctx, 'まだ 装備を もっていない。宝箱を さがそう！', 160, 120, { size: 11, align: 'center', color: COLORS.sub });
        const sel = list[equipPick.index];
        if (sel) text(ctx, EQUIPS[sel].desc, 8, 200, { size: 10, color: COLORS.sub, maxWidth: 304 });
        text(ctx, `${btn('a')} 付ける・${btn('b')} やめる`, 160, 218, { size: 10.5, align: 'center', color: COLORS.dim });
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

    // ヘルプ: 上画面に 話題の 中身、下画面に 話題の 一覧
    function drawHelpTop(ctx) {
        const h = helpTopics(g)[hIndex];
        if (!h) return;
        text(ctx, h.title, 200, 34, { size: 18, align: 'center', bold: true, color: COLORS.accent });
        let y = 66;
        for (const line of h.text) {
            const rows = wrap(ctx, fillKeys(line), 356, 12.5);
            rows.forEach(r => { text(ctx, r, 22, y, { size: 12.5 }); y += 18; });
            y += 6;
        }
    }
    function drawHelpList(ctx) {
        const list = helpTopics(g), top = scroll(hIndex, ZUKAN_ROWS, list.length);
        list.slice(top, top + ZUKAN_ROWS).forEach((h, k) => {
            const y = 36 + k * ROW_H;
            if (top + k === hIndex) { roundRect(ctx, 8, y, 304, ROW_H - 2, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
            text(ctx, h.title, 16, y + 14, { size: 12 });
            if (!(g.flags.helpSeen && g.flags.helpSeen[h.id])) text(ctx, 'NEW', 304, y + 14, { size: 10, align: 'right', bold: true, color: '#ff9ad8' });
        });
    }

    function drawItems(ctx) {
        if (bookPick) {
            const list = bookMedals(), top = scroll(bookPick.index, ROWS + 2, list.length), it = ITEMS[bookPick.itemId];
            text(ctx, `${it.name}を だれに 読ませる？`, 160, 46, { size: 11.5, align: 'center', bold: true, color: COLORS.accent });
            list.slice(top, top + ROWS + 2).forEach((m, k) => {
                const y = 52 + k * ROW_H;
                if (top + k === bookPick.index) { roundRect(ctx, 8, y, 304, ROW_H - 2, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
                text(ctx, `${unitOf(m.id).name} Lv${m.lv}`, 16, y + 14, { size: 12, maxWidth: 170 });
                text(ctx, NATURES[m.nature]?.name || '', 304, y + 14, { size: 11, align: 'right', color: m.nature === it.book ? COLORS.dim : '#ff9ad8' });
            });
            text(ctx, `${btn('a')} 読ませる・${btn('b')} やめる`, 160, 210, { size: 10.5, align: 'center', color: COLORS.dim });
            return;
        }
        const ids = Object.keys(ITEMS), top = scroll(iIndex, ITEM_ROWS, ids.length);
        ids.slice(top, top + ITEM_ROWS).forEach((id, k) => {
            const y = 36 + k * ROW_H;
            if (top + k === iIndex) { roundRect(ctx, 8, y, 304, ROW_H - 2, 4); ctx.fillStyle = '#2d5aa8'; ctx.fill(); }
            text(ctx, ITEMS[id].name, 16, y + 14, { size: 12 });
            if (ITEMS[id].material) text(ctx, '合成', 200, y + 14, { size: 10, color: '#c8a8ff' });
            text(ctx, `×${g.items[id] || 0}`, 304, y + 14, { size: 12, align: 'right' });
        });
        text(ctx, bookNote && t - bookNote.t < 2.5 ? bookNote.text : ITEMS[ids[iIndex]].book ? `${btn('a')} で なかまに 読ませる (性格が かわる)` : `お金: ${g.money}円`, 8, 200, { size: 11, color: bookNote && t - bookNote.t < 2.5 ? '#ff9ad8' : COLORS.sub, maxWidth: 304 });
    }

    return { name: 'menu', update, drawTop, drawBottom };
}
