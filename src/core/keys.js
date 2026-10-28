// =====================================================================
// 画面に 出す ボタンの 名前 (2026-10-26 ユーザー指定:「J=A」のような 書き方は 分かりにくい)
// ---------------------------------------------------------------------
// キーボードで 遊んでいるときは キーの 名前 ([J] しらべる)、ゲームパッドや スマホでは ボタンの 名前 ([A] しらべる)。
// 最後に さわった ものに 合わせて input.js が setKeyMode() で 切りかえる
// =====================================================================
const KEY_NAMES = { a: 'J', b: 'K', x: 'I', y: 'U', l: 'Q', r: 'E', start: 'Shift', fast: 'F' };
const BUTTON_NAMES = { fast: 'START' };   // 倍速は ゲームパッド・スマホでは START
let mode = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches ? 'button' : 'key';

export function setKeyMode(kind) {
    mode = kind === 'key' ? 'key' : 'button';
}
export const isKeyboard = () => mode === 'key';

// [J] / [A] のように かっこ つきで
export const btn = b => `[${mode === 'key' ? KEY_NAMES[b] : BUTTON_NAMES[b] || b.toUpperCase()}]`;
// 移動の 名前
export const moveName = () => (mode === 'key' ? '[WASD]' : '[十字キー]');
