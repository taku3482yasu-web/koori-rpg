// =====================================================================
// 場所ごとの 背景 (上画面 400×240)。バトルと ストーリーの ムービーで つかう (2026-11-02 に battle-view.js から 分けた)
// =====================================================================
import { text } from '../core/draw.js';

export const HORIZON = 70;
const RIVER = ['kawara', 'kawaraN', 'kawaraS', 'hashiue', 'hashishita', 'kawakami', 'bridge'];

// 夜の 学校 (2 章): くらい かべと 窓、木の ゆか
function drawSchoolBackground(ctx, t) {
    ctx.fillStyle = '#2a2438';
    ctx.fillRect(0, 0, 400, HORIZON);
    for (let i = 0; i < 4; i++) {
        const x = 30 + i * 96;
        ctx.fillStyle = '#141a3a';
        ctx.fillRect(x, 14, 56, 40);
        ctx.fillStyle = '#6a5a7a';
        ctx.fillRect(x + 27, 14, 2, 40);
        ctx.fillRect(x, 33, 56, 2);
    }
    ctx.fillStyle = '#fff6c8';
    ctx.beginPath();
    ctx.arc(76, 26, 6, 0, Math.PI * 2);
    ctx.fill();
    const gg = ctx.createLinearGradient(0, HORIZON, 0, 240);
    gg.addColorStop(0, '#6a4a2a');
    gg.addColorStop(1, '#b08a5a');
    ctx.fillStyle = gg;
    ctx.fillRect(0, HORIZON, 400, 240 - HORIZON);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, HORIZON, 400, 4);
    ctx.strokeStyle = 'rgba(60, 30, 10, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -6; i <= 6; i++) { ctx.moveTo(200 + i * 14, HORIZON); ctx.lineTo(200 + i * 90, 240); }
    ctx.stroke();
}

// 浦の島の海岸どうくつの 中 (4 章): くらい 岩の かべと しおだまり
function drawCaveBackground(ctx, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, HORIZON);
    grad.addColorStop(0, '#141820');
    grad.addColorStop(1, '#2a3440');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, HORIZON);
    // 岩の でこぼこと つらら石
    ctx.fillStyle = '#3a4654';
    for (let i = 0; i < 9; i++) ctx.fillRect(i * 46 - 8, HORIZON - 18 - (i % 3) * 9, 40, 30);
    ctx.fillStyle = '#222a34';
    for (let i = 0; i < 12; i++) { const x = i * 35 + 6; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 8, 0); ctx.lineTo(x + 4, 10 + (i % 4) * 6); ctx.fill(); }
    const gg = ctx.createLinearGradient(0, HORIZON, 0, 240);
    gg.addColorStop(0, '#3a4048');
    gg.addColorStop(1, '#6a7078');
    ctx.fillStyle = gg;
    ctx.fillRect(0, HORIZON, 400, 240 - HORIZON);
    // しおだまり (きらきら)
    ctx.fillStyle = 'rgba(60, 140, 200, 0.55)';
    ctx.beginPath(); ctx.ellipse(70, 200, 50, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(340, 170, 40, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 4; i++) ctx.fillRect(40 + i * 20 + Math.sin(t * 2 + i) * 4, 198, 6, 1);
}


// ----- ストーリーの ムービー用の 場所 (2026-11-02) -----
const skyOf = time => (time === 3 ? ['#141a3a', '#2a2a5a'] : time === 2 ? ['#f08a4a', '#f8c070'] : ['#7ac8f8', '#c8ecff']);
function skyAndGround(ctx, sky, ground) {
    const g1 = ctx.createLinearGradient(0, 0, 0, HORIZON);
    g1.addColorStop(0, sky[0]); g1.addColorStop(1, sky[1]);
    ctx.fillStyle = g1; ctx.fillRect(0, 0, 400, HORIZON);
    const g2 = ctx.createLinearGradient(0, HORIZON, 0, 240);
    g2.addColorStop(0, ground[0]); g2.addColorStop(1, ground[1]);
    ctx.fillStyle = g2; ctx.fillRect(0, HORIZON, 400, 240 - HORIZON);
}
const rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
// 石の川タウン: 家の 屋根と 電柱
function drawMachi(ctx, t, time) {
    skyAndGround(ctx, skyOf(time), ['#8a9a6a', '#c8d0a0']);
    [[10, '#c84a3a'], [110, '#3a6ab0'], [250, '#5a9a4a'], [330, '#c89a3a']].forEach(([x, roof]) => {
        rect(ctx, x, HORIZON - 34, 70, 34, '#f0e6d0');
        ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - 6, HORIZON - 32); ctx.lineTo(x + 35, HORIZON - 56); ctx.lineTo(x + 76, HORIZON - 32); ctx.fill();
        rect(ctx, x + 12, HORIZON - 24, 14, 12, '#8ac8f0'); rect(ctx, x + 44, HORIZON - 26, 14, 26, '#8a6a4a');
    });
    rect(ctx, 214, 6, 4, HORIZON, '#6a5a4a'); rect(ctx, 200, 14, 32, 3, '#6a5a4a');
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 22); ctx.quadraticCurveTo(110, 32, 216, 16); ctx.quadraticCurveTo(320, 30, 400, 20); ctx.stroke();
    rect(ctx, 0, HORIZON + 30, 400, 34, '#a8a8a0'); rect(ctx, 0, HORIZON + 46, 400, 2, '#f0f0e8');
}
// 商店街: お店の ならびと のれん・アーケード
function drawStreet(ctx, t, time) {
    skyAndGround(ctx, skyOf(time), ['#b8a890', '#e0d4bc']);
    const shops = [['#f8e8c0', '#3a9a4a', '八百屋'], ['#f8e0d0', '#c83a3a', 'お面'], ['#e8e8f0', '#5a5aa8', 'ゲーセン'], ['#f0e0c0', '#c8883a', 'だがし']];
    shops.forEach(([wall, roof, name], i) => {
        const x = 8 + i * 98;
        rect(ctx, x, HORIZON - 46, 90, 46, wall);
        rect(ctx, x, HORIZON - 50, 90, 8, roof);
        for (let k = 0; k < 5; k++) rect(ctx, x + 4 + k * 17, HORIZON - 40, 14, 14, k % 2 ? roof : '#ffffff');
        text(ctx, name, x + 45, HORIZON - 8, { size: 10, align: 'center', bold: true, color: '#3a2a1a' });
    });
    rect(ctx, 0, 0, 400, 6, '#8a8a90');
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#ff6a6a' : '#ffe85a'; ctx.beginPath(); ctx.arc(25 + i * 50, 14, 5, 0, Math.PI * 2); ctx.fill(); }
}
// 駅の ホーム: 屋根・柱・線路と 電車
function drawStation(ctx, t, time, name = '') {
    skyAndGround(ctx, skyOf(time), ['#9a9a9a', '#c8c8c0']);
    rect(ctx, 0, HORIZON - 30, 400, 22, '#3a8ad0');                       // 電車
    for (let i = 0; i < 8; i++) rect(ctx, 10 + i * 50, HORIZON - 26, 30, 10, '#bfe8ff');
    rect(ctx, 0, HORIZON - 12, 400, 4, '#f0f0f0');
    rect(ctx, 0, HORIZON - 8, 400, 8, '#5a4a3a');
    rect(ctx, 0, 0, 400, 12, '#6a6a72');                                 // 屋根
    for (let i = 0; i < 5; i++) rect(ctx, 30 + i * 86, 12, 5, HORIZON - 42, '#8a8a92');
    rect(ctx, 0, HORIZON + 4, 400, 6, '#ffe85a');                         // 点字ブロック
    if (name) { rect(ctx, 150, 18, 100, 18, '#ffffff'); text(ctx, name, 200, 31, { size: 10, align: 'center', bold: true, color: '#2a2a2a' }); }
}
// こおりくんの 家の 中: たたみ と ふすま
function drawHome(ctx, t, time) {
    rect(ctx, 0, 0, 400, HORIZON, '#e8dcc0');
    for (let i = 0; i < 4; i++) { rect(ctx, 20 + i * 96, 8, 88, HORIZON - 10, '#f6f0e0'); rect(ctx, 20 + i * 96 + 42, 8, 2, HORIZON - 10, '#c8b890'); }
    rect(ctx, 0, HORIZON - 4, 400, 4, '#8a6a4a');
    const g2 = ctx.createLinearGradient(0, HORIZON, 0, 240);
    g2.addColorStop(0, '#b8c070'); g2.addColorStop(1, '#d8e090');
    ctx.fillStyle = g2; ctx.fillRect(0, HORIZON, 400, 240 - HORIZON);
    ctx.strokeStyle = 'rgba(80, 90, 30, 0.35)'; ctx.beginPath();
    for (let k = 1; k < 4; k++) { const y = HORIZON + k * 44; ctx.moveTo(0, y); ctx.lineTo(400, y); }
    ctx.moveTo(200, HORIZON); ctx.lineTo(200, 240); ctx.stroke();
    if (time >= 2) { ctx.fillStyle = 'rgba(20, 20, 60, 0.35)'; ctx.fillRect(0, 0, 400, 240); }
}
// ダム (3 章): 山の 奥に ダムの かべ、手前は こおった 湖の 底
function drawDamBack(ctx, t, time) {
    skyAndGround(ctx, skyOf(time), ['#9ac0d8', '#d8eef8']);
    ctx.fillStyle = '#6a7a8a';
    [[0, 30, 90], [70, 40, 70], [300, 24, 100]].forEach(([x, y, w]) => ctx.fillRect(x, y, w, HORIZON - y));
    rect(ctx, 90, HORIZON - 30, 220, 30, '#a8acb4'); rect(ctx, 90, HORIZON - 30, 220, 4, '#d0d4da');
    for (let i = 0; i < 10; i++) rect(ctx, 96 + i * 22, HORIZON - 24, 1, 22, '#8a9098');
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 6; i++) ctx.fillRect(20 + i * 70, HORIZON + 20 + (i % 3) * 40, 30, 2);
}

export function drawBackdrop(ctx, place, t, time = 0) {
    if (place === 'machi') { drawMachi(ctx, t, time); return; }
    if (place === 'street') { drawStreet(ctx, t, time); return; }
    if (place === 'station' || place.startsWith('station:')) { drawStation(ctx, t, time, place.split(':')[1] || ''); return; }
    if (place === 'home') { drawHome(ctx, t, time); return; }
    if (place === 'damBack') { drawDamBack(ctx, t, time); return; }
    if (place === 'school') { drawSchoolBackground(ctx, t); return; }
    if (place === 'cave') { drawCaveBackground(ctx, t); return; }
    const river = RIVER.includes(place);
    const sky = time === 3 ? ['#141a3a', '#2a2a5a'] : time === 2 ? ['#f08a4a', '#f8c070'] : ['#7ac8f8', '#c8ecff'];
    const grad = ctx.createLinearGradient(0, 0, 0, HORIZON);
    grad.addColorStop(0, sky[0]);
    grad.addColorStop(1, sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, HORIZON);
    const yama = place === 'yama' || place === 'dam';
    if (yama) {
        // 遠くの 山 (てっぺんに 雪)。3 章
        for (const [x, w, h] of [[-20, 160, 62], [90, 200, 80], [250, 190, 66], [340, 140, 50]]) {
            const top = HORIZON - h;
            ctx.fillStyle = 'rgba(50, 80, 110, 0.55)';
            ctx.beginPath(); ctx.moveTo(x, HORIZON); ctx.lineTo(x + w / 2, top); ctx.lineTo(x + w, HORIZON); ctx.fill();
            ctx.fillStyle = 'rgba(240, 248, 255, 0.85)';
            ctx.beginPath(); ctx.moveTo(x + w / 2 - w * 0.09, top + h * 0.18); ctx.lineTo(x + w / 2, top); ctx.lineTo(x + w / 2 + w * 0.09, top + h * 0.18); ctx.fill();
        }
    } else if (place === 'shrine') {
        // 12 章 神社 (黒い 空): 赤黒い 空と 鳥居
        ctx.fillStyle = '#2a0a12'; ctx.fillRect(0, 0, 400, HORIZON);
        for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(80, 10, 30, ${0.3 + 0.1 * Math.sin(t + i)})`; ctx.beginPath(); ctx.ellipse((i * 79 + t * 8) % 480 - 40, 20 + (i % 3) * 18, 60, 12, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#c03a2a'; ctx.fillRect(140, 30, 120, 10); ctx.fillRect(150, 46, 100, 6); ctx.fillRect(160, 40, 8, HORIZON - 40); ctx.fillRect(232, 40, 8, HORIZON - 40);
    } else if (place === 'kurai') {
        // 13 章 喰らいの 城の 最上階: 嵐の 空と つぎはぎの 柱
        ctx.fillStyle = '#1a0a24'; ctx.fillRect(0, 0, 400, HORIZON);
        for (let i = 0; i < 7; i++) { ctx.fillStyle = `rgba(90, 30, 120, ${0.3 + 0.1 * Math.sin(t * 1.5 + i)})`; ctx.beginPath(); ctx.ellipse((i * 71 + t * 22) % 480 - 40, 16 + (i % 3) * 16, 64, 12, 0, 0, Math.PI * 2); ctx.fill(); }
        if (Math.floor(t * 3) % 11 === 0) { ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'; ctx.fillRect(0, 0, 400, HORIZON); }
        [[20, '#3a2a4a'], [96, '#4a2a3a'], [290, '#2a3a4a'], [366, '#3a2a4a']].forEach(([x, c]) => { ctx.fillStyle = c; ctx.fillRect(x, 20, 18, HORIZON - 20); ctx.fillStyle = '#5a3a6a'; ctx.fillRect(x, 44, 18, 4); ctx.fillRect(x, 70, 18, 4); });
    } else if (place === 'tsubo') {
        // 11 章 ASOの壺の底: くらい どうくつと 下から 光る 溶岩
        ctx.fillStyle = '#1a0c0a'; ctx.fillRect(0, 0, 400, HORIZON);
        ctx.fillStyle = '#2a1410';
        [[0, 50], [70, 30], [150, 56], [250, 26], [330, 44]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 40, y); ctx.lineTo(x + 80, 0); ctx.fill(); });
        const lg = ctx.createLinearGradient(0, HORIZON - 30, 0, HORIZON);
        lg.addColorStop(0, 'rgba(255, 90, 20, 0)'); lg.addColorStop(1, `rgba(255, 90, 20, ${0.45 + 0.1 * Math.sin(t * 2)})`);
        ctx.fillStyle = lg; ctx.fillRect(0, HORIZON - 30, 400, 30);
    } else if (place === 'town') {
        // 10 章 黒い 霧の 石の川タウン: むらさきの 空と 家の かげ
        ctx.fillStyle = '#2a1a3a'; ctx.fillRect(0, 0, 400, HORIZON);
        ctx.fillStyle = '#1a1028';
        [[10, 40, 60], [90, 30, 50], [170, 46, 70], [260, 34, 56], [330, 44, 64]].forEach(([x, y, w]) => { ctx.fillRect(x, y, w, HORIZON - y); ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + w / 2, y - 16); ctx.lineTo(x + w + 4, y); ctx.fill(); });
        for (let i = 0; i < 8; i++) { ctx.fillStyle = `rgba(140, 60, 180, ${0.15 + 0.08 * Math.sin(t + i)})`; ctx.beginPath(); ctx.ellipse((i * 67 + t * 12) % 460 - 30, 30 + (i % 3) * 22, 50, 14, 0, 0, Math.PI * 2); ctx.fill(); }
    } else if (place === 'kinniku' || place === 'hyouga') {
        // 9 章 筋肉の山 / 雪どけの 氷河: 青空と 雪の のこる 山
        ctx.fillStyle = place === 'hyouga' ? '#9ad0f0' : '#7ab8e8'; ctx.fillRect(0, 0, 400, HORIZON);
        ctx.fillStyle = '#7a6a5a';
        ctx.beginPath(); ctx.moveTo(-20, HORIZON); ctx.lineTo(80, 30); ctx.lineTo(180, HORIZON); ctx.lineTo(240, 50); ctx.lineTo(330, 20); ctx.lineTo(430, HORIZON); ctx.fill();
        ctx.fillStyle = '#f4f8ff';
        [[80, 30], [240, 50], [330, 20]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x - 22, y + 22); ctx.lineTo(x, y); ctx.lineTo(x + 22, y + 22); ctx.fill(); });
        if (place === 'hyouga') { ctx.fillStyle = '#ffb0c8'; for (let i = 0; i < 14; i++) ctx.fillRect((i * 61 + t * 20) % 400, (i * 29 + t * 14) % HORIZON, 3, 2); }
    } else if (place === 'yuen') {
        // 14 章の 遊園地 (夜): かんらん車の かげと 光る 電球
        ctx.fillStyle = '#141032'; ctx.fillRect(0, 0, 400, HORIZON);
        ctx.strokeStyle = '#4a3a8a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(320, 70, 54, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 0.2; ctx.beginPath(); ctx.moveTo(320, 70); ctx.lineTo(320 + Math.cos(a) * 54, 70 + Math.sin(a) * 54); ctx.stroke(); }
        for (let i = 0; i < 20; i++) { ctx.fillStyle = ['#ff6a8a', '#ffe85a', '#6ae0ff'][i % 3]; ctx.fillRect(i * 21 + 4, 24 + Math.sin(i) * 6, 3, 3); }
    } else if (place === 'shiro') {
        // 金色のSE城 (8 章): 金の かべと 赤い 柱、ちょうちん
        ctx.fillStyle = '#a07818'; ctx.fillRect(0, 0, 400, HORIZON);
        ctx.fillStyle = '#e0b840'; ctx.fillRect(0, HORIZON - 40, 400, 40);
        ctx.fillStyle = '#fff0a0'; ctx.fillRect(0, HORIZON - 40, 400, 2);
        ctx.fillStyle = '#a02020';
        for (let i = 0; i < 6; i++) ctx.fillRect(20 + i * 72, 0, 12, HORIZON);
        ctx.fillStyle = '#ff6a3a';
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(62 + i * 72, 26, 9, 12, 0, 0, Math.PI * 2); ctx.fill(); }
    } else if (place === 'moon') {
        // 月の迷宮 (7 章): 夜空と 星、むらさきの 石の かべ
        ctx.fillStyle = '#0c0a24'; ctx.fillRect(0, 0, 400, HORIZON);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 24; i++) ctx.fillRect((i * 97) % 400, (i * 37) % (HORIZON - 10), 1, 1);
        ctx.fillStyle = '#2a2050';
        for (let i = 0; i < 7; i++) ctx.fillRect(i * 64 - 10, HORIZON - 24 - (i % 2) * 10, 44, 34);
    } else if (place === 'yashiki') {
        // 屋敷の 中 (6 章): 板べいと しょうじ
        ctx.fillStyle = '#4a3624'; ctx.fillRect(0, 0, 400, HORIZON);
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = '#e8e0c8'; ctx.fillRect(14 + i * 66, 12, 52, HORIZON - 18);
            ctx.fillStyle = '#6a5038';
            for (let k = 1; k < 3; k++) ctx.fillRect(14 + i * 66 + k * 17, 12, 2, HORIZON - 18);
            for (let k = 1; k < 3; k++) ctx.fillRect(14 + i * 66, 12 + k * 17, 52, 2);
        }
    } else if (place === 'tera') {
        // 遠くの 五重塔と 竹 (5 章 ネット寺)
        ctx.fillStyle = 'rgba(40, 30, 50, 0.45)';
        for (let i = 0; i < 5; i++) ctx.fillRect(300 + i * 2, HORIZON - 14 - i * 12, 40 - i * 4, 4);
        ctx.fillRect(318, HORIZON - 70, 4, 70);
        ctx.fillStyle = 'rgba(40, 90, 50, 0.4)';
        for (let i = 0; i < 9; i++) ctx.fillRect(10 + i * 26, HORIZON - 50 - (i % 3) * 8, 4, 60);
    } else if (place === 'umi') {
        // 水平線の 海と きらきら (4 章)
        ctx.fillStyle = '#2a7ac0';
        ctx.fillRect(0, HORIZON - 22, 400, 22);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        for (let i = 0; i < 7; i++) ctx.fillRect((i * 67 + t * 12) % 420 - 10, HORIZON - 18 + (i % 3) * 6, 10, 1);
    } else {
        // 遠くの 町
        ctx.fillStyle = 'rgba(40, 60, 90, 0.25)';
        [[20, 34, 40], [70, 46, 30], [300, 28, 50], [360, 44, 30]].forEach(([x, y, w]) => ctx.fillRect(x, y, w, HORIZON - y));
    }
    // 地面 (手前ほど 明るく)。ダムは こおった 湖の 底・海辺は 砂浜
    const ground = river ? ['#2a6aa8', '#4aa0e0'] : place === 'park' ? ['#c8b880', '#f0e0a8'] : place === 'dam' ? ['#7aa8c0', '#c8e6f2'] : place === 'umi' ? ['#d0b878', '#f0e0a8'] : place === 'tera' ? ['#9a9a92', '#c8c8c0'] : place === 'yashiki' ? ['#a8a060', '#d8d090'] : place === 'moon' ? ['#3a3070', '#6a60a8'] : place === 'shiro' ? ['#8a1828', '#c03040'] : place === 'yuen' ? ['#5a5a6a', '#8a8a9a'] : place === 'kinniku' ? ['#8a7a5a', '#b8a888'] : place === 'town' ? ['#3a3048', '#5a4a6a'] : place === 'tsubo' ? ['#4a1a10', '#7a3a20'] : place === 'kurai' ? ['#2a1a34', '#4a3058'] : place === 'shrine' ? ['#8a8070', '#b0a890'] : place === 'hyouga' ? ['#c8e6f2', '#f0faff'] : ['#4a9a3a', '#7ad05a'];
    const gg = ctx.createLinearGradient(0, HORIZON, 0, 240);
    gg.addColorStop(0, ground[0]);
    gg.addColorStop(1, ground[1]);
    ctx.fillStyle = gg;
    ctx.fillRect(0, HORIZON, 400, 240 - HORIZON);
    ctx.fillStyle = river ? '#c8c0b0' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, HORIZON, 400, 4);
    // 奥行きの 線 (まんなかの 奥に 集まる)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -6; i <= 6; i++) { ctx.moveTo(200 + i * 12, HORIZON); ctx.lineTo(200 + i * 80, 240); }
    for (let k = 1; k <= 5; k++) { const y = HORIZON + (240 - HORIZON) * Math.pow(k / 5, 1.8); ctx.moveTo(0, y); ctx.lineTo(400, y); }
    ctx.stroke();
    if (river) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 8; i++) ctx.fillRect((i * 61 + t * 20) % 420 - 20, HORIZON + 20 + (i * 17) % 140, 18, 2);
    }
}
