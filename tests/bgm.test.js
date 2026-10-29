// BGM の 楽譜 (data/bgm.js)
import test from 'node:test';
import assert from 'node:assert/strict';
import { SONGS, MODES, compileSong, bgmFor } from '../src/data/bgm.js';
import { AREAS, BOSSES } from '../src/data/nakama.js';

const tokens = s => (s || '').split(/\s+/).filter(t => t && t !== '|');

test('町は 地区ごと・ボスは 1 体ごとに 曲が ある', () => {
    for (const area of Object.keys(AREAS)) assert.ok(SONGS[area], `${area} の 曲`);
    for (const id of Object.keys(BOSSES)) assert.ok(SONGS[id], `${id} の 曲`);
    for (const id of ['title', 'battle', 'rival', 'boss']) assert.ok(SONGS[id], id);
    // 曲の 名前は ぜんぶ ちがう
    assert.equal(new Set(Object.values(SONGS).map(s => s.name)).size, Object.keys(SONGS).length);
});

test('楽譜: メロディは ちょうど 8 小節・記号が 正しい・パターンは 小節に おさまる', () => {
    for (const [id, song] of Object.entries(SONGS)) {
        const steps = song.steps || 8;
        assert.ok(MODES[song.mode], `${id} の 音階`);
        const chords = tokens(song.chords);
        assert.equal(chords.length, 8, `${id} の 和音`);
        assert.ok(chords.every(c => /^[1-7]$/.test(c)), `${id} の 和音`);
        const mel = tokens(song.melody);
        assert.equal(mel.length, 8 * steps, `${id} の メロディの 長さ`);
        for (const t of mel) assert.match(t, /^([#b]?[1-7][',]*|-|\.)$/, `${id}: ${t}`);
        assert.notEqual(mel[0], '-', `${id} は のばす 記号から 始まらない`);
        for (const [k, re] of [['bass', /^[rof.-]$/], ['arp', /^[0-3.]$/], ['drums', /^[kshxb.]$/]]) {
            const p = tokens(song[k]);
            if (!p.length) continue;
            assert.equal(steps % p.length, 0, `${id} の ${k} の 長さ`);
            for (const t of p) assert.match(t, re, `${id} の ${k}: ${t}`);
        }
        const c = compileSong(song);
        assert.equal(c.total, 8 * steps);
        assert.ok(c.notes.length > 20, id);
        // 音の 高さは 聞ける はんい (ベースの 低い ほうから メロディの 高い ほうまで)
        for (const n of c.notes) assert.ok(n.midi >= 30 && n.midi <= 96, `${id} の 音 ${n.midi}`);
        for (const n of c.notes) assert.ok(n.step + n.len <= c.total, `${id} の 音の 長さ`);
    }
});

test('どの 曲を 鳴らすか: タイトル・町の 地区・ふつうの バトル・ライバル・ボスごと・おわったら 止める', () => {
    assert.equal(bgmFor({ scene: 'title' }), 'title');
    assert.equal(bgmFor({ scene: 'field', area: 'umi' }), 'umi');
    assert.equal(bgmFor({ scene: 'menu', area: 'moon' }), 'moon');
    assert.equal(bgmFor({ scene: 'battle', battle: { kind: 'wild' } }), 'battle');
    assert.equal(bgmFor({ scene: 'battle', battle: { kind: 'rival' } }), 'rival');
    assert.equal(bgmFor({ scene: 'battle', battle: { kind: 'boss', bossId: 'himuro' } }), 'himuro');
    assert.equal(bgmFor({ scene: 'battle', battle: { kind: 'boss', bossId: 'mada_nai' } }), 'boss', '曲の ない ボスは 予備の 曲');
    assert.equal(bgmFor({ scene: 'battle', battle: { kind: 'boss', bossId: 'nushi', outcome: 'win' } }), null);
    assert.equal(bgmFor({ scene: 'result' }), null);
});
