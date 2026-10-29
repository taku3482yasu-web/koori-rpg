// =====================================================================
// BGM: data/bgm.js の 楽譜を WebAudio で くりかえし 鳴らす (2026-10-30)
// ---------------------------------------------------------------------
// playBgm(id) を 毎コマ 呼ぶ。同じ 曲なら なにも しない。ちがう 曲なら 前の 曲を 0.4 秒で 消して 次を 始める。
// 音は 少し 先 (0.25 秒) まで 予約しておく (画面が 重くても 音が とぎれない)
// =====================================================================
import { audioContext } from './sound.js';
import { SONGS, compileSong } from '../data/bgm.js';

const VOL = { lead: 0.032, bass: 0.045, arp: 0.014 };
const AHEAD = 0.25;
const compiled = {};
let want = null;       // 鳴らしたい 曲
let cur = null;        // 鳴っている 曲 { id, song, gain, start, next (次に 予約する step) }
let noise = null;

function noiseBuffer(ac) {
    if (noise) return noise;
    noise = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noise;
}

const freq = midi => 440 * 2 ** ((midi - 69) / 12);

function note(ac, out, n, t, stepSec, wave) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    const dur = n.len * stepSec;
    osc.type = n.voice === 'bass' ? 'triangle' : n.voice === 'arp' ? 'triangle' : wave;
    osc.frequency.setValueAtTime(freq(n.midi), t);
    const v = VOL[n.voice];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.01);
    g.gain.setValueAtTime(v, t + Math.max(0.02, dur - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.98);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + dur);
}

function drum(ac, out, kind, t) {
    const g = ac.createGain();
    g.connect(out);
    if (kind === 'k') {
        const osc = ac.createOscillator();
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        g.gain.setValueAtTime(0.09, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        osc.connect(g);
        osc.start(t); osc.stop(t + 0.16);
    } else if (kind === 'b') {
        // 木魚: 高めの 短い 音
        const osc = ac.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(620, t + 0.06);
        g.gain.setValueAtTime(0.05, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
        osc.connect(g);
        osc.start(t); osc.stop(t + 0.09);
    } else {
        const src = ac.createBufferSource();
        src.buffer = noiseBuffer(ac);
        const f = ac.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.value = kind === 'h' ? 7000 : 1800;
        const len = kind === 'h' ? 0.04 : 0.12;
        g.gain.setValueAtTime(kind === 'h' ? 0.025 : 0.05, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        src.connect(f).connect(g);
        src.start(t); src.stop(t + len + 0.01);
    }
}

function stopCur(ac) {
    if (!cur) return;
    const g = cur.gain;
    g.gain.cancelScheduledValues(ac.currentTime);
    g.gain.setValueAtTime(g.gain.value, ac.currentTime);
    g.gain.linearRampToValueAtTime(0, ac.currentTime + 0.4);
    setTimeout(() => g.disconnect(), 1500);
    cur = null;
}

function schedule() {
    const ac = audioContext();
    if (!ac) return;
    if ((cur?.id ?? null) !== want) {
        stopCur(ac);
        if (want) {
            const c = compiled[want] || (compiled[want] = compileSong(SONGS[want]));
            const gain = ac.createGain();
            gain.gain.value = 1;
            gain.connect(ac.destination);
            cur = { id: want, c, wave: SONGS[want].lead || 'square', gain, start: ac.currentTime + 0.45, next: 0 };
        }
    }
    if (!cur) return;
    const { c } = cur;
    const until = ac.currentTime + AHEAD;
    // 画面が かくれて 予約が おくれたら、過ぎた ぶんは 鳴らさずに とばす
    while (cur.start + cur.next * c.stepSec < ac.currentTime - 0.05) cur.next++;
    while (cur.start + cur.next * c.stepSec < until) {
        const s = cur.next % c.total;
        const t = cur.start + cur.next * c.stepSec;
        for (const n of c.notes) if (n.step === s) note(ac, cur.gain, n, t, c.stepSec, cur.wave);
        for (const h of c.hits) if (h.step === s) drum(ac, cur.gain, h.kind, t);
        cur.next++;
    }
}

// 毎コマ 呼ぶ。id: SONGS の 名前 / null で 止める
export function playBgm(id) {
    want = id && SONGS[id] ? id : null;
    schedule();
}
export const currentBgm = () => cur?.id ?? null;

// 画面が かくれて いる あいだも 少し 先まで 予約を つづける (requestAnimationFrame は 止まるので)
if (typeof window !== 'undefined') setInterval(schedule, 100);
