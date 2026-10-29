// =====================================================================
// 町の 場面: 上画面で 歩く・調べる・レンズで さがす、下画面に 地図と ボタン (設計書 5 章・7 章)
// 2 章: 小学校の 入り口 (夕方・夜) から 校舎の 中へ。七不思議を 調べると バトル。げた箱の マットで 外へ
// 3 章: 町の 北の 山道から 山と ダムへ。奥の院の 言いつたえ → 氷の 封印 3 つ → ダムの主 (ヒョウガリュウ)
// =====================================================================
import { ART } from '../art/index.js';
import { TILE, MAP_W, SPOTS, BUILDINGS, areaAt, tileAt, regionOf, SCHOOL_Y0, SCHOOL_IN, SCHOOL_OUT, SCHOOL_OPEN, SCHOOL_ROOMS, MYSTERIES,
    YAMA_Y0, YAMA_IN, YAMA_OUT, YAMA_AFTER_BOSS, YAMA_PLACES, SEALS } from '../data/map.js';
import { ITEMS, SHOP } from '../data/items.js';
import { NAKAMA, AREAS } from '../data/nakama.js';
import { COLORS, drawArt, panel, text, textWidth, wrap, fitSize, button, hit, drawFriendMark } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { btn, moveName } from '../core/keys.js';
import { moveHero, lookAt, peopleHere, inShrine, gatesHere, sealsHere, heroTile, mysteriesSolved, allMysteriesSolved } from '../logic/world.js';
import { reached } from '../logic/story.js';
import { questOf, questState, questReady, questProgress, acceptQuest, completeQuest } from '../logic/quests.js';
import { TIMES, objective, hasWatch, spotActive, spotKinds, encounter, receiveWatch, advanceTime, bossEnemies, friendCount, takeGift, maxBuy, buyItem, MAX_ITEM, readLegend, sealsSolved, allSealsSolved } from '../logic/game.js';
import { createWild } from '../logic/wild.js';
import { drawCue } from './cues.js';
import { buildFieldCanvas, buildMiniMap } from './field-art.js';

const WALK = 72, RUN = 124;
const LENS_R = 26, LENS_FIND = 14, LENS_TIME = 1.2;
const SPOT_COOLDOWN = 25;   // かくれている キャラと 戦った 場所は 25 秒 休む
const TINT = ['rgba(255, 220, 160, 0.10)', null, 'rgba(255, 120, 40, 0.20)', 'rgba(20, 30, 90, 0.48)'];

// 地図に 書く 建物の 名前 (2026-10-28 ユーザー指定: どこに 何屋さんが あるか)。地図が 小さいので みじかく
const MINI_NAMES = {
    home: 'いえ', dagashi: '駄菓子屋', school: '学校', shrine: '神社', toilet: 'トイレ', temple: 'お寺',
    gamecenter: 'ゲーセン', pachinkoAto: 'パチ跡', yaoya: '八百屋', omenya: 'お面屋', kouban: '交番',
    jansou: '雀荘', denkiya: '電気屋', honya: '本屋', karaoke: 'カラオケ', sentou: '銭湯', okunoin: '奥の院'
};

const BTN = {
    lens: { x: 164, y: 28, w: 148, h: 40, label: 'レンズ' },
    menu: { x: 164, y: 76, w: 148, h: 40, label: 'メニュー' }
};

let fieldCanvas = null, miniCanvas = null, fieldWet = null;
// 町の 絵を 作る。3 章 クリアで ダムに 水が もどるので 作りなおす
function ensureCanvas(wet) {
    if (fieldWet === wet) return;
    fieldCanvas = buildFieldCanvas(wet);
    miniCanvas = buildMiniMap(3, wet);
    fieldWet = wet;
}

export function createField(app) {
    const g = app.g;
    ensureCanvas(reached(g, 'clear3'));
    let t = 0, walkT = 0, moving = false;
    let lens = null;     // { x, y, charge, spot, drag }
    const trail = [];    // こおりくんの 歩いた 道すじ (ふるカワが なぞって ついてくる)
    const buddy = { x: g.pos.x - 14, y: g.pos.y, flip: false, walkT: 0, moving: false };
    const cam = { x: 0, y: 0 };
    const wild = createWild(g, app.rng);   // 町に いる キャラ (見えている キャラ・見つけた キャラ)
    let fighting = null;                    // いま 戦っている キャラ
    // かくれている 場所に いて、まだ 見つけていない (違和感を 出す・レンズに 反応する)
    const hiding = s => spotActive(g, s, g.playTime) && !wild.list.some(c => c.spot === s.id);

    // 学校の 中・山に いるか (町と 学校と 山は つながって いないので、カメラも 地図も べつに する)
    const inYama = () => g.pos.y >= YAMA_Y0 * TILE;
    const inSchool = () => g.pos.y >= SCHOOL_Y0 * TILE && !inYama();
    const region = () => regionOf(Math.floor(g.pos.y / TILE));
    function camera() {
        const [top, bottom] = region().map(v => v * TILE);
        cam.x = Math.max(0, Math.min(MAP_W * TILE - 400, Math.round(g.pos.x - 200)));
        cam.y = Math.max(top, Math.min(bottom - 240, Math.round(g.pos.y - 128)));
    }
    // 場所を 飛ぶ (学校に 入る・出る)。p は マス
    function warp(p) {
        g.pos = { x: p.x * TILE + 8, y: p.y * TILE + 12, dir: p.dir };
        trail.length = 0;
        buddy.x = g.pos.x - 14;
        buddy.y = g.pos.y;
        camera();
        sfx('cursor');
    }
    camera();

    // ----- できごと -----
    const say = (lines, opts) => app.talk.open(lines, opts);
    const furu = text => ({ who: 'ふるカワ', art: 'furukawa', text });

    function meetFurukawa() {
        say([
            furu('あっ、こおりくん！ ちょうど よかった！'),
            furu('この 町には、ふしぎな キャラが いっぱい かくれてるの。この「さがすレンズ」で のぞくと 見つかるんだよ。'),
            furu('それと これ！「おなかまウォッチ」。おなかまメダルを セットすると、なかまを 呼び出せるの。'),
            { who: '', text: 'おなかまウォッチ と さがすレンズ を もらった！' },
            { who: 'ダイチョウエンキン', art: 'daichouenkin', text: 'おなか、ぐるぐる～。こおりくん、ひさしぶり！ ぼくも 手伝うよ！' },
            { who: '', text: 'ダイチョウエンキンの おなかまメダルを もらった！' },
            furu(`町を 歩いてる キャラには 話しかけると 勝負できるよ。かくれてる キャラは レンズ (${btn('y')}) で さがしてね。まずは なかまを 3 人 ふやしてみて！`)
        ], { done: () => app.save() });
        receiveWatch(g);
        sfx('watch');
        trail.length = 0;
        buddy.x = 7 * TILE + 8;
        buddy.y = 6 * TILE + 16;
    }

    function talkToPerson(p) {
        if (p.id === 'mama') {
            const lines = {
                intro: ['こおりくん、夏休みだからって ゴロゴロしてないで、外で 遊んできなさい！', '神社の ほうで ふるカワちゃんが さがしてたわよ。'],
                friends: ['あら、おともだちが ふえたのね。おやつは 駄菓子屋で 買えるわよ。'],
                bridge: ['石の川橋が 通れないんですって。こまったわねえ。'],
                clear: ['南の 商店街の 工事も 終わったんですって。夕方や 夜は にぎやかよ。', 'そういえば、夜の 小学校に あかりが ついてるって うわさよ。七不思議が どうとか……こわいわねえ。'],
                school: ['夜の 学校に 行ってるの？ 暗いから 気を つけるのよ。', 'おなかが すいたら、駄菓子屋で おやつを 買っていきなさい。'],
                clear2: ['学校の 七不思議、こおりくんが 解決したんですって？ すごいじゃない！', 'そういえば 石の川の 水が へってるの。山の ダムの 水が 消えたって うわさよ。町の 北の 山道から 行けるわ。'],
                yama: ['山に 行ってるの？ 山の 上は すずしいから、かぜを ひかないようにね。', 'ダムの 水が もどらないと、町の 水道も こまっちゃうわ。'],
                clear3: ['ダムに 水が もどったんですって！ こおりくん、おてがらね。', `町の なかまは ${friendCount(g)} 人？ 山にも まだまだ いそうね。`]
            }[g.story];
            say(lines.map(text => ({ who: 'ともいし', art: 'tomoishi', text })));
        } else if (p.id === 'furukawaShrine') {
            meetFurukawa();
        } else if (p.id === 'kage') {
            // 2 章の ボス: 七不思議の 8 つ目
            say([
                { who: '', text: 'ろうかの おくに、まっくろな 影が 立っている……。' },
                { who: 'ろうかの カゲ', art: 'lunashadow', text: '…………。' },
                furu('これが 8 つ目の ふしぎ……「夜の ろうかを 走る 影」！ こおりくん、気を つけて！ なかまに とりついて くるよ！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('kage'), kind: 'boss', place: 'school' }) });
        } else if (p.id === 'damNushi') {
            // 3 章の ボス: ダムの主 (ヒョウガリュウ。2026-10-29 ユーザー指定)
            say([
                { who: '', text: '氷の 城の 前に、王冠を かぶった 大きな 龍が いる……！' },
                { who: 'ダムの主', art: 'hyougaryu', text: 'グルルル……氷河の 底で 眠っていた わしを 起こしたのは だれだ……。' },
                { who: 'ダムの主', art: 'hyougaryu', text: 'この 王冠が ある かぎり、山の 水は すべて わしの 氷よ！' },
                furu('ダムの主……ヒョウガリュウだ！ 王冠の 力で あばれてるんだ！'),
                furu('「氷の偶像」を 2 つ 作られたら、大技の ために 入るよ。ためて いる あいだに 偶像を こわせば 止められる！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('himuro'), kind: 'boss', place: 'dam' }) });
        } else if (p.id === 'nushi') {
            if (g.story === 'bridge') {
                say([
                    { who: 'ヌシ', art: 'hashishita', text: 'ひとつ、ふたつ、みっつ……だれだ！ おれの 数を じゃまするのは！' },
                    furu('こおりくん、ウォッチで なかまを 呼び出して！')
                ], { done: () => app.startBattle({ enemies: bossEnemies(), kind: 'boss', place: 'bridge' }) });
            } else {
                say([{ who: '', text: '大きな 坊主が 橋の まんなかで 足音を 数えている……。通れそうに ない。' },
                    ...(hasWatch(g) ? [furu('いまの なかまだけじゃ 心配だよ。もう少し なかまを ふやそう！')] : [])]);
            }
        }
    }

    function openDoor(b) {
        if (b.id === 'home') {
            say([{ who: '', text: `こおりくんの 家。いまは ${g.day}日目の ${TIMES[g.time]}。` }], {
                choices: ['ねる (時間を すすめる)', 'セーブする', 'やめる'],
                done: i => {
                    if (i === 0) {
                        advanceTime(g, app.rng);
                        sfx('heal');
                        app.save();
                        say([{ who: '', text: `ぐっすり ねた。……${g.day}日目の ${TIMES[g.time]}に なった。${g.weather === 'rain' && g.time === 0 ? '今日は 雨だ。' : ''}` }]);
                    } else if (i === 1) {
                        app.save();
                        say([{ who: '', text: 'セーブした！' }]);
                    }
                }
            });
        } else if (b.id === 'dagashi') {
            shop();
        } else if (b.id === 'school') {
            enterSchool();
        } else if (b.id === 'okunoin') {
            readOkunoin();
        } else {
            const msg = {
                shrine: 'おさいせんを 入れて おまいりした。なかまが たくさん 見つかりますように……',
                toilet: '……だれも 入っていない。なのに、なんだか おなかが ぐるぐる する。',
                temple: 'ポク……ポク……。中から 木魚の 音が する。',
                // 商店街 (段階 2)
                gamecenter: '「じゅんび中」の はり紙が ある。中から ピコピコ 音が する……。',
                pachinkoAto: 'つぶれた パチンコ店。シャッターの すきまから、ジャラジャラ 聞こえた 気が する。',
                yaoya: '八百屋の おじさん「へい らっしゃい！ きゅうりは かっぱの 好物だよ！」',
                omenya: 'お祭り用の お面が ずらりと ならんでいる。ひとつ、こっちを 見ている 気が する……。',
                kouban: 'おまわりさん「無免許で 飛んでいる ハチを 見かけたら 教えてね」',
                jansou: '中から「ツモ！」「ロン！」と 声が する。子どもは 入れない。',
                denkiya: '古い テレビが 山づみ。1 台だけ、電源が 入っていないのに ついている。',
                honya: '本が ぎっしり。「全部 読んだら ヨシ！」と だれかが 言っていた。',
                karaoke: '中から 同じ 歌が ずっと 聞こえる。もう 何曲目だろう。',
                sentou: 'ゆ と 書いた のれん。「こおりの お客さまは とけるので ご注意ください」'
            }[b.id];
            say([{ who: '', text: msg }]);
        }
    }

    // 小学校 (2 章): 1 章 クリアの あと、夕方・夜だけ 入れる
    function enterSchool() {
        if (!reached(g, 'clear')) { say([{ who: '', text: '夏休みで しまっている。' }]); return; }
        if (!SCHOOL_OPEN.includes(g.time)) {
            say([{ who: '', text: '夏休みで しまっている。……でも 夜に なると、中から あかりが もれて いるらしい。' },
                furu(`夕方か 夜に また 来てみよう。家で ねると 時間が すすむよ。`)]);
            return;
        }
        warp(SCHOOL_IN);
        if (g.story !== 'clear') return;
        g.story = 'school';
        say([
            { who: '', text: '入り口の カギが あいていた……。' },
            furu('夜の 学校って、なんだか ドキドキするね。この 学校には「七不思議」が あるって うわさなんだ。'),
            furu('理科室の 動く ガイコツ、音楽室で 夜中に 鳴る 音、図書室の わすれられた 本、おどり場の 大鏡、体育倉庫の かけ声、開かずの ロッカー、プールの 手……。'),
            furu('あやしい ところを 調べて、ぜんぶ たしかめよう！ 七つ ぜんぶ 知ると、なにかが おこるんだって……。'),
            furu('それと、学校の キャラは なかまに「とりつく」ことが あるよ。とりつかれた なかまは なまけたり、味方を 攻めたり しちゃうの。'),
            furu(`そのときは 輪を 回して 後ろに さげて、まんなかの「おたすけ」(${btn('help')}) で 助けてあげて！`),
            { who: '', text: '「おたすけ」が つかえるように なった！ げた箱の マットに のると 外に 出られる。' }
        ], { done: () => app.save() });
    }

    // 山 (3 章): 町の 北の 山道から 入る。はじめて 入ると 3 章が 始まる
    function enterYama() {
        warp(YAMA_IN);
        if (g.story !== 'clear2') return;
        g.story = 'yama';
        say([
            { who: '', text: '山道を のぼって、山の 上に 来た。' },
            furu('見て、こおりくん！ 沢が からっぽだよ……。ダムの 水が ぜんぶ 消えちゃったんだ。'),
            furu('このままじゃ 石の川の 水も なくなっちゃう。山の 上の「奥の院」には、むかしの 言いつたえが あるんだって。行ってみよう！'),
            { who: '', text: '山の 南の はしの 入り口から 町に もどれる。' }
        ], { done: () => app.save() });
    }

    // 奥の院の 石碑 (3 章): こおり族の 言いつたえ。読むと 氷の 封印を 調べられる
    function readOkunoin() {
        if (readLegend(g)) {
            sfx('watch');
            say([
                { who: '', text: '奥の院の 中に、古い 石碑が ある……。' },
                { who: '', text: '「むかし、この 山の 水は こおり族が まもっていた。」' },
                { who: '', text: '「こおり族の 王冠を かぶる者は、山の 水を すべて こおらせ、思いのままに できる。ゆえに 王冠は ここに ねむらせる。」' },
                { who: '', text: '石碑の となりの 箱は……からっぽだ！' },
                furu('王冠が ない……！ こおり族って、こおりくんの ご先祖さまだよね？ だれかが 王冠を ぬすんで、ダムの 水を こおらせたんだ！'),
                furu('山の あちこちに、夏なのに とけない 氷の 柱が 立ってたよね。あれが 水を とじこめる「封印」かも。ぜんぶ とかそう！'),
                { who: '', text: '氷の 封印は 3 つ。森の 原っぱ・雪渓・岩場に ある。' }
            ], { done: () => app.save() });
            return;
        }
        say([{ who: '', text: reached(g, 'clear3') ? '石碑の となりの 箱に、こおりの 王冠が もどっている。' : '古い 石碑。むかしの こおり族の 言いつたえが 書いてある。' }]);
    }

    // 氷の 封印を 調べる (3 章) → 封印を まもる キャラと バトル (勝つと とける)
    function examineSeal(m) {
        if (g.mysteries[m.id]) { say([{ who: '', text: m.done }]); return; }
        if (!g.flags.oku) {
            say([{ who: '', text: '夏なのに とけない 氷の 柱だ。さわると すごく つめたい……。' }, furu('奥の院に 行けば、なにか わかるかも。')]);
            return;
        }
        const n = NAKAMA[m.nakama];
        g.zukan.seen[m.nakama] = true;
        say([...m.lines.map(text => ({ who: '', text })), { who: n.name, art: n.art, text: `「${n.line}」` }, { who: '', text: `封印を まもる ${n.name}が おそいかかってきた！` }], {
            done: () => app.startBattle({ enemies: [{ id: m.nakama, lv: m.lv }], kind: 'wild', place: 'yama', mystery: m.id })
        });
    }

    // 七不思議を 調べる → 正体と バトル (勝つと たしかめた ことに なる)
    function examineMystery(m) {
        if (g.mysteries[m.id]) { say([{ who: '', text: m.done }]); return; }
        const n = NAKAMA[m.nakama];
        g.zukan.seen[m.nakama] = true;
        say([...m.lines.map(text => ({ who: '', text })), { who: n.name, art: n.art, text: `「${n.line}」` }, { who: '', text: `七不思議の 正体、${n.name}が おそいかかってきた！` }], {
            done: () => app.startBattle({ enemies: [{ id: m.nakama, lv: m.lv }], kind: 'wild', place: 'school', mystery: m.id })
        });
    }

    // 品物を えらんで、何こ 買うか えらぶ (2026-10-28 ユーザー指定)
    function shop(greet = 'いらっしゃい。なにに するかね？') {
        const OBA = '駄菓子屋の おばあちゃん';
        const labels = SHOP.map(id => `${ITEMS[id].name}  ${ITEMS[id].price}円 (${g.items[id] || 0}こ)`);
        say([{ who: OBA, text: `${greet} (おこづかい ${g.money}円)` }], {
            choices: [...labels, 'やめる'],
            done: i => {
                const id = SHOP[i];
                if (!id) return;
                const it = ITEMS[id], max = maxBuy(g, id);
                if (max === 0) {
                    sfx('cancel');
                    const full = (g.items[id] || 0) >= MAX_ITEM;
                    say([{ who: OBA, text: full ? `${it.name}は もう もちきれないよ。` : 'おこづかいが たりないねえ。' }], { done: () => shop() });
                    return;
                }
                say([{ who: OBA, text: `${it.name}を いくつ ほしいかね？ (おこづかい ${g.money}円)` }], {
                    count: { max, label: n => `${it.name} × ${n} = ${it.price * n}円` },
                    done: n => {
                        if (!n) { shop(); return; }
                        buyItem(g, id, n);
                        sfx('ok');
                        shop(`まいど。${it.name}を ${n}こ だね。ほかには？`);
                    }
                });
            }
        });
    }

    // 戦いから 帰ってきたとき (main.js が 呼ぶ)
    function afterBattle(result) {
        camera();
        if (fighting) {
            if (fighting.spot) g.spotCooldown[fighting.spot] = g.playTime + SPOT_COOLDOWN;
            wild.remove(fighting);
            fighting = null;
        }
        if (result.boss && result.outcome === 'win' && result.bossId === 'kage') {
            say([
                { who: 'ルナシャドウ', art: 'lunashadow', text: '…………（ぺこり）。' },
                furu('影が おとなしく なった……！ あれ？ 窓の 外に だれか いる！'),
                { who: 'おにおに', art: 'onioni', text: 'ちぇっ、七不思議で 町の こどもを こわがらせる 作戦は しっぱいか。おぼえてろよ、こおりくん！' },
                furu('いまの、おにおに……？ 学校の さわぎも、鬼鬼団の しわざだったんだ！'),
                { who: '', text: '２章 クリア！ 七不思議の キャラが 学校を 歩きまわるように なった。' },
                furu('そういえば、山の ほうの ダムの 水が へってるって うわさだよ。……また おにおにかな？'),
                { who: '', text: '町の 北の はしの 山道が 通れるように なった！' }
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'himuro') {
            warp(YAMA_AFTER_BOSS);
            say([
                { who: 'ヒョウガリュウ', art: 'hyougaryu', text: 'グ……王冠の 力に のまれて おったか……。' },
                { who: '', text: '王冠が コロンと 落ちた。氷の 城が とけはじめる……！' },
                { who: '', text: 'ゴゴゴゴ……！ ダムに 水が もどってきた！' },
                { who: 'おにおに', art: 'onioni', text: 'ちぇっ、王冠で ヒョウガリュウを あやつって、水を 止めて 町を こまらせる 作戦も しっぱいか。' },
                { who: 'おにおに', art: 'onioni', text: 'つぎは 商店街の ゲームセンターだ。おぼえてろよ、こおりくん！' },
                furu('おにおに……！ 王冠を ぬすんだのも 鬼鬼団だったんだ。王冠は 奥の院に もどしておこうね。'),
                { who: 'ヒョウガリュウ', art: 'hyougaryu', text: 'こおり族の 子よ……王冠を まもれなかった わびだ。わしも 力を かそう。' },
                { who: '', text: '３章 クリア！ 山の 沢と 石の川に 水が もどった。封印を まもっていた キャラが 山を 歩きまわるように なった。' },
                { who: '', text: '―― ４章は つぎの アップデートで。' }
            ], { done: () => app.save() });
        } else if (result.mystery && result.outcome === 'win' && SEALS.some(x => x.id === result.mystery)) {
            const m = SEALS.find(x => x.id === result.mystery), n = sealsSolved(g);
            say([
                { who: '', text: `氷の 封印「${m.label}」が とけた！ (${n}/${SEALS.length})` },
                ...(allSealsSolved(g) ? [furu('これで 封印は ぜんぶ とけた！ ……ダムの ほうから ゴゴゴって 音が する！'), { who: '', text: 'ダムの 湖の 底の 氷の 城へ 行ってみよう。' }] : [])
            ], { done: () => app.save() });
        } else if (result.mystery && result.outcome === 'win') {
            const m = MYSTERIES.find(x => x.id === result.mystery), n = mysteriesSolved(g);
            say([
                { who: '', text: `七不思議「${m.label}」の 正体は ${NAKAMA[m.nakama].name}だった！ (${n}/${MYSTERIES.length})` },
                ...(allMysteriesSolved(g) ? [furu('これで 七つ ぜんぶ たしかめた！ ……あれ？ ろうかの おくに、黒い 影が 走っていった！'), { who: '', text: 'ろうかの 西の はしに 行ってみよう。' }] : [])
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win') {
            say([
                { who: 'ハシシタボウズ', art: 'hashishita', text: '数えまちがえて イライラ してたんだ……ごめんよ。これからは 橋の下で しずかに 数えるよ。' },
                furu('やったね、こおりくん！ これで 東側にも 行けるね。お寺の ほうにも なかまが いるかも！'),
                { who: '', text: '１章 クリア！' },
                furu('そういえば、南の 商店街の 工事も 終わったんだって！ 町の 南の はしから 行けるよ。新しい なかまが いるかも！'),
                { who: '', text: '商店街に 行けるように なった！ ―― ２章は つぎの アップデートで。' }
            ], { done: () => app.save() });
        } else if (result.storyChanged === 'bridge') {
            say([furu('なかまが ふえたね！ そういえば 石の川橋に 足音を 数える 大きな 坊主が いて、だれも 渡れないんだって。行ってみよう！')], { done: () => app.save() });
        } else if (result.outcome === 'lose') {
            say([{ who: '', text: `こおりくんは 家に 逃げかえった……。(${-result.money}円 落とした)` }]);
        }
    }

    // ----- レンズ -----
    function updateLens(dt, input) {
        if (input.pressed.b || input.pressed.y) { lens = null; sfx('cancel'); return; }
        const sp = 110 * dt;
        if (input.held.left) lens.x -= sp;
        if (input.held.right) lens.x += sp;
        if (input.held.up) lens.y -= sp;
        if (input.held.down) lens.y += sp;
        if (input.touch.justDown) lens.drag = { x: input.touch.x, y: input.touch.y };
        if (input.touch.down && lens.drag) {
            lens.x += (input.touch.x - lens.drag.x) * 1.25;
            lens.y += (input.touch.y - lens.drag.y) * 1.25;
            lens.drag = { x: input.touch.x, y: input.touch.y };
        }
        if (!input.touch.down) lens.drag = null;
        if (input.mouse && input.mouse.moved) { lens.x = input.mouse.x; lens.y = input.mouse.y; }
        lens.x = Math.max(10, Math.min(390, lens.x));
        lens.y = Math.max(10, Math.min(230, lens.y));
        let found = null;
        for (const s of SPOTS) {
            const sx = s.x * TILE + 8 - cam.x, sy = s.y * TILE + 8 - cam.y;
            if (Math.hypot(sx - lens.x, sy - lens.y) < LENS_FIND && hiding(s)) found = s;
        }
        if (found) {
            if (lens.spot !== found) { lens.spot = found; lens.charge = 0; }
            lens.charge += dt;
            if (Math.floor(lens.charge * 10) !== Math.floor((lens.charge - dt) * 10)) sfx('lens');
            if (lens.charge >= LENS_TIME) {
                sfx('found');
                const id = app.rng.weighted(spotKinds(g, found)).id;
                const c = wild.reveal(found, id);
                c.pop = t;
                g.zukan.seen[id] = true;
                lens = null;
                say([{ who: '', text: `${NAKAMA[id].name}を 見つけた！` }, furu('出てきたよ！ 話しかけてみよう！')]);
            }
        } else {
            lens.spot = null;
            lens.charge = Math.max(0, lens.charge - dt * 2);
        }
    }

    function update(dt, input) {
        t += dt;
        g.playTime += dt;
        camera();
        wild.update(dt, g.pos);
        if (app.talk.isActive()) return;
        if (lens) { updateLens(dt, input); return; }

        // 下画面の ボタン
        if (input.touch.justDown) {
            if (hasWatch(g) && hit(BTN.lens, input.touch.x, input.touch.y)) { startLens(); return; }
            if (hit(BTN.menu, input.touch.x, input.touch.y)) { sfx('ok'); app.go('menu'); return; }
        }
        if (input.pressed.y && hasWatch(g)) { startLens(); return; }
        if (input.pressed.x || input.pressed.start) { sfx('ok'); app.go('menu'); return; }

        let dx = 0, dy = 0;
        if (input.held.left) dx -= 1;
        if (input.held.right) dx += 1;
        if (input.held.up) dy -= 1;
        if (input.held.down) dy += 1;
        moving = dx || dy;
        if (moving) {
            const speed = (input.held.b ? RUN : WALK) * dt / (dx && dy ? Math.SQRT2 : 1);
            const before = { x: g.pos.x, y: g.pos.y };
            moveHero(g, dx * speed, dy * speed, wild.list);
            walkT += dt;
            if (before.x !== g.pos.x || before.y !== g.pos.y) {
                const lastP = trail[trail.length - 1];
                if (!lastP || Math.hypot(lastP.x - g.pos.x, lastP.y - g.pos.y) >= 1) trail.push({ x: g.pos.x, y: g.pos.y });
                if (trail.length > 120) trail.shift();
            }
        }
        camera();
        followBuddy(dt);
        if (g.story === 'intro' && inShrine(g)) { meetFurukawa(); return; }
        // げた箱の マットに のったら 学校の 外へ
        const ht = heroTile(g);
        if (tileAt(ht.x, ht.y) === 'M') { warp(SCHOOL_OUT); return; }
        // 山道の 入り口 (町の 北の はし → 山 / 山の 南の はし → 町)
        if (tileAt(ht.x, ht.y) === 'U') { if (inYama()) warp(YAMA_OUT); else enterYama(); return; }
        if (input.pressed.a) {
            const c = wild.facing(g.pos);
            if (c) { sfx('ok'); talkToWild(c); return; }
            const target = lookAt(g);
            if (target?.type === 'mystery') { sfx('ok'); examineMystery(target.mystery); return; }
            if (target?.type === 'seal') { sfx('ok'); examineSeal(target.seal); return; }
            if (target?.type === 'gate' && target.gate.id === 'gateYama') {
                sfx('ok');
                say([{ who: '', text: '「この先 山道。落石の ため 通行止め」と 書いてある。' }, ...(hasWatch(g) ? [furu('学校の さわぎが おちついたら 通れるように なるかも。')] : [])]);
                return;
            }
            if (target?.type === 'person') { sfx('ok'); talkToPerson(target.person); } else if (target?.type === 'door') { sfx('ok'); openDoor(target.building); } else if (target?.type === 'gate') { sfx('ok'); say([{ who: '', text: '「この先 商店街。工事中に つき 通行止め」と 書いてある。' }, ...(hasWatch(g) ? [furu('石の川橋の ヌシの 件が かたづいたら 通れるって。')] : [])]); }
        }
    }

    // ふるカワ: 道すじを 18 ドット うしろから なぞり、なめらかに 近づく (2026-10-26 ユーザー指定: かくかく しないように)
    const FOLLOW = 18;
    function followBuddy(dt) {
        let tx = g.pos.x - 14, ty = g.pos.y, left = FOLLOW;
        let prev = { x: g.pos.x, y: g.pos.y };
        for (let i = trail.length - 1; i >= 0; i--) {
            const d = Math.hypot(trail[i].x - prev.x, trail[i].y - prev.y);
            if (d >= left) {
                const k = left / d;
                tx = prev.x + (trail[i].x - prev.x) * k;
                ty = prev.y + (trail[i].y - prev.y) * k;
                left = 0;
                break;
            }
            left -= d;
            prev = trail[i];
            tx = prev.x;
            ty = prev.y;
        }
        // 遠くに 飛んだとき (負けて 家に もどった など) は すぐ そばへ
        if (Math.hypot(tx - buddy.x, ty - buddy.y) > 64) { buddy.x = tx; buddy.y = ty; trail.length = 0; }
        const dx = (tx - buddy.x) * Math.min(1, dt * 10), dy = (ty - buddy.y) * Math.min(1, dt * 10);
        buddy.x += dx;
        buddy.y += dy;
        buddy.moving = Math.hypot(dx, dy) > 0.05;
        if (Math.abs(dx) > 0.05) buddy.flip = dx < 0;
        if (buddy.moving) buddy.walkT += dt;
    }

    // 話せる キャラ (印なし): 会話と、1 日 1 回 道具 (2026-10-28 ユーザー指定)。依頼も ここで たのまれる
    const rewardText = r => [r.money ? `${r.money}円` : '', r.item ? `${ITEMS[r.item].name} ${r.n}こ` : ''].filter(Boolean).join(' と ');
    function talkToFriend(c) {
        const n = NAKAMA[c.id], f = wild.sourceOf(c);
        c.flip = c.x > g.pos.x;
        if (c.target) { c.target = null; c.pause = 3; }
        const who = text => ({ who: n.name, art: n.art, text });
        // 依頼が できていたら お礼
        const q = questOf(g, f.id);
        if (q && questState(g, q.id) === 'active' && questReady(g, q)) {
            const r = completeQuest(g, q);
            sfx('friend');
            say([who(q.thanks), { who: '', text: `依頼「${q.title}」を はたした！ ${rewardText(r)}を もらった！` }], { done: () => app.save() });
            return;
        }
        const lines = f.lines.map(text => ({ who: n.name, art: n.art, text }));
        const gift = takeGift(g, f);
        if (gift) {
            sfx('friend');
            lines.push({ who: '', text: `${ITEMS[gift.item].name}を ${gift.n}こ もらった！` });
        } else if (f.gift) {
            lines.splice(1);
            lines.push({ who: n.name, art: n.art, text: 'また あした 来てね！' });
        }
        if (q && questState(g, q.id) === 'active') {
            const p = questProgress(g, q);
            lines.push(who(`「${q.title}」の こと、たのんだよ！ (${p.now}/${p.need})`));
        } else if (q) {
            // まだ たのまれていない 依頼: うける / あとで
            lines.push(who(q.ask), { who: '', text: `依頼「${q.title}」　お礼: ${rewardText(q.reward)}` });
            say(lines, { choices: ['うける', 'あとで'], done: i => {
                if (i !== 0) { say([who('そっか。気が むいたら また 来てね。')]); return; }
                acceptQuest(g, q.id);
                sfx('ok');
                say([who('ありがとう！ よろしくね！'), { who: '', text: `依頼「${q.title}」を うけた！ (メニューの「いらい」で 見られる)` }], { done: () => app.save() });
            } });
            return;
        }
        say(lines);
    }

    // 町の キャラに 話しかけると バトル
    function talkToWild(c) {
        if (c.friendly) { talkToFriend(c); return; }
        const n = NAKAMA[c.id];
        c.flip = c.x > g.pos.x;
        if (c.target) { c.target = null; c.pause = 3; }
        say([{ who: n.name, art: n.art, text: `「${n.line}」` }, { who: '', text: `${n.name}が おそいかかってきた！` }], {
            done: () => {
                fighting = c;
                const source = wild.sourceOf(c);
                app.startBattle({ enemies: encounter(g, source, app.rng, c), kind: 'wild', place: inYama() ? 'yama' : source.id });
            }
        });
    }

    function startLens() {
        sfx('lens');
        lens = { x: 200, y: 120, charge: 0, spot: null, drag: null };
        if (app.input && app.input.mouse.inside) { lens.x = app.input.mouse.x; lens.y = app.input.mouse.y; }
    }

    // ----- 描く -----
    function drawPeople(ctx) {
        const list = [];
        for (const p of peopleHere(g)) {
            list.push({ y: (p.y + (p.h || 1)) * TILE, draw: () => drawArt(ctx, ART[p.art], Math.floor(t * 2), p.x * TILE + 8 - cam.x, (p.y + (p.h || 1)) * TILE - cam.y, { scale: p.scale || 1 }) });
        }
        const talkable = !lens && !app.talk.isActive() ? wild.facing(g.pos) : null;
        for (const c of wild.list) {
            const n = NAKAMA[c.id];
            const born = c.pop ? Math.min(1, (t - c.pop) / 0.4) : 1;
            list.push({ y: c.y, draw: () => {
                const x = c.x - cam.x, y = c.y - cam.y;
                ctx.fillStyle = 'rgba(0,0,0,0.22)';
                ctx.beginPath();
                ctx.ellipse(x, y + 1, 6, 2.5, 0, 0, Math.PI * 2);
                ctx.fill();
                const hop = c.target ? Math.abs(Math.sin(c.walkT * 10)) * -1.5 : 0;
                drawArt(ctx, ART[n.art], c.target ? Math.floor(c.walkT * 6) : Math.floor(t * 1.5 + c.x), x, y + hop - (1 - born) * 10, { flip: c.flip, alpha: born });
                // 戦える キャラには 赤い「！」(2026-10-28 ユーザー指定)。話せる キャラには なにも つけない
                if (!c.friendly) text(ctx, '!', x, y - 20 + Math.sin(t * 6) * 1.5, { size: 12, align: 'center', bold: true, color: '#ff3a3a' });
                // 依頼が ある (たのみたい・できた) 話せる キャラには 小さな ふきだし
                else if (c !== talkable) {
                    const q = questOf(g, c.friend);
                    const mark = q && (!questState(g, q.id) ? '…' : questReady(g, q) ? '♪' : '');
                    if (mark) {
                        panel(ctx, x - 7, y - 30 + Math.sin(t * 4) * 1, 14, 11, { fill: 'rgba(255,255,255,0.95)', edge: '#1b3a6b', r: 4, lineWidth: 1 });
                        text(ctx, mark, x, y - 21.5 + Math.sin(t * 4) * 1, { size: 9, align: 'center', bold: true, color: mark === '♪' ? '#d0408a' : '#1b3a6b', shadow: false });
                    }
                }
                // もう 仲間に した キャラには 金の メダル (2026-10-28 ユーザー指定)
                if (!c.friendly && g.zukan.friends[c.id]) drawFriendMark(ctx, x + 8, y - 24, 4);
                // 話しかけられる キャラの 上に ふきだし
                if (c === talkable) {
                    const label = `${btn('a')} はなす`;
                    panel(ctx, x - 22, y - 36, 44, 13, { fill: 'rgba(255,255,255,0.95)', edge: '#1b3a6b', r: 4, lineWidth: 1 });
                    text(ctx, label, x, y - 26.5, { size: 9, align: 'center', bold: true, color: '#1b3a6b', shadow: false });
                }
            } });
        }
        // ふるカワ (ウォッチを もらったあとは ついてくる)
        if (hasWatch(g)) {
            const bf = buddy.moving ? Math.floor(buddy.walkT * 6) : Math.floor(t * 1.5);
            list.push({ y: buddy.y - 0.1, draw: () => drawArt(ctx, ART.furukawa, bf, buddy.x - cam.x, buddy.y - cam.y + 1, { flip: buddy.flip }) });
        }
        const frame = moving ? Math.floor(walkT * 6) % 2 : Math.floor(t * 1.5) % 2;
        list.push({ y: g.pos.y, draw: () => drawArt(ctx, ART.koori, frame, g.pos.x - cam.x, g.pos.y - cam.y + 2, { flip: g.pos.dir === 'left' }) });
        list.sort((a, b) => a.y - b.y).forEach(o => o.draw());
    }

    function drawTop(ctx) {
        ensureCanvas(reached(g, 'clear3'));
        ctx.drawImage(fieldCanvas, cam.x, cam.y, 400, 240, 0, 0, 400, 240);
        // 川の きらきら (町だけ)
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let i = 0; !inSchool() && !inYama() && i < 6; i++) {
            const wy = ((i * 97 + t * 30) % ((SCHOOL_Y0 - 1) * TILE));
            ctx.fillRect(30 * TILE + ((i * 23) % 60) - cam.x, wy - cam.y, 4, 1);
        }
        // 学校の 教室の 名札と、まだ たしかめて いない 七不思議の「？」
        if (inSchool()) {
            for (const r of SCHOOL_ROOMS) {
                const sx = r.x * TILE + 8 - cam.x, sy = r.y * TILE + 2 - cam.y, w = r.label.length * 10 + 8;
                if (sx < -60 || sx > 460 || sy < -20 || sy > 260) continue;
                panel(ctx, sx - w / 2, sy - 9, w, 13, { fill: 'rgba(240,240,250,0.92)', edge: '#3a3040', r: 2, lineWidth: 1 });
                text(ctx, r.label, sx, sy + 1, { size: 9.5, align: 'center', color: '#2a2030', shadow: false, bold: true });
            }
            if (reached(g, 'school')) {
                for (const m of MYSTERIES) {
                    if (g.mysteries[m.id]) continue;
                    text(ctx, '？', m.x * TILE + 8 - cam.x, m.y * TILE - 10 - cam.y + Math.sin(t * 4 + m.x) * 2, { size: 13, align: 'center', bold: true, color: '#c88aff' });
                }
            }
        }
        // 看板
        for (const b of BUILDINGS) {
            const sx = b.door.x * TILE + 8 - cam.x, sy = b.y * TILE + 10 - cam.y;
            if (sx > -60 && sx < 460 && sy > -20 && sy < 260) {
                panel(ctx, sx - b.label.length * 5 - 4, sy - 9, b.label.length * 10 + 8, 13, { fill: 'rgba(255,250,235,0.92)', edge: '#5a3a20', r: 2, lineWidth: 1 });
                text(ctx, b.label, sx, sy + 1, { size: 9.5, align: 'center', color: '#3a2410', shadow: false, bold: true });
            }
        }
        for (const s of SPOTS) if (hiding(s)) drawCue(ctx, s, s.x * TILE + 8 - cam.x, s.y * TILE + 8 - cam.y, t);
        drawGates(ctx);
        drawSeals(ctx);
        drawPeople(ctx);
        // 時間帯の 色・雨
        if (TINT[g.time]) { ctx.fillStyle = TINT[g.time]; ctx.fillRect(0, 0, 400, 240); }
        if (g.weather === 'rain' && !inSchool()) {
            ctx.fillStyle = 'rgba(40, 60, 100, 0.15)';
            ctx.fillRect(0, 0, 400, 240);
            ctx.strokeStyle = 'rgba(200, 220, 255, 0.55)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            for (let i = 0; i < 40; i++) {
                const rx = (i * 53 + t * 40) % 420 - 10, ry = (i * 37 + t * 260) % 260 - 10;
                ctx.moveTo(rx, ry);
                ctx.lineTo(rx - 3, ry + 9);
            }
            ctx.stroke();
        }
        if (lens) drawLens(ctx);
        app.talk.drawTop(ctx, t);
    }

    // 氷の 封印 (3 章): まだ とけて いない 氷の 柱。言いつたえを 読んだ あとは「？」
    function drawSeals(ctx) {
        for (const m of sealsHere(g)) {
            const x = m.x * TILE - cam.x, y = m.y * TILE - cam.y;
            if (x < -30 || x > 430 || y < -40 || y > 270) continue;
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + 1, y + 13, 14, 3);
            ctx.fillStyle = '#7ac8e8'; ctx.fillRect(x + 3, y - 10, 10, 25);
            ctx.fillStyle = '#bfeaff'; ctx.fillRect(x + 4, y - 13, 8, 4); ctx.fillRect(x + 5, y - 8, 3, 18);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 5, y - 9, 1, 6);
            ctx.fillStyle = '#5aa8d0'; ctx.fillRect(x + 11, y - 8, 1, 20);
            if (g.flags.oku) text(ctx, '？', x + 8, y - 20 + Math.sin(t * 4 + m.x) * 2, { size: 13, align: 'center', bold: true, color: '#8ae0ff' });
        }
    }

    // 工事中の さく (黄色と 黒の しましま)
    function drawGates(ctx) {
        for (const q of gatesHere(g)) {
            const x = q.x * TILE - cam.x, y = q.y * TILE - cam.y, w = q.w * TILE;
            if (x < -40 || x > 440 || y < -40 || y > 280) continue;
            ctx.fillStyle = '#5a5a5a';
            ctx.fillRect(x + 1, y + 4, 2, 12);
            ctx.fillRect(x + w - 3, y + 4, 2, 12);
            for (let i = 0; i < w; i += 6) {
                ctx.fillStyle = (i / 6) % 2 ? '#202020' : '#ffd040';
                ctx.fillRect(x + i, y + 5, 6, 5);
            }
            const label = q.label || '工事中', lw = label.length * 10 + 6;
            panel(ctx, x + w / 2 - lw / 2, y - 9, lw, 12, { fill: '#ffd040', edge: '#202020', r: 2, lineWidth: 1 });
            text(ctx, label, x + w / 2, y + 0.5, { size: 9, align: 'center', bold: true, color: '#202020', shadow: false });
        }
    }

    function drawLens(ctx) {
        const shake = lens.spot ? Math.sin(t * 60) * Math.min(2, lens.charge * 2) : 0;
        const lx = lens.x + shake, ly = lens.y;
        // レンズの 外を 暗く
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, 400, 240);
        ctx.arc(lx, ly, LENS_R, 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgba(8, 12, 30, 0.62)';
        ctx.fill('evenodd');
        ctx.restore();
        // 近くに いると きらきら
        for (const s of SPOTS) {
            if (!hiding(s)) continue;
            const sx = s.x * TILE + 8 - cam.x, sy = s.y * TILE + 8 - cam.y;
            const d = Math.hypot(sx - lx, sy - ly);
            if (d < LENS_R + 4) {
                ctx.fillStyle = `rgba(255, 240, 140, ${0.5 + 0.5 * Math.sin(t * 8)})`;
                ctx.fillRect(sx - 1, sy - 4, 2, 8);
                ctx.fillRect(sx - 4, sy - 1, 8, 2);
            }
        }
        ctx.strokeStyle = lens.spot ? COLORS.accent : '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(lx, ly, LENS_R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#1b3a6b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(lx, ly, LENS_R + 2, 0, Math.PI * 2);
        ctx.stroke();
        if (lens.spot) {
            ctx.strokeStyle = COLORS.accent;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(lx, ly, LENS_R + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (lens.charge / LENS_TIME));
            ctx.stroke();
        }
    }

    function drawBottom(ctx) {
        ctx.fillStyle = '#16203a';
        ctx.fillRect(0, 0, 320, 240);
        if (lens) {
            text(ctx, 'さがすレンズ', 160, 30, { size: 16, align: 'center', bold: true, color: COLORS.ice });
            panel(ctx, 20, 44, 280, 130, { fill: 'rgba(255,255,255,0.05)' });
            text(ctx, 'ここを なぞって レンズを 動かす', 160, 104, { size: 13, align: 'center', color: COLORS.sub });
            text(ctx, '(十字キー・上画面の マウスでも 動く)', 160, 124, { size: 11, align: 'center', color: COLORS.dim });
            text(ctx, lens.spot ? '……なにか いる！ そのまま！' : 'へんな ところに レンズを 合わせよう', 160, 196, { size: 13, align: 'center', bold: Boolean(lens.spot), color: lens.spot ? COLORS.accent : COLORS.ink });
            text(ctx, `${btn('b')} で やめる`, 160, 226, { size: 11, align: 'center', color: COLORS.dim });
            return;
        }
        const ht = heroTile(g);
        text(ctx, `${g.day}日目 ${TIMES[g.time]} ${g.weather === 'rain' ? '雨' : 'はれ'}　${AREAS[areaAt(ht.x, ht.y)]}`, 10, 18, { size: 12, bold: true, maxWidth: 230 });
        text(ctx, `${g.money}円`, 310, 18, { size: 12, align: 'right', color: COLORS.accent });
        // 地図 (商店街が ふえて 縦に 長いので、こおりくんの まわりを 切りだす)
        panel(ctx, 6, 26, 148, 112, { fill: '#000', r: 3 });
        const [rTop, rBottom] = region();
        const [mTop, mBottom] = [rTop * 3, (rTop === 0 ? rBottom - 1 : rBottom) * 3];
        const my = Math.max(mTop, Math.min(mBottom - 108, Math.round(g.pos.y / TILE * 3 - 54)));
        ctx.drawImage(miniCanvas, 0, my, 144, 108, 8, 28, 144, 108);
        if (Math.floor(t * 4) % 2) {
            ctx.fillStyle = '#ff3a5a';
            ctx.fillRect(8 + g.pos.x / TILE * 3 - 2, 28 + g.pos.y / TILE * 3 - 4 - my, 4, 4);
        }
        // 建物の 名前 (地図の 中に 見えている ぶん)
        ctx.save();
        ctx.beginPath();
        ctx.rect(8, 28, 144, 108);
        ctx.clip();
        const placed = [];   // 名前どうしが 重なったら 下へ ずらす
        const labels = inYama()
            ? YAMA_PLACES.map(r => ({ id: r.id, name: r.label, cx: r.x, cy: r.y }))
            : inSchool()
            ? SCHOOL_ROOMS.filter(r => r.id !== 'getabako').map(r => ({ id: r.id, name: r.label, cx: r.x + 0.5, cy: r.y + 3 }))
            : BUILDINGS.map(b => ({ id: b.id, name: MINI_NAMES[b.id] || b.label, cx: b.x + b.w / 2, cy: b.y + b.h / 2 }));
        for (const b of labels) {
            const name = b.name;
            const bx = 8 + b.cx * 3;
            let by = 28 + b.cy * 3 - my;
            const w = textWidth(ctx, name, 8, true) + 4;
            const x = Math.max(8 + w / 2, Math.min(152 - w / 2, bx));
            while (placed.some(q => Math.abs(q.x - x) < (q.w + w) / 2 && Math.abs(q.y - by) < 10)) by += 10;
            placed.push({ x, y: by, w });
            if (by < 34 || by > 132) continue;   // 地図の はしで 切れる ものは 出さない
            ctx.fillStyle = 'rgba(10, 16, 36, 0.72)';
            ctx.fillRect(Math.round(x - w / 2), Math.round(by - 6), Math.round(w), 10);
            text(ctx, name, x, by + 2, { size: 8, align: 'center', bold: true, color: b.id === 'dagashi' ? COLORS.accent : '#ffffff', shadow: false });
        }
        ctx.restore();
        // 目的地の しるし
        const goal = g.story === 'intro' ? { x: 6, y: 5 } : g.story === 'bridge' ? { x: 31, y: 17 }
            : g.story === 'clear' ? { x: 19, y: 6 } : g.story === 'school' && allMysteriesSolved(g) ? { x: 9, y: 70 }
            : g.story === 'clear2' ? { x: 26.5, y: 0 } : g.story === 'yama' && !g.flags.oku ? { x: 7, y: YAMA_Y0 + 5 }
            : g.story === 'yama' && allSealsSolved(g) ? { x: 32, y: YAMA_Y0 + 6 } : null;
        const gy = goal ? 28 + goal.y * 3 + 4 - my : 0;
        if (goal && gy > 30 && gy < 136) text(ctx, '!', 8 + goal.x * 3, gy, { size: 12, bold: true, align: 'center', color: COLORS.accent });
        button(ctx, BTN.lens, { disabled: !hasWatch(g) });
        button(ctx, BTN.menu);
        text(ctx, hasWatch(g) ? `なかま ${g.medals.length} / 図鑑 ${friendCount(g)}` : 'ウォッチを まだ もっていない', 238, 132, { size: 11, align: 'center', color: COLORS.sub });
        panel(ctx, 6, 146, 308, 52);
        text(ctx, 'もくてき', 14, 162, { size: 10, color: COLORS.accent, bold: true });
        const os = fitSize(ctx, objective(g), 290, 12, 2, 9);
        wrap(ctx, objective(g), 290, os).slice(0, 2).forEach((r, i) => text(ctx, r, 14, 178 + i * (os + 3), { size: os }));
        text(ctx, `${moveName()} 歩く　${btn('a')} はなす・しらべる　${btn('b')} おしたまま はしる`, 160, 220, { size: 10.5, align: 'center', color: COLORS.dim });
        text(ctx, `${btn('y')} レンズ　${btn('x')} メニュー`, 160, 234, { size: 10.5, align: 'center', color: COLORS.dim });
        app.talk.drawBottom(ctx);
    }

    return { name: 'field', update, drawTop, drawBottom, afterBattle, debug: { lens: () => lens, cam, buddy, wild } };
}

export const nakamaName = id => NAKAMA[id]?.name || id;
