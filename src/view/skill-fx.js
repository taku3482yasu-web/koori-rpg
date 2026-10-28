// =====================================================================
// わざ・術の 動き (2026-10-28 ユーザー指定: 技や 術に 特有の モーション。コオリソードは こおりくんが 剣で 切りつける など)
// ---------------------------------------------------------------------
// battle-view.js が わざ・術の できごとで skillMotion() を 引き、体の 動き (skillPose) と 絵 (drawSkillFx) を 出す。
// 見た目だけ (当たり・ダメージは logic/battle.js)。必殺技は special-fx.js
//
// kind: 体の 動きと 出す 絵
//   slash 剣で 切りつける / smash 跳んで たたきつける (ハンマー・ふみつけ) / thrust 突く / punch こぶし・一撃 / bite かみつく・つつく /
//   tackle 体当たり (残像) / breath 息・風・炎を 吐く / throw 投げる・撃つ (玉が 飛ぶ) / magic 術・まほう (魔法陣 → 光の 柱) /
//   song 音・うた (音符が 飛ぶ) / powder こな・けむり (雲が ただよう) / heal 治す (光の 輪) / burst まわり みんなに 衝撃波
// near: 相手の そばまで 近づく わざ (ずれの 大きさ)。dur: 動きの 長さ (秒)、hit: 当たる 時間 (秒)
// =====================================================================
export const SKILL_KIND = {
    slash: { dur: 0.6, hit: 0.32, near: 0.55 },
    smash: { dur: 0.75, hit: 0.48, near: 0.5 },
    thrust: { dur: 0.48, hit: 0.26, near: 0.45 },
    punch: { dur: 0.45, hit: 0.24, near: 0.5 },
    bite: { dur: 0.48, hit: 0.27, near: 0.55 },
    tackle: { dur: 0.52, hit: 0.25, near: 0.7 },
    breath: { dur: 0.75, hit: 0.48, near: 0 },
    throw: { dur: 0.55, hit: 0.34, near: 0 },
    magic: { dur: 0.85, hit: 0.55, near: 0 },
    song: { dur: 0.75, hit: 0.48, near: 0 },
    powder: { dur: 0.75, hit: 0.48, near: 0 },
    heal: { dur: 0.65, hit: 0.3, near: 0 },
    burst: { dur: 0.65, hit: 0.36, near: 0 }
};

// わざの 名前 → 動き (この ゲームの わざ。nakama.js の WAZA)。weapon: 手に 持つ もの
const BY_NAME = {
    'コオリソード': { kind: 'slash', weapon: 'iceSword' },
    'ころがりタックル': { kind: 'tackle' }, 'こうらタックル': { kind: 'tackle' }, 'とびだし': { kind: 'tackle' }, 'そうめんスライダー': { kind: 'tackle' },
    'つっこみ': { kind: 'thrust', weapon: 'stinger' },
    'ふんづけ返し': { kind: 'smash' }, 'ハクの一撃': { kind: 'smash' },
    'よっぱらいつつき': { kind: 'bite' }, 'からみつく': { kind: 'powder' },
    'はんにゃのにらみ': { kind: 'magic' }, 'ネオンビリビリ': { kind: 'magic' }, 'かぞえまちがい': { kind: 'magic' }, 'ネオンばけ': { kind: 'powder' },
    'ねむりごな': { kind: 'powder' }, 'ばい菌': { kind: 'powder' }, 'ドロン': { kind: 'powder' },
    'ポクポク': { kind: 'song' }, 'リーチ宣言': { kind: 'song' }, 'はずれたカラオケ': { kind: 'song' }, '配信のお経': { kind: 'song' }, '百のかぞえうた': { kind: 'song' },
    'きんピカ': { kind: 'burst' }, 'まきびしまき': { kind: 'burst' }, 'ポップアップ広告': { kind: 'burst' },
    'はばたき': { kind: 'breath' }, 'ちょうちん火': { kind: 'breath' }, 'ブツン': { kind: 'magic' }, 'キラッ☆': { kind: 'magic' },
    'あつあつラーメン': { kind: 'throw' }, 'さらの しずく': { kind: 'heal' },
    // 2 章の ボス (影)
    'たたきつけ': { kind: 'smash' }, '未詳の左腕': { kind: 'punch' }, '不明の右手': { kind: 'magic' },
    '振り払い': { kind: 'burst' }, '不安の眼': { kind: 'magic' }, '呪いの笑み': { kind: 'magic' }
};
// 名前に ない わざは ことばから (上から 順に 見る)
const WORDS = [
    [/剣|ソード|斬|ぎり|きり|刀|スラッシュ|カット/, 'slash'],
    [/ハンマー|金棒|プレス|ふんづけ|一撃|たたき/, 'smash'],
    [/やり|突き|つっこみ|はり|針/, 'thrust'],
    [/パンチ|キック|チョップ/, 'punch'],
    [/かみ|つつき|きば/, 'bite'],
    [/タックル|とっしん|突進|ころがり|とびだし|スライダー/, 'tackle'],
    [/うた|音|お経|カラオケ|宣言/, 'song'],
    [/こな|ごな|けむり|菌/, 'powder'],
    [/いき|ブレス|はばたき|風|火/, 'breath'],
    [/なげ|玉|ショット|マシンガン|クナイ|メール|ころがし/, 'throw']
];

// cmd: 'waza' | 'jutsu'。move: わざ・術 ({ name, type, effects })
export function skillMotion(move, cmd) {
    if (cmd === 'jutsu') return { kind: move.type === 'heal' ? 'heal' : 'magic' };   // 術は 魔法陣 (回復の 術は 光の 輪)
    const name = move.name || '';
    if (BY_NAME[name]) return BY_NAME[name];
    if (move.effects && move.effects.some(f => f.kind === 'heal')) return { kind: 'heal' };
    const w = WORDS.find(([re]) => re.test(name));
    if (w) return { kind: w[1], weapon: w[1] === 'slash' ? 'sword' : null };
    const all = move.effects && move.effects.some(f => f.target === 'all');
    return { kind: all ? 'burst' : 'throw' };
}

// 体の 動き。k: 0〜1、(dx, dy): 相手へ 近づく ずれ (ドット)
export function skillPose(kind, k, dx, dy) {
    let ox = 0, oy = 0, sx = 1, sy = 1;
    const go = f => { ox += dx * f; oy += dy * f; };
    const ease = x => x * x * (3 - 2 * x);
    switch (kind) {
        case 'slash':   // 近づいて ふりかぶり (少し のけぞる) → 切りつけて もどる
            go(k < 0.5 ? ease(k / 0.5) : 1 - ease((k - 0.5) / 0.5));
            if (k > 0.35 && k < 0.55) { sx = 1.12; sy = 0.92; }
            break;
        case 'smash':   // 高く 跳んで → 相手の 上に たたきつける (着地で つぶれる)
            go(k < 0.64 ? ease(Math.min(1, k / 0.55)) : 1 - ease((k - 0.64) / 0.36));
            oy -= (k < 0.45 ? Math.sin(k / 0.45 * Math.PI / 2) : Math.max(0, 1 - (k - 0.45) / 0.18)) * 34;
            if (k > 0.62 && k < 0.78) { sy = 0.78; sx = 1.2; }
            break;
        case 'thrust':
        case 'punch':   // ためて (少し さがる) → すばやく 突く
            go(k < 0.25 ? -k / 0.25 * 0.15 : k < 0.6 ? ease((k - 0.25) / 0.3) : 1 - ease((k - 0.6) / 0.4));
            break;
        case 'bite':   // 飛びかかって のびる
            go(Math.sin(Math.min(1, k) * Math.PI));
            sx = 1 + Math.sin(k * Math.PI) * 0.12;
            sy = 1 - Math.sin(k * Math.PI) * 0.08;
            break;
        case 'tackle':   // 体を まるめて 突っこむ
            go(Math.sin(Math.min(1, k * 1.1) * Math.PI));
            sy = 1 - Math.sin(k * Math.PI) * 0.15;
            sx = 1 + Math.sin(k * Math.PI) * 0.1;
            break;
        case 'breath':   // 息を 吸って (ふくらむ) → 吐く (ふるえる)
            if (k < 0.4) { sx = sy = 1 + k / 0.4 * 0.1; } else { ox += Math.sin(k * 70) * 1.2; }
            break;
        case 'throw':   // 腕を ひいて → 投げる (小さく はねる)
            oy -= Math.sin(Math.min(1, k / 0.6) * Math.PI) * 10;
            break;
        case 'magic':   // ふわっと 浮かぶ
        case 'song':
            oy -= Math.sin(k * Math.PI) * 12;
            break;
        case 'powder':   // くるくる ゆれる
            ox += Math.sin(k * Math.PI * 6) * 3;
            oy -= Math.abs(Math.sin(k * Math.PI * 3)) * 5;
            break;
        case 'heal':
            sx = sy = 1 + Math.sin(k * Math.PI) * 0.1;
            break;
        case 'burst':   // ちぢんで → はじける
            sx = sy = k < 0.45 ? 1 - k / 0.45 * 0.15 : 0.85 + Math.sin((k - 0.45) / 0.55 * Math.PI) * 0.35;
            break;
        default:
            break;
    }
    return { ox, oy, sx, sy };
}

// ----- 絵 -----
const line = (ctx, x1, y1, x2, y2, color, w) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
};

// 武器: 持ち手 (px, py) から 角度 a へ のびる。s: 大きさ
export function drawWeapon(ctx, weapon, px, py, a, s) {
    const c = Math.cos(a), sn = Math.sin(a);
    ctx.lineCap = 'round';
    if (weapon === 'iceSword' || weapon === 'sword') {
        const L = 15 * s, bx = px + c * 3 * s, by = py + sn * 3 * s, tx = px + c * L, ty = py + sn * L;
        line(ctx, bx, by, tx, ty, '#20304a', 4.5 * s);
        line(ctx, bx, by, tx, ty, weapon === 'iceSword' ? '#bff0ff' : '#e0e6ee', 2.8 * s);
        line(ctx, px + c * 4 * s, py + sn * 4 * s, tx - c * 2, ty - sn * 2, '#ffffff', 0.9 * s);
        line(ctx, bx - sn * 3.5 * s, by + c * 3.5 * s, bx + sn * 3.5 * s, by - c * 3.5 * s, weapon === 'iceSword' ? '#4a8ad8' : '#c8a040', 1.8 * s);   // つば
        line(ctx, px, py, bx, by, '#6a4a2a', 2 * s);   // 柄
    } else if (weapon === 'stinger') {
        // ハチの 針
        const L = 10 * s, tx = px + c * L, ty = py + sn * L;
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(px - sn * 2 * s, py + c * 2 * s);
        ctx.lineTo(px + sn * 2 * s, py - c * 2 * s);
        ctx.closePath();
        ctx.fill();
    }
    ctx.lineCap = 'butt';
}

// fx: { kind, weapon, color, start, dur, hit, from (使った キャラの 中心を 返す 関数), to: [{ x, y }], s (大きさ), seed }
export function drawSkillFx(ctx, fx, t) {
    const k = (t - fx.start) / fx.dur;
    if (k < 0 || k >= 1) return;
    const from = fx.from();
    if (!from) return;
    const imp = fx.hit / fx.dur;
    const after = Math.max(0, (k - imp) / (1 - imp));   // 当たった あと 0〜1
    const to = fx.to.length ? fx.to : [{ x: from.x, y: from.y - 60 }];
    const T = to[0];
    const a = Math.atan2(T.y - from.y, T.x - from.x);
    const s = fx.s;
    const dot = (x, y, r, color, al = 1) => {
        ctx.globalAlpha = Math.max(0, Math.min(1, al));
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x - r), Math.round(y - r), Math.round(r * 2), Math.round(r * 2));
    };
    ctx.save();
    switch (fx.kind) {
        case 'slash': {
            // 剣を 後ろに ふりかぶって → 相手へ ふりぬく。軌跡の 三日月と、当たった ところに 切り口
            const back = a - 2.1, end = a + 1.2;
            const q = k < imp * 0.55 ? 0 : Math.min(1, (k - imp * 0.55) / (imp * 0.6));
            const ang = back + (end - back) * q * q * (3 - 2 * q);
            if (k < 0.85) drawWeapon(ctx, fx.weapon || 'sword', from.x, from.y, ang, s);
            if (q > 0) {
                ctx.globalAlpha = 0.75 * (1 - after);
                ctx.strokeStyle = fx.weapon === 'iceSword' ? '#bff0ff' : '#ffffff';
                ctx.lineWidth = 4 * s;
                ctx.beginPath();
                ctx.arc(from.x, from.y, 13 * s, back + 0.5, Math.max(back + 0.5, ang));
                ctx.stroke();
            }
            if (k >= imp) to.forEach(p => {
                const L = 18 * Math.min(1, after * 3);
                ctx.globalAlpha = 1 - after;
                line(ctx, p.x - L, p.y - L * 0.7, p.x + L, p.y + L * 0.7, '#ffffff', 3);
                line(ctx, p.x - L, p.y - L * 0.7 + 3, p.x + L, p.y + L * 0.7 + 3, fx.color, 1.5);
                for (let i = 0; i < 6; i++) {   // 氷の かけら
                    const b = i / 6 * Math.PI * 2 + fx.seed, R = 6 + after * 18;
                    dot(p.x + Math.cos(b) * R, p.y + Math.sin(b) * R, 1.5, fx.color, 1 - after);
                }
            });
            break;
        }
        case 'smash':
            // 着地した ところに 衝撃の 輪・ひび・土ぼこり
            if (k >= imp) to.forEach(p => {
                const gy = p.y + 18;
                ctx.globalAlpha = 1 - after;
                ctx.strokeStyle = '#ffe680';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(p.x, gy, 8 + after * 40, 3 + after * 10, 0, 0, Math.PI * 2);
                ctx.stroke();
                for (let i = 0; i < 5; i++) {
                    const b = i * 1.3 + fx.seed;
                    line(ctx, p.x, gy, p.x + Math.cos(b) * 20, gy + Math.sin(b) * 5, '#4a3020', 1.5);
                }
                for (let i = 0; i < 8; i++) dot(p.x - 24 + i * 7, gy - Math.sin(after * Math.PI) * (6 + i % 3 * 4), 2, '#c8b080', 1 - after);
            });
            break;
        case 'thrust': {
            // 針・やりで 突く (相手へ のびる)
            const q = k < 0.25 ? 0 : Math.sin(Math.min(1, (k - 0.25) / (imp - 0.25 + 0.15)) * Math.PI / 2) * (1 - after);
            drawWeapon(ctx, fx.weapon || 'stinger', from.x + Math.cos(a) * q * 8, from.y + Math.sin(a) * q * 8, a, s);
            if (k >= imp) to.forEach(p => {
                for (let i = 0; i < 4; i++) {
                    const b = a + Math.PI + (i - 1.5) * 0.5, R = 4 + after * 16;
                    line(ctx, p.x, p.y, p.x + Math.cos(b) * R, p.y + Math.sin(b) * R, '#ffffff', 2 * (1 - after));
                }
            });
            break;
        }
        case 'punch':
            if (k >= imp) to.forEach(p => {
                for (let i = 0; i < 8; i++) {
                    const b = i / 8 * Math.PI * 2 + fx.seed, R = 6 + after * 20;
                    dot(p.x + Math.cos(b) * R, p.y + Math.sin(b) * R, 2.5, '#ffe680', 1 - after);
                }
            });
            break;
        case 'bite':
            // 上と 下の キバが 閉じる
            to.forEach(p => {
                const gap = k < imp ? 22 * (1 - k / imp) + 2 : 2;
                ctx.globalAlpha = k < imp ? Math.min(1, k / 0.15) : 1 - after;
                ctx.fillStyle = '#ffffff';
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath(); ctx.moveTo(p.x + i * 7 - 3, p.y - gap); ctx.lineTo(p.x + i * 7 + 3, p.y - gap); ctx.lineTo(p.x + i * 7, p.y - gap + 8); ctx.fill();
                    ctx.beginPath(); ctx.moveTo(p.x + i * 7 - 3, p.y + gap); ctx.lineTo(p.x + i * 7 + 3, p.y + gap); ctx.lineTo(p.x + i * 7, p.y + gap - 8); ctx.fill();
                }
            });
            break;
        case 'tackle':
            if (k >= imp) to.forEach(p => {
                ctx.globalAlpha = 1 - after;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8 + after * 22, 0, Math.PI * 2);
                ctx.stroke();
            });
            break;
        case 'breath':
            // 口から 相手へ ふき出す (属性の 色の つぶ)
            if (k > 0.3) to.forEach(p => {
                for (let i = 0; i < 18; i++) {
                    const d = ((k - 0.3) / 0.7 * 1.4 + i / 18) % 1;
                    const spread = (i % 5 - 2) * 4 * d;
                    const x = from.x + (p.x - from.x) * d - Math.sin(a) * spread, y = from.y + (p.y - from.y) * d + Math.cos(a) * spread;
                    dot(x, y, 3 - d * 1.5, i % 3 ? fx.color : '#ffffff', (1 - d * 0.5) * (1 - Math.max(0, k - 0.85) / 0.15));
                }
            });
            break;
        case 'throw':
            // 玉が 山なりに 飛ぶ
            if (k > 0.15 && k < imp) to.forEach(p => {
                const q = (k - 0.15) / (imp - 0.15);
                const x = from.x + (p.x - from.x) * q, y = from.y + (p.y - from.y) * q - Math.sin(Math.PI * q) * 22;
                dot(x, y, 7, fx.color, 0.35);
                dot(x, y, 4, fx.color, 1);
                dot(x - 1, y - 1, 1.5, '#ffffff', 1);
            });
            if (k >= imp) to.forEach(p => dot(p.x, p.y, 10 * (1 - after) + 2, '#ffffff', 1 - after));
            break;
        case 'magic': {
            // 足もとに 回る 魔法陣 → 相手に 光の 柱が 落ちる
            const gy = from.y + 22 * s;
            const al = Math.sin(Math.min(1, k * 1.3) * Math.PI) * 0.9;
            ctx.globalAlpha = al;
            ctx.strokeStyle = fx.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.ellipse(from.x, gy, 24 * s, 7 * s, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(from.x, gy, 15 * s, 4.5 * s, 0, 0, Math.PI * 2); ctx.stroke();
            for (let i = 0; i < 8; i++) {
                const b = i / 8 * Math.PI * 2 + k * 8;
                dot(from.x + Math.cos(b) * 20 * s, gy + Math.sin(b) * 6 * s, 1.5, '#ffffff', al);
            }
            if (k > imp - 0.12) to.forEach(p => {
                const q = Math.min(1, (k - imp + 0.12) / 0.12);
                ctx.globalAlpha = Math.min(1, 1.4 - after * 1.4);
                ctx.fillStyle = fx.color;
                ctx.fillRect(p.x - 5, p.y - 80 * q, 10, 80 * q + 10);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(p.x - 2, p.y - 80 * q, 4, 80 * q + 10);
                if (k >= imp) dot(p.x, p.y, 14 * (1 - after) + 3, '#ffffff', 1 - after);
            });
            break;
        }
        case 'song':
            // 音符が 相手へ ふわふわ 飛ぶ
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            to.forEach(p => {
                for (let i = 0; i < 4; i++) {
                    const q = Math.min(1, Math.max(0, (k - i * 0.08) / (imp + 0.1)));
                    if (q <= 0) continue;
                    ctx.globalAlpha = 1 - Math.max(0, k - 0.8) / 0.2;
                    ctx.fillStyle = i % 2 ? '#ffe680' : fx.color;
                    ctx.fillText(i % 2 ? '♪' : '♫', from.x + (p.x - from.x) * q + Math.sin(q * 9 + i) * 8, from.y + (p.y - from.y) * q - Math.sin(q * Math.PI) * 18);
                }
            });
            break;
        case 'powder':
            // こなの 雲が 相手へ ただよって つつむ
            to.forEach(p => {
                const q = Math.min(1, k / imp);
                const cx = from.x + (p.x - from.x) * q, cy = from.y + (p.y - from.y) * q;
                for (let i = 0; i < 12; i++) {
                    const b = i * 2.4 + fx.seed + k * 3, R = 6 + q * 12 + (i % 3) * 3;
                    dot(cx + Math.cos(b) * R, cy + Math.sin(b) * R * 0.7, 3, i % 2 ? fx.color : '#ffffff', (1 - Math.max(0, k - 0.7) / 0.3) * 0.85);
                }
            });
            break;
        case 'heal':
            // 頭の 上の 光の 輪が おりてくる
            ctx.globalAlpha = 1 - k;
            ctx.strokeStyle = '#c8ffb0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(from.x, from.y - 30 * s + k * 30 * s, 14 * s, 4 * s, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
        case 'burst':
            // まわりへ 広がる 衝撃波 (相手 みんなに とどく)
            if (k >= imp * 0.7) {
                const q = Math.min(1, (k - imp * 0.7) / (1 - imp * 0.7));
                const R = Math.max(...to.map(p => Math.hypot(p.x - from.x, p.y - from.y))) * q + 10;
                ctx.globalAlpha = 1 - q;
                ctx.strokeStyle = fx.color;
                ctx.lineWidth = 4 * (1 - q) + 1;
                ctx.beginPath();
                ctx.ellipse(from.x, from.y, R, R * 0.6, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            break;
        default:
            break;
    }
    ctx.restore();
}
