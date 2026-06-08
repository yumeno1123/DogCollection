/**
 * 犬種当てクイズ＆ポケット犬種図鑑
 * 【app.js】
 * 
 * 概要：
 * アプリケーションの起動と、ボタンなどの操作（イベントリスナー）
 * の設定のみを行うエントリーポイントモジュールです。
 */

import { loadSaveData, saveGameData, gameState } from './state.js';
import { el, switchScreen, renderDictionary, filterDictionary } from './ui.js';
import { startQuizGame, quitQuiz, useHint, confirmQuitQuiz, cancelQuitQuiz } from './game.js';

// ================= アプリの初期起動処理 ================= //

window.addEventListener('DOMContentLoaded', () => {
  loadSaveData();      // セーブデータを読み込む (state.js)
  setupEventListeners(); // ボタンのクリックイベントなどを設定する
  showDogCounts();     // スタート画面に犬種の登録総数を表示する
  syncSoundSettingsUI(); // 効果音設定UIを現在のステートと同期する
});

// 効果音設定UIを同期する
function syncSoundSettingsUI() {
  if (el.elSoundMuteCheckbox) {
    el.elSoundMuteCheckbox.checked = gameState.soundMuted;
  }
  if (el.elSoundVolumeSlider) {
    el.elSoundVolumeSlider.value = Math.round(gameState.soundVolume * 100);
  }
}

// 出題モードごとの登録犬種数を計算して画面に表示する
function showDogCounts() {
  import('./dictionary.js').then((dict) => {
    const popularCount = Object.keys(dict.POPULAR_DOGS).length;
    const allCount = new Set([...Object.keys(dict.POPULAR_DOGS), ...Object.keys(dict.ALL_DOGS_DICTIONARY)]).size;
    
    const elPopularCount = document.getElementById('popular-count');
    const elAllCount = document.getElementById('all-count');
    if (elPopularCount) elPopularCount.textContent = popularCount;
    if (elAllCount) elAllCount.textContent = allCount;
  }).catch(err => {
    console.error("犬種数の計算に失敗しました:", err);
  });
}

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

  // カスタム中断ポップアップのボタンイベント
  if (el.elBtnQuitCancel) {
    el.elBtnQuitCancel.addEventListener('click', cancelQuitQuiz);
  }
  if (el.elBtnQuitConfirm) {
    el.elBtnQuitConfirm.addEventListener('click', confirmQuitQuiz);
  }

  // 効果音設定コントロールのイベント
  if (el.elSoundMuteCheckbox) {
    el.elSoundMuteCheckbox.addEventListener('change', (e) => {
      gameState.soundMuted = e.target.checked;
      saveGameData();
    });
  }
  if (el.elSoundVolumeSlider) {
    el.elSoundVolumeSlider.addEventListener('input', (e) => {
      gameState.soundVolume = parseInt(e.target.value) / 100;
      saveGameData();
    });
  }

  // セーブデータ管理（エクスポート・インポート）のイベント
  if (el.elBtnToggleDataMgmt) {
    el.elBtnToggleDataMgmt.addEventListener('click', () => {
      if (el.elDataMgmtContent) {
        el.elDataMgmtContent.classList.toggle('hidden');
      }
    });
  }

  if (el.elBtnDataCopy) {
    el.elBtnDataCopy.addEventListener('click', () => {
      if (el.elDataMgmtTextarea) {
        el.elDataMgmtTextarea.select();
        navigator.clipboard.writeText(el.elDataMgmtTextarea.value).then(() => {
          if (el.elDataMgmtStatus) {
            el.elDataMgmtStatus.textContent = 'コピーしました！ 📋';
            el.elDataMgmtStatus.className = 'data-mgmt-status success';
          }
        }).catch(err => {
          if (el.elDataMgmtStatus) {
            el.elDataMgmtStatus.textContent = 'コピーに失敗しました';
            el.elDataMgmtStatus.className = 'data-mgmt-status error';
          }
        });
      }
    });
  }

  if (el.elBtnDataImport) {
    el.elBtnDataImport.addEventListener('click', () => {
      if (el.elDataMgmtTextarea) {
        const txt = el.elDataMgmtTextarea.value.trim();
        if (!txt) {
          if (el.elDataMgmtStatus) {
            el.elDataMgmtStatus.textContent = 'データが空です';
            el.elDataMgmtStatus.className = 'data-mgmt-status error';
          }
          return;
        }
        try {
          const parsed = JSON.parse(txt);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            // セーブデータをローカルストレージへ上書き保存してページをリロードする
            localStorage.setItem(gameState.STORAGE_KEY, txt);
            if (el.elDataMgmtStatus) {
              el.elDataMgmtStatus.textContent = 'よみこみました！再起動します... 🔄';
              el.elDataMgmtStatus.className = 'data-mgmt-status success';
            }
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            if (el.elDataMgmtStatus) {
              el.elDataMgmtStatus.textContent = 'データの形式が正しくありません';
              el.elDataMgmtStatus.className = 'data-mgmt-status error';
            }
          }
        } catch (e) {
          if (el.elDataMgmtStatus) {
            el.elDataMgmtStatus.textContent = 'データの解析に失敗しました（JSONエラー）';
            el.elDataMgmtStatus.className = 'data-mgmt-status error';
          }
        }
      }
    });
  }

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
