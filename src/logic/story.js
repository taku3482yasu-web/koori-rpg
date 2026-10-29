// =====================================================================
// ストーリーの 順番 (画面に ふれない)
// ---------------------------------------------------------------------
// 1 章: intro → friends → bridge → clear (ヌシを たおした。ここから 2 章)
// 2 章「学校の七不思議」: clear → school (夜の 学校に 入った) → clear2 (8 つ目の ふしぎを たおした)
// 3 章「ダムの水が消える」: clear2 → yama (山に 入った) → clear3 (ダムの ヌシを たおした)
// 4 章「海辺の どうくつと ライバル探検隊」: clear3 → umi (ともいしと 話した。電車で 行ける) → umibe (海辺の 町に 着いた) → clear4 (どうくつの ボスを たおした)
// 5 章「ネット寺の のろい」: clear4 → tera (ダイシの 手紙を 読んだ。電車で 行ける) → netdera (ネット寺に 着いた) → clear5 (ダイシを たおした)
// 6 章「忍びの屋敷と 消えた メダル」: clear5 → shinobi (ともいしと 話した。電車で 行ける) → yashiki (屋敷に 着いた) → clear6 (トモオカを たおした)
// reached(g, 'clear') は「1 章 クリアの あと」(2 章の あいだも ふくむ)
// =====================================================================
export const STORY = ['intro', 'friends', 'bridge', 'clear', 'school', 'clear2', 'yama', 'clear3', 'umi', 'umibe', 'clear4', 'tera', 'netdera', 'clear5', 'shinobi', 'yashiki', 'clear6'];
export const reached = (g, s) => STORY.indexOf(g.story) >= STORY.indexOf(s);
