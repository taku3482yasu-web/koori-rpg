# CLAUDE.md

このリポジトリで作業する Claude への約束です。

- 返事・コメント・書類は日本語で書く。ゲームの中の文字は、ほかのこおりくんシリーズと同じく ひらがな多め・分かち書き。
- 設計書は Claude Docs: https://claude.ai/artifact/F4U4T1NJg6qNmFsEuP67pN 。決まったことは設計書にも書き戻す。
- 演出も内部処理も このリポジトリで作る（分担なし）。ただし `src/logic/` は画面にふれない（`view/` を読み込まない）。数字の確認は tests/ で。
- 前作のキャラは前作の絵と設定を写す（`tools/extract-art.mjs` で koori-dungeon から。`src/art/legacy-art.js` は手で直さない）。
- ユーザーは `play.html` をダブルクリックして遊ぶ。直したら `npm run build:file` で作り直してからコミットする（`.githooks/pre-commit` が自動でやる）。
- テスト: `npm test`（画面なし）と `node tools/browser-test.mjs`（Chrome で遊ぶ）。
- main に push すると GitHub Pages に公開される（`.github/workflows/pages.yml`）。
- 変更ができてテストが通ったら、聞かずに commit して main に push する（2026-10-29 ユーザー指定）。テストが落ちたら push しない。
