// =====================================================================
// 描く道具: 文字・窓・ボタン・ドット絵
// =====================================================================
export const FONT = '"Hiragino Maru Gothic ProN", "BIZ UDPGothic", "Meiryo", "Yu Gothic", sans-serif';

export const COLORS = {
    ink: '#ffffff',
    sub: '#b8c4e0',
    dim: '#7a86a6',
    panel: 'rgba(16, 22, 42, 0.88)',
    panelEdge: '#7fd3f7',
    accent: '#ffd84a',
    hp: '#5ad06a',
    hpLow: '#ff5a5a',
    gauge: '#ff9ad8',
    ice: '#bff0ff'
};

export function text(ctx, str, x, y, { size = 12, color = COLORS.ink, align = 'left', bold = false, shadow = true, baseline = 'alphabetic', maxWidth } = {}) {
    ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    if (shadow) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillText(str, x + 1, y + 1, maxWidth);
    }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y, maxWidth);
}

export function textWidth(ctx, str, size = 12, bold = false) {
    ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
    return ctx.measureText(str).width;
}

// lines 行に 入る 文字の 大きさ (入らなければ min まで 小さく する。2026-10-28 ユーザー指定: 文字が 入りきらない)
export function fitSize(ctx, str, width, size, lines, min = 9) {
    while (size > min && wrap(ctx, str, width, size).length > lines) size -= 0.5;
    return size;
}

// 文字を幅で折り返す (日本語は 1 文字ずつ。\n でも改行)
export function wrap(ctx, str, width, size = 12) {
    const lines = [];
    for (const para of String(str).split('\n')) {
        let line = '';
        for (const ch of para) {
            if (textWidth(ctx, line + ch, size) > width && line) {
                lines.push(line);
                line = ch;
            } else line += ch;
        }
        lines.push(line);
    }
    return lines;
}

export function roundRect(ctx, x, y, w, h, r = 6) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

export function panel(ctx, x, y, w, h, { fill = COLORS.panel, edge = COLORS.panelEdge, r = 6, lineWidth = 1.5 } = {}) {
    roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (edge) {
        ctx.strokeStyle = edge;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
}

// 下画面のボタン。{ x, y, w, h, label } を描き、押されたかどうかは hit() で調べる
export function button(ctx, b, { active = false, disabled = false, size = 13 } = {}) {
    panel(ctx, b.x, b.y, b.w, b.h, {
        fill: disabled ? 'rgba(40, 44, 60, 0.9)' : active ? '#2d5aa8' : 'rgba(26, 36, 64, 0.95)',
        edge: disabled ? '#4a5068' : active ? COLORS.accent : COLORS.panelEdge,
        r: 6
    });
    text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 + size / 3 + 1, { size, align: 'center', bold: true, color: disabled ? COLORS.dim : COLORS.ink });
}

export const hit = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

// もう 仲間に した キャラの 印 (金の メダルに ★)。(x, y) は まんなか、r は 半径 (2026-10-28 ユーザー指定)
export function drawFriendMark(ctx, x, y, r = 5) {
    ctx.fillStyle = '#ffd34a';
    ctx.strokeStyle = '#7a4a00';
    ctx.lineWidth = Math.max(1, r / 4);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.3 : r * 0.7;
        ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
}

// ドット絵 ({ w, h, palette, frames }) を描く。(x, y) は足元のまんなか。scale: 1 ドットの大きさ
// sx, sy: 横・たての のびちぢみ (攻撃を 食らった ときに つぶれる など。足元は 動かない)
export function drawArt(ctx, art, frame, x, y, { scale = 1, flip = false, alpha = 1, tint = null, sx = 1, sy = 1 } = {}) {
    if (!art) return;
    const n = art.frames.length;
    const rows = art.frames[((Math.floor(frame) % n) + n) % n];
    const pw = scale * sx, ph = scale * sy;
    const left = Math.round(x - (art.w * pw) / 2);
    const top = Math.round(y - art.h * ph);
    const before = ctx.globalAlpha;
    ctx.globalAlpha = before * alpha;
    for (let ry = 0; ry < rows.length; ry++) {
        const row = rows[ry];
        for (let rx = 0; rx < row.length; rx++) {
            const ch = row[rx];
            if (ch === '.') continue;
            ctx.fillStyle = tint || art.palette[ch];
            const dx = flip ? art.w - 1 - rx : rx;
            ctx.fillRect(left + dx * pw, top + ry * ph, pw + 0.05, ph + 0.05);
        }
    }
    ctx.globalAlpha = before;
}

export function bar(ctx, x, y, w, h, ratio, color, back = 'rgba(0, 0, 0, 0.6)') {
    ctx.fillStyle = back;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, Math.min(1, ratio)) * w, h);
}
