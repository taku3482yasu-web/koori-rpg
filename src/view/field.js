// =====================================================================
// 町の 場面: 上画面で 歩く・調べる・レンズで さがす、下画面に 地図と ボタン (設計書 5 章・7 章)
// 2 章: 小学校の 入り口 (夕方・夜) から 校舎の 中へ。七不思議を 調べると バトル。げた箱の マットで 外へ
// 3 章: 町の 北の 山道から 山と ダムへ。奥の院の 言いつたえ → 氷の 封印 3 つ → ダムの主 (ヒョウガリュウ)
// 4 章: ともいしと 話す → 商店街の 石の川駅から 電車で 海辺の 町へ → ライバル探検隊 (バージョンで ちがう) → 黒い 紋の 浦の島重蔵
// 5 章: ともいし → ダイシの 手紙 → 電車で ネット寺 → 黒い 紋の 3 体を 助ける → コオニンの かげ → 紋に のまれた ダイシ
// 6 章: ともいし → 電車で 忍びの屋敷 → 庭の ズミタニ (影分身) → 奥の 間で ルキハ と おにおに → 東の 蔵の 幹部 トモオカ (右腕)
// 7 章: 電車で 月の迷宮 (ルナヤに まねかれる) → 迷宮の 奥の 月の 鏡で 回想 → ルナヤ (満ちていく 月)
// 8 章: 電車で 金色のSE城 (ライバル探検隊が 門を こじあける) → 幹部 大鬼・双頭鬼・金滅鬼 → 玉座の 間の おにおに → ルキハ
// 12 章: ともいしの 家で 黒い 空 → 神社に みんなが あつまる → おにおに・鬼神と 勝負 (必殺技が 進化) → 家で ねると 出発の 前の 夜
// 大魔王ASO: 14 章 クリアの あと ASO の 間で 話すと 勝負 (推奨 Lv90)。勝つと なかまに
// 11 章: ともいしの 家で ルキハの 城への 道の 話 → 電車で ASOの壺の底 → 火山の 底の バクエンリュウ・闇 (ASO が 道具を 投げる) → ASO の 間
// 10 章: 町に もどると 黒い 霧 → 石の川タウンと 商店街の キャラは ぜんぶ 紋つき「・闇」→ 5 回 助けると 家の 前に 幹部 タシケダ
// 9 章: ともいしの 家で おにおにが なかまに → 電車で 筋肉の山 → 雪どけの 氷河の ハル麒麟 (角) → 山頂の ノゾエマ → 必殺技が 進化
// 14 章 (バージョンで ちがう): ともいしの 家で 招待券 → 電車で 遊園地 → 駅で 帰ろうとすると ふるカワが いない → 夜の 手がかり 3 つ →
//   残党の ボス (内定 サアラハ / 免許 リハマ)。セリフは ストーリー工房の 14 章の あらすじから Claude が 書いた 仮組
// 15 章「新たなる１日」: 石の川駅の 前の 無限回廊の 番人・ライバル探検隊の 仲間クエスト
//   セリフは ストーリー工房 (https://claude.ai/artifact/2FExjjNSVxzmaDyk81oJxH) の 4〜6 章の とおり
// =====================================================================
import { ART } from '../art/index.js';
import { TILE, MAP_W, SPOTS, BUILDINGS, areaAt, tileAt, regionOf, SCHOOL_Y0, SCHOOL_IN, SCHOOL_OUT, SCHOOL_OPEN, SCHOOL_ROOMS, MYSTERIES,
    YAMA_Y0, YAMA_IN, YAMA_OUT, YAMA_AFTER_BOSS, YAMA_PLACES, SEALS, UMI_Y0, UMI_IN, STATION_OUT, UMI_AFTER_BOSS, UMI_PLACES, inCaveTile,
    TERA_Y0, TERA_IN, TERA_AFTER_BOSS, TERA_PLACES, MONS, YASHIKI_Y0, YASHIKI_IN, YASHIKI_PLACES, MOON_Y0, MOON_IN, MOON_PLACES, SHIRO_Y0, SHIRO_IN, SHIRO_PLACES, PARK_Y0, PARK_IN, PARK_PLACES, PARK_NAME, PARK_CLUES,
    KINNIKU_Y0, KINNIKU_IN, KINNIKU_PLACES, TSUBO_Y0, TSUBO_IN, TSUBO_PLACES, KURAI_Y0, KURAI_IN, KURAI_PLACES } from '../data/map.js';
import { ITEMS, SHOP } from '../data/items.js';
import { FUSION_HINTS } from '../data/fusion.js';
import { NAKAMA, AREAS, RIVALS, rivalTeam, TEAMS, BOSSES, BOSS14 } from '../data/nakama.js';
import { COLORS, drawArt, panel, text, textWidth, wrap, fitSize, button, hit, drawFriendMark } from '../core/draw.js';
import { sfx } from '../core/sound.js';
import { btn, moveName } from '../core/keys.js';
import { moveHero, lookAt, peopleHere, inShrine, gatesHere, sealsHere, heroTile, mysteriesSolved, allMysteriesSolved, personArt, monsHere } from '../logic/world.js';
import { reached } from '../logic/story.js';
import { questOf, questState, questReady, questProgress, acceptQuest, completeQuest } from '../logic/quests.js';
import { TIMES, objective, hasWatch, spotActive, spotKinds, encounter, receiveWatch, advanceTime, bossEnemies, friendCount, takeGift, maxBuy, buyItem, MAX_ITEM, readLegend, sealsSolved, allSealsSolved,
    startChapter4, arriveUmi, canRideTrain, rivalEnemies, startChapter5, arriveTera, trainLines, monsSaved, allMonsSaved, startChapter6, arriveYashiki, arriveMoon, arriveShiro,
    startChapter9, arriveKinniku, startChapter10, DARK10_GOAL, darkTown, startChapter11, arriveTsubo, meetAso, startChapter12, startChapter13, arriveKurai, nightBefore, canFightAso, startChapter14, arrivePark, parkNight, findClue, cluesFound, boss14Enemies, kairouOf, kairouEnemies, teamEnemies } from '../logic/game.js';
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
    jansou: '雀荘', denkiya: '電気屋', honya: '本屋', karaoke: 'カラオケ', sentou: '銭湯', okunoin: '奥の院', station: '駅'
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

    // 学校の 中・山・海に いるか (町と 学校と 山と 海は つながって いないので、カメラも 地図も べつに する)
    const between = (y0, y1) => g.pos.y >= y0 * TILE && g.pos.y < y1 * TILE;
    const inKurai = () => g.pos.y >= KURAI_Y0 * TILE;
    const inTsubo = () => between(TSUBO_Y0, KURAI_Y0);
    const inKinniku = () => between(KINNIKU_Y0, TSUBO_Y0);
    const inPark = () => between(PARK_Y0, KINNIKU_Y0);
    const darkHere = () => g.story === 'shuugeki' && g.pos.y < SCHOOL_Y0 * TILE;   // 10 章の 黒い 霧 (町と 商店街)
    const inHyouga = () => between(KINNIKU_Y0 + 10, KINNIKU_Y0 + 16);   // 雪どけの 氷河 (バトルの 背景)
    const inShiro = () => between(SHIRO_Y0, PARK_Y0);
    const inMoon = () => between(MOON_Y0, SHIRO_Y0);
    const inYashiki = () => between(YASHIKI_Y0, MOON_Y0);
    const inTera = () => between(TERA_Y0, YASHIKI_Y0);
    const inUmi = () => between(UMI_Y0, TERA_Y0);
    const inYama = () => g.pos.y >= YAMA_Y0 * TILE && g.pos.y < UMI_Y0 * TILE;
    const inSchool = () => g.pos.y >= SCHOOL_Y0 * TILE && g.pos.y < YAMA_Y0 * TILE;
    const inCave = () => { const ht = heroTile(g); return inCaveTile(ht.x, ht.y); };
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
    const tomo = text => ({ who: 'ともいし', art: 'tomoishi', text });
    const nar = text => ({ who: '', text });
    const by = (id, text) => ({ who: RIVALS[id]?.name || NAKAMA[id]?.name || id, art: RIVALS[id]?.art || NAKAMA[id]?.art || id, text });
    // ライバル探検隊の セリフ (4 章。前作の 口調。バージョンで チームが ちがう)
    const RIVAL_LINES = {
        naitei: {
            meet: ['asahara', 'おまえが うわさの こおりくんか。海岸どうくつの 奥の お宝は、ワシら ASK-3が いただく！'],
            block: [['asahara', 'ここを 通りたくば、ワシらに 勝ってみせよ！ CS城の主の力、見せてやろう！'], ['sasaki', 'どうも、しご出来です。'], ['kotani', '勝率は計算済みです。']],
            lose: [['asahara', 'ぐぬぬ……この ワシが……負けただと……！'], ['asahara', '……約束は 約束だ。先に 行くがよい。ただし、お宝の 分けまえは もらうぞ！']]
        },
        menkyo: {
            meet: ['ueno', 'おまえが うわさの こおりくんか。海岸どうくつの 奥の お宝は、我ら お願いマッスルが いただく！'],
            block: [['ueno', 'ここを 通りたくば、我らに 勝ってみせよ！ 我が筋肉の前に ひれ伏すがよい！'], ['shibata', 'ぶんぶん！ 撮れ高いただき！ んなああ～'], ['ikekimu', 'チッ…邪魔だ。']],
            lose: [['ueno', 'み……見事な……筋肉……いや、見事な なかまたちだ……。'], ['ueno', '我らの 負けだ。先に 行くがよい！']]
        }
    };
    const rivalLines = () => RIVAL_LINES[g.version] || RIVAL_LINES.naitei;
    // 15 章: ライバル探検隊の 仲間クエスト (Claude の 仮組)
    const TEAM_LINES = {
        '5dx': 'イェア！ チーム5DX、ノリで 勝負だバ！ 勝ったら おれたちも なかまに なってやるバ！',
        ask3: 'ルキハの 件では 世話に なったな。……だが 勝負は 別だ！ ワシら ASK-3に 勝てたら、なかまに なってやろう！',
        kemono: 'ピョンッ！ チーム・ケモノミチ、迷宮で きたえた 力を 見せてやる！ 勝ったら なかまだ！',
        muscle: '我ら お願いマッスル！ 筋肉で 語りあおうではないか！ 勝てば なかまに なってやろう！',
        bartas: 'チームバータスよ。勝てたら わたしたちの 美しさ、あなたに あずけて あげる。'
    };
    const TEAM_WIN = {
        '5dx': 'ま～いったバ！ ノリで なかまに なるバ！ イェア！',
        ask3: 'ぐぬぬ……約束は 約束だ。ASK-3、きさまに ついて いこう！',
        kemono: 'ピョンッ……まけた！ 迷宮の 外も 楽しそうだ。なかまに なるぞ！',
        muscle: 'み……見事な 筋肉……いや、見事な なかまたちだ！ 我らも 加わろう！',
        bartas: 'ふふ、負けたわ。いいわ、あなたの なかまに なって あげる。'
    };

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
                // 4 章から (前作の ともいしの 口調: こおりを「こおり」と よぶ・博多弁)
                umi: ['海辺の 町に 行くとね？ 電車は 商店街の 西の はしの 石の川駅からよ。', 'こおり、知らない 人に ついて いったら いかんよ！'],
                umibe: ['海辺の 町は どうやった？ ……こおり、あんた とけとらんね？ 日焼けには 気を つけなさい！'],
                clear4: ['海辺の 町でも 大活躍したらしいね！ ……でも その フードの 人、なんか 気味が わるかね。', `なかまは ${friendCount(g)} 人？ ……それより こおり、お金は ちゃんと 返しなさいよ！`],
                tera: ['ネット寺に 行くとね？ 電車は 石の川駅からよ。', 'お寺では しずかに しなさいよ！ こおり、あんたは いっつも うるさいけん。'],
                netdera: ['ネット寺は どうやった？ ダイシさん、元気に しとんしゃった？'],
                clear5: ['ネット寺の のろいも といたらしいね！ ……ルキハ？ なんか こわい 名前やね。', `なかまは ${friendCount(g)} 人？ ……こおり、ちゃんと 宿題も しなさいよ！`],
                shinobi: ['忍びの屋敷へ 行くとね？ 電車は 石の川駅からよ。', 'こおり、メダルを とりもどすまで 帰ってこんでいいけんね！ ……うそうそ、ごはんには 帰ってきなさい。'],
                yashiki: ['忍びの屋敷は どうやった？ 忍者さんって ほんとに いるとね？'],
                clear6: ['町の 子たちの メダル、とりもどしてくれたって？ こおり、えらいやん！', 'おにおにくん……どうしたっちゃろうね。こおり、なんか しっとうと？'],
                meikyu: ['月の迷宮？ まよったら いかんよ。こおり、あんた 方向おんちやけん。'],
                clear7: ['おにおにくんを とりもどしに 行くと？ ……こおり、ちゃんと 連れて 帰ってきなさいよ。'],
                oshiro: ['SE城？ 金ピカの お城なんて、おにおにくんも 出世したもんやね。……え、ちがうと？'],
                onijoin: ['筋肉の山？ おにおにくんも いっしょなら 安心やね。……こおり、ちゃんと 修行してきなさいよ。'],
                kinniku: ['ノゾエマさんって、鏡に むかって 筋肉と 話す 人やろ？ ……こおり、まねしたら いかんよ。'],
                clear9: ['こおり、なんか たくましく なったんやない？'],
                shuugeki: [(g.flags.dark10 || 0) >= DARK10_GOAL ? 'こおり！ 来たら いかん！' : 'こおり！ 町じゅう 紋つきだらけよ！ ……お母さんは だいじょうぶ、家で まっとるけん。'],
                clear10: ['こおり、ありがとね。'],
                tsuboe: ['ASOの壺？ 大魔王が ねむっとるって 話やないね……。こおり、ほんとに 気を つけなさいよ。'],
                tsubo: ['壺の 底は 熱いっちゃろ？ 水筒 もっていきなさい。'],
                clear11: ['ASOさんって 人に 会えたと？ ……こおり、なんか 顔つきが かわったね。'],
                shuuketsu: ['神社に みんな あつまっとるらしいよ。……こおり、あんた いつのまに こんなに ともだちが できたと？'],
                clear12: ['……ほら、ふるカワちゃんが また 来とるよ。'],
                kuraie: ['こおり、おべんとう もった？ ……ちゃんと 帰って きなさいよ。'],
                kurai: ['こおり……。お母さん、ここで まっとるけんね。'],
                clear13: ['おかえり、こおり。……ほんとに よう がんばったね。'],
                invite: [`${parkName()}、たのしんで おいで！ ……おみやげは まんじゅうで よかよ。`],
                park: ['遊園地は どうね？ 暗く なる 前に 帰ってきなさいよ。'],
                yoru: ['ふるカワちゃんが いなく なったと！？ こおり、はよ さがしに 行きなさい！'],
                clear14: ['ふるカワちゃん、ぶじで よかったねえ。……さあ こおり、今日は 新しい 1 日よ。', `なかまは ${friendCount(g)} 人？ この 町の キャラ、ぜんぶ なかまに できるかもね。`],
                clear8: ['おにおにくん、もどってきたっちゃろ？ よかったやん！ ……ルキハって 人は、まだ どこかに おるとね？']
            }[g.story];
            if (startChapter9(g)) {
                // 9 章の はじまり「おにおにと いっしょに」(ストーリー工房 9 章 場面 1)
                say([
                    by('onioni', 'おい、こおり。おれも 行くぞ。ルキハには たっぷり 借りを 返して もらわんとな！ ……おまえの 借金は べつだぞ。'),
                    tomo('あら、おにおにくん。ごはん 食べていきなさい。……こおり、おにおにくんに お金 返したと？ 今すぐ 返しなさい！'),
                    nar('おにおにが なかまに なった！'),
                    furu('ルキハと 戦うには、もっと 強く ならなきゃ。……筋肉の山の ノゾエマさんに 修行を つけて もらおう！'),
                    nar('石の川駅から、電車で 筋肉の山へ 行けるように なった！')
                ], { done: () => app.save() });
                return;
            }
            if (startChapter13(g)) {
                // 13 章の はじまり「出発」(ストーリー工房 12 章 場面 3 の つづき。セリフは Claude の 仮組)
                say([
                    nar('朝。黒い 空の むこうに、ルキハの 城が うかんでいる。'),
                    tomo('……行って らっしゃい、こおり。'),
                    furu('石の川駅から、城へ つづく 黒い 光の 道が のびてるって！'),
                    by('onioni', 'みんな 先に 行って まっとるぞ。……さあ、終わらせに 行くか。'),
                    nar('石の川駅から、喰らいの 城へ 行けるように なった！')
                ], { done: () => app.save() });
                return;
            }
            if (startChapter12(g)) {
                // 12 章の はじまり「黒い 空」(ストーリー工房 12 章 場面 1)
                say([
                    nar('空が 黒く そまり、世界じゅうに 紋つきの 軍勢が あらわれた。'),
                    furu('ルキハが 本気で 世界を 喰おうと してる……！'),
                    tomo('こおり、神社に みんなが あつまっとるらしいよ。行って きなさい。'),
                    nar('石の川神社へ 行こう。')
                ], { done: () => app.save() });
                return;
            }
            if (startChapter11(g)) {
                // 11 章の はじまり (ストーリー工房 11 章 あらすじ。セリフは Claude の 仮組)
                say([
                    furu('こおりくん！ ルナヤさんから 手紙が きたよ！'),
                    furu('「ルキハの 城へ 行く 道は、ASOの壺の底に ある。……壺の 底よ、壺の 底。わすれないでね？」だって。'),
                    by('onioni', 'ASOの壺……大魔王が ねむっとる 所か。おもしろい、行ってやろうじゃないか。'),
                    tomo('こおり、ちゃんと 帰って くるんよ。'),
                    nar('石の川駅から、電車で ASOの壺の底へ 行けるように なった！')
                ], { done: () => app.save() });
                return;
            }
            if (startChapter14(g)) {
                // 14 章の はじまり (ストーリー工房 14 章 = 内定・15 章 = 免許 の あらすじから。仮組)
                const menkyo = g.version === 'menkyo';
                say([
                    nar(menkyo ? 'ルキハとの 戦いから しばらく。こおりくんは 車の 免許を とるため、自動車学校に かよっていた。' : 'ルキハとの 戦いから しばらく。こおりくんは 内定を とるため、毎日 がんばっていた。'),
                    tomo('こおり、ふるカワちゃんが 来とるよ。なんか うれしそうな 顔して。'),
                    furu(`こおりくん、見て見て！ 新しく できた アミューズメント${menkyo ? '施設' : 'パーク'}「${parkName()}」の 招待券！ 3 まい あるの！`),
                    by('onioni', 'おれも 行くぞ！ ……タダなら な。'),
                    furu('石の川駅から 電車で 行けるんだって！ いっしょに 行こう！'),
                    nar(`石の川駅から、電車で ${parkName()}へ 行けるように なった！`)
                ], { done: () => app.save() });
                return;
            }
            if (startChapter6(g)) {
                // 6 章の はじまり「ねらわれた メダル」(ストーリー工房 6 章 場面 1)
                say([
                    tomo('こおり！ 町の 子たちの メダルが ぬすまれたって 大さわぎよ。あんた なにしよっと！ はよ 行きなさい！'),
                    furu('鬼鬼団の しわざだって うわさだよ。忍びの屋敷の ズミタニさんが 追ってるみたい！'),
                    nar('石の川駅から、電車で 忍びの屋敷へ 行けるように なった！')
                ], { done: () => app.save() });
                return;
            }
            if (startChapter5(g)) {
                // 5 章の はじまり「ダイシの 手紙」(ストーリー工房 5 章 場面 1)
                say([
                    tomo('こおり、あんた あてに 手紙が きとるよ。'),
                    nar('ネット寺の ダイシから 手紙が とどいた。'),
                    nar('「寺の 者たちが 黒い 紋に のろわれた。たすけて ほしい。」'),
                    furu('また 黒い 紋……！ 行こう、こおりくん！'),
                    nar('石の川駅から、電車で ネット寺へ 行けるように なった！')
                ], { done: () => app.save() });
                return;
            }
            if (startChapter4(g)) {
                // 4 章の はじまり「王冠の なぞ」(ストーリー工房 4 章 場面 1)
                say([
                    tomo('こおり、ダムの 水 よう もどしたね！ ……で、王冠を ぬすんだ 人は まだ つかまっとらんと？'),
                    furu('うん……。王冠の 箱の まわりに、黒い すすみたいな ものが のこってたの。'),
                    furu('海辺の 町でも、なかまが 急に あばれだす 事件が あるんだって。もしかしたら 関係 あるかも！'),
                    { who: 'こおりくん', art: 'koori', text: '（行ってみよう！）' },
                    nar('商店街の 西の はしの 石の川駅から、電車で 海辺の 町へ 行けるように なった！')
                ], { done: () => app.save() });
                return;
            }
            say(lines.map(text => tomo(text)));
        } else if (p.id === 'rival4') {
            // 4 章: ライバル探検隊が どうくつの 通路を ふさいでいる → 3 体の バトル
            const L = rivalLines();
            say([...L.block.map(([id, text]) => by(id, text)), nar(`チーム「${rivalTeam(g.version).name}」が 勝負を いどんできた！`)],
                { done: () => app.startBattle({ enemies: rivalEnemies(g), kind: 'rival', place: 'cave' }) });
        } else if (p.id === 'urashima4') {
            // 4 章の ボス: 黒い 紋に とりつかれた 浦の島重蔵 (ストーリー工房 4 章 場面 3)
            say([
                nar('どうくつの 主の 体に、ドクドクと 動く 黒い 紋が うかんでいる……。'),
                by('urashima', 'わしは……えーと……なんじゃったかの……。体が かってに……うごくんじゃ……！ ……つり？'),
                furu('あの 紋、王冠の 箱に のこってた 黒い すすと 同じだ！'),
                furu('かかえてる 玉手箱を ねらって こわせば、玉手箱の わざを 止められるよ！ でも けむりが 出るかも……！'),
                furu('こうらに こもったら、すきまから 出てる 頭を ねらって！ ひっくり返せるかも！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('urashima4'), kind: 'boss', place: 'cave' }) });
        } else if (p.id === 'daishiNpc') {
            say([by('daishi', `紋つきの 者たちを、どうか 救って くだされ。……紋を はらえば、きっと 正気に もどりますぞ。(${monsSaved(g)}/${MONS.length})`)]);
        } else if (p.id === 'zumitani6') {
            // 6 章 1 回目: ズミタニ (影分身。ストーリー工房 6 章 場面 2)
            say([
                by('zumitani', 'やっほー、77代目の ズミタニだよ！ メダルどろぼうを 追ってるんだ。……で、きみ、役に 立つの？ ためして あげるね♪'),
                furu('分身して くるよ！ 本物を 見つけて ロックオンして！ まちがえると しかえし されちゃう！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('zumitani6'), kind: 'boss', place: 'yashiki' }) });
        } else if (p.id === 'onioni6' || p.id === 'rukiha6') {
            // 6 章 2 回目: 奥の 間で ルキハ と あやつられた おにおに (ストーリー工房 6 章 場面 3)
            say([
                nar('奥の 間に、ひとりの 男が 座っていた。'),
                nar('人と おなじ 顔。けれど 片目は 赤黒く にごり、首すじには うろこの ような ものが のぞいている。'),
                { who: 'ルキハ', art: 'rukiha', text: 'はじめまして だな、こおり族の 子。王冠の 味は……なかなか だったぞ。' },
                nar('その うしろに、目の 光が 消えた おにおにが 立っていた。'),
                { who: 'こおりくん', art: 'koori', text: '（おにおに……！）' },
                by('onioni', '…………。ルキハさまの じゃまは させん。')
            ], { done: () => app.startBattle({ enemies: bossEnemies('onioni6'), kind: 'boss', place: 'yashiki' }) });
        } else if (p.id === 'tomooka6') {
            // 6 章 3 回目: 鬼鬼団の 幹部 トモオカ (右腕)
            say([
                { who: 'トモオカ', art: 'tomooka', text: 'メダルは わたさんぞ！ 鬼鬼団 幹部、トモオカさまの 右腕を 見せてやる！' },
                furu('たたかれるほど 右腕が 大きく なるみたい！ 右腕を ねらって しぼませて！ 大きく なりきったら 防げない 一撃が くるよ！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('tomooka6'), kind: 'boss', place: 'yashiki' }) });
        } else if (p.id === 'runaya7') {
            // 7 章: 月の 鏡の 回想 (ストーリー工房 7 章 場面 2) → 力を ためす バトル
            say([
                by('runaya', 'ここが 月の 鏡よ。……鏡を のぞいて ごらんなさい。'),
                nar('鏡の 中に、むかしの 景色が うかんだ。'),
                nar('ひとりの 男が、大きな 竜を、鳥を、けものを……ひとつずつ 喰らっていく。'),
                nar('喰らう たびに、男の 体の どこかが ゆがんで いった。'),
                by('runaya', 'あの 男は、人の すがたを 着ているだけ。中身は……喰らった ものの かたまりよ。'),
                by('runaya', '……あの 男に 立ちむかうなら、その 前に あなたたちの 力を ためさせて もらうわ。ためさせて もらうわ。……あら、これも 言ったかしら？'),
                furu('月が 満ちたら 大技が くるよ！ 空の 月を ねらって 欠けさせて！')
            ], { done: () => { g.flags.mirror7 = true; app.startBattle({ enemies: bossEnemies('runaya7'), kind: 'boss', place: 'moon' }); } });
        } else if (p.id === 'ooni8') {
            // 8 章 幹部 1 人目: 大鬼 (ストーリー工房 8 章 場面 2「幹部たち」)
            say([
                nar('大広間の 奥に、天井に 頭が とどきそうな 大きな 鬼が 立ちふさがった。胸には 黒い 紋。'),
                { who: '大鬼', art: 'ooni', text: 'ここから 先は 通さん！ ルキハさまの ため……つぶれろ……！' },
                furu('大きすぎて、どの わざも みんなに とどくよ！ 足を ねらって 当てつづけて！ 転ばせれば チャンス！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('ooni8'), kind: 'boss', place: 'shiro' }) });
        } else if (p.id === 'soutou8') {
            // 8 章 幹部 2 人目: 双頭鬼
            say([
                { who: '双頭鬼 (右の頭)', art: 'soutouki', text: 'ケケケ……とりついて やろうか？' },
                { who: '双頭鬼 (左の頭)', art: 'soutouki', text: 'いや、術で 焼いて やろう。' },
                furu('右の 頭は とりつき、左の 頭は 術を 使うみたい！ 頭を こわせば その わざは 止まるよ。両方 こわせば チャンス！'),
                furu('とりつかれたら 後ろに 回して「おたすけ」だよ！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('soutou8'), kind: 'boss', place: 'shiro' }) });
        } else if (p.id === 'kinme8') {
            // 8 章 幹部 3 人目: 金滅鬼 (ストーリー工房 8 章 場面 2)
            say([
                by('kinmetsuki', '金色の 鬼に ひれ伏せ！ ルキハさまの ために……！ この 黄金の 体、きずひとつ つけられまい！'),
                furu('金ピカで 目が くらんじゃう……！ めくらましの とりつきに 気を つけて！ この 鬼に すきは ない、まっこう 勝負だよ！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('kinme8'), kind: 'boss', place: 'shiro' }) });
        } else if (p.id === 'onioni8') {
            // 8 章の 山場: 玉座の 間の おにおに (ストーリー工房 8 章 場面 3)
            say([
                by('onioni', '……来たか、こおり。'),
                by('onioni', 'ルキハさまの じゃまは させん。……借金ごと ここで 消えて もらうぞ！'),
                furu('おにおに、目を さまして！'),
                nar('おにおにの 胸の 黒い 紋が、どくん、と 脈うった。'),
                furu('大技を ためてる あいだに いっぱい 攻撃を 当てて！ 紋が 暴発して 止まるはず！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('onioni8'), kind: 'boss', place: 'shiro' }) });
        } else if (p.id === 'onioni12') {
            // 12 章: みんなが 来た (ストーリー工房 12 章 場面 2) → おにおにの 勝負 (ユーザー指定)
            const L = rivalLines();
            say([
                nar('石の川神社に、これまで 出会った みんなが あつまっていた。'),
                by(L.meet[0], 'ライバルは ライバルでも、世界が なくなったら 勝負も できないからな。'),
                by('onioni', '氷隊と 鬼鬼団が いっしょに 戦うとはな。……足を ひっぱるなよ、こおり。'),
                furu('こおりくん、みんなで 行こう！'),
                by('onioni', '……その 前に だ。こおり、おれと 勝負しろ。'),
                by('onioni', 'ルキハに あやつられて いた おれじゃ ない、ほんとうの おれの 力を 見せてやる。……本気で 来い！'),
                nar('おにおにの 体が 赤黒く 燃えあがった……！ 鬼神の すがただ！'),
                furu('大技を ためてる あいだに 攻撃を あてれば、力が 暴発するはず！ 2 回目からは ガードしてくるよ！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('onioni12'), kind: 'boss', place: 'shrine' }) });
        } else if (p.only === 'gather12') {
            // 12 章: 神社に あつまった みんな (Claude の 仮組)
            const lines = {
                g12zumitani: ['zumitani', 'ルキハの 城？ 忍びこむなら まかせてよ♪ ……もちろん、ついて いくからね。'],
                g12runaya: ['runaya', 'あの 男の 顔を ねらうのよ。顔よ、顔。……あら、これは もう 言ったかしら？'],
                g12nozoema: ['nozoema', 'そなたの 剣、ルキハに とどかせて みせよ。筋肉も ついて いくぞ。'],
                g12daishi: ['daishi', '拙僧も 微力ながら、念仏で 支えますぞ。……配信も しますぞ。'],
                g12rival: [rivalLines().meet[0], 'ふん、今回だけは 手を かしてやる。……かんちがい するなよ！']
            }[p.id];
            say([by(lines[0], lines[1])]);
        } else if (p.id === 'bakuen11') {
            // 11 章の ボス: 火山の 底に ねむる バクエンリュウ・闇 (ASO と 出会う 前。ASO は 声だけ)
            say([
                nar('火山の 底で、マグマの 竜が ねむっていた。胸には 黒い 紋が どくどくと 脈うっている。'),
                { who: 'バクエンリュウ', art: 'bakuenryu', text: 'グオオオ……ルキハ……さま……。ここは……通さぬ……！' },
                furu('体が マグマで できてる……！ これじゃ 攻撃が とどかないよ！'),
                { who: '？？？', art: 'maou', text: '……こおり族の 子よ。その 竜の 体は マグマ、ふつうの 攻撃は とどかぬ。我が 道具を 投げてやる。うまく 使え！' },
                furu('投げられた 道具を ねらって 攻撃すると 使えるよ！ 剣なら 力が 上がって、実なら 回復、水爆弾なら 体が かたまるはず！'),
                furu('マグマの 波で 道具が とけちゃうから、いそいで！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('bakuen11'), kind: 'boss', place: 'tsubo' }) });
        } else if (p.id === 'rukiha13') {
            // 13 章の ボス: ルキハ (ストーリー工房 13 章 場面 2「ルキハ」)。たおすと ニオニオーテンに 変わる (場面 3・4 は バトルの 中)
            const rk = text => ({ who: 'ルキハ', art: 'rukiha', text });
            say([
                rk('来たか、こおり族の 子。王冠の 味が、まだ 舌に のこっているぞ。'),
                rk('おまえも、おまえの なかまも、みんな オレの 中で ひとつに なれば いい。'),
                { who: 'こおりくん', art: 'koori', text: '（そんな こと させない！）' },
                furu('ルキハは 体を 変形させて 攻撃してくるよ！ 気を つけて！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('rukiha13'), kind: 'boss', place: 'kurai' }) });
        } else if (p.id === 'aso11') {
            // 11 章: ASO の 間の 大魔王ASO (ストーリー工房 11 章 場面 2・3。ASO とは 戦わない)
            if (canFightAso(g)) {
                // 14 章 クリアの あと: 大魔王ASO と 勝負 (推奨 Lv90。2026-10-30 ユーザー指定)
                say([
                    { who: '大魔王ASO', art: 'maou', text: '……ルキハを たおし、残党まで かたづけたか。こおり族の 子よ、きさまの 力、この 我が ためして やろう。' },
                    { who: '大魔王ASO', art: 'maou', text: '我に 勝てたなら……きさまの なかまに なって やっても よい。' },
                    nar('(推奨 Lv90 の 強敵)')
                ], {
                    choices: ['勝負する', 'やめる'],
                    done: i => {
                        if (i !== 0) return;
                        say([furu('拘束のリングに つかまったら、浮いてる リングを ねらって こわして！ 輪が 回せなく なるよ！')],
                            { done: () => app.startBattle({ enemies: bossEnemies('aso15'), kind: 'boss', place: 'tsubo' }) });
                    }
                });
                return;
            }
            if (!meetAso(g)) { say([{ who: '大魔王ASO', art: 'maou', text: g.flags.aso15 ? '……我は きさまの なかまだ。ウォッチで 呼ぶが よい。' : '……きさまに たくしたぞ、こおり族の 子よ。あの 男の 顔を ねらえ。' }]); return; }
            say([
                nar('ASO の 間に、大きな 影が しずかに すわっていた。'),
                { who: '大魔王ASO', art: 'maou', text: 'この 我が……このASOが……人の すがたを した 男ごときに、力を 半分 喰われるとは……！' },
                { who: '大魔王ASO', art: 'maou', text: '聞くがよい、こおり族の 子よ。あの 男は 喰った ものを 自身の身体に反映させることができる。だが 顔だけは……あの 男 自身の ものだ。' },
                { who: '大魔王ASO', art: 'maou', text: '顔を ねらえ。それが あの 男の 本体だ。……我の 力の 仇、きさまに たくすぞ。' },
                nar('壺の 底に、黒い 光の 道が うかびあがった。'),
                nar('１１章 クリア！'),
                nar('―― １２章は つぎの アップデートで。')
            ], { done: () => app.save() });
        } else if (p.id === 'tashikeda10') {
            // 10 章の ボス: ともいしを ねらう 幹部 タシケダ (ストーリー工房 10 章 場面 2)
            say([
                tomo('こおり！ 来たら いかん！'),
                { who: 'タシケダ', art: 'tashikeda', text: 'こおり族の 母か。ルキハさまへの いい みやげに なる。' },
                { who: 'こおりくん', art: 'koori', text: '（おかあさんに さわるな！）' },
                { who: 'タシケダ', art: 'tashikeda', text: 'ワタシは ルキハさまの 軍勢の 幹部、タシケダ。……きみの なかまの レベル、ぜんぶ いただくよ。' },
                furu('レベルを 吸われたら、出てきた 紋つきを たおせば もどるよ！ 左右に 2 体 そろうと 大技が くる！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('tashikeda10'), kind: 'boss', place: 'town' }) });
        } else if (p.id === 'harukirin9') {
            // 9 章 1 回目: 雪どけの 氷河の ハル麒麟 (セリフは ダンジョンの ハル麒麟から)
            say([
                nar('とけかけた 氷河の 上に、桜の 花びらを まとった 麒麟が 立っていた。'),
                by('harukirin', '氷は とけ、春が 来る。それが さだめ。こおりの子よ、そなたも 溶けて 賢者と なりなさい。'),
                { who: 'こおりくん', art: 'koori', text: '（こおりは とけないよ！）' },
                furu('HP が 半分に なると 春の 力を ためて、全回復しちゃうみたい！ 角を ねらって こわして！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('harukirin9'), kind: 'boss', place: 'hyouga' }) });
        } else if (p.id === 'nozoema9') {
            // 9 章 2 回目: 山頂の 道場の ノゾエマ (ストーリー工房 9 章 場面 2)
            say([
                by('nozoema', 'よくぞ 来た。……だが その 前に 見よ、この 鍛えぬかれた 筋肉を！ 力が ほしくば、この 山を のぼりきって みせよ！'),
                by('nozoema', '名刀江波と 筋肉は、心が くもった 者には こたえぬ。毎朝 鏡に むかい、筋肉と 語りあうのだ。'),
                by('nozoema', '……さあ、修行の しあげだ。この 刀を 越えてみせよ！'),
                furu('ノゾエマさんは「筋肉の おたすけ」で どんどん 強く なるよ！ 長引くと あぶない、いっきに たたみかけて！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('nozoema9'), kind: 'boss', place: 'kinniku' }) });
        } else if (p.id === 'oni14') {
            // 14 章: いっしょに 来た おにおに
            say([by('onioni', g.story === 'yoru'
                ? (cluesFound(g) < PARK_CLUES.length ? `ふるカワの 手がかりは アトラクションの 入り口に あるはずだ！ (${cluesFound(g)}/${PARK_CLUES.length})` : '広場の まんなかだ、こおり！')
                : 'おれは ここで まっとる。……べつに ジェットコースターが こわいわけじゃ ないぞ。')]);
        } else if (p.id === 'boss14') {
            // 14 章の ボス (内定 サアラハ / 免許 リハマ)
            const menkyo = g.version === 'menkyo';
            const boss = menkyo ? { who: 'リハマ', art: 'rihama' } : { who: 'サアラハ', art: 'saaraha' };
            say([
                nar('広場の まんなかに、黒い 紋を つけた 人かげが 立っていた。'),
                { ...boss, text: menkyo ? 'ルキハさまの かたき……ここで ノーブレーキで ひいて やるよ！' : 'よく ここまで 来たね。ルキハさまに かわって、おまえたちの 未来を とりけして あげる！' },
                { who: 'ふるカワ', art: 'furukawa', text: 'こおりくん！ たすけて！' },
                by('onioni', menkyo ? '赤信号の ときは 体が かたい！ 信号機を ねらえ、こおり！' : 'おりを ねらえ、こおり！ ふるカワを にがせば あいつも あわてるはずだ！')
            ], { done: () => app.startBattle({ enemies: boss14Enemies(g), kind: 'boss', place: 'yuen' }) });
        } else if (p.id === 'kairou') {
            // 15 章: 無限回廊 (強化ボスと 1 階ずつ)
            const k = kairouOf(g), next = kairouEnemies(g)[0];
            say([{ who: '回廊の 番人', art: 'haridaijin', text: `ここは 無限回廊。強く なった ボスたちが 1 階ずつ 待っておる。いまは ${k.floor} 階 (さいこう ${k.best} 階)。${k.floor} 階の あいては ${BOSSES[next.id].name} Lv${next.lv}じゃ。` }], {
                choices: [`${k.floor} 階に いどむ`, 'やめる'],
                done: i => { if (i === 0) app.startBattle({ enemies: kairouEnemies(g), kind: 'kairou', place: BOSSES[next.id].place }); }
            });
        } else if (p.team) {
            // 15 章: ライバル探検隊の 仲間クエスト (勝つと 3 人 なかまに なる)
            const T = TEAMS[p.team];
            say([by(T.leader, TEAM_LINES[p.team]), nar(`チーム「${T.name}」が 勝負を いどんできた！`)],
                { done: () => app.startBattle({ enemies: teamEnemies(p.team), kind: 'team', place: inMoon() ? 'moon' : inUmi() ? 'umi' : 'park', team: p.team }) });
        } else if (p.id === 'daishi5') {
            // 5 章の ボス: 紋に のまれた ダイシ (仏の顔 → HP が 半分で 鬼の顔)
            say([
                nar('ダイシの 体に、黒い 紋が どくどくと 脈うっている……。'),
                by('daishi', '……ぐ……拙僧は……鬼に……なっては……ならぬ……！'),
                furu('ダイシさんまで 紋に のまれちゃった！ 攻撃しつづけると 鬼の 顔に なって 強く なるよ。そしたら 顔の 鬼の面を ねらって！'),
                furu('お経が 聞こえたら、うしろの 鐘を ねらって 鳴らして！ びっくりして すきが できるはず！')
            ], { done: () => app.startBattle({ enemies: bossEnemies('daishi5'), kind: 'boss', place: 'tera' }) });
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
                    if (i === 0 && nightBefore(g)) {
                        // 12 章 クリア: 出発の 前の 夜 (ストーリー工房 12 章 場面 3)
                        g.time = 3;
                        say([
                            tomo('こおり、おべんとう つくっといたよ。'),
                            tomo('……ちゃんと 帰って きなさい！ 借金も 返さんまま いなくなるのは ゆるさんけんね！'),
                            nar('こおりくんは しずかに ねむった。'),
                            nar('１２章 クリア！'),
                            nar('つぎの 朝、家の 前の ともいしと 話そう。')
                        ], { done: () => app.save() });
                    } else if (i === 0) {
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
        } else if (b.id === 'station') {
            rideTrain();
        } else if (b.id === 'attrA' || b.id === 'attrB' || b.id === 'attrC') {
            lookAttraction(b.id);
        } else if (b.id === 'kuraiStation') {
            say([nar('黒い 光の 道。石の川駅に つながっている。')], {
                choices: ['石の川へ もどる', 'やめる'],
                done: i => { if (i === 0) { sfx('watch'); warp(STATION_OUT); } }
            });
        } else if (b.id === 'tsuboStation') {
            say([nar('ASOの壺前駅。石の川 行きの 電車が とまっている。')], {
                choices: ['石の川へ もどる', 'やめる'],
                done: i => { if (i === 0) { sfx('watch'); warp(STATION_OUT); } }
            });
        } else if (b.id === 'kinnikuStation') {
            say([nar('筋肉の山 登山口駅。石の川 行きの 電車が とまっている。')], {
                choices: ['石の川へ もどる', 'やめる'],
                done: i => { if (i === 0) { sfx('watch'); warp(STATION_OUT); } }
            });
        } else if (b.id === 'parkStation') {
            if (g.story === 'park') {
                if (!g.flags.ride14) { say([furu('まだ ぜんぜん 遊んでないよ！ アトラクションに 乗ろうよ！')]); return; }
                parkEvening();
                return;
            }
            say([nar(`${parkName()}前駅。石の川 行きの 電車が とまっている。`)], {
                choices: ['石の川へ もどる', 'やめる'],
                done: i => { if (i === 0) { sfx('watch'); warp(STATION_OUT); } }
            });
        } else if (b.id === 'gattai') {
            // 合体の館 (2026-10-30): 主の ヒントを 聞いてから 合体の 画面へ
            const k = g.flags.fusionHint || 0;
            g.flags.fusionHint = k + 1;
            say([
                nar('合体の館。むらさきの けむりの 中に、あやしい 魔法陣が 光っている。'),
                { who: '館の 主', art: 'haridaijin', text: k === 0 ? 'ようこそ 合体の館へ。キャラと キャラ、キャラと 合成アイテム、アイテムと アイテム……2 つを 合わせると 新しい ものが 生まれる。ここでしか 会えない キャラも おるぞ。' : FUSION_HINTS[(k - 1) % FUSION_HINTS.length] }
            ], { choices: ['合体する', 'やめる'], done: i => { if (i === 0) { sfx('watch'); app.go('fusion'); } } });
        } else if (b.id === 'shiroStation') {
            say([nar('SE城前駅。石の川 行きの 電車が とまっている。')], {
                choices: ['石の川へ もどる', 'やめる'],
                done: i => { if (i === 0) { sfx('watch'); warp(STATION_OUT); } }
            });
        } else if (b.id === 'moonStation') {
            say([nar('月の迷宮前駅。石の川 行きの 電車が とまっている。')], {
                choices: ['石の川へ もどる', 'やめる'],
                done: i => { if (i === 0) { sfx('watch'); warp(STATION_OUT); } }
            });
        } else if (b.id === 'yashikiStation') {
            say([nar('忍びの屋敷前駅。石の川 行きの 電車が とまっている。')], {
                choices: ['石の川へ もどる', 'やめる'],
                done: i => { if (i === 0) { sfx('watch'); warp(STATION_OUT); } }
            });
        } else if (b.id === 'teraStation') {
            say([nar('ネット寺前駅。石の川 行きの 電車が とまっている。')], {
                choices: ['石の川へ もどる', 'やめる'],
                done: i => { if (i === 0) { sfx('watch'); warp(STATION_OUT); } }
            });
        } else if (b.id === 'umiStation') {
            say([nar('海辺駅。石の川 行きの 電車が とまっている。')], {
                choices: ['石の川へ もどる', 'やめる'],
                done: i => { if (i === 0) { sfx('watch'); warp(STATION_OUT); } }
            });
        } else if (b.id === 'uminoie') {
            shop('いらっしゃい！ 海の家だよ。なんに する？', '海の家の おじさん');
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
                sentou: 'ゆ と 書いた のれん。「こおりの お客さまは とけるので ご注意ください」',
                // 海辺の 町 (4 章)
                umiHouse: reached(g, 'clear4') ? '漁師の おじさん「浦の島の じいさん、もとに もどったらしいな。よかった よかった。また 釣りばっかり しとるよ」'
                    : '漁師の おじさん「さいきん どうくつの 奥で、浦の島の じいさんが あばれとるらしい。いつもは 釣りばっかり しとる おとなしい じいさんなのに……」',
                tsuriguya: '釣具屋の おばさん「夜の 桟橋には、大きな 黒い 坊主が 出るって うわさだよ。こわいねえ」',
                // ネット寺 (5 章)
                hondou: reached(g, 'clear5') ? '本堂の 中で、ネット配信の お経が しずかに ながれている。' : '本堂の 中から、ノイズまじりの お経が 聞こえる……。',
                shouro: '鐘楼の 鐘に「通知を オンに してね」と 書いた 札が はってある。',
                shoko: reached(g, 'clear5') ? '書庫には 古い 書と、ノートパソコンが ならんでいる。' : '書庫の とびらに カギが かかっている。'
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
            furu('それと、学校の キャラは なかまに「とりつく」ことが あるよ。ねむり・のろい・こんらん・どく……ぜんぶ とりつきの しわざ。なまけたり、味方を 攻めたり する とりつきも あるの。'),
            furu(`そのときは 輪を 回して 後ろに さげて、まんなかの「おたすけ」(${btn('help')}) で はらって あげて！`),
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

    // 電車 (4 章): 商店街の 石の川駅 ⇔ 海辺駅。はじめて 着くと ライバル探検隊に 出会う (ストーリー工房 4 章 場面 2)
    function rideTrain() {
        if (!canRideTrain(g)) { say([nar('石の川駅。いまは 電車に 乗る 用事が ない。')]); return; }
        const lines = trainLines(g);
        const names = { umi: '海辺の 町へ 行く', tera: 'ネット寺へ 行く', yashiki: '忍びの屋敷へ 行く', moon: '月の迷宮へ 行く', shiro: '金色のSE城へ 行く', kinniku: '筋肉の山へ 行く', tsubo: 'ASOの壺の底へ 行く', kurai: '喰らいの 城へ 行く', park: `${parkName()}へ 行く` };
        say([nar(`石の川駅。${lines.length > 1 ? 'どこへ 行こうか？' : lines[0] === 'tera' ? 'ネット寺 行きの 電車が とまっている。' : '海辺の 町 行きの 電車が とまっている。'}`)], {
            choices: [...lines.map(l => names[l]), 'やめる'],
            done: i => {
                const dest = lines[i];
                if (!dest) return;
                sfx('watch');
                if (dest === 'tera') { goTera(); return; }
                if (dest === 'yashiki') { goYashiki(); return; }
                if (dest === 'moon') { goMoon(); return; }
                if (dest === 'shiro') { goShiro(); return; }
                if (dest === 'park') { goPark(); return; }
                if (dest === 'kinniku') { goKinniku(); return; }
                if (dest === 'tsubo') { goTsubo(); return; }
                if (dest === 'kurai') { goKurai(); return; }
                warp(UMI_IN);
                if (!arriveUmi(g)) return;
                const L = rivalLines();
                say([
                    nar('電車に ゆられて、海辺の 町に 着いた。'),
                    by(L.meet[0], L.meet[1]),
                    furu('ライバル探検隊だ……！ どっちが 先に 奥まで 行けるか 勝負だね！'),
                    nar(`チーム「${rivalTeam(g.version).name}」は 東の 浦の島の海岸どうくつへ 走っていった！`)
                ], { done: () => app.save() });
            }
        });
    }

    // ネット寺に 着く (5 章)。はじめて なら ダイシが むかえる (ストーリー工房 5 章 場面 2)
    function goTera() {
        warp(TERA_IN);
        if (!arriveTera(g)) return;
        say([
            nar('電車に ゆられて、ネット寺に 着いた。'),
            by('daishi', 'よくぞ 参られた。寺の 者たちの 紋が、夜ごとに ふえて おるのです……。'),
            by('daishi', '寺の 古い 書には こう あります。「黒き 紋は 喰らう 者の しるし。紋を つけられし ものは、いずれ 喰われる」と。'),
            nar('境内の どこかに、黒い 紋に とりつかれた キャラが 3 体 いる。')
        ], { done: () => app.save() });
    }

    // ----- 13 章 (喰らいの 城) -----
    function goKurai() {
        warp(KURAI_IN);
        if (!arriveKurai(g)) return;
        // ストーリー工房 13 章 場面 1「喰らいの 城」
        say([
            nar('黒い 光の 道を ぬけると、喰らいの 城の 前に 出た。'),
            nar('城の まわりを、紋つきの 軍勢が うめつくしている。'),
            by('onioni', 'ここは おれたち 鬼鬼団が 引き受ける！ 行け、こおり！'),
            { who: 'ズミタニ', art: 'zumitani', text: 'ほらほら、早く 行って！ ここで 負けたら、77代目の 名が なくからね♪' },
            furu('城の 中も 紋つきで いっぱい……。最上階まで 一気に 行こう！')
        ], { done: () => app.save() });
    }

    // ----- 11 章 (ASOの壺の底) -----
    function goTsubo() {
        warp(TSUBO_IN);
        if (!arriveTsubo(g)) return;
        // ストーリー工房 11 章 場面 1「壺の 底へ」
        say([
            nar('電車に ゆられて、ASOの壺の 口に 着いた。'),
            furu('ここ……すごく 熱い……！'),
            by('onioni', 'ASOの壺の底か……。おれも 来るのは はじめてだ。'),
            nar('壺の 底には 溶岩の どうくつが ひろがっている。いちばん 下は 火山の 底らしい。')
        ], { done: () => app.save() });
    }

    // ----- 9 章 (筋肉の山) -----
    function goKinniku() {
        warp(KINNIKU_IN);
        if (!arriveKinniku(g)) return;
        say([
            nar('電車に ゆられて、筋肉の山の 登山口に 着いた。'),
            by('onioni', 'ここが 筋肉の山か……。上の ほうは 雪が のこっとるな。'),
            furu('とちゅうに「雪どけの 氷河」が あるんだって。ノゾエマさんの 道場は 山頂だよ！')
        ], { done: () => app.save() });
    }

    // ----- 14 章 (遊園地) -----
    function parkName() { return PARK_NAME[g.version] || PARK_NAME.naitei; }
    function goPark() {
        warp(PARK_IN);
        if (!arrivePark(g)) return;
        say([
            nar(`電車に ゆられて、${parkName()}に 着いた！`),
            furu(`わあ、${parkName()}！ アトラクションが いっぱい！ ぜんぶ 乗ろうね！`),
            by('onioni', 'おれは 広場で まっとる。……べつに こわいわけじゃ ないぞ。'),
            nar('アトラクションで 遊ぼう。帰るときは 遊園地前駅へ。')
        ], { done: () => app.save() });
    }
    // アトラクション: 昼は 遊ぶ・夜は ふるカワの 手がかりを さがす
    const RIDES = {
        naitei: { attrA: 'コースター「内定ジェット」！ 急降下で、内定が 決まる 気が した！', attrB: 'かんらん車から 町が ぜんぶ 見えた。石の川も、商店街も、遠くの SE城も……。', attrC: 'おばけ屋敷で「面接官の おばけ」に「志望動機は？」と 聞かれた……！ こわい！' },
        menkyo: { attrA: 'ゴーカート「仮免ジェット」！ カーブの 前で ちゃんと 安全確認！', attrB: 'かんらん車から 町が ぜんぶ 見えた。石の川も、商店街も、遠くの SE城も……。', attrC: 'おばけ屋敷で「教官の おばけ」に「はい、脱輪」と ささやかれた……！ こわい！' }
    };
    function lookAttraction(id) {
        const name = BUILDINGS.find(x => x.id === id).label;
        if (g.story === 'park') {
            if (!g.flags.ride14) g.flags.ride14 = {};
            g.flags.ride14[id] = true;
            say([nar((RIDES[g.version] || RIDES.naitei)[id]), furu('たのしい～！ つぎは どれに 乗る？')]);
        } else if (g.story === 'yoru') {
            const c = findClue(g, id);
            if (!c) { say([nar(`${name}は 夜の 闇に しずんでいる。……ここには もう なにも ない。`)]); return; }
            const lines = [nar(`${name}の 入り口に、${c.item}が 落ちていた！ (${cluesFound(g)}/${PARK_CLUES.length})`)];
            if (cluesFound(g) >= PARK_CLUES.length) lines.push(by('onioni', 'こおり、広場の まんなかに だれか おるぞ！'));
            say(lines, { done: () => app.save() });
        } else say([nar(`${name}。${g.story === 'clear14' ? 'ふるカワと もう いちど 乗った。たのしい！' : 'いまは しまっている。'}`)]);
    }
    // 駅で 帰ろうとすると ふるカワが いない → 夜 (ストーリー工房 14 章 あらすじ)
    function parkEvening() {
        const menkyo = g.version === 'menkyo';
        parkNight(g);
        say([
            nar('夕方。そろそろ 帰ろうと した、そのとき——'),
            { who: 'こおりくん', art: 'koori', text: '（あれ？ ふるカワが いない……？）' },
            by('onioni', 'さっきまで そこに おったのに……！'),
            nar('どこからか、ひくい 笑い声が ひびいた。'),
            menkyo
                ? { who: 'リハマ', art: 'rihama', text: 'ルキハさまの かたき……この 子は あずかった。夜の シティを 走りまわって さがすんだな。' }
                : { who: 'サアラハ', art: 'saaraha', text: 'ルキハさまの かたきは とらせて もらう。……この 子は あずかったよ。かえして ほしければ、夜の パークを さがしてみな。' },
            by('onioni', 'ルキハの 軍勢の 残党か……！ こおり、さがすぞ！'),
            nar(`あたりが 暗く なった。夜の ${parkName()}で、アトラクションの 入り口を しらべて ふるカワの 手がかりを さがそう！`)
        ], { done: () => app.save() });
    }

    // 金色のSE城に 着く (8 章)。はじめて なら ライバル探検隊が 門を こじあける (ストーリー工房 8 章 場面 1)
    function goShiro() {
        warp(SHIRO_IN);
        if (!arriveShiro(g)) return;
        const L = rivalLines(), team = rivalTeam(g.version);
        say([
            nar('電車に ゆられて、金色のSE城に 着いた。城門の 前には、鬼鬼団の 鬼たちが ずらりと ならんでいる……！'),
            nar(`そこへ、チーム「${team.name}」が かけつけた！`),
            by(L.meet[0], 'ここは おれたちが ひきうける！ 行け、こおりくん！'),
            furu('ありがとう！ こおりくん、行こう！'),
            nar('ライバル探検隊が 城門を こじあけた！ 城の 中では 鬼鬼団の 幹部が 待ちかまえている。')
        ], { done: () => app.save() });
    }

    // 月の迷宮に 着く (7 章)。はじめて なら ルナヤが まねく (ストーリー工房 7 章 場面 1)
    function goMoon() {
        warp(MOON_IN);
        if (!arriveMoon(g)) return;
        say([
            nar('電車に ゆられて、月の迷宮に 着いた。'),
            by('runaya', 'ルキハを 追って いるのね。月の 鏡なら、あの 男の むかしを 見せて くれるわ。……月の 鏡なら……あら、これ もう 言ったかしら？'),
            nar('ルナヤは 迷宮の 奥へ 消えた。月の 鏡は 迷宮の いちばん 奥に ある らしい。')
        ], { done: () => app.save() });
    }

    // 忍びの屋敷に 着く (6 章)
    function goYashiki() {
        warp(YASHIKI_IN);
        if (!arriveYashiki(g)) return;
        say([
            nar('電車に ゆられて、忍びの屋敷に 着いた。'),
            nar('板べいの 門の 中で、だれかが 待っている……。')
        ], { done: () => app.save() });
    }

    // 黒い 紋の なかま (5 章): 話しかけると バトル。勝つと 紋が 消えて なかまに なる
    function examineMon(m) {
        const n = NAKAMA[m.nakama];
        g.zukan.seen[m.nakama] = true;
        say([...m.lines.map(text => nar(text)), { who: n.name, art: n.art, text: '「……ウ……ア……」' }, nar(`黒い 紋に とりつかれた ${n.name}が おそいかかってきた！`)], {
            done: () => app.startBattle({ enemies: [{ id: m.nakama, lv: m.lv, dark: true }], kind: 'wild', place: 'tera', mystery: m.id })
        });
    }

    // 品物を えらんで、何こ 買うか えらぶ (2026-10-28 ユーザー指定)。海の家 (4 章) でも 同じ 品物
    function shop(greet = 'いらっしゃい。なにに するかね？', OBA = '駄菓子屋の おばあちゃん') {
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
                    say([{ who: OBA, text: full ? `${it.name}は もう もちきれないよ。` : 'おこづかいが たりないねえ。' }], { done: () => shop(undefined, OBA) });
                    return;
                }
                say([{ who: OBA, text: `${it.name}を いくつ ほしいかね？ (おこづかい ${g.money}円)` }], {
                    count: { max, label: n => `${it.name} × ${n} = ${it.price * n}円` },
                    done: n => {
                        if (!n) { shop(undefined, OBA); return; }
                        buyItem(g, id, n);
                        sfx('ok');
                        shop(`まいど。${it.name}を ${n}こ だね。ほかには？`, OBA);
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
                furu('こおりくん、いちど 家に 帰ろうか。ともいしさんが 心配してるかも。')
            ], { done: () => app.save() });
        } else if (result.mon && result.outcome === 'win') {
            // 5 章: 紋が 消えて なかまに。3 体 ぜんぶ 助けると 鬼鬼団の かげ → ダイシが 紋に のまれる (ストーリー工房 5 章 場面 3)
            const m = MONS.find(x => x.id === result.mon), n = monsSaved(g);
            const lines = [nar(`${NAKAMA[m.nakama].name}の 黒い 紋が 消えた！ (${n}/${MONS.length})`)];
            if (allMonsSaved(g)) {
                lines.push(
                    nar('本堂の うらから、鬼の 角の かげが 走り去った。'),
                    furu('いまの……鬼鬼団の コオニンだよ！ なんで 鬼鬼団が……？'),
                    { who: 'こおりくん', art: 'koori', text: '（おにおにが こんな こと する かな……？）' },
                    { who: 'こおりくん', art: 'koori', text: '（まあ、パチンコに負けたらしそうかな。）' },
                    nar('そのとき、本堂の 前の ダイシの 体に、黒い 紋が うかびあがった！')
                );
            }
            say(lines, { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'runaya7') {
            // 7 章 クリア: ねらいは 鬼鬼団 (ストーリー工房 7 章 場面 3)
            say([
                by('runaya', '……ふふ、合格よ。合格。……あら、これは まだ 言って なかったわね。'),
                furu('王冠も メダルも、ルキハが 力を 喰らう ために あつめてたんだ……！'),
                by('runaya', '鬼鬼団の 金色のSE城に、ぬすんだ 力が あつめられて いるはず。おにおにも そこに いるわ。……SE城よ、SE城。わすれないでね？ SE城よ？'),
                { who: 'こおりくん', art: 'koori', text: '（おにおにを とりもどそう！）' },
                nar('７章 クリア！ ルナヤが なかまに なった。'),
                nar('石の川駅から、電車で 金色のSE城へ 行けるように なった！')
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === BOSS14[g.version]) {
            // 14 章 クリア → 15 章「新たなる１日」(ストーリー工房 15 章 = no 15 の あらすじ)
            say([
                nar('残党は 黒い 霧に なって 消えた。'),
                furu('こおりくん……ありがとう！ こわかった……！'),
                by('onioni', '……まったく、遊園地くらい ゆっくり 遊ばせろ。'),
                nar('１４章 クリア！'),
                nar('―― １５章「新たなる１日」 ――'),
                nar('こおりくんの 旅は 終わらない。この 世界の キャラを ぜんぶ なかまに しよう！'),
                nar('石の川駅の 前に「無限回廊」の 番人が あらわれた。ライバル探検隊も 勝負を まっている！')
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'onioni12') {
            say([
                by('onioni', '……ぐ……。まいった。おまえ、ほんとうに 強く なったな、こおり。'),
                by('onioni', 'だが おれも 負けっぱなしじゃ おらん。……見とけ、これが 鬼の 王の 力だ！'),
                nar('おにおにの 必殺技が「鬼の王の金棒」に 進化した！'),
                furu('これで ルキハの 城へ 行けるね……！ 今夜は 家に 帰って ゆっくり ねよう。')
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'rukiha13') {
            // 13 章 クリア: エンディング (ストーリー工房 13 章 場面 5)
            const ending = [
                nar('ルキハの 顔が くずれ、喰らわれた 光が 空へ かえっていく。'),
                nar('世界じゅうの 紋が、しずかに 消えた。'),
                by('onioni', '終わったな、こおり。……よくやった。'),
                furu('こおりくん、帰ろう。石の川タウンに！')
            ];
            say(ending, {
                done: () => {
                    warp({ x: 6, y: 24, dir: 'up' });
                    g.time = 0;
                    say([
                        tomo(`おかえり、こおり。……さ、つぎは ${g.version === 'menkyo' ? '免許' : '内定'} とりなさい！`),
                        nar('―― こおりくんの 大冒険 ～大集合だヨ！おともだち！～ ――'),
                        nar('ストーリー: こおりくんの 作者　／　キャラ: こおりくんシリーズの みんな　／　プログラム・音楽: Claude'),
                        nar(`なかま ${friendCount(g)} 人と いっしょに 世界を すくった。ありがとう！`),
                        nar('１３章 クリア！ ―― おわり ――'),
                        nar('……でも、こおりくんの 毎日は つづく。家の 前の ともいしと 話そう。')
                    ], { done: () => app.save() });
                }
            });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'aso15') {
            say([
                { who: '大魔王ASO', art: 'maou', text: '……見事だ。この 我を 二度も 地に つけるとはな。' },
                { who: '大魔王ASO', art: 'maou', text: 'よかろう。約束どおり、きさまの 力と なろう。' },
                nar('大魔王ASOが なかまに なった！')
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'bakuen11') {
            say([
                nar('バクエンリュウの 紋が、ぱきんと くだけた。'),
                { who: 'バクエンリュウ', art: 'bakuenryu', text: 'グ……オオ……。からだが……かるい……。……おまえたちに ついて いこう。' },
                nar('バクエンリュウが なかまに なった！'),
                { who: '？？？', art: 'maou', text: '……みごとだ。おくへ 来い、こおり族の 子よ。' },
                furu('いまの 声……ASO の 間の ほうからだ！')
            ], { done: () => app.save() });
        } else if (result.dark && result.outcome === 'win') {
            // 10 章: 紋つきに 勝つと 紋が とける
            const lines = [nar(`紋が とけた！ (${Math.min(result.dark, DARK10_GOAL)}/${DARK10_GOAL})`)];
            if (result.dark === DARK10_GOAL) lines.push(nar('家の ほうから、いやな 気配が する……！'), furu('ともいしさんが あぶない！ 家へ 行こう！'));
            say(lines, { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'tashikeda10') {
            // 10 章 クリア: 町の 夜明け (ストーリー工房 10 章 場面 3)
            say([
                { who: 'タシケダ', art: 'tashikeda', text: 'エラー……エラー……。ルキハさまに 報告……しなきゃ……。' },
                nar('タシケダは 黒い 霧に なって 消えた。'),
                nar('霧が はれ、町に 朝が もどった。'),
                by('daichouenkin', 'こおりくーん！ おなか、ぐるぐるだけど、みんな ぶじだよー！'),
                by('ishikoron', 'ふん、石の川の 石は 紋なんかに まけないぞ。'),
                by('hashishita', '……ひとつ、ふたつ、みっつ……。橋も ぶじだ。'),
                tomo('こおり、ありがとね。……ぜったい 帰って きなさいよ！'),
                nar('１０章 クリア！'),
                nar('―― １１章は つぎの アップデートで。')
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'harukirin9') {
            say([
                by('harukirin', '……春を はねかえす 氷か。見事だ。'),
                by('harukirin', 'そなたの 道を 春風で ひらこう。……わたしも ともに 行こう。'),
                nar('ハル麒麟が なかまに なった！ 北の 細道が 通れるように なった。'),
                furu('この 先が 山頂の 道場だよ！')
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'nozoema9') {
            // 9 章 クリア: 必殺技の 進化 → ひろがる 紋 (ストーリー工房 9 章 場面 3)
            say([
                by('nozoema', '……見事な 筋肉だ。'),
                by('nozoema', 'こおりくん、そなたの 剣には まだ 眠っている 力が ある。……わが 名刀江波の 型、受けとるがよい！'),
                nar('こおりくんの 必殺技が「絶対殺すソード・レクイエム」に 進化した！'),
                nar('ノゾエマが なかまに なった！'),
                nar('山の 上から 見ると、遠くの 町に 黒い 雲が かかっていた。'),
                furu('あっちは……石の川タウンの ほう！？'),
                nar('９章 クリア！'),
                nar('―― １０章は つぎの アップデートで。')
            ], { done: () => app.save() });
        } else if (result.kairou && result.outcome === 'win') {
            const lines = [nar(`無限回廊 ${result.kairou} 階を 突破！`)];
            if (result.prize) lines.push(nar(`ごほうびに ${ITEMS[result.prize].name}を もらった！`));
            lines.push({ who: '回廊の 番人', art: 'haridaijin', text: `つぎは ${kairouOf(g).floor} 階じゃ。もっと 強い ボスが 待っておるぞ。` });
            say(lines, { done: () => app.save() });
        } else if (result.team && result.outcome === 'win') {
            const T = TEAMS[result.team];
            say([
                by(T.leader, TEAM_WIN[result.team]),
                nar(`${T.members.map(id => NAKAMA[id].name).join('・')}が なかまに なった！`)
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'ooni8') {
            say([
                { who: '大鬼', art: 'ooni', text: 'ぐ……おお……。' },
                nar('大鬼の 紋が、ぱきんと くだけた。大鬼は その場に すわりこんで、ねむって しまった。'),
                furu('紋が とけた！ 次の 部屋へ 行こう！')
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'soutou8') {
            say([
                { who: '双頭鬼 (右の頭)', art: 'soutouki', text: '……あれ？ おれたち、なんで けんか してたんだっけ？' },
                { who: '双頭鬼 (左の頭)', art: 'soutouki', text: 'さあ……。頭が 2 つ あっても、思い出せん……。' },
                nar('双頭鬼の 紋が くだけた！')
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'kinme8') {
            // ストーリー工房 8 章 場面 2
            say([
                by('kinmetsuki', '……ぐぬぬ、金ピカが……はがれる……。'),
                nar('金滅鬼の 紋が、ぱきんと くだけた。'),
                by('kinmetsuki', '……その 心、本物か。この 金滅鬼、きさまらに ついて いこう。'),
                nar('金滅鬼が なかまに なった！'),
                furu('この 先が 玉座の 間……おにおにが いるはずだよ！')
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'onioni8') {
            // 8 章 クリア: とけた 紋 → ルキハ (ストーリー工房 8 章 場面 4・5)
            say([
                nar('おにおにの 紋が くだけ、目に 光が もどった。'),
                by('onioni', '……う、ここは……おれの SE城か？ なんで こおりが ここに……。'),
                by('onioni', 'そうだ……ルキハって 男に 会って、目を 見た とたん……そこから なにも おぼえとらん……。'),
                by('onioni', 'くそっ……おれは みんなに なんて ことを……。すまん、こおり……！'),
                { who: 'ルキハ', art: 'rukiha', text: '人形が こわれたか。まあ いい、城の 力は ぜんぶ いただいた。' },
                nar('宝物庫に あつめられた 光が、ルキハの 口に すいこまれていく。'),
                { who: 'ルキハ', art: 'rukiha', text: 'つぎは この 世界 ぜんぶを いただく。……せいぜい 楽しみに しておけ、こおり族の 子。' },
                nar('ルキハは 黒い 霧に なって 消えた。'),
                nar('８章 クリア！ 玉座の 間に ゴウキオニと 金滅鬼が あらわれるように なった。'),
                nar('いったん 石の川タウンの 家に 帰ろう。')
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'zumitani6') {
            say([
                by('zumitani', 'へえ、思ったより やるじゃん♪ 鬼鬼団は この 屋敷の 奥に メダルを はこんでるよ。ただの どろぼうに しては、手ぎわが よすぎるんだよね～。'),
                nar('ズミタニが 道を あけた。屋敷の 奥へ 行けるように なった！')
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'onioni6') {
            // ルキハと おにおにが 消える → のこされた メダル (ストーリー工房 6 章 場面 4)
            say([
                by('onioni', '……ぐっ……。'),
                nar('黒い 霧が おにおにを つつみ、ルキハと いっしょに 消えた……。'),
                furu('おにおに、ぜんぜん いつもと ちがった……。'),
                by('zumitani', 'あの 男の 目、見た？ あれ、人の 目じゃ ないよ。……きみ、気を付けたほうがいいよ。次は 喰われちゃうかもね♪'),
                nar('東の 蔵から、ガタガタと 音が する。だれかが メダルを はこび出そうと している！')
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'tomooka6') {
            say([
                { who: 'トモオカ', art: 'tomooka', text: 'ぐぬぬ……この 右腕が……しぼむとは……！ おぼえとけよ！' },
                nar('トモオカは メダルの 袋を 落として にげていった！'),
                nar('町の 子たちの メダルを 少し とりもどした！'),
                nar('６章 クリア！ ズミタニが 屋敷の 庭を 歩きまわるように なった。'),
                nar('石の川駅から、電車で 月の迷宮へ 行けるように なった！')
            ], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'daishi5') {
            // 5 章 クリア: 書庫で ルキハの 名前 (ストーリー工房 5 章 場面 4)
            warp(TERA_AFTER_BOSS);
            say([
                nar('ダイシの 黒い 紋が、けむりの ように 消えた。'),
                by('daishi', '……かたじけない。拙僧も 紋に のまれ、鬼の 顔に なって おりました。'),
                by('daishi', '紋を つけた 者の 名は……「ルキハ」。人の すがたを した、なにか ですぞ。'),
                furu('ルキハ……。'),
                nar('５章 クリア！ 紋が 消えた キャラたちが ネット寺を 歩きまわるように なった。'),
                furu('こおりくん、いちど 家に 帰ろう。ともいしさんが 心配してるよ。')
            ], { done: () => app.save() });
        } else if (result.rival && result.outcome === 'win') {
            // 4 章: ライバル探検隊に 勝つと 通路を ゆずって くれる
            say([...rivalLines().lose.map(([id, text]) => by(id, text)), nar('ライバル探検隊は 道を ゆずった。'), furu('奥から だれかの 声が する……！ 行ってみよう！')], { done: () => app.save() });
        } else if (result.boss && result.outcome === 'win' && result.bossId === 'urashima4') {
            // 4 章 クリア: 紋が 消える → どうくつの 出口に フードの 人かげ (ストーリー工房 4 章 場面 4)
            warp(UMI_AFTER_BOSS);
            say([
                nar('浦の島重蔵の 黒い 紋が、けむりの ように 消えた。'),
                by('urashima', '……はて。わしは なにを しておったんじゃ……。ほっほっほ。強い 若者じゃのう。ひさしぶりに 脳汁が でたわい。'),
                by('urashima', 'お礼に 力を かそう。……なんの お礼じゃったかの。'),
                nar('どうくつの 出口に、フードを かぶった 人が 立っていた。'),
                nar('……ふりむいた その 指先は、黒く ねじれて、ひとの ものでは なかった。'),
                { who: 'フードの 人', text: '……ほう、紋が とけたか。まあ いい。味見は じゅうぶんだ。' },
                nar('人かげは 霧の ように 消えた。'),
                nar('４章 クリア！ どうくつの 奥にも キャラが 出るように なった。'),
                furu('こおりくん、いちど 家に 帰ろう。ともいしさんに 話を しなきゃ。')
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
        // 10 章の はじまり: 9 章 クリアの あと 石の川タウン・商店街に もどると 黒い 霧 (ストーリー工房 10 章 場面 1)
        if (g.story === 'clear9' && g.pos.y < SCHOOL_Y0 * TILE && startChapter10(g)) {
            say([
                nar('町じゅうに 黒い 霧が たちこめている……。'),
                furu('みんなの 体に 紋が……！ はやく 助けなきゃ！'),
                by('onioni', 'ルキハの 軍勢の しわざか……！ 町の やつらも 商店街の やつらも、ぜんぶ 紋つきに なっとるぞ。'),
                furu(`紋つきの なかまに 勝てば 紋が とけるはず！ ${DARK10_GOAL} 回 助けたら、家の ほうを 見に 行こう！`)
            ], { done: () => app.save() });
            return;
        }

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
            if (target?.type === 'mon') { sfx('ok'); examineMon(target.mon); return; }
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
                app.startBattle({ enemies: encounter(g, source, app.rng, c), kind: 'wild', place: inKurai() ? 'kurai' : darkTown(g, source) ? 'town' : inTsubo() ? 'tsubo' : inKinniku() ? (inHyouga() ? 'hyouga' : 'kinniku') : inPark() ? 'yuen' : inShiro() ? 'shiro' : inMoon() ? 'moon' : inYashiki() ? 'yashiki' : inTera() ? 'tera' : inUmi() ? (inCave() ? 'cave' : 'umi') : inYama() ? 'yama' : source.id });
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
            list.push({ y: (p.y + (p.h || 1)) * TILE, draw: () => drawArt(ctx, ART[personArt(g, p)], Math.floor(t * 2), p.x * TILE + 8 - cam.x, (p.y + (p.h || 1)) * TILE - cam.y, { scale: p.scale || 1 }) });
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
                // 10 章: 紋つき (町と 商店街の キャラ) は むらさきの もや
                if (!c.friendly && darkHere()) {
                    ctx.fillStyle = `rgba(120, 40, 160, ${0.28 + 0.12 * Math.sin(t * 4 + c.x)})`;
                    ctx.beginPath(); ctx.ellipse(x, y - 7, 10, 11, 0, 0, Math.PI * 2); ctx.fill();
                }
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
        // ふるカワ (ウォッチを もらったあとは ついてくる。14 章の 夜は さらわれて いない)
        if (hasWatch(g) && g.story !== 'yoru') {
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
        for (let i = 0; !inSchool() && !inYama() && !inUmi() && !inTera() && !inYashiki() && !inMoon() && !inShiro() && !inPark() && !inKinniku() && !inTsubo() && i < 6; i++) {
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
        drawMons(ctx);
        drawPeople(ctx);
        // 時間帯の 色・雨
        if (TINT[g.time]) { ctx.fillStyle = TINT[g.time]; ctx.fillRect(0, 0, 400, 240); }
        // 12 章: 黒い 空 (町と 商店街)
        if (g.story === 'shuuketsu' && g.pos.y < SCHOOL_Y0 * TILE) { ctx.fillStyle = 'rgba(30, 0, 10, 0.32)'; ctx.fillRect(0, 0, 400, 240); }
        // 10 章: 黒い 霧の 町
        if (darkHere()) {
            ctx.fillStyle = 'rgba(30, 6, 50, 0.5)';
            ctx.fillRect(0, 0, 400, 240);
            for (let i = 0; i < 7; i++) {
                ctx.fillStyle = `rgba(20, 10, 30, ${0.25 + 0.1 * Math.sin(t * 0.8 + i)})`;
                ctx.beginPath(); ctx.ellipse((i * 83 + t * 10) % 520 - 60, 20 + (i * 47) % 220, 70, 22, 0, 0, Math.PI * 2); ctx.fill();
            }
        }
        if (g.weather === 'rain' && !inSchool() && !inCave() && !inMoon()) {
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

    // 黒い 紋の なかま (5 章): キャラの 絵に 黒い もやと どくどく 動く 紋
    function drawMons(ctx) {
        for (const m of monsHere(g)) {
            const x = m.x * TILE + 8 - cam.x, y = m.y * TILE + 14 - cam.y;
            if (x < -30 || x > 430 || y < -40 || y > 270) continue;
            ctx.fillStyle = `rgba(30, 0, 40, ${0.25 + 0.15 * Math.sin(t * 4 + m.x)})`;
            ctx.beginPath(); ctx.ellipse(x, y - 8, 12, 12, 0, 0, Math.PI * 2); ctx.fill();
            drawArt(ctx, ART[NAKAMA[m.nakama].art], Math.floor(t * 2), x, y);
            const k = 2 + Math.sin(t * 6) * 1;
            ctx.fillStyle = '#1a0010';
            ctx.fillRect(x - k, y - 10 - k, k * 2, k * 2);
            ctx.fillRect(x - 1, y - 14 - k, 2, k * 2 + 8);
            text(ctx, '！', x, y - 24 + Math.sin(t * 5) * 1.5, { size: 12, align: 'center', bold: true, color: '#c040ff' });
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
        text(ctx, `${g.day}日目 ${TIMES[g.time]} ${g.weather === 'rain' ? '雨' : 'はれ'}　${areaAt(ht.x, ht.y) === 'park' ? parkName() : AREAS[areaAt(ht.x, ht.y)]}`, 10, 18, { size: 12, bold: true, maxWidth: 230 });
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
        const labels = inKurai()
            ? KURAI_PLACES.map(r => ({ id: r.id, name: r.label, cx: r.x, cy: r.y }))
            : inTsubo()
            ? TSUBO_PLACES.map(r => ({ id: r.id, name: r.label, cx: r.x, cy: r.y }))
            : inKinniku()
            ? KINNIKU_PLACES.map(r => ({ id: r.id, name: r.label, cx: r.x, cy: r.y }))
            : inPark()
            ? PARK_PLACES.map(r => ({ id: r.id, name: r.label, cx: r.x, cy: r.y }))
            : inShiro()
            ? SHIRO_PLACES.map(r => ({ id: r.id, name: r.label, cx: r.x, cy: r.y }))
            : inMoon()
            ? MOON_PLACES.map(r => ({ id: r.id, name: r.label, cx: r.x, cy: r.y }))
            : inYashiki()
            ? YASHIKI_PLACES.map(r => ({ id: r.id, name: r.label, cx: r.x, cy: r.y }))
            : inTera()
            ? TERA_PLACES.map(r => ({ id: r.id, name: r.label, cx: r.x, cy: r.y }))
            : inUmi()
            ? UMI_PLACES.map(r => ({ id: r.id, name: r.label, cx: r.x, cy: r.y }))
            : inYama()
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
            : g.story === 'yama' && allSealsSolved(g) ? { x: 32, y: YAMA_Y0 + 6 }
            : g.story === 'clear3' ? { x: 8, y: 24 } : g.story === 'umi' ? { x: 5, y: 40 }
            : g.story === 'umibe' ? (g.flags.rival4 ? { x: 43, y: UMI_Y0 + 1 } : { x: 39, y: UMI_Y0 + 7 })
            : g.story === 'clear4' ? { x: 8, y: 24 } : g.story === 'tera' ? { x: 5, y: 40 }
            : g.story === 'netdera' ? (monsHere(g)[0] || { x: 26, y: TERA_Y0 + 8 })
            : g.story === 'clear5' ? { x: 8, y: 24 } : g.story === 'shinobi' ? { x: 5, y: 40 }
            : g.story === 'yashiki' ? (!g.flags.zumi6 ? { x: 24, y: YASHIKI_Y0 + 14 } : !g.flags.oni6 ? { x: 24, y: YASHIKI_Y0 + 5 } : { x: 35, y: YASHIKI_Y0 + 5 })
            : g.story === 'clear6' ? { x: 5, y: 40 } : g.story === 'meikyu' ? { x: 24, y: MOON_Y0 + 2 }
            : g.story === 'clear7' ? { x: 5, y: 40 }
            : g.story === 'oshiro' ? { x: 24, y: SHIRO_Y0 + (!g.flags.ooni8 ? 19 : !g.flags.soutou8 ? 15 : !g.flags.kinme8 ? 11 : 7) }
            : g.story === 'clear8' || g.story === 'clear10' || g.story === 'clear11' || g.story === 'clear12' || g.story === 'clear13' ? { x: 8, y: 24 }
            : g.story === 'shuuketsu' ? (!g.flags.oni12 ? { x: 8, y: 6 } : { x: 6, y: 23 })
            : g.story === 'kuraie' ? { x: 5, y: 40 } : g.story === 'kurai' ? { x: 24, y: KURAI_Y0 + 4 }
            : g.story === 'tsuboe' ? { x: 5, y: 40 } : g.story === 'tsubo' ? (!g.flags.baku11 ? { x: 28, y: TSUBO_Y0 + 5 } : { x: 36, y: TSUBO_Y0 + 4 }) : g.story === 'invite' || g.story === 'onijoin' ? { x: 5, y: 40 }
            : g.story === 'shuugeki' ? ((g.flags.dark10 || 0) >= DARK10_GOAL ? { x: 10, y: 24 } : null)
            : g.story === 'kinniku' ? (!g.flags.kirin9 ? { x: 13, y: KINNIKU_Y0 + 10 } : { x: 34, y: KINNIKU_Y0 + 2 })
            : g.story === 'park' ? (g.flags.ride14 ? { x: 5, y: PARK_Y0 + 28 } : { x: 24, y: PARK_Y0 + 6 })
            : g.story === 'yoru' ? (PARK_CLUES.map(c => BUILDINGS.find(x => x.id === c.id).door).find((d, i) => !(g.flags.clue14 || {})[PARK_CLUES[i].id]) || { x: 24, y: PARK_Y0 + 12 }) : null;
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
