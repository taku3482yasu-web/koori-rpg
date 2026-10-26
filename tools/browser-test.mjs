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
const KEYCODES = { Enter: 13, KeyC: 67, KeyX: 88, KeyQ: 81, KeyE: 69, KeyY: 89, ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Digit1: 49, KeyZ: 90, Tab: 9 };
async function key(code, hold = 80) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: code, windowsVirtualKeyCode: KEYCODES[code] });
    await sleep(hold);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: code, windowsVirtualKeyCode: KEYCODES[code] });
    await sleep(120);
}
// 会話を 最後まで 進める
async function skipTalk(max = 20) {
    for (let i = 0; i < max && await evaluate('window.__app.talk.isActive()'); i++) { await key('Enter'); await key('Enter'); }
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

    // ----- タイトル → はじめから -----
    await shot('title');
    check(await evaluate('Boolean(window.__app && window.__app.scene)'), 'タイトルが 出る');
    await key('Enter');
    await sleep(300);
    check(await evaluate('window.__app.g && window.__app.g.story === "intro"'), 'はじめから で 始まる');
    await shot('intro-talk');
    await skipTalk();

    // ----- 歩く -----
    const before = await evaluate('window.__app.g.pos.x');
    await key('ArrowRight', 500);
    check(await evaluate(`window.__app.g.pos.x > ${before}`), '十字キーで 歩く');
    await shot('field');

    // ----- 神社で ウォッチを もらう -----
    await evaluate('(() => { const g = window.__app.g; g.pos.x = 11 * 16 + 8; g.pos.y = 6 * 16 + 12; return true; })()');
    await key('ArrowLeft', 300);
    await sleep(200);
    check(await evaluate('window.__app.talk.isActive()'), '神社に 入ると ふるカワと 会話');
    await shot('shrine-talk');
    await skipTalk();
    check(await evaluate('window.__app.g.story === "friends" && window.__app.g.medals.length === 1'), 'ウォッチと ダイチョウエンキンの メダルを もらう');

    // ----- レンズで さがす (川原の石ころの 上に こおりくんを 立たせて、レンズを まんなかの まま 待つ) -----
    await evaluate('(() => { const g = window.__app.g; g.pos.x = 28 * 16 + 8; g.pos.y = 11 * 16 + 14; return true; })()');
    await key('KeyC');
    await shot('lens');
    check(await evaluate('Boolean(window.__app.field.debug.lens())'), 'Y (C キー) で レンズが 出る');
    // レンズを 場所に 合わせる
    await evaluate(`(() => { const f = window.__app.field; const l = f.debug.lens(); l.x = 28 * 16 + 8 - f.debug.cam.x; l.y = 11 * 16 + 8 - f.debug.cam.y; return true; })()`);
    await sleep(1600);
    check(await sceneIs('battle'), 'レンズを 合わせて 待つと バトルが 始まる');
    await sleep(1500);
    await shot('battle');

    // ----- バトル: 輪を 回す・必殺技・道具 -----
    await evaluate('(() => { const b = window.__app.scene.battle; b.enemies.forEach(e => { e.s.atk = 1; e.s.mag = 1; }); return true; })()');
    await evaluate('window.__app.g.items.onigiri = 3');
    await key('KeyE');
    check(await evaluate('window.__app.scene.battle.rot === 1'), 'R (E キー) で 輪が 回る');
    await sleep(500);
    await key('KeyQ');
    await evaluate('(() => { const b = window.__app.scene.battle; b.front()[0].gauge = 100; return true; })()');
    await key('Digit1');
    check(await evaluate('window.__app.scene.battle.paused'), '必殺技で れんだの ミニゲーム');
    await shot('minigame');
    for (let i = 0; i < 16; i++) await key('Enter', 30);
    await sleep(3200);
    check(await evaluate('!window.__app.scene.battle || window.__app.scene.battle.events !== undefined'), 'ミニゲームが 終わる');
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
    await clickBottom(42, 17);   // ウォッチの タブ
    await clickBottom(57, 58);   // 1 つ目の 場所
    await shot('menu-pick');
    await key('KeyX');
    await key('Tab');
    check(await sceneIs('field'), 'メニューを 閉じる');

    // ----- セーブして 開きなおす → つづきから -----
    await evaluate('window.__app.save(), true');
    await send('Page.reload');
    await sleep(1200);
    await key('Enter');
    await sleep(300);
    check(await evaluate('window.__app.g && window.__app.g.story === "friends" && window.__app.g.medals.length >= 1'), 'つづきから で 前の 続き');

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
    await evaluate('(() => { const a = window.__app; a.startBattle({ enemies: [{ id: "nushi", lv: 8 }], kind: "boss", place: "bridge" }); return true; })()');
    await sleep(1500);
    await shot('phone-battle');
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
