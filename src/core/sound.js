// =====================================================================
// 効果音: ピコピコ音 (WebAudio で作る。音のファイルは使わない)
// ---------------------------------------------------------------------
// はじめてボタンを押すまでブラウザは音を止めているので、unlock() を入力のたびに呼ぶ
// =====================================================================
let ac = null;
let muted = false;

export function unlockSound() {
    if (typeof window === 'undefined' || muted) return;
    if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
    }
    if (ac.state === 'suspended') ac.resume();
}

function tone(freq, start, dur, { type = 'square', vol = 0.06, slide = 0 } = {}) {
    const t = ac.currentTime + start;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
}

const SOUNDS = {
    cursor: () => tone(880, 0, 0.05, { vol: 0.03 }),
    ok: () => { tone(988, 0, 0.06); tone(1318, 0.05, 0.08); },
    cancel: () => tone(440, 0, 0.08, { slide: -120 }),
    step: () => tone(200, 0, 0.03, { type: 'triangle', vol: 0.02 }),
    lens: () => tone(1500, 0, 0.04, { type: 'sine', vol: 0.04 }),
    found: () => { [660, 880, 1100, 1320].forEach((f, i) => tone(f, i * 0.06, 0.1)); },
    hit: () => tone(180, 0, 0.08, { type: 'sawtooth', vol: 0.05, slide: -80 }),
    big: () => { tone(120, 0, 0.25, { type: 'sawtooth', vol: 0.08, slide: -60 }); tone(240, 0.02, 0.2, { vol: 0.05 }); },
    heal: () => { [784, 988, 1175].forEach((f, i) => tone(f, i * 0.07, 0.12, { type: 'triangle' })); },
    rotate: () => tone(600, 0, 0.06, { type: 'triangle', slide: 300 }),
    special: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.05, 0.12)); },
    mash: () => tone(1200 + Math.random() * 300, 0, 0.03, { vol: 0.03 }),
    win: () => { [784, 784, 784, 1047].forEach((f, i) => tone(f, i * 0.12, i === 3 ? 0.4 : 0.1)); },
    lose: () => { [440, 392, 349, 262].forEach((f, i) => tone(f, i * 0.18, 0.2, { type: 'triangle' })); },
    friend: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.25, { type: 'triangle', vol: 0.05 })); },
    watch: () => { tone(1047, 0, 0.1); tone(1568, 0.1, 0.3, { type: 'sine' }); }
};

export function sfx(name) {
    if (!ac || muted || ac.state !== 'running') return;
    SOUNDS[name]?.();
}

export function setMuted(v) { muted = v; }
// BGM (core/bgm.js) も 同じ 音の 出口を 使う。まだ 鳴らせない ときは null
export const audioContext = () => (ac && !muted && ac.state === 'running' ? ac : null);
