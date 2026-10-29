// =====================================================================
// 本物の ブラウザでの 自動テスト (play.html を Chrome で 開いて 遊ぶ)
// ---------------------------------------------------------------------
// node tools/browser-test.mjs [--shots <フォルダ>]
//   タイトル → はじめから → 会話 → 神社で ウォッチ → レンズで さがす → バトル (輪・必殺技・道具) → 結果 → メニュー
//   → スマホの 大きさ (縦持ち・ボタン) → つづきから。エラーが 出たら 失敗 (終了コード 1)
//   --shots を つけると、とちゅうの 画面を PNG で 保存する
// Chrome が 見つからないときは 飛ばす (終了コード 0)
// =====================================================================
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const shotsArg = process.argv.indexOf('--shots');
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const CHROMES = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const CHROME = CHROMES.find(p => existsSync(p));
if (!CHROME) {
    console.log('ブラウザのテスト: Chrome が 見つからないので 飛ばしました');
    process.exit(0);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'koori-rpg-test-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--allow-file-access-from-files',
    '--window-size=900,1000', 'about:blank'], { stdio: 'ignore' });

let ws, id = 0;
const pending = new Map(), errors = [], results = [];
const send = (method, params = {}) => new Promise(resolve => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params }));
});
const evaluate = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
};
const check = (ok, name) => { results.push(`${ok ? '✔' : '✘'} ${name}`); };
const KEYCODES = { Enter: 13, KeyC: 67, KeyX: 88, KeyQ: 81, KeyE: 69, KeyY: 89, ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Digit1: 49, KeyZ: 90, Tab: 9, KeyJ: 74, KeyK: 75, KeyU: 85, KeyI: 73, KeyW: 87, KeyA: 65, KeyS: 83, KeyD: 68 };
async function key(code, hold = 80) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: code, windowsVirtualKeyCode: KEYCODES[code] });
    await sleep(hold);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: code, windowsVirtualKeyCode: KEYCODES[code] });
    await sleep(120);
}
// 会話を 最後まで 進める
async function skipTalk(max = 20) {
    // 会話が 終わったあとに よけいに 押すと、町で 話しかけて しまうので 1 回ずつ
    for (let i = 0; i < max * 2 && await evaluate('window.__app.talk.isActive()'); i++) await key('Enter');
}
// 下画面の ドット座標 (x, y) を マウスで 押す
async function clickBottom(x, y) {
    const p = await evaluate(`(() => { const r = document.getElementById('bottom').getBoundingClientRect(); return { x: r.x + ${x} / 320 * r.width, y: r.y + ${y} / 240 * r.height }; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1, buttons: 1 });
    await sleep(60);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await sleep(200);
}
let shotNo = 0;
async function shot(name) {
    if (!SHOTS) return;
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(SHOTS, `${String(++shotNo).padStart(2, '0')}-${name}.png`), Buffer.from(r.data, 'base64'));
}
const sceneIs = name => evaluate(`window.__app.scene.name === ${JSON.stringify(name)}`);

try {
    let wsUrl = null;
    for (let i = 0; i < 50 && !wsUrl; i++) {
        try {
            const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
            wsUrl = list.find(t => t.type === 'page')?.webSocketDebuggerUrl;
        } catch (e) { /* まだ 起動中 */ }
        if (!wsUrl) await sleep(200);
    }
    ws = new WebSocket(wsUrl);
    await new Promise(r => ws.addEventListener('open', r));
    ws.addEventListener('message', m => {
        const msg = JSON.parse(m.data);
        if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result || msg); pending.delete(msg.id); }
        if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
        if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '));
    });
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: pathToFileURL(join(ROOT, 'play.html')).href });
    await sleep(1200);
    await evaluate('localStorage.clear(), true');

    // ----- タイトル → はじめから (J キーで 決定) -----
    await shot('title');
    check(await evaluate('Boolean(window.__app && window.__app.scene)'), 'タイトルが 出る');
    await key('KeyJ');
    await sleep(300);
    check(await evaluate('window.__app.g && window.__app.g.story === "intro"'), 'J キーで 決定して はじめから 始まる');
    await shot('intro-talk');
    await skipTalk();

    // ----- 歩く -----
    const before = await evaluate('window.__app.g.pos.x');
    await key('KeyD', 500);
    check(await evaluate(`window.__app.g.pos.x > ${before}`), 'D キーで 右へ 歩く');
    const beforeY = await evaluate('window.__app.g.pos.y');
    await key('KeyS', 300);
    check(await evaluate(`window.__app.g.pos.y > ${beforeY}`), 'S キーで 下へ 歩く');
    await shot('field');

    // ----- 神社で ウォッチを もらう -----
    await evaluate('(() => { const g = window.__app.g; g.pos.x = 11 * 16 + 8; g.pos.y = 6 * 16 + 12; return true; })()');
    await key('ArrowLeft', 300);
    await sleep(200);
    check(await evaluate('window.__app.talk.isActive()'), '神社に 入ると ふるカワと 会話');
    await shot('shrine-talk');
    await skipTalk();
    check(await evaluate('window.__app.g.story === "friends" && window.__app.g.medals.length === 2 && window.__app.g.watch[1] === "hero"'), 'ウォッチと ダイチョウエンキンの メダルを もらう (こおりくんも ウォッチに 入る)');

    // ----- ふるカワが なめらかに ついてくる (1 コマで 大きく 飛ばない・離れすぎない) -----
    await send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyD', key: 'KeyD', windowsVirtualKeyCode: 68 });
    const samples = await evaluate('new Promise(r => { const out = []; let n = 0; const tick = () => { const b = window.__app.field.debug.buddy, p = window.__app.g.pos; out.push([b.x, b.y, p.x, p.y]); if (++n < 60) requestAnimationFrame(tick); else r(out); }; requestAnimationFrame(tick); })');
    await send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyD', key: 'KeyD', windowsVirtualKeyCode: 68 });
    const steps = samples.slice(1).map((v, i) => Math.hypot(v[0] - samples[i][0], v[1] - samples[i][1]));
    const far = Math.max(...samples.map(v => Math.hypot(v[0] - v[2], v[1] - v[3])));
    check(Math.max(...steps) < 4 && far < 40, `ふるカワが なめらかに ついてくる (1 コマ 最大 ${Math.max(...steps).toFixed(2)} ドット・離れて 最大 ${far.toFixed(1)})`);

    // ----- かくれている 場所の 違和感 (画面だけ 保存) -----
    for (const [name, x, y] of [['cue-parking', 7, 29], ['cue-jizo', 23, 5]]) {
        await evaluate(`(() => { const g = window.__app.g; g.pos.x = ${x} * 16 + 8; g.pos.y = ${y} * 16 + 12; return true; })()`);
        await sleep(400);
        await shot(name);
    }

    // ----- 見えている キャラが 町を 歩いている -----
    await sleep(1500);
    check(await evaluate('window.__app.field.debug.wild.list.length >= 3'), '見えている キャラが 町に いる');
    // 話せる キャラ (印なし。2026-10-28): 話しかけると 会話と 道具。ぶつかると すけない
    await evaluate('(() => { const g = window.__app.g, c = window.__app.field.debug.wild.list.find(x => x.friend === "f_pekorisu"); g.pos.x = c.x - 14; g.pos.y = c.y; g.pos.dir = "right"; c.pause = 99; c.target = null; return true; })()');
    const pan = await evaluate('window.__app.g.items.melonpan || 0');
    await key('KeyJ');
    await sleep(200);
    check(await evaluate('window.__app.talk.isActive()'), '印の ない キャラに 話しかけると 会話');
    await skipTalk();
    check(await evaluate(`(window.__app.g.items.melonpan || 0) === ${pan} + 1 && window.__app.scene.name === "field"`), '話せる キャラから 道具を もらう (バトルに ならない)');
    const cx = await evaluate('window.__app.field.debug.wild.list.find(x => x.friend === "f_pekorisu").x');
    await key('KeyD', 500);
    check(await evaluate(`window.__app.g.pos.x <= ${cx} - 9`), 'キャラに ぶつかると 止まる (すけない)');

    // ----- レンズで さがす (川原の石ころの 上に こおりくんを 立たせて、レンズを まんなかの まま 待つ) -----
    await evaluate('(() => { const g = window.__app.g; g.pos.x = 28 * 16 + 8; g.pos.y = 11 * 16 + 14; return true; })()');
    await key('KeyU');
    await shot('lens');
    check(await evaluate('Boolean(window.__app.field.debug.lens())'), 'Y (U キー) で レンズが 出る');
    // マウスで レンズを 場所に 合わせる (上画面の 上で マウスを 動かす)
    const target = await evaluate(`(() => { const f = window.__app.field; const r = document.getElementById('top').getBoundingClientRect(); const sx = 28 * 16 + 8 - f.debug.cam.x, sy = 11 * 16 + 8 - f.debug.cam.y; return { x: r.x + sx / 400 * r.width, y: r.y + sy / 240 * r.height, sx, sy }; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: target.x - 40, y: target.y });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: target.x, y: target.y });
    await sleep(100);
    check(await evaluate(`(() => { const l = window.__app.field.debug.lens(); return l && Math.abs(l.x - ${target.sx}) < 2 && Math.abs(l.y - ${target.sy}) < 2; })()`), 'マウスで レンズが 動く');
    await sleep(1600);
    check(await evaluate('window.__app.talk.isActive() && window.__app.field.debug.wild.list.some(c => c.revealed && c.id === "ishikoron")'), 'レンズで 見つけると「見つけた！」と 出て、キャラが その場に 出てくる');
    await shot('found');
    await skipTalk();
    check(await sceneIs('field'), '見つけても すぐには バトルに ならない');
    // 出てきた キャラの 下に 立って 上を 向き、J で 話しかける
    await evaluate('(() => { const g = window.__app.g, c = window.__app.field.debug.wild.list.find(x => x.revealed); g.pos.x = c.x; g.pos.y = c.y + 16; g.pos.dir = "up"; c.pause = 99; c.target = null; window.__app.field.debug.wild.list.forEach(o => { if (o !== c && Math.hypot(o.x - c.x, o.y - c.y) < 64) { o.x += 200; o.pause = 99; o.target = null; } }); return true; })()');
    await shot('revealed');
    await key('KeyJ');
    check(await evaluate('window.__app.talk.isActive()'), '話しかけると キャラが しゃべる');
    await skipTalk();
    await sleep(200);
    check(await sceneIs('battle'), '話しかけると バトルが 始まる');
    // はじまり (2026-10-29): 「○○が あらわれた！」で 止まり、なかまは まだ 出ていない → たたかう で 開始
    await sleep(600);
    await shot('battle-appear');
    check(await evaluate('window.__app.scene.debug.intro() === 0 && !window.__app.scene.debug.allyShown() && window.__app.scene.battle.t === 0'), 'バトルの はじめは「あらわれた！」で 止まって 待つ');
    check(await evaluate(`(() => { const s = window.__app.scene, es = s.battle.enemies, t = s.debug.appearText();
        return es.length === 1 ? t === es[0].name + 'が あらわれた！' : t === es[Math.floor((es.length - 1) / 2)].name + 'たちが あらわれた！'; })()`), '2 体 いじょうは まんなかの 敵で「○○たちが あらわれた！」');
    await key('KeyJ');
    await sleep(300);
    check(await evaluate('window.__app.scene.debug.allyShown() && !window.__app.scene.battle.waiting'), '「たたかう」で なかまが 出てきて 始まる');
    await sleep(1500);
    await shot('battle');

    // ----- バトル: 攻撃した キャラが 動く (飛びこみ・はねる)・当たると 火花 -----
    const moved = await evaluate('new Promise(r => { let m = false, f = false, n = 0; const tick = () => { const d = window.__app.scene.debug; if (d) { if (Object.keys(d.motions).length) m = true; if (d.effects.some(e => e.kind === "spark")) f = true; } if ((m && f) || ++n > 900) r({ m, f }); else requestAnimationFrame(tick); }; tick(); })');
    check(moved.m && moved.f, `攻撃した キャラが 動き、当たると 火花が 出る (${JSON.stringify(moved)})`);

    // ----- バトル: 倍速 (F キー)・どうぐを えらぶ あいだは 止まる (2026-10-28) -----
    await key('KeyF');
    check(await evaluate('window.__app.g.fastBattle === true'), 'F キーで 倍速');
    await key('KeyF');
    check(await evaluate('!window.__app.g.fastBattle'), 'もう一度 F キーで もとの 速さ');
    await key('KeyU');
    const t0 = await evaluate('window.__app.scene.battle.t');
    await sleep(600);
    check(await evaluate(`window.__app.scene.battle.t === ${t0}`), 'どうぐを えらんでいる あいだは バトルが 止まる');
    await key('KeyK');
    await sleep(300);
    check(await evaluate(`window.__app.scene.battle.t > ${t0}`), 'とじると バトルが 動きだす');

    // ----- バトル: どうぐを 使う なかまを えらぶ (2026-10-28) -----
    // 前の 1 体目を 少し、2 体目を たくさん へらす → カーソルは HP の 少ない 2 体目。上で 1 体目に して 使う
    await evaluate('(() => { const b = window.__app.scene.battle; window.__app.g.items.onigiri = 3; b.itemCooldown = 0; const f = b.frontAlive(); f[0].hp = Math.ceil(f[0].max * 0.5); f[1].hp = 1; window.__pickUid = f[0].uid; window.__pickHp = f[0].hp; return true; })()');
    await key('KeyU');
    await key('KeyJ');
    check(await evaluate('(() => { const m = window.__app.scene.debug.menu(); return Boolean(m && m.pick && m.pick.id === "onigiri"); })()'), 'どうぐ → おにぎり → だれに 使うか えらぶ');
    await key('ArrowUp');
    await shot('item-pick');
    await key('KeyJ');
    await sleep(100);
    check(await evaluate('(() => { const b = window.__app.scene.battle, u = b.wheel.find(x => x && x.uid === window.__pickUid); return u.hp > window.__pickHp && !window.__app.scene.debug.menu(); })()'), 'えらんだ なかまに おにぎりを 使う');
    await evaluate('(() => { window.__app.scene.battle.wheel.forEach(u => { if (u) { u.hp = u.max; u.ko = false; } }); return true; })()');

    // ----- バトル: ロックオン (↑↓・上画面の タップ。設計書 3.2) -----
    await key('ArrowDown');
    check(await evaluate('window.__app.scene.battle.lock === window.__app.scene.battle.enemiesAlive()[0].uid'), '↓で 敵を ねらう (ロックオン)');
    await key('ArrowUp');
    check(await evaluate('window.__app.scene.battle.lock === null'), '↑で ねらいを はずす');

    // ----- バトル: 輪を 回す・必殺技・道具 -----
    await evaluate('(() => { const b = window.__app.scene.battle; b.enemies.forEach(e => { e.s.atk = 1; e.s.mag = 1; }); return true; })()');
    await evaluate('window.__app.g.items.onigiri = 3');
    await key('KeyE');
    check(await evaluate('window.__app.scene.battle.rot === 1'), 'R (E キー) で 輪が 回る');
    await sleep(500);
    await key('KeyQ');
    await evaluate('(() => { const b = window.__app.scene.battle; b.front()[0].gauge = 100; return true; })()');
    await evaluate('(() => { const st = window.__flow = { seen: new Set(), hurt: false, done: false, n: 0 }; const tick = () => { const s = window.__app.scene, m = s.debug && s.debug.mg(); if (m) st.seen.add(m.phase); if (s.debug && Object.values(s.debug.motions).some(x => x.kind === "hurt" || x.kind === "ko")) st.hurt = true; if ((!m && st.seen.size) || ++st.n > 1500) st.done = true; else requestAnimationFrame(tick); }; tick(); return true; })()');
    await key('Digit1');
    check(await evaluate('window.__app.scene.battle.paused && ["mash", "reel", "trace", "spin"].includes(window.__app.scene.debug.mg().command)'), '必殺技で コマンド (4 種類から ランダム)');
    await shot('command');
    // どの コマンドでも 決まるまで A を 押す (れんだ・目押し)。なぞる・ぐるぐるは 時間切れまで 待つ
    for (let i = 0; i < 12; i++) await key('Enter', 20);
    // コマンド → 結果 → カットイン → 動き を 見とどける (動きの 中で 敵が 食らう モーション)
    const flow = await evaluate('new Promise(r => { const w = () => (window.__flow.done ? r({ phases: [...window.__flow.seen], hurt: window.__flow.hurt }) : requestAnimationFrame(w)); w(); })');
    check(['result', 'cutin', 'act'].every(p => flow.phases.includes(p)), `必殺技: コマンドの あと 結果 → カットイン → キャラの 動き (${flow.phases.join(' → ')})`);
    check(flow.hurt, '必殺技が 当たると 敵が 食らった モーション');
    // 敵を 弱らせて 勝つ
    await evaluate('(() => { const b = window.__app.scene.battle; if (b) b.enemies.forEach(e => { e.hp = 1; }); return true; })()');
    for (let i = 0; i < 40 && await sceneIs('battle'); i++) await sleep(250);
    await shot('result');
    check(!(await sceneIs('battle')), 'バトルに 勝つと 結果に 進む');
    for (let i = 0; i < 6 && !(await sceneIs('field')); i++) { await key('Enter'); await sleep(300); }
    await skipTalk();
    check(await sceneIs('field'), '結果の あと 町に もどる');

    // ----- メニュー -----
    await key('Tab');
    await sleep(200);
    check(await sceneIs('menu'), 'X (Tab キー) で メニューが 開く');
    await shot('menu-watch');
    await key('KeyE');
    await shot('menu-zukan');
    await clickBottom(34, 17);   // へんせいの タブ
    await clickBottom(57, 58);   // 1 つ目の 場所
    await shot('menu-pick');
    await key('KeyK');
    // Tab キーは メニューの 中では タブの 切りかえ (2026-10-28 ユーザー指定)
    await key('Tab');
    check(await sceneIs('menu'), 'メニューの 中で Tab キー → メニューは 閉じない');
    await shot('menu-all');
    await key('KeyI');
    check(await sceneIs('field'), 'メニューを 閉じる');

    // ----- 駄菓子屋: 何こ 買うか えらぶ (2026-10-28) -----
    await evaluate('(() => { const g = window.__app.g; g.money = 1000; g.items.onigiri = 0; g.pos.x = 17 * 16 + 8; g.pos.y = 24 * 16 + 12; g.pos.dir = "up"; window.__app.field.debug.wild.list.forEach(c => { if (Math.hypot(c.x - g.pos.x, c.y - g.pos.y) < 48) { c.x += 160; c.target = null; c.pause = 99; } }); return true; })()');
    await key('KeyJ');
    await sleep(200);
    await key('KeyJ');           // あいさつを 全部 出す
    await sleep(200);
    await key('KeyJ');           // おにぎり
    await sleep(200);
    await key('KeyJ');           // 「いくつ」を 全部 出す
    await sleep(200);
    await key('ArrowUp');
    await key('ArrowUp');
    await key('ArrowRight');     // 1 + 2 + 10 = 13 こ
    await shot('shop-count');
    await key('KeyJ');
    await sleep(200);
    check(await evaluate('window.__app.g.items.onigiri === 13 && window.__app.g.money === 1000 - 60 * 13'), '駄菓子屋で 13 こ えらんで 買える');
    await key('KeyK');           // あいさつを 全部 出す
    await sleep(200);
    await key('KeyK');           // やめる
    await sleep(200);
    check(!(await evaluate('window.__app.talk.isActive()')), '駄菓子屋を 出る');

    // ----- セーブして 開きなおす → つづきから -----
    await evaluate('window.__app.save(), true');
    await send('Page.reload');
    await sleep(1200);
    await key('Enter');
    await sleep(300);
    check(await evaluate('window.__app.g && window.__app.g.story === "friends" && window.__app.g.medals.length >= 1'), 'つづきから で 前の 続き');

    // ----- 商店街 (段階 2。2026-10-27): 1 章 クリアの あと 南へ 行ける -----
    await skipTalk();
    check(await evaluate('(() => { const g = window.__app.g; g.pos.x = 12 * 16 + 8; g.pos.y = 34 * 16 + 12; return true; })()') && true, '商店街の 入り口へ');
    await key('KeyS', 600);
    check(await evaluate('window.__app.g.pos.y < 35 * 16'), '1 章 クリア前は 工事中で 商店街へ 行けない');
    await evaluate('(() => { const g = window.__app.g; g.story = "clear"; g.time = 3; return true; })()');
    await key('KeyS', 900);
    check(await evaluate('window.__app.g.pos.y > 35 * 16'), '1 章 クリアの あとは 商店街へ 行ける');
    await evaluate('(() => { const g = window.__app.g; g.pos.x = 20 * 16 + 8; g.pos.y = 50 * 16 + 12; window.__app.field.debug.wild.update(0.1, g.pos); return true; })()');
    await sleep(600);
    await shot('shoutengai');
    check(await evaluate('window.__app.field.debug.wild.list.some(c => window.__app.g.pos && c.y > 36 * 16)'), '商店街に キャラが いる');
    // バトル: 5 つの コマンド (わざ・術の 名前が 出る) と こおりくん
    await evaluate('(() => { window.__app.startBattle({ enemies: [{ id: "yataiman", lv: 8 }, { id: "saikoron", lv: 7 }], kind: "wild", place: "arcadeW" }); return true; })()');
    await sleep(100);
    await key('KeyJ');
    await sleep(4000);
    await shot('shoutengai-battle');
    check(await evaluate('(() => { const b = window.__app.scene.battle; return b.wheel.some(u => u && u.hero); })()'), 'こおりくんも バトルに 出る');
    await evaluate('(() => { const b = window.__app.scene.battle; b.enemies.forEach(e => { e.hp = 0; e.ko = true; }); return true; })()');
    await sleep(1500);
    await skipTalk();
    for (let i = 0; i < 6 && !(await sceneIs('field')); i++) { await key('KeyJ'); await sleep(300); }
    await skipTalk();

    // ----- 2 章: 夜の 小学校に 入る → 七不思議を 調べると バトル → マットで 外へ (2026-10-28) -----
    await evaluate('(() => { const g = window.__app.g; g.story = "clear"; g.time = 1; g.pos.x = 19 * 16 + 8; g.pos.y = 7 * 16 + 12; g.pos.dir = "up"; window.__app.field.debug.wild.list.length = 0; return true; })()');
    await key('KeyJ');
    await skipTalk();
    check(await evaluate('window.__app.g.pos.y < 60 * 16'), '昼の 小学校は しまっている');
    await evaluate('window.__app.g.time = 3');
    await key('KeyJ');
    await skipTalk();
    check(await evaluate('window.__app.g.story === "school" && window.__app.g.pos.y > 60 * 16'), '夜は 小学校の 中に 入れる (2 章が 始まる)');
    await shot('school');
    await evaluate('(() => { const g = window.__app.g; g.pos.x = 3 * 16 + 8; g.pos.y = 63 * 16 + 12; g.pos.dir = "up"; window.__app.field.debug.wild.list.length = 0; return true; })()');
    await key('KeyJ');
    await skipTalk();
    await sleep(300);
    check(await evaluate('window.__app.scene.name === "battle" && window.__app.scene.battle.mystery === "rika"'), '理科室の ガイコツを 調べると バトル');
    await key('KeyJ');
    await evaluate('(() => { const b = window.__app.scene.battle; b.enemies.forEach(e => { e.hp = 0; e.ko = true; }); return true; })()');
    for (let i = 0; i < 20 && await sceneIs('battle'); i++) await sleep(200);
    for (let i = 0; i < 8 && !(await sceneIs('field')); i++) { await key('KeyJ'); await sleep(300); }
    await skipTalk();
    check(await evaluate('window.__app.g.mysteries.rika === true'), '勝つと 七不思議を ひとつ たしかめた');
    await evaluate('(() => { const g = window.__app.g; g.pos.x = 23 * 16 + 8; g.pos.y = 71 * 16 + 12; return true; })()');
    await key('KeyS', 400);
    check(await evaluate('window.__app.g.pos.y < 60 * 16'), 'げた箱の マットで 学校の 外へ');

    // ----- 3 章: 町の 北の 山道から 山へ → 奥の院 → 氷の 封印 → ダムの主 (2026-10-29) -----
    const at = (x, y, dir = 'up') => evaluate(`(() => { const g = window.__app.g; g.pos.x = ${x} * 16 + 8; g.pos.y = ${y} * 16 + 12; g.pos.dir = "${dir}"; window.__app.field.debug.wild.list.length = 0; return true; })()`);
    const winNow = async () => {
        await key('KeyJ');
        await evaluate('(() => { const b = window.__app.scene.battle; b.enemies.forEach(e => { e.hp = 0; e.ko = true; }); return true; })()');
        for (let i = 0; i < 20 && await sceneIs('battle'); i++) await sleep(200);
        for (let i = 0; i < 10 && !(await sceneIs('field')); i++) { await key('KeyJ'); await sleep(300); }
    };
    await evaluate('window.__app.g.story = "school"; window.__app.g.time = 1; true');
    await at(26.5, 1);
    await key('KeyW', 500);
    check(await evaluate('window.__app.g.pos.y < 60 * 16'), '2 章 クリアまで 山道は 通行止め');
    await evaluate('window.__app.g.story = "clear2"; true');
    await at(26.5, 1);
    await key('KeyW', 500);
    await sleep(200);
    await shot('yama-enter');
    await skipTalk();
    check(await evaluate('window.__app.g.story === "yama" && window.__app.g.pos.y > 84 * 16'), '2 章 クリアの あと 山道から 山へ 入れる (3 章が 始まる)');
    await at(15, 108);
    await key('KeyJ');
    await skipTalk();
    check(await sceneIs('field') && await evaluate('!window.__app.g.mysteries.sealMori'), '言いつたえを 読む 前は 氷の 柱を 調べても バトルに ならない');
    await at(7, 90);
    await key('KeyJ');
    await skipTalk();
    check(await evaluate('window.__app.g.flags.oku === true'), '奥の院で 言いつたえを 読む');
    await at(15, 108);
    await key('KeyJ');
    await skipTalk();
    await sleep(300);
    check(await evaluate('window.__app.scene.name === "battle" && window.__app.scene.battle.mystery === "sealMori"'), '氷の 封印を 調べると まもる キャラと バトル');
    await winNow();
    await skipTalk();
    check(await evaluate('window.__app.g.mysteries.sealMori === true'), '勝つと 封印が とける');
    await evaluate('(() => { const g = window.__app.g; g.mysteries.sealSekkei = true; g.mysteries.sealIwa = true; return true; })()');
    await at(32, 92);
    await shot('yama-dam');
    await key('KeyJ');
    await skipTalk();
    await sleep(300);
    check(await evaluate('window.__app.scene.name === "battle" && window.__app.scene.battle.enemies[0].id === "himuro"'), '封印を ぜんぶ とくと 氷の 城の 前で ダムの主と バトル');
    await key('KeyJ');
    await sleep(1200);
    await shot('yama-boss');
    // 氷の偶像: 2 体 そろうと 必殺技を ためる。偶像を こわすと 止まる
    await evaluate('(() => { const b = window.__app.scene.battle, boss = b.enemies[0]; window.__moves = boss.bossMoves; boss.bossMoves = boss.bossMoves.filter(m => m.summon); boss.timer = 999; return true; })()');
    await sleep(300);
    await evaluate('(() => { const b = window.__app.scene.battle; b.enemies[0].timer = 999; return true; })()');
    await sleep(600);
    await shot('yama-idols');
    check(await evaluate('(() => { const b = window.__app.scene.battle; return b.enemies.filter(e => e.idol && !e.ko).length === 2 && Boolean(b.charge); })()'), 'ダムの主: 氷の偶像が 2 体 そろうと 必殺技を ためる');
    await evaluate('(() => { const b = window.__app.scene.battle; b.enemies[0].bossMoves = window.__moves; const i = b.enemies.find(e => e.idol && !e.ko); i.hp = 1; b.lock = i.uid; return true; })()');
    for (let i = 0; i < 30 && await evaluate('Boolean(window.__app.scene.battle.charge)'); i++) await sleep(200);
    await shot('yama-idol-cancel');
    check(await evaluate('!window.__app.scene.battle.charge && !window.__app.scene.battle.events.some(e => e.type === "special" && e.big)'), 'ダムの主: 偶像を こわすと 必殺技が 止まる');
    await evaluate('(() => { const b = window.__app.scene.battle; b.enemies.forEach(e => { e.hp = 0; e.ko = true; }); return true; })()');
    for (let i = 0; i < 20 && await sceneIs('battle'); i++) await sleep(200);
    for (let i = 0; i < 10 && !(await sceneIs('field')); i++) { await key('KeyJ'); await sleep(300); }
    await skipTalk(30);
    await shot('yama-clear');
    check(await evaluate('window.__app.g.story === "clear3" && window.__app.g.medals.some(m => m.id === "hyougaryu")'), 'ダムの主を たおすと 3 章 クリア (ヒョウガリュウが なかまに)');
    check(await evaluate('(() => { const g = window.__app.g; const y = Math.floor((g.pos.y - 3) / 16); return y >= 96; })()'), 'クリアの あと 湖の 外に 立っている');
    await at(23.5, 117, 'down');
    await key('KeyS', 400);
    check(await evaluate('window.__app.g.pos.y < 60 * 16'), '山の 入り口から 町に もどる');
    // 敵は 3 体まで (2026-10-29)。「あらわれた！」は まんなかの 敵
    await evaluate('(() => { window.__app.startBattle({ enemies: [{ id: "fubukipenguin", lv: 12 }, { id: "yukimidango", lv: 13 }, { id: "dai" + "chouenkin", lv: 12 }], kind: "wild", place: "yama" }); return true; })()');
    await sleep(300);
    await shot('three-appear');
    check(await evaluate('window.__app.scene.battle.enemies.length === 3 && window.__app.scene.debug.appearText() === "ユキミダンゴたちが あらわれた！"'), '敵 3 体: まんなかの 敵で「○○たちが あらわれた！」');
    await key('KeyJ');
    await sleep(1500);
    await shot('three-battle');
    await evaluate('(() => { const b = window.__app.scene.battle; b.enemies.forEach(e => { e.hp = 0; e.ko = true; }); return true; })()');
    for (let i = 0; i < 20 && await sceneIs('battle'); i++) await sleep(200);
    for (let i = 0; i < 10 && !(await sceneIs('field')); i++) { await key('KeyJ'); await sleep(300); }
    await skipTalk();

    // ----- 4 章: ともいし → 石の川駅から 電車 → 海辺の 町 → ライバル探検隊 → 浦の島重蔵 (2026-10-29) -----
    await evaluate('window.__app.g.story = "clear3"; window.__app.g.time = 1; true');
    await at(8, 25, 'up');
    await key('KeyJ');
    await skipTalk();
    check(await evaluate('window.__app.g.story === "umi"'), '3 章 クリアの あと ともいしと 話すと 4 章が 始まる');
    await at(5, 41, 'up');
    await key('KeyJ');
    await skipTalk();
    await sleep(200);
    await shot('umi-arrive');
    check(await evaluate('window.__app.g.story === "umibe" && window.__app.g.pos.y > 120 * 16'), '石の川駅から 電車で 海辺の 町へ (ライバル探検隊に 出会う)');
    await at(39, 128, 'up');
    await key('KeyJ');
    await skipTalk();
    await sleep(300);
    check(await evaluate('window.__app.scene.name === "battle" && window.__app.scene.battle.kind === "rival" && window.__app.scene.battle.enemies.length === 3'), 'どうくつの 通路で ライバル探検隊と 3 体の バトル');
    await key('KeyJ');
    await sleep(1200);
    await shot('umi-rival');
    await winNow();
    await skipTalk();
    check(await evaluate('window.__app.g.flags.rival4 === true && window.__app.g.story === "umibe"'), 'ライバル探検隊に 勝つと 通路を ゆずる');
    await at(43, 123, 'up');
    await key('KeyJ');
    await skipTalk();
    await sleep(300);
    check(await evaluate('window.__app.scene.name === "battle" && window.__app.scene.battle.enemies[0].id === "urashima4"'), 'どうくつの 奥で 黒い 紋の 浦の島重蔵と バトル');
    await key('KeyJ');
    await sleep(1500);
    await shot('umi-boss');
    await winNow();
    await skipTalk(30);
    await shot('umi-clear');
    check(await evaluate('window.__app.g.story === "clear4" && window.__app.g.medals.some(m => m.id === "urashima")'), '浦の島重蔵を たおすと 4 章 クリア (なかまに なる)');
    await at(5, 125, 'up');
    await key('KeyJ');
    await skipTalk();
    check(await evaluate('window.__app.g.pos.y < 60 * 16'), '海辺駅から 電車で 石の川に もどる');

    // ----- スマホ (縦持ち) -----
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.reload');
    await sleep(1200);
    await evaluate('document.body.classList.remove("nopad"); window.dispatchEvent(new Event("resize")); true');
    await sleep(200);
    const pad = await evaluate('(() => { const r = document.getElementById("pad").getBoundingClientRect(); const s = document.getElementById("bottom").getBoundingClientRect(); return { padTop: r.top, padH: r.height, bottom: s.bottom, w: s.width }; })()');
    check(pad.padH >= 200 && pad.padTop >= pad.bottom - 1 && pad.w > 250, `スマホで 2 画面の 下に ボタンが 出る (${JSON.stringify(pad)})`);
    await shot('phone-title');
    // 画面の A ボタンを 指で 押す
    const a = await evaluate('(() => { const r = document.querySelector(".f.a").getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()');
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] });
    await sleep(80);
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(400);
    check(await evaluate('Boolean(window.__app.g)'), 'スマホの A ボタンで 決定できる');
    await skipTalk();
    await shot('phone-field');
    // 6 体 そろえて ボス戦 (味方の うしろ姿を 見る)
    await evaluate('(() => { const g = window.__app.g; ["kozarappa", "ishikoron", "haribaby", "kogame", "mizukirin"].forEach((id, i) => { g.medals.push({ uid: "t" + i, id, lv: 5, exp: 0 }); g.watch[i + 1] = "t" + i; }); return true; })()');
    // にげる: ふつうの バトルは にげられる (お金は へらない)・ボスからは にげられない
    await evaluate('(() => { const a = window.__app; window.__money = a.g.money; a.startBattle({ enemies: [{ id: "saikoron", lv: 3 }], kind: "wild", place: "kawara" }); return true; })()');
    await sleep(100);
    await key('KeyD');
    await key('KeyS');
    await key('KeyJ');
    for (let i = 0; i < 20 && await sceneIs('battle'); i++) await sleep(150);
    check(await sceneIs('field') && await evaluate('window.__app.g.money === window.__money'), '「にげる」で バトルから にげられる (お金は へらない)');
    await skipTalk();
    await evaluate('(() => { const a = window.__app; a.startBattle({ enemies: [{ id: "nushi", lv: 8 }], kind: "boss", place: "bridge" }); return true; })()');
    await sleep(100);
    await key('KeyD');
    await key('KeyS');
    await key('KeyJ');
    await sleep(200);
    await shot('boss-noflee');
    check(await sceneIs('battle') && await evaluate('window.__app.scene.battle.waiting'), 'ボスからは にげられない');
    await key('KeyW');
    await key('KeyA');
    await key('KeyJ');
    await sleep(1500);
    await shot('phone-battle');
    // 動きを 見るための 連写 (--shots の ときだけ)
    for (let i = 0; SHOTS && i < 8; i++) { await shot('phone-motion'); await sleep(90); }
    await evaluate('(() => { const b = window.__app.scene.battle; b.bossTimer = 9.6; return true; })()');
    await sleep(500);
    await shot('phone-telegraph');
} catch (e) {
    errors.push(String(e && e.stack || e));
} finally {
    for (const e of errors) results.push(`✘ エラー: ${e}`);
    console.log(results.join('\n'));
    const ok = results.every(r => r.startsWith('✔'));
    console.log(ok ? `ブラウザのテスト: ${results.length} 個 成功` : 'ブラウザのテスト: 失敗あり');
    try { ws?.close(); } catch (e) { /* 閉じている */ }
    chrome.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch (e) { /* Chrome が まだ つかんでいる */ }
    process.exit(ok ? 0 : 1);
}
