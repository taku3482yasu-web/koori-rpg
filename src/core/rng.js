// 種つきの乱数 (mulberry32)。テストで同じ結果を出せるように、ゲームの乱数は全部これを通す
export function createRng(seed = Date.now()) {
    let a = seed >>> 0;
    const next = () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
        next,
        int: n => Math.floor(next() * n),
        chance: p => next() < p,
        pick: list => list[Math.floor(next() * list.length)],
        // [{ ..., w: 重み }] から 1 つ
        weighted: list => {
            const total = list.reduce((s, x) => s + (x.w ?? 1), 0);
            let r = next() * total;
            for (const x of list) {
                r -= x.w ?? 1;
                if (r < 0) return x;
            }
            return list[list.length - 1];
        }
    };
}
