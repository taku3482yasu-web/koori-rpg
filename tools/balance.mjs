// ボスの 撃破率を しらべる (2026-10-30。むずかしい 章は 5 割くらいに する)
//   node tools/balance.mjs [ボスの id ...] [--n 回数] [--lv +何]
//   その 章までに 会える なかまから ランダムに 5 体 + こおりくん を ボスの Lv (適正レベル) で 戦わせる。
//   プレイヤーの かわりに: しかけの 部位を ロックオン・弱った なかまを 輪で うしろへ・必殺技 (ふつうの でき)・とりつきを おたすけ・おやつ
import { createBattle, step, rotate, lockOn, openGims, canSpecial, startSpecial, resolveSpecial, begin, canRescue, startRescue, resolveRescue, useItem } from '../src/logic/battle.js';
import { createRng } from '../src/core/rng.js';
import { NAKAMA, BOSSES, idsInArea, FLOOR13, TEAMS, HELPER_LV } from '../src/data/nakama.js';

// 章ごとの ボスと、その 章までに 行ける 地区・なかまに なった ボス
const CHAPTERS = {
    6: { bosses: ['zumitani6', 'onioni6', 'tomooka6'], areas: ['ishinokawa', 'shoutengai', 'school', 'yama', 'umi', 'tera', 'yashiki'], extra: ['hashishita', 'lunashadow', 'hyougaryu', 'urashima', 'daishi'] },
    8: { bosses: ['ooni8', 'soutou8', 'kinme8', 'onioni8'], areas: ['ishinokawa', 'shoutengai', 'school', 'yama', 'umi', 'tera', 'yashiki', 'moon', 'shiro'], extra: ['hashishita', 'lunashadow', 'hyougaryu', 'urashima', 'daishi', 'zumitani', 'runaya'] },
    13: { bosses: ['tomooka13', 'tashikeda13', 'rukiha13'], areas: ['ishinokawa', 'shoutengai', 'school', 'yama', 'umi', 'tera', 'yashiki', 'moon', 'shiro', 'kinniku', 'tsubo'], extra: ['hashishita', 'lunashadow', 'hyougaryu', 'urashima', 'daishi', 'zumitani', 'runaya', 'kinmetsuki', 'harukirin', 'nozoema', 'bakuenryu', 'onioni'] }
};
const RANK_W = { S: 4, A: 4, B: 3, C: 2, D: 1, E: 0.5 };

function party(rng, ch, lv) {
    const pool = [...new Set([...CHAPTERS[ch].areas.flatMap(idsInArea), ...CHAPTERS[ch].extra])].filter(id => NAKAMA[id]);
    const picked = [];
    while (picked.length < 5) {
        const id = rng.weighted(pool.filter(x => !picked.includes(x)).map(x => ({ id: x, w: RANK_W[NAKAMA[x].rank] || 1 }))).id;
        picked.push(id);
    }
    return ['koori', ...picked].map((id, i) => ({ uid: `a${i}`, id, lv, upgrade: (ch >= 13 && (id === 'koori' || id === 'onioni')) || (ch >= 9 && id === 'koori') }));
}

export function simulate(bossId, seed, lvPlus = 0) {
    const ch = Object.keys(CHAPTERS).find(k => CHAPTERS[k].bosses.includes(bossId));
    const rng = createRng(seed);
    const lv = BOSSES[bossId].lv + lvPlus;
    const f = FLOOR13.find(x => x.id === bossId);
    const helpers = f ? { name: '', members: TEAMS[f.team.naitei].members, lv: HELPER_LV } : null;
    const b = createBattle({ allies: party(rng, ch, lv), enemies: [{ id: bossId, lv: BOSSES[bossId].lv, dark: Boolean(f) }], rng: createRng(seed + 1000), kind: 'boss', intro: true, helpers });
    begin(b);
    let snacks = 3, think = 0;
    for (let t = 0; t < 360 && !b.outcome; t += 0.05) {
        step(b, 0.05);
        think -= 0.05;
        if (think > 0 || b.outcome) continue;
        think = 0.6;   // 人の 反応の おそさ
        const boss = b.enemies.find(e => BOSSES[e.id] && !e.ko) || b.enemiesAlive()[0];
        if (!boss) continue;
        // しかけの 部位 (投げられた 道具・頭・角・腕 など) を ねらう
        const open = openGims(b, boss);
        if (open.length && !(b.lock === boss.uid && open.includes(b.lockPart))) lockOn(b, boss.uid, open.includes('head') ? 'head' : rng.pick(open));
        else if (!open.length && boss.parts && b.lock !== boss.uid) lockOn(b, boss.uid);
        else if (!b.lock) lockOn(b, (b.enemiesAlive().find(e => e.drainOf || e.idol) || boss).uid);
        // 弱った なかま・とりつかれた なかまを うしろへ
        const front = b.front();
        if (front.some(u => !u || u.ko || u.hp < u.max * 0.3 || Object.keys(u.status).length)) rotate(b, 1);
        for (const u of b.wheel) if (u && canRescue(b, u.uid)) resolveRescue(b, startRescue(b, u.uid), rng.chance(0.7));
        for (let i = 0; i < 3; i++) if (canSpecial(b, i)) resolveSpecial(b, startSpecial(b, i), 1.0);
        if (snacks > 0 && b.wheel.filter(u => u && !u.ko).length <= 3) { if (useItem(b, 'onigiri')) snacks--; }
    }
    if (process.env.PROBE) { const e = b.enemies.find(x => BOSSES[x.id]); console.log(bossId, b.outcome || 'timeout', `phase${e.phase}`, e.enraged ? 'enraged' : '', `hp ${Math.round(e.hp / e.max * 100)}%`, `t ${Math.round(b.t)}`); }
    return b.outcome === 'win';
}

if (process.argv[1] && process.argv[1].endsWith('balance.mjs')) {
    const args = process.argv.slice(2);
    const n = args.includes('--n') ? Number(args[args.indexOf('--n') + 1]) : 60;
    const plus = args.includes('--lv') ? Number(args[args.indexOf('--lv') + 1]) : 0;
    const ids = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
    for (const id of ids.length ? ids : Object.values(CHAPTERS).flatMap(c => c.bosses)) {
        let win = 0;
        for (let s = 1; s <= n; s++) if (simulate(id, s * 7919, plus)) win++;
        console.log(`${id.padEnd(12)} Lv${BOSSES[id].lv}${plus ? `(なかま +${plus})` : ''}  撃破率 ${Math.round(win / n * 100)}%`);
    }
}
