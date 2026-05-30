/**
 * 犬種当てクイズ＆ポケット犬種図鑑
 * 【app.js】
 * 
 * 概要：
 * アプリケーションの起動と、ボタンなどの操作（イベントリスナー）
 * の設定のみを行うエントリーポイントモジュールです。
 */

import { loadSaveData, gameState } from './state.js';
import { el, switchScreen, renderDictionary, filterDictionary } from './ui.js';
import { startQuizGame, quitQuiz, useHint } from './game.js';

// ================= アプリの初期起動処理 ================= //

window.addEventListener('DOMContentLoaded', () => {
  loadSaveData();      // セーブデータを読み込む (state.js)
  setupEventListeners(); // ボタンのクリックイベントなどを設定する
});

// イベントリスナーの設定
function setupEventListeners() {
  // 画面遷移：スタート画面 -> クイズ画面（各ゲームモードに対応）
  el.elBtnStart.addEventListener('click', () => startQuizGame('4choices'));
  el.elBtnStartTimeAttack.addEventListener('click', () => {
    gameState.targetBreedKeyFromDict = null; // 通常の開始時は指定を解除
    startQuizGame('timeattack');
  });
  el.elBtnStartEndless.addEventListener('click', () => startQuizGame('endless'));

  // 画面遷移：クイズ画面 -> スタート画面（クイズを中断）
  el.elBtnQuit.addEventListener('click', quitQuiz);

  // 画面遷移：スタート画面 -> 図鑑画面
  el.elBtnViewDict.addEventListener('click', () => {
    switchScreen('dictionary-screen');
    renderDictionary();
  });

  // 画面遷移：図鑑画面 -> スタート画面
  el.elBtnBackToMenu.addEventListener('click', () => {
    switchScreen('start-screen');
  });

  // 画面遷移：結果画面 -> クイズ画面（もういちど遊ぶ）
  el.elBtnRestart.addEventListener('click', () => startQuizGame(gameState.activeGameType));

  // 画面遷移：結果画面 -> 図鑑画面
  el.elBtnGoToDict.addEventListener('click', () => {
    switchScreen('dictionary-screen');
    renderDictionary();
  });

  // 画面遷移：結果画面 -> スタート画面
  el.elBtnResultBackToMenu.addEventListener('click', () => {
    switchScreen('start-screen');
  });

  // ヒントボタン
  el.elBtnHint.addEventListener('click', useHint);

  // 図鑑のフィルターボタン
  el.elBtnFilterAll.addEventListener('click', () => filterDictionary('all'));
  el.elBtnFilterCollected.addEventListener('click', () => filterDictionary('collected'));
  el.elBtnFilterUncollected.addEventListener('click', () => filterDictionary('uncollected'));
}
