// セーブ: このブラウザの localStorage に、バージョン (内定・免許) ごとに 1 つずつ
const key = version => `koori-rpg:save:${version}`;

export function loadSave(version) {
    try {
        const raw = localStorage.getItem(key(version));
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export function writeSave(version, data) {
    try {
        localStorage.setItem(key(version), JSON.stringify(data));
        return true;
    } catch (e) {
        return false;
    }
}

export function hasSave(version) {
    return loadSave(version) !== null;
}
