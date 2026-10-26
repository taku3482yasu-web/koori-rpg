// =====================================================================
// 町の 場面: 上画面で 歩く・調べる・レンズで さがす、下画面に 地図と ボタン (設計書 5 章・7 章)
// =====================================================================
import { ART } from '../art/index.js';
import { TILE, MAP_W, MAP_H, SPOTS, BUILDINGS } from '../data/map.js';
import { ITEMS, SHOP } from '../data/items.js';
import { NAKAMA } from '../data/nakama.js';
import { COLORS, drawArt, panel, text, wrap, button, hit } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { moveHero, lookAt, peopleHere, inShrine } from '../logic/world.js';
import { TIMES, objective, hasWatch, spotActive, encounter, receiveWatch, advanceTime, bossEnemies, friendCount } from '../logic/game.js';
import { buildFieldCanvas, buildMiniMap } from './field-art.js';

const WALK = 72, RUN = 124;
const LENS_R = 26, LENS_FIND = 14, LENS_TIME = 1.2;
const SPOT_COOLDOWN = 25;   // 1 回 戦った 場所は 25 秒 休む
const TINT = ['rgba(255, 220, 160, 0.10)', null, 'rgba(255, 120, 40, 0.20)', 'rgba(20, 30, 90, 0.48)'];

const BTN = {
    lens: { x: 164, y: 28, w: 148, h: 40, label: 'レンズ (Y)' },
    menu: { x: 164, y: 76, w: 148, h: 40, label: 'メニュー (X)' }
};

let fieldCanvas = null, miniCanvas = null;

export function createField(app) {
    const g = app.g;
    if (!fieldCanvas) { fieldCanvas = buildFieldCanvas(); miniCanvas = buildMiniMap(3); }
    let t = 0, walkT = 0, moving = false;
    let lens = null;     // { x, y, charge, spot, drag }
    const trail = [];    // ふるカワが ついてくる 道すじ
    const cam = { x: 0, y: 0 };

    function camera() {
        cam.x = Math.max(0, Math.min(MAP_W * TILE - 400, Math.round(g.pos.x - 200)));
        cam.y = Math.max(0, Math.min(MAP_H * TILE - 240, Math.round(g.pos.y - 128)));
    }
    camera();

    // ----- できごと -----
    const say = (lines, opts) => app.talk.open(lines, opts);
    const furu = text => ({ who: 'ふるカワ', art: 'furukawa', text });

    function meetFurukawa() {
        say([
            furu('あっ、こおりくん！ ちょうど よかった！'),
            furu('この 町には、ふしぎな キャラが いっぱい かくれてるの。この「さがすレンズ」で のぞくと 見つかるんだよ。'),
            furu('それと これ！「おなかまウォッチ」。おなかまメダルを セットすると、なかまを 呼び出せるの。'),
            { who: '', text: 'おなかまウォッチ と さがすレンズ を もらった！' },
            { who: 'ダイチョウエンキン', art: 'daichouenkin', text: 'おなか、ぐるぐる～。こおりくん、ひさしぶり！ ぼくも 手伝うよ！' },
            { who: '', text: 'ダイチョウエンキンの おなかまメダルを もらった！' },
            furu('レンズ (Y) で 町を のぞいて、かくれてる キャラを さがそう。まずは なかまを 3 人 ふやしてみて！')
        ], { done: () => app.save() });
        receiveWatch(g);
        sfx('watch');
        trail.length = 0;
    }

    function talkToPerson(p) {
        if (p.id === 'mama') {
            const lines = {
                intro: ['こおりくん、夏休みだからって ゴロゴロしてないで、外で 遊んできなさい！', '神社の ほうで ふるカワちゃんが さがしてたわよ。'],
                friends: ['あら、おともだちが ふえたのね。おやつは 駄菓子屋で 買えるわよ。'],
                bridge: ['石の川橋が 通れないんですって。こまったわねえ。'],
                clear: [`町の なかまは ${friendCount(g)} 人？ まだまだ いそうね。夜に しか 出ない 子も いるらしいわよ。`]
            }[g.story];
            say(lines.map(text => ({ who: 'ともいし', art: 'tomoishi', text })));
        } else if (p.id === 'furukawaShrine') {
            meetFurukawa();
        } else if (p.id === 'nushi') {
            if (g.story === 'bridge') {
                say([
                    { who: 'ヌシ', art: 'hashishita', text: 'ひとつ、ふたつ、みっつ……だれだ！ おれの 数を じゃまするのは！' },
                    furu('こおりくん、ウォッチで なかまを 呼び出して！')
                ], { done: () => app.startBattle({ enemies: bossEnemies(), kind: 'boss', place: 'bridge' }) });
            } else {
                say([{ who: '', text: '大きな 坊主が 橋の まんなかで 足音を 数えている……。通れそうに ない。' },
                    ...(hasWatch(g) ? [furu('いまの なかまだけじゃ 心配だよ。もう少し なかまを ふやそう！')] : [])]);
            }
        }
    }

    function openDoor(b) {
        if (b.id === 'home') {
            say([{ who: '', text: `こおりくんの 家。いまは ${g.day}日目の ${TIMES[g.time]}。` }], {
                choices: ['ねる (時間を すすめる)', 'セーブする', 'やめる'],
                done: i => {
                    if (i === 0) {
                        advanceTime(g, app.rng);
                        sfx('heal');
                        app.save();
                        say([{ who: '', text: `ぐっすり ねた。……${g.day}日目の ${TIMES[g.time]}に なった。${g.weather === 'rain' && g.time === 0 ? '今日は 雨だ。' : ''}` }]);
                    } else if (i === 1) {
                        app.save();
                        say([{ who: '', text: 'セーブした！' }]);
                    }
                }
            });
        } else if (b.id === 'dagashi') {
            shop();
        } else {
            const msg = {
                school: '夏休みで しまっている。',
                shrine: 'おさいせんを 入れて おまいりした。なかまが たくさん 見つかりますように……',
                toilet: '……だれも 入っていない。なのに、なんだか おなかが ぐるぐる する。',
                temple: 'ポク……ポク……。中から 木魚の 音が する。'
            }[b.id];
            say([{ who: '', text: msg }]);
        }
    }

    function shop() {
        const labels = SHOP.map(id => `${ITEMS[id].name}  ${ITEMS[id].price}円 (${g.items[id] || 0}こ)`);
        say([{ who: '駄菓子屋の おばあちゃん', text: `いらっしゃい。なにに するかね？ (おこづかい ${g.money}円)` }], {
            choices: [...labels, 'やめる'],
            done: i => {
                const id = SHOP[i];
                if (!id) return;
                if (g.money < ITEMS[id].price) {
                    sfx('cancel');
                    say([{ who: '駄菓子屋の おばあちゃん', text: 'おこづかいが たりないねえ。' }], { done: shop });
                    return;
                }
                g.money -= ITEMS[id].price;
                g.items[id] = (g.items[id] || 0) + 1;
                sfx('ok');
                shop();
            }
        });
    }

    // 戦いから 帰ってきたとき (main.js が 呼ぶ)
    function afterBattle(result) {
        camera();
        if (result.boss && result.outcome === 'win') {
            say([
                { who: 'ハシシタボウズ', art: 'hashishita', text: '数えまちがえて イライラ してたんだ……ごめんよ。これからは 橋の下で しずかに 数えるよ。' },
                furu('やったね、こおりくん！ これで 東側にも 行けるね。お寺の ほうにも なかまが いるかも！'),
                { who: '', text: '１章 クリア！ ―― ２章は つぎの アップデートで。石の川タウンの なかま 20 人を あつめてみよう！' }
            ], { done: () => app.save() });
        } else if (result.storyChanged === 'bridge') {
            say([furu('なかまが ふえたね！ そういえば 石の川橋に 足音を 数える 大きな 坊主が いて、だれも 渡れないんだって。行ってみよう！')], { done: () => app.save() });
        } else if (result.outcome === 'lose') {
            say([{ who: '', text: `こおりくんは 家に 逃げかえった……。(${-result.money}円 落とした)` }]);
        }
    }

    // ----- レンズ -----
    function updateLens(dt, input) {
        if (input.pressed.b || input.pressed.y) { lens = null; sfx('cancel'); return; }
        const sp = 110 * dt;
        if (input.held.left) lens.x -= sp;
        if (input.held.right) lens.x += sp;
        if (input.held.up) lens.y -= sp;
        if (input.held.down) lens.y += sp;
        if (input.touch.justDown) lens.drag = { x: input.touch.x, y: input.touch.y };
        if (input.touch.down && lens.drag) {
            lens.x += (input.touch.x - lens.drag.x) * 1.25;
            lens.y += (input.touch.y - lens.drag.y) * 1.25;
            lens.drag = { x: input.touch.x, y: input.touch.y };
        }
        if (!input.touch.down) lens.drag = null;
        lens.x = Math.max(10, Math.min(390, lens.x));
        lens.y = Math.max(10, Math.min(230, lens.y));
        let found = null;
        for (const s of SPOTS) {
            const sx = s.x * TILE + 8 - cam.x, sy = s.y * TILE + 8 - cam.y;
            if (Math.hypot(sx - lens.x, sy - lens.y) < LENS_FIND && spotActive(g, s, g.playTime)) found = s;
        }
        if (found) {
            if (lens.spot !== found) { lens.spot = found; lens.charge = 0; }
            lens.charge += dt;
            if (Math.floor(lens.charge * 10) !== Math.floor((lens.charge - dt) * 10)) sfx('lens');
            if (lens.charge >= LENS_TIME) {
                sfx('found');
                g.spotCooldown[found.id] = g.playTime + SPOT_COOLDOWN;
                const enemies = encounter(g, found, app.rng);
                lens = null;
                app.startBattle({ enemies, kind: 'wild', place: found.id });
            }
        } else {
            lens.spot = null;
            lens.charge = Math.max(0, lens.charge - dt * 2);
        }
    }

    function update(dt, input) {
        t += dt;
        g.playTime += dt;
        camera();
        if (app.talk.isActive()) return;
        if (lens) { updateLens(dt, input); return; }

        // 下画面の ボタン
        if (input.touch.justDown) {
            if (hasWatch(g) && hit(BTN.lens, input.touch.x, input.touch.y)) { startLens(); return; }
            if (hit(BTN.menu, input.touch.x, input.touch.y)) { sfx('ok'); app.go('menu'); return; }
        }
        if (input.pressed.y && hasWatch(g)) { startLens(); return; }
        if (input.pressed.x || input.pressed.start) { sfx('ok'); app.go('menu'); return; }

        let dx = 0, dy = 0;
        if (input.held.left) dx -= 1;
        if (input.held.right) dx += 1;
        if (input.held.up) dy -= 1;
        if (input.held.down) dy += 1;
        moving = dx || dy;
        if (moving) {
            const speed = (input.held.b ? RUN : WALK) * dt / (dx && dy ? Math.SQRT2 : 1);
            const before = { x: g.pos.x, y: g.pos.y };
            moveHero(g, dx * speed, dy * speed);
            walkT += dt;
            if (before.x !== g.pos.x || before.y !== g.pos.y) {
                trail.push({ x: g.pos.x, y: g.pos.y, dir: g.pos.dir });
                if (trail.length > 40) trail.shift();
            }
        }
        camera();
        if (g.story === 'intro' && inShrine(g)) { meetFurukawa(); return; }
        if (input.pressed.a) {
            const target = lookAt(g);
            if (target?.type === 'person') { sfx('ok'); talkToPerson(target.person); } else if (target?.type === 'door') { sfx('ok'); openDoor(target.building); }
        }
    }

    function startLens() {
        sfx('lens');
        lens = { x: 200, y: 120, charge: 0, spot: null, drag: null };
    }

    // ----- 描く -----
    function drawPeople(ctx) {
        const list = [];
        for (const p of peopleHere(g)) {
            list.push({ y: (p.y + (p.h || 1)) * TILE, draw: () => drawArt(ctx, ART[p.art], Math.floor(t * 2), p.x * TILE + 8 - cam.x, (p.y + (p.h || 1)) * TILE - cam.y, { scale: p.scale || 1 }) });
        }
        // ふるカワ (ウォッチを もらったあとは ついてくる)
        if (hasWatch(g)) {
            const f = trail.length > 14 ? trail[trail.length - 15] : { x: g.pos.x - 14, y: g.pos.y - 2 };
            list.push({ y: f.y, draw: () => drawArt(ctx, ART.furukawa, Math.floor(t * 2), f.x - cam.x, f.y - cam.y + 1, { alpha: 0.95 }) });
        }
        const frame = moving ? Math.floor(walkT * 6) % 2 : Math.floor(t * 1.5) % 2;
        list.push({ y: g.pos.y, draw: () => drawArt(ctx, ART.koori, frame, g.pos.x - cam.x, g.pos.y - cam.y + 2, { flip: g.pos.dir === 'left' }) });
        list.sort((a, b) => a.y - b.y).forEach(o => o.draw());
    }

    function drawTop(ctx) {
        ctx.drawImage(fieldCanvas, cam.x, cam.y, 400, 240, 0, 0, 400, 240);
        // 川の きらきら
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let i = 0; i < 6; i++) {
            const wy = ((i * 97 + t * 30) % (MAP_H * TILE));
            ctx.fillRect(30 * TILE + ((i * 23) % 60) - cam.x, wy - cam.y, 4, 1);
        }
        // 看板
        for (const b of BUILDINGS) {
            const sx = b.door.x * TILE + 8 - cam.x, sy = b.y * TILE + 10 - cam.y;
            if (sx > -60 && sx < 460 && sy > -20 && sy < 260) {
                panel(ctx, sx - b.label.length * 5 - 4, sy - 9, b.label.length * 10 + 8, 13, { fill: 'rgba(255,250,235,0.92)', edge: '#5a3a20', r: 2, lineWidth: 1 });
                text(ctx, b.label, sx, sy + 1, { size: 9.5, align: 'center', color: '#3a2410', shadow: false, bold: true });
            }
        }
        drawPeople(ctx);
        // 時間帯の 色・雨
        if (TINT[g.time]) { ctx.fillStyle = TINT[g.time]; ctx.fillRect(0, 0, 400, 240); }
        if (g.weather === 'rain') {
            ctx.fillStyle = 'rgba(40, 60, 100, 0.15)';
            ctx.fillRect(0, 0, 400, 240);
            ctx.strokeStyle = 'rgba(200, 220, 255, 0.55)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            for (let i = 0; i < 40; i++) {
                const rx = (i * 53 + t * 40) % 420 - 10, ry = (i * 37 + t * 260) % 260 - 10;
                ctx.moveTo(rx, ry);
                ctx.lineTo(rx - 3, ry + 9);
            }
            ctx.stroke();
        }
        if (lens) drawLens(ctx);
        app.talk.drawTop(ctx, t);
    }

    function drawLens(ctx) {
        const shake = lens.spot ? Math.sin(t * 60) * Math.min(2, lens.charge * 2) : 0;
        const lx = lens.x + shake, ly = lens.y;
        // レンズの 外を 暗く
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, 400, 240);
        ctx.arc(lx, ly, LENS_R, 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgba(8, 12, 30, 0.62)';
        ctx.fill('evenodd');
        ctx.restore();
        // 近くに いると きらきら
        for (const s of SPOTS) {
            if (!spotActive(g, s, g.playTime)) continue;
            const sx = s.x * TILE + 8 - cam.x, sy = s.y * TILE + 8 - cam.y;
            const d = Math.hypot(sx - lx, sy - ly);
            if (d < LENS_R + 4) {
                ctx.fillStyle = `rgba(255, 240, 140, ${0.5 + 0.5 * Math.sin(t * 8)})`;
                ctx.fillRect(sx - 1, sy - 4, 2, 8);
                ctx.fillRect(sx - 4, sy - 1, 8, 2);
            }
        }
        ctx.strokeStyle = lens.spot ? COLORS.accent : '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(lx, ly, LENS_R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#1b3a6b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(lx, ly, LENS_R + 2, 0, Math.PI * 2);
        ctx.stroke();
        if (lens.spot) {
            ctx.strokeStyle = COLORS.accent;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(lx, ly, LENS_R + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (lens.charge / LENS_TIME));
            ctx.stroke();
        }
    }

    function drawBottom(ctx) {
        ctx.fillStyle = '#16203a';
        ctx.fillRect(0, 0, 320, 240);
        if (lens) {
            text(ctx, 'さがすレンズ', 160, 30, { size: 16, align: 'center', bold: true, color: COLORS.ice });
            panel(ctx, 20, 44, 280, 130, { fill: 'rgba(255,255,255,0.05)' });
            text(ctx, 'ここを なぞって レンズを 動かす', 160, 104, { size: 13, align: 'center', color: COLORS.sub });
            text(ctx, '(十字キーでも 動く)', 160, 124, { size: 11, align: 'center', color: COLORS.dim });
            text(ctx, lens.spot ? '……なにか いる！ そのまま！' : 'あやしい ところに レンズを 合わせよう', 160, 196, { size: 13, align: 'center', bold: Boolean(lens.spot), color: lens.spot ? COLORS.accent : COLORS.ink });
            text(ctx, 'B で やめる', 160, 226, { size: 11, align: 'center', color: COLORS.dim });
            return;
        }
        text(ctx, `${g.day}日目 ${TIMES[g.time]} ${g.weather === 'rain' ? '雨' : 'はれ'}`, 10, 18, { size: 12, bold: true });
        text(ctx, `${g.money}円`, 310, 18, { size: 12, align: 'right', color: COLORS.accent });
        // 地図
        panel(ctx, 6, 26, 148, 112, { fill: '#000', r: 3 });
        ctx.drawImage(miniCanvas, 8, 28, 144, 108);
        if (Math.floor(t * 4) % 2) {
            ctx.fillStyle = '#ff3a5a';
            ctx.fillRect(8 + g.pos.x / TILE * 3 - 2, 28 + g.pos.y / TILE * 3 - 4, 4, 4);
        }
        // 目的地の しるし
        const goal = g.story === 'intro' ? { x: 6, y: 5 } : g.story === 'bridge' ? { x: 31, y: 17 } : null;
        if (goal) text(ctx, '!', 8 + goal.x * 3, 28 + goal.y * 3 + 4, { size: 12, bold: true, align: 'center', color: COLORS.accent });
        button(ctx, BTN.lens, { disabled: !hasWatch(g) });
        button(ctx, BTN.menu);
        text(ctx, hasWatch(g) ? `なかま ${g.medals.length} / 図鑑 ${friendCount(g)}` : 'ウォッチを まだ もっていない', 238, 132, { size: 11, align: 'center', color: COLORS.sub });
        panel(ctx, 6, 146, 308, 52);
        text(ctx, 'もくてき', 14, 162, { size: 10, color: COLORS.accent, bold: true });
        wrap(ctx, objective(g), 290, 12).slice(0, 2).forEach((r, i) => text(ctx, r, 14, 178 + i * 15, { size: 12 }));
        text(ctx, 'A: しらべる・はなす   B (おしたまま): はしる', 160, 220, { size: 10.5, align: 'center', color: COLORS.dim });
        text(ctx, '十字キー: あるく', 160, 234, { size: 10.5, align: 'center', color: COLORS.dim });
        app.talk.drawBottom(ctx);
    }

    return { name: 'field', update, drawTop, drawBottom, afterBattle, debug: { lens: () => lens, cam } };
}

export const nakamaName = id => NAKAMA[id]?.name || id;
