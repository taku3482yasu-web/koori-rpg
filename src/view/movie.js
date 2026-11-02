// =====================================================================
// ストーリーの ムービー (2026-11-02 ユーザー指定: ストーリーの ときは 専用の ムービーを 流す。キャラが 動き、
// 専用の モーション・アクション・エフェクトで 豪華に。町の 中で 話すと 場所が 合わない ことが あった)
// ---------------------------------------------------------------------
// 会話 (talk.js) の「ムービー モード」で 使う 舞台。上画面 ぜんぶに 場所の 背景 (backdrop.js) を 描き、
// その 上に キャラを 立たせて 動かす。会話の 行は ふつうの { who, art, text }、あいだに 動きの 行 { do: '…' } を はさめる。
//
//   セリフの 行: 話す キャラが まだ 舞台に いなければ 出てくる (右から 歩いて くる)。話す たびに ぴょんと はねて、
//                セリフに あわせて ！・？・汗・怒り などの マークが 出る
//   動きの 行 (do):
//     enter { id, art, from: 'right'|'left'|'top'|'fade'|'smoke'|'ice'|'dark', x, scale, flip }   出てくる
//     exit  { id, to: 'right'|'left'|'up'|'fade'|'smoke' }   いなくなる
//     move  { id, x, time }          歩く               jump  { id, times }   はねる
//     turn  { id }                   向きを かえる       pose  { id, pose: 'shiver'|'float'|'spin'|'bow'|'run'|'' }
//     shake { power, time }          画面が ゆれる       fx    { kind, id | x,y }  エフェクト (FX の 名前)
//     weather { kind: 'cold'|'snow'|'dark'|'night'|'' }   ずっと つづく 空気 (冷気・雪・黒い 霧・夜)
//     place { place }                場所を かえる (暗転)  caption { text }   大きな 字幕
//     fade  { to: 'black'|'clear', time }                wait  { time }
//   wait: false を つけると 待たずに 次へ 進む
// =====================================================================
import { ART } from '../art/index.js';
import { drawArt, artFit, text } from '../core/draw.js';
import { drawBackdrop } from './backdrop.js';
import { sfx } from '../core/sound.js';

const GROUND = 150;                                  // 足もとの 高さ
const LEFT = [118, 70, 164, 30];                      // こおりくんたち (左・右向き)
const RIGHT = [300, 350, 252, 206, 380];              // 相手 (右・左向き)
const PARTY = ['koori', 'furukawa', 'onioni', 'tomoishi'];
const big = art => ART[art] && ART[art].w > 24;      // もとが 大きい 絵 (ボスなど) は 大きく 立たせる

// セリフから マークを えらぶ
function emoteOf(t) {
    if (/ちぇっ|ぐぬぬ|ゆるさ|だまれ|ふざけ|くそ|なんだと/.test(t)) return 'anger';
    if (/ありがと|よかった|うれし|すき|大好き/.test(t)) return 'heart';
    if (/ほっほ|くく|ふふ|あはは|わはは|ガハハ|♪/.test(t)) return 'note';
    if (/^(……|…)/.test(t) || /(……|…)$/.test(t)) return 'dots';
    if (/[？?]/.test(t)) return 'question';
    if (/こわ|あせ|まずい|やばい|うそ|ひぃ|えっ/.test(t)) return 'sweat';
    if (/！/.test(t)) return 'exclaim';
    return null;
}

export function createStage({ place = 'kawara', time = 0, cast = ['koori', 'furukawa'], weather = '' } = {}) {
    const actors = [];
    const fx = [];
    let t = 0, shakeT = 0, shakePow = 0, fadeA = 0, fadeTo = 0, fadeSpeed = 2, caption = null;
    let curPlace = place, sky = weather, pendingPlace = null;
    let busyUntil = 0;
    let speaking = null;

    const find = id => actors.find(a => a.id === id);
    const freeSlot = side => {
        const xs = side === 'left' ? LEFT : RIGHT;
        return xs.find(x => !actors.some(a => !a.leaving && Math.abs(a.tx - x) < 20)) ?? xs[xs.length - 1];
    };
    function add({ id, art = id, x = null, side = null, scale = null, flip = null, from = null }) {
        const s = side || (PARTY.includes(id) ? 'left' : 'right');
        const tx = x ?? freeSlot(s);
        const a = {
            id, art, x: tx, y: GROUND, tx, scale: scale ?? (big(art) ? 3.4 : 3), flip: flip ?? (s === 'right'),
            alpha: 1, hop: -9, hops: 0, pose: '', speed: 160, leaving: null, dy: 0, born: t
        };
        if (from === 'right') a.x = 440;
        else if (from === 'left') a.x = -40;
        else if (from === 'top') a.dy = -240;
        else if (from === 'fade' || from === 'smoke' || from === 'ice' || from === 'dark') { a.alpha = 0; a.fadeIn = true; }
        if (from === 'smoke') burst('smoke', a.tx, GROUND - 20);
        if (from === 'ice') { burst('ice', a.tx, GROUND - 24); sfx('lens'); }
        if (from === 'dark') burst('dark', a.tx, GROUND - 24);
        actors.push(a);
        return a;
    }
    cast.forEach((c, i) => (typeof c === 'string' ? add({ id: c, x: PARTY.includes(c) ? LEFT[i] ?? null : null }) : add(c)));

    // ----- エフェクト -----
    const COLORS = { smoke: '#d8d8e0', ice: '#bff0ff', dark: '#3a1040', sparkle: '#fff6a0', heart: '#ff8ab8', flash: '#ffffff', burst: '#ffd75e' };
    function burst(kind, x, y) {
        const n = kind === 'sparkle' ? 14 : 18;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + Math.random() * 0.3, v = 30 + Math.random() * 60;
            fx.push({ kind: 'p', color: COLORS[kind] || '#ffffff', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 0.9, age: 0, size: kind === 'smoke' ? 6 : 3 });
        }
    }
    function mark(kind, a) {
        fx.push({ kind: 'mark', mark: kind, actor: a, age: 0, life: 1.3 });
    }
    function effect(kind, a, x, y) {
        const px = a ? a.x : x ?? 200, py = a ? GROUND - ART[a.art].h * a.scale * artFit(ART[a.art]) : y ?? 100;
        if (['exclaim', 'question', 'sweat', 'anger', 'heart', 'note', 'dots', 'zzz'].includes(kind)) { if (a) mark(kind, a); return; }
        if (kind === 'flash') { fx.push({ kind: 'flash', age: 0, life: 0.5 }); sfx('big'); return; }
        if (kind === 'quake') { shakePow = 5; shakeT = 1.2; sfx('big'); return; }
        if (kind === 'ring') { fx.push({ kind: 'ring', x: px, y: (a ? (py + GROUND) / 2 : py), age: 0, life: 0.8, color: '#bff0ff' }); return; }
        burst(kind, px, a ? (py + GROUND) / 2 : py);
        if (kind === 'sparkle') sfx('heal');
        if (kind === 'smoke') sfx('cancel');
    }

    // ----- 動きの 行を 始める (待つ 時間を 返す) -----
    function run(step) {
        const a = step.id ? find(step.id) : null;
        let dur = 0;
        switch (step.do) {
            case 'enter': {
                if (a && !a.leaving) break;
                const n = add(step);
                dur = step.from === 'right' || step.from === 'left' ? Math.abs(n.x - n.tx) / n.speed : step.from === 'top' ? 0.6 : step.from ? 0.7 : 0;
                if (step.from === 'right' || step.from === 'left') n.walking = true;
                break;
            }
            case 'exit':
                if (!a) break;
                a.leaving = step.to || 'right';
                if (a.leaving === 'right') { a.tx = 460; a.flip = false; a.walking = true; dur = (460 - a.x) / a.speed; }
                else if (a.leaving === 'left') { a.tx = -60; a.flip = true; a.walking = true; dur = (a.x + 60) / a.speed; }
                else { dur = 0.6; if (a.leaving === 'smoke') effect('smoke', a); }
                break;
            case 'move':
                if (!a) break;
                a.tx = step.x;
                a.speed = step.time ? Math.max(20, Math.abs(step.x - a.x) / step.time) : 160;
                a.flip = step.x < a.x;
                if (step.face === 'right') a.flip = false;
                a.walking = true;
                dur = Math.abs(step.x - a.x) / a.speed;
                break;
            case 'jump':
                if (!a) break;
                a.hop = t; a.hops = (step.times || 1) - 1;
                dur = 0.35 * (step.times || 1);
                sfx('cursor');
                break;
            case 'turn': if (a) a.flip = !a.flip; break;
            case 'pose': if (a) a.pose = step.pose || ''; break;
            case 'shake': shakePow = step.power ?? 4; shakeT = step.time ?? 0.8; dur = shakeT; sfx('big'); break;
            case 'fx': effect(step.kind, a, step.x, step.y); dur = step.kind === 'flash' ? 0.3 : 0.5; break;
            case 'weather': sky = step.kind || ''; break;
            case 'place': pendingPlace = step.place; fadeTo = 1; dur = 1; break;
            case 'caption': caption = { text: step.text, sub: step.sub || '', at: t }; dur = 1.8; sfx('watch'); break;
            case 'fade': fadeTo = step.to === 'black' ? 1 : 0; fadeSpeed = 1 / (step.time ?? 0.5); dur = step.time ?? 0.5; break;
            case 'wait': dur = step.time ?? 0.5; break;
            default: break;
        }
        if (step.wait === false) dur = 0;
        busyUntil = t + dur;
    }

    // セリフの 行: 話す キャラを 出して、はねて、マーク
    function onLine(line) {
        if (!line.who || !line.art || !ART[line.art]) { speaking = null; return; }
        const id = line.art;
        let a = find(id);
        if (!a || a.leaving) {
            a = add({ id, art: id, from: PARTY.includes(id) ? 'left' : 'right' });
            a.walking = true;
        }
        speaking = a;
        a.hop = t; a.hops = 0;
        const e = emoteOf(line.text);
        if (e) mark(e, a);
    }

    // すぐ 終わらせる (A で 動きを とばす)
    function finishNow() {
        busyUntil = t;
        for (const a of actors) { a.x = a.tx; a.walking = false; a.dy = 0; if (a.fadeIn) { a.alpha = 1; a.fadeIn = false; } }
        if (pendingPlace) { curPlace = pendingPlace; pendingPlace = null; fadeTo = 0; fadeA = 0; }
        if (fadeTo === 1) fadeA = 1; else fadeA = 0;
        cleanup();
    }
    function cleanup() {
        for (let i = actors.length - 1; i >= 0; i--) {
            const a = actors[i];
            if (a.leaving && (a.alpha <= 0.02 || a.x < -50 || a.x > 450 || a.dy < -230)) actors.splice(i, 1);
        }
    }

    function update(dt) {
        t += dt;
        for (const a of actors) {
            if (a.walking) {
                const d = a.tx - a.x, st = a.speed * dt;
                if (Math.abs(d) <= st) { a.x = a.tx; a.walking = false; if (!a.leaving && !PARTY.includes(a.id)) a.flip = a.x > 200; if (!a.leaving && PARTY.includes(a.id)) a.flip = false; }
                else a.x += Math.sign(d) * st;
            }
            if (a.dy < 0 && !a.leaving) a.dy = Math.min(0, a.dy + 520 * dt);
            if (a.fadeIn) { a.alpha = Math.min(1, a.alpha + dt * 1.6); if (a.alpha >= 1) a.fadeIn = false; }
            if (a.leaving === 'fade' || a.leaving === 'smoke') a.alpha = Math.max(0, a.alpha - dt * 1.8);
            if (a.leaving === 'up') a.dy -= 420 * dt;
        }
        cleanup();
        shakeT = Math.max(0, shakeT - dt);
        if (fadeA < fadeTo) fadeA = Math.min(fadeTo, fadeA + dt * fadeSpeed);
        if (fadeA > fadeTo) fadeA = Math.max(fadeTo, fadeA - dt * fadeSpeed);
        if (pendingPlace && fadeA >= 1) { curPlace = pendingPlace; pendingPlace = null; fadeTo = 0; fadeSpeed = 2; }
        for (let i = fx.length - 1; i >= 0; i--) {
            const f = fx[i];
            f.age += dt;
            if (f.kind === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 40 * dt; f.vx *= 0.97; }
            if (f.age >= f.life) fx.splice(i, 1);
        }
    }

    // ----- 描く -----
    function drawWeather(ctx) {
        if (sky === 'cold') {
            // ダムの 底から もれだす 冷気: 地面を はう 白い もや と、こおりついた 地面
            ctx.fillStyle = 'rgba(200, 236, 255, 0.35)';
            ctx.fillRect(0, GROUND - 6, 400, 240 - GROUND + 6);
            for (let i = 0; i < 9; i++) {
                const x = (i * 57 + t * (14 + (i % 3) * 6)) % 480 - 40, y = GROUND - 10 + (i % 4) * 12 + Math.sin(t + i) * 4;
                ctx.fillStyle = `rgba(230, 248, 255, ${0.28 + 0.1 * Math.sin(t * 2 + i)})`;
                ctx.beginPath(); ctx.ellipse(x, y, 54, 12, 0, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            for (let i = 0; i < 16; i++) { const x = (i * 29) % 400, y = GROUND + 6 + (i * 13) % 70; ctx.fillRect(x, y, 6, 1); ctx.fillRect(x + 2, y - 2, 1, 5); }
        } else if (sky === 'snow') {
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 40; i++) ctx.fillRect((i * 47 + Math.sin(t + i) * 10 + t * 8) % 400, (i * 31 + t * 30) % 240, 2, 2);
        } else if (sky === 'dark') {
            ctx.fillStyle = 'rgba(30, 0, 40, 0.35)';
            ctx.fillRect(0, 0, 400, 240);
            for (let i = 0; i < 8; i++) {
                ctx.fillStyle = `rgba(20, 0, 30, ${0.25 + 0.1 * Math.sin(t * 2 + i)})`;
                ctx.beginPath(); ctx.ellipse((i * 63 + t * 10) % 460 - 30, 40 + (i % 3) * 30, 60, 18, 0, 0, Math.PI * 2); ctx.fill();
            }
        } else if (sky === 'night') {
            ctx.fillStyle = 'rgba(10, 16, 50, 0.45)';
            ctx.fillRect(0, 0, 400, 240);
        }
    }
    function drawMark(ctx, f) {
        const a = f.actor;
        if (!actors.includes(a)) return;
        const h = ART[a.art].h * a.scale * artFit(ART[a.art]);
        const x = a.x + (a.flip ? -h * 0.25 : h * 0.25), y = GROUND + a.dy - h - 8 - Math.min(1, f.age * 6) * 6;
        const k = f.age < 0.15 ? f.age / 0.15 : 1;
        ctx.globalAlpha = f.age > f.life - 0.3 ? (f.life - f.age) / 0.3 : 1;
        const M = { exclaim: ['！', '#ffe85a'], question: ['？', '#8ad0ff'], anger: ['💢', '#ff5a5a'], heart: ['♥', '#ff8ab8'], note: ['♪', '#ffd75e'], dots: ['…', '#ffffff'], sweat: ['💦', '#8ad0ff'], zzz: ['Z', '#ffffff'] }[f.mark];
        if (M) text(ctx, M[0], x, y, { size: 16 * k, align: 'center', bold: true, color: M[1] });
        ctx.globalAlpha = 1;
    }
    function drawActor(ctx, a) {
        const art = ART[a.art];
        if (!art) return;
        let y = GROUND + a.dy, x = a.x, sx = 1, sy = 1;
        const since = t - a.hop;
        if (since >= 0 && since < 0.35 * (a.hops + 1)) y -= Math.sin(Math.PI * ((since % 0.35) / 0.35)) * 12;
        if (a.walking) y -= Math.abs(Math.sin(t * 12)) * 3;
        if (a.pose === 'shiver') x += Math.sin(t * 50) * 1.5;
        if (a.pose === 'float') y -= 8 + Math.sin(t * 2.5) * 5;
        if (a.pose === 'bow') { sy = 0.86; sx = 1.08; }
        if (a.pose === 'run') y -= Math.abs(Math.sin(t * 18)) * 5;
        let flip = a.flip;
        if (a.pose === 'spin') flip = Math.floor(t * 8) % 2 === 0;
        // 影
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath(); ctx.ellipse(a.x, GROUND + 2, art.w * a.scale * artFit(art) * 0.32, 4, 0, 0, Math.PI * 2); ctx.fill();
        // 話している キャラは すこし 明るく、ほかは すこし 暗く
        const dim = speaking && speaking !== a ? 0.82 : 1;
        drawArt(ctx, art, Math.floor(t * 2), x, y, { scale: a.scale, flip, alpha: a.alpha * dim, sx, sy });
    }
    function draw(ctx) {
        ctx.save();
        if (shakeT > 0) ctx.translate((Math.random() - 0.5) * shakePow * 2, (Math.random() - 0.5) * shakePow * 2);
        drawBackdrop(ctx, curPlace, t, time);
        if (sky === 'cold') drawWeather(ctx);
        [...actors].sort((p, q) => p.scale - q.scale).forEach(a => drawActor(ctx, a));
        if (sky !== 'cold') drawWeather(ctx);
        for (const f of fx) {
            if (f.kind === 'p') {
                ctx.globalAlpha = Math.max(0, 1 - f.age / f.life);
                ctx.fillStyle = f.color;
                ctx.fillRect(f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);
                ctx.globalAlpha = 1;
            } else if (f.kind === 'mark') drawMark(ctx, f);
            else if (f.kind === 'ring') {
                ctx.strokeStyle = f.color; ctx.lineWidth = 3; ctx.globalAlpha = 1 - f.age / f.life;
                ctx.beginPath(); ctx.ellipse(f.x, f.y, 10 + f.age * 120, 4 + f.age * 40, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
        ctx.restore();
        for (const f of fx) if (f.kind === 'flash') { ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - f.age / f.life)})`; ctx.fillRect(0, 0, 400, 240); }
        // 黒い 帯 (映画の ように)
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 400, 10);
        if (caption) {
            const k = t - caption.at;
            if (k < 2.4) {
                ctx.globalAlpha = k < 0.3 ? k / 0.3 : k > 2 ? (2.4 - k) / 0.4 : 1;
                ctx.fillStyle = 'rgba(0,0,0,0.55)';
                ctx.fillRect(0, 70, 400, 56);
                text(ctx, caption.text, 200, 102, { size: 20, align: 'center', bold: true, color: '#ffe85a' });
                if (caption.sub) text(ctx, caption.sub, 200, 120, { size: 11, align: 'center', color: '#ffffff' });
                ctx.globalAlpha = 1;
            } else caption = null;
        }
        if (fadeA > 0) { ctx.fillStyle = `rgba(0,0,0,${fadeA})`; ctx.fillRect(0, 0, 400, 240); }
    }

    return { run, onLine, update, draw, finishNow, busy: () => t < busyUntil || actors.some(a => a.walking || a.fadeIn) || Boolean(pendingPlace), place: () => curPlace };
}
