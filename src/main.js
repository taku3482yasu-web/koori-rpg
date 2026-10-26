// =====================================================================
// こおりくんの大冒険～大集合だヨ！おともだち！～ (内定 / 免許)
// ---------------------------------------------------------------------
// 場面 (title → field ⇄ battle → result → field、field ⇄ menu) を 切りかえ、毎コマ 入力 → update → 描く。
// セーブは 町に 戻るたび・メニューで・ページを 閉じるとき・30 秒ごと (設計書 7 章「いつでも 中断できる」)
// =====================================================================
import { setupScreens } from './core/screen.js';
import { createInput } from './core/input.js';
import { createRng } from './core/rng.js';
import { loadSave, writeSave } from './core/save.js';
import { unlockSound } from './core/sound.js';
import { newGame, migrate, VERSIONS, watchMedals, applyBattleResult } from './logic/game.js';
import { createBattle } from './logic/battle.js';
import { createTalk } from './view/talk.js';
import { createTitle } from './view/title.js';
import { createField } from './view/field.js';
import { createBattleView } from './view/battle-view.js';
import { createResult } from './view/result.js';
import { createMenu } from './view/menu.js';

const topCanvas = document.getElementById('top');
const bottomCanvas = document.getElementById('bottom');
const screens = setupScreens(topCanvas, bottomCanvas);
if (!matchMedia('(pointer: coarse)').matches) document.body.classList.add('nopad');
screens.layout();
const input = createInput({ bottomCanvas, topCanvas, padRoot: document.getElementById('pad'), onPadChange: () => screens.layout() });

const params = new URLSearchParams(location.search);
const app = {
    version: params.get('v') === 'menkyo' ? 'menkyo' : 'naitei',
    g: null,
    input,
    rng: createRng(Date.now() & 0xffffffff),
    talk: createTalk(),
    scene: null,
    field: null,
    get versionName() { return `${VERSIONS[this.version]}バージョン`; },

    setVersion(v) {
        this.version = v;
        document.body.classList.toggle('v-menkyo', v === 'menkyo');
    },
    start(version, fresh) {
        this.setVersion(version);
        const saved = fresh ? null : loadSave(version);
        this.g = saved ? migrate(saved) : newGame(version, Date.now() & 0xffff);
        this.field = createField(this);
        this.scene = this.field;
        if (fresh) {
            this.talk.open([
                { who: 'ともいし', art: 'tomoishi', text: 'こおりくん、夏休みだからって 家で ゴロゴロしてないで、外で 遊んできなさい！' },
                { who: 'ともいし', art: 'tomoishi', text: 'そうそう、神社の ほうで ふるカワちゃんが さがしてたわよ。' }
            ]);
            this.save();
        }
    },
    save() {
        if (this.g) writeSave(this.version, this.g);
    },
    go(name) {
        if (name === 'field') this.scene = this.field;
        else if (name === 'menu') this.scene = createMenu(this);
        else if (name === 'title') this.scene = createTitle(this);
    },
    startBattle({ enemies, kind, place }) {
        const allies = watchMedals(this.g).map(m => (m ? { uid: m.uid, id: m.id, lv: m.lv } : null));
        const battle = createBattle({ allies, enemies, rng: this.rng, kind });
        this.scene = createBattleView(this, battle, place);
    },
    endBattle(battle) {
        const result = applyBattleResult(this.g, battle, this.rng);
        if (result.outcome === 'lose') {
            this.g.pos = { x: 6 * 16 + 8, y: 24 * 16 + 12, dir: 'down' };
        }
        this.save();
        this.scene = createResult(this, result);
    },
    backToField(result) {
        this.scene = this.field;
        this.field.afterBattle(result);
        this.save();
    }
};
app.setVersion(app.version);
app.scene = createTitle(app);
window.__app = app;   // 自動テスト・デバッグ用

// ----- 毎コマ -----
let last = performance.now(), saveTimer = 0;
function frame(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    input.update();
    if (input.touch.justDown || Object.values(input.pressed).some(Boolean)) unlockSound();
    if (app.talk.isActive()) app.talk.update(dt, input);
    else app.scene.update(dt, input);
    app.scene.drawTop(screens.top);
    app.scene.drawBottom(screens.bottom);
    if (app.g && app.scene === app.field) {
        saveTimer += dt;
        if (saveTimer > 30) { saveTimer = 0; app.save(); }
    }
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => { if (document.hidden) app.save(); });
window.addEventListener('pagehide', () => app.save());
