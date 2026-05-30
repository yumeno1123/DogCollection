/**
 * 犬種当てクイズ＆ポケット犬種図鑑
 * 【app.js】
 * 
 * 概要：
 * アプリケーションの起動と、ボタンなどの操作（イベントリスナー）
 * の設定のみを行うエントリーポイントファイルです。
 * 状態管理やゲームロジックは別のファイルに分割されています。
 */

// ================= アプリの初期起動処理 ================= //

window.addEventListener('DOMContentLoaded', () => {
  loadSaveData();      // セーブデータを読み込む (state.js)
  setupEventListeners(); // ボタンのクリックイベントなどを設定する
});

// イベントリスナーの設定
function setupEventListeners() {
  // 画面遷移：スタート画面 -> クイズ画面（各ゲームモードに対応） (game.js)
  elBtnStart.addEventListener('click', () => startQuizGame('4choices'));
  elBtnStartTimeAttack.addEventListener('click', () => {
    targetBreedKeyFromDict = null; // 通常の開始時は指定を解除
    startQuizGame('timeattack');
  });
  elBtnStartEndless.addEventListener('click', () => startQuizGame('endless'));

  // 画面遷移：クイズ画面 -> スタート画面（クイズを中断） (game.js)
  elBtnQuit.addEventListener('click', quitQuiz);

  // 画面遷移：スタート画面 -> 図鑑画面
  elBtnViewDict.addEventListener('click', () => {
    switchScreen('dictionary-screen'); // ui.js
    renderDictionary(); // game.js
  });

  // 画面遷移：図鑑画面 -> スタート画面
  elBtnBackToMenu.addEventListener('click', () => {
    switchScreen('start-screen'); // ui.js
  });

  // 画面遷移：結果画面 -> クイズ画面（もういちど遊ぶ）
  elBtnRestart.addEventListener('click', () => startQuizGame(activeGameType));

  // 画面遷移：結果画面 -> 図鑑画面
  elBtnGoToDict.addEventListener('click', () => {
    switchScreen('dictionary-screen'); // ui.js
    renderDictionary(); // game.js
  });

  // 画面遷移：結果画面 -> スタート画面
  elBtnResultBackToMenu.addEventListener('click', () => {
    switchScreen('start-screen'); // ui.js
  });

  // ヒントボタン
  elBtnHint.addEventListener('click', useHint); // game.js

  // 図鑑のフィルターボタン
  elBtnFilterAll.addEventListener('click', () => filterDictionary('all')); // game.js
  elBtnFilterCollected.addEventListener('click', () => filterDictionary('collected'));
  elBtnFilterUncollected.addEventListener('click', () => filterDictionary('uncollected'));
}
