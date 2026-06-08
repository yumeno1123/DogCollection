/**
 * 犬種当てクイズ＆ポケット犬種図鑑
 * 【ui.js】
 * 
 * 概要：
 * HTMLの画面（DOM要素）の取得と、
 * 画面切り替え、図鑑表示、ポップアップ表示などのUI描画処理を管理するモジュールファイルです。
 */

import { gameState } from './state.js';
import { getDogData } from './dictionary.js';
import { fetchDogImage } from './api.js';

// ================= HTML要素の取得 ================= //
export const el = {
  // 各画面
  elStartScreen: document.getElementById('start-screen'),
  elQuizScreen: document.getElementById('quiz-screen'),
  elDictionaryScreen: document.getElementById('dictionary-screen'),
  elResultScreen: document.getElementById('result-screen'),

  // ボタン類
  elBtnStart: document.getElementById('btn-start-game'),
  elBtnStartTimeAttack: document.getElementById('btn-start-timeattack'),
  elBtnStartEndless: document.getElementById('btn-start-endless'),
  elBtnViewDict: document.getElementById('btn-view-dictionary'),
  elBtnBackToMenu: document.getElementById('btn-back-to-menu'),
  elBtnRestart: document.getElementById('btn-restart-game'),
  elBtnGoToDict: document.getElementById('btn-go-to-dict'),
  elBtnHint: document.getElementById('btn-quiz-hint'),
  elBtnQuit: document.getElementById('btn-quit-quiz'),
  elBtnResultBackToMenu: document.getElementById('btn-result-back-to-menu'),

  // クイズ画面の共通・4択用要素
  get elQuizCard() { return document.querySelector('.quiz-card'); },
  elQuizProgress: document.getElementById('quiz-progress-text'),
  elQuizTimer: document.getElementById('quiz-timer-text'),
  elQuizScore: document.getElementById('quiz-score-text'),
  elTimerBarContainer: document.getElementById('timer-bar-container'),
  elTimerBar: document.getElementById('timer-bar'),

  elFourChoicesImageArea: document.getElementById('four-choices-image-area'),
  elQuizDogImg: document.getElementById('quiz-dog-image'),
  elTextHintBox: document.getElementById('text-hint-box'),
  elLoading: document.getElementById('loading-indicator'),
  elHintActionArea: document.getElementById('hint-action-area'),
  elHintStatus: document.getElementById('hint-status-text'),
  elFourChoicesOptionsArea: document.getElementById('four-choices-options-area'),
  elOptions: [
    document.getElementById('opt-1'),
    document.getElementById('opt-2'),
    document.getElementById('opt-3'),
    document.getElementById('opt-4')
  ],

  // クイズ画面の2択用要素
  elTwoChoicesArea: document.getElementById('two-choices-area'),
  elTwoChoicesDogName: document.getElementById('two-choices-dog-name'),
  elChoiceLeft: document.getElementById('choice-left'),
  elChoiceRight: document.getElementById('choice-right'),
  elImgChoiceLeft: document.getElementById('img-choice-left'),
  elImgChoiceRight: document.getElementById('img-choice-right'),
  elLoadingLeft: document.getElementById('loading-left'),
  elLoadingRight: document.getElementById('loading-right'),
  elFeedbackLeft: document.getElementById('feedback-left'),
  elFeedbackRight: document.getElementById('feedback-right'),
  elBreedNameLeft: document.getElementById('breed-name-left'),
  elBreedNameRight: document.getElementById('breed-name-right'),

  // 準備画面用の要素
  elPrepArea: document.getElementById('prep-area'),
  elPrepTargetBox: document.getElementById('prep-target-box'),
  elPrepTargetDogName: document.getElementById('prep-target-dog-name'),
  elPrepTargetImage: document.getElementById('prep-target-image'),
  elPrepTargetLoading: document.getElementById('prep-target-loading'),
  elPrepGeneralBox: document.getElementById('prep-general-box'),
  elPrepProgressBar: document.getElementById('prep-progress-bar'),
  elPrepStatusText: document.getElementById('prep-status-text'),
  elPrepCountdown: document.getElementById('prep-countdown'),
  elQuizMainContents: document.getElementById('quiz-main-contents'),

  // 結果画面の要素
  elResult4ChoicesBox: document.getElementById('result-4choices-box'),
  elResultTimeAttackBox: document.getElementById('result-timeattack-box'),
  elResultEndlessBox: document.getElementById('result-endless-box'),

  elResultScoreVal: document.getElementById('result-score-val'),
  elResultPointsVal: document.getElementById('result-points-val'),
  elResultTaTimeVal: document.getElementById('result-ta-time-val'),
  elResultTaRawTime: document.getElementById('result-ta-raw-time'),
  elResultTaPenaltyVal: document.getElementById('result-ta-penalty-val'),
  elResultTaWrongVal: document.getElementById('result-ta-wrong-val'),
  elResultEndlessScoreVal: document.getElementById('result-endless-score-val'),
  elResultEndlessHighscoreMsg: document.getElementById('result-endless-highscore-msg'),

  elResultMessage: document.getElementById('result-message'),
  elNewUnlocksBox: document.getElementById('new-unlocks-box'),
  elNewUnlocksList: document.getElementById('new-unlocks-list'),

  // 図鑑画面の要素
  elDictGrid: document.getElementById('dictionary-grid'),
  elCollectedCount: document.getElementById('collected-count'),
  elTotalCount: document.getElementById('total-count'),
  elCollectedPercent: document.getElementById('collected-percent'),
  elBtnFilterAll: document.getElementById('btn-filter-all'),
  elBtnFilterCollected: document.getElementById('btn-filter-collected'),
  elBtnFilterUncollected: document.getElementById('btn-filter-uncollected'),

  // 効果音・ポップアップ・データ管理用
  elSoundMuteCheckbox: document.getElementById('sound-mute-checkbox'),
  elSoundVolumeSlider: document.getElementById('sound-volume-slider'),
  elQuitConfirmModal: document.getElementById('quit-confirm-modal'),
  elBtnQuitCancel: document.getElementById('btn-quit-cancel'),
  elBtnQuitConfirm: document.getElementById('btn-quit-confirm'),
  elBtnToggleDataMgmt: document.getElementById('btn-toggle-data-mgmt'),
  elDataMgmtContent: document.getElementById('data-mgmt-content'),
  elDataMgmtTextarea: document.getElementById('data-mgmt-textarea'),
  elBtnDataCopy: document.getElementById('btn-data-copy'),
  elBtnDataImport: document.getElementById('btn-data-import'),
  elDataMgmtStatus: document.getElementById('data-mgmt-status')
};

// ================= UI表示制御の共通関数 ================= //

/**
 * 指定されたIDの画面だけを表示し、他を非表示にします。
 * @param {string} screenId - 表示する画面のID
 */
export function switchScreen(screenId) {
  // すべての画面を非表示にする
  el.elStartScreen.classList.add('hidden');
  el.elQuizScreen.classList.add('hidden');
  el.elDictionaryScreen.classList.add('hidden');
  el.elResultScreen.classList.add('hidden');

  // 画面が切り替わるので、2択用のカード余白クラスをリセットする
  if (el.elQuizCard) {
    el.elQuizCard.classList.remove('two-choices-mode');
  }

  // 指定された画面だけ表示する
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.remove('hidden');
  }
}

/**
 * 4択クイズの画像ローディング表示を切り替えます。
 * @param {boolean} isLoading - ロード中かどうか
 */
export function showLoading(isLoading) {
  if (isLoading) {
    el.elLoading.classList.remove('hidden');
  } else {
    el.elLoading.classList.add('hidden');
  }
}

/**
 * 準備画面とクイズメインコンテンツの表示を切り替えます。
 * @param {boolean} showPrep - 準備画面を表示するかどうか
 */
export function showPrepScreen(showPrep) {
  if (showPrep) {
    el.elPrepArea.classList.remove('hidden');
    el.elQuizMainContents.classList.add('hidden');
  } else {
    el.elPrepArea.classList.add('hidden');
    el.elQuizMainContents.classList.remove('hidden');
  }
}

// ================= 結果画面のUI描画処理 ================= //

/**
 * 結果画面の新しく図鑑に解放された犬のリストを描画します。
 */
export function renderNewUnlocksList() {
  if (gameState.newlyUnlockedDogs.length > 0) {
    el.elNewUnlocksBox.classList.remove('hidden');
    el.elNewUnlocksList.innerHTML = '';

    gameState.newlyUnlockedDogs.forEach(item => {
      const elItem = document.createElement('div');
      elItem.className = 'unlock-item';

      let stageText = '';
      if (item.stage === 1) stageText = 'カラー写真公開！';
      if (item.stage === 2) stageText = '生物情報がよめるよ！';
      if (item.stage === 3) stageText = '豆知識がよめるよ！';

      elItem.innerHTML = `
        <span>${item.name}</span>
        <span class="new-badge">${stageText}</span>
      `;
      el.elNewUnlocksList.appendChild(elItem);
    });
  } else {
    el.elNewUnlocksBox.classList.add('hidden');
  }
}

// ================= ポケット犬種図鑑のUI描画処理 ================= //

export let currentFilter = 'all'; // 図鑑画面の現在選択されているフィルター

/**
 * 図鑑画面を描画します。
 */
export function renderDictionary() {
  const allKeys = [...new Set([...Object.keys(getDogData("shiba") ? {} : {}), ...Object.keys(gameState.saveData)])]; 
  // 実際には POPULAR_DOGS と ALL_DOGS_DICTIONARY から取得するため、dictionary.js のエクスポートを参照します。
  // dictionary.jsからインポートして使用できるようにします。
  // (dictionary.jsの構造上、辞書のキー配列をここで組み立てます)
  
  // 図鑑に全キーを展開するため、一度全辞書データを取得
  import('./dictionary.js').then((dict) => {
    const allKeys = [...new Set([...Object.keys(dict.POPULAR_DOGS), ...Object.keys(dict.ALL_DOGS_DICTIONARY)])];
    
    // 五十音順に並び替え
    allKeys.sort((a, b) => {
      const nameA = getDogData(a).japanese;
      const nameB = getDogData(b).japanese;
      return nameA.localeCompare(nameB, 'ja');
    });

    let collectedCount = 0;
    allKeys.forEach(key => {
      if ((gameState.saveData[key] || 0) > 0) {
        collectedCount++;
      }
    });

    const totalCount = allKeys.length;
    const percent = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

    el.elCollectedCount.textContent = collectedCount;
    el.elTotalCount.textContent = totalCount;
    el.elCollectedPercent.textContent = percent;

    // セーブデータ管理エリアの非表示初期化と、現在のセーブデータテキスト書き出し
    if (el.elDataMgmtContent) el.elDataMgmtContent.classList.add('hidden');
    if (el.elDataMgmtTextarea) el.elDataMgmtTextarea.value = JSON.stringify(gameState.saveData);
    if (el.elDataMgmtStatus) {
      el.elDataMgmtStatus.textContent = '';
      el.elDataMgmtStatus.className = 'data-mgmt-status';
    }

    el.elDictGrid.innerHTML = '';
    
    allKeys.forEach(key => {
      const dogWins = gameState.saveData[key] || 0;
      const dogData = getDogData(key);
      const highScore = gameState.saveData[`${key}_highscore`] || (dogWins > 0 ? 10 : 0);
      const attempts = gameState.saveData[`${key}_attempts`] || dogWins;
      const accuracy = attempts > 0 ? Math.round((dogWins / attempts) * 100) : 0;

      if (currentFilter === 'collected' && dogWins === 0) return;
      if (currentFilter === 'uncollected' && dogWins > 0) return;

      const elCard = document.createElement('div');
      elCard.className = `dict-card locked`;

      let nameHtml = '？？？';
      let imageHtml = '';
      let starsHtml = '';
      let actionBtnHtml = '';
      let taBtnHtml = '';
      let infoHtml = '';

      if (dogWins === 0) {
        elCard.className = 'dict-card locked';
        starsHtml = `
          <div class="star-indicator">
            <span>🐾</span><span>🐾</span><span>🐾</span>
          </div>
        `;
      } 
      else if (dogWins === 1) {
        elCard.className = 'dict-card unlocked-1';
        nameHtml = dogData.japanese;
        
        imageHtml = `<img id="dict-img-${key.replace('-','_')}" src="" alt="${dogData.japanese}">`;
        loadDictCardImage(key);

        infoHtml = `
          <div class="dict-info-text">原産国：？？？</div>
          <div class="dict-info-text">大きさ：？？？</div>
          <div class="dict-info-text">ベスト：${highScore}点</div>
          <div class="dict-info-text">正答率：${accuracy}% (${dogWins}/${attempts}回)</div>
        `;

        starsHtml = `
          <div class="star-indicator">
            <span class="active">🐾</span><span>🐾</span><span>🐾</span>
          </div>
        `;
        taBtnHtml = `<button class="dict-play-ta-btn" onclick="startTimeAttackFromDict('${key}')">2択で遊ぶ ⏱️</button>`;
      } 
      else if (dogWins === 2) {
        elCard.className = 'dict-card unlocked-2';
        nameHtml = dogData.japanese;

        imageHtml = `<img id="dict-img-${key.replace('-','_')}" src="" alt="${dogData.japanese}">`;
        loadDictCardImage(key); 

        infoHtml = `
          <div class="dict-info-text">原産国：${dogData.origin}</div>
          <div class="dict-info-text">大きさ：${dogData.size}</div>
          <div class="dict-info-text">ベスト：${highScore}点</div>
          <div class="dict-info-text">正答率：${accuracy}% (${dogWins}/${attempts}回)</div>
        `;

        starsHtml = `
          <div class="star-indicator">
            <span class="active">🐾</span><span class="active">🐾</span><span>🐾</span>
          </div>
        `;
        taBtnHtml = `<button class="dict-play-ta-btn" onclick="startTimeAttackFromDict('${key}')">2択で遊ぶ ⏱️</button>`;
      } 
      else if (dogWins >= 3) {
        elCard.className = 'dict-card unlocked-3';
        nameHtml = dogData.japanese;

        imageHtml = `<img id="dict-img-${key.replace('-','_')}" src="" alt="${dogData.japanese}">`;
        loadDictCardImage(key);

        infoHtml = `
          <div class="dict-info-text">原産国：${dogData.origin}</div>
          <div class="dict-info-text">大きさ：${dogData.size}</div>
          <div class="dict-info-text">ベスト：${highScore}点</div>
          <div class="dict-info-text">正答率：${accuracy}% (${dogWins}/${attempts}回)</div>
        `;

        starsHtml = `
          <div class="star-indicator">
            <span class="active">🐾</span><span class="active">🐾</span><span class="active">🐾</span>
          </div>
        `;
        actionBtnHtml = `<button class="dict-details-btn" onclick="showDogDetailsPopup('${key}')">豆知識 💡</button>`;
        taBtnHtml = `<button class="dict-play-ta-btn" onclick="startTimeAttackFromDict('${key}')">2択で遊ぶ ⏱️</button>`;
      }

      elCard.innerHTML = `
        <div class="dict-image-box">
          ${imageHtml}
        </div>
        <div class="dict-dog-name">${nameHtml}</div>
        ${infoHtml}
        ${starsHtml}
        <div class="dict-actions-wrapper" style="width: 100%; margin-top: 6px;">
          ${actionBtnHtml}
          ${taBtnHtml}
        </div>
      `;

      el.elDictGrid.appendChild(elCard);
    });
  });
}

/**
 * 図鑑のフィルターを切り替えます。
 * @param {string} filterType - 'all', 'collected', 'uncollected'
 */
export function filterDictionary(filterType) {
  currentFilter = filterType;

  el.elBtnFilterAll.classList.remove('active');
  el.elBtnFilterCollected.classList.remove('active');
  el.elBtnFilterUncollected.classList.remove('active');

  if (filterType === 'all') el.elBtnFilterAll.classList.add('active');
  if (filterType === 'collected') el.elBtnFilterCollected.classList.add('active');
  if (filterType === 'uncollected') el.elBtnFilterUncollected.classList.add('active');

  renderDictionary();
}

/**
 * 図鑑一覧の写真を非同期で DogAPI から取得してセットします。
 * @param {string} dogKey - 犬種キー
 */
export async function loadDictCardImage(dogKey) {
  try {
    const imgUrl = await fetchDogImage(dogKey);
    const imgElement = document.getElementById(`dict-img-${dogKey.replace('-','_')}`);
    if (imgElement) {
      imgElement.src = imgUrl;
    }
  } catch (error) {
    console.error("図鑑用画像の取得に失敗しました:", dogKey, error);
    const imgElement = document.getElementById(`dict-img-${dogKey.replace('-','_')}`);
    if (imgElement) {
      imgElement.style.display = 'none';
      const imgBox = imgElement.parentElement;
      if (imgBox) {
        imgBox.classList.add('error');
      }
    }
  }
}

/**
 * 豆知識ポップアップを表示します。
 * @param {string} dogKey - 犬種キー
 */
export async function showDogDetailsPopup(dogKey) {
  const dogData = getDogData(dogKey);

  const elPopupOverlay = document.createElement('div');
  elPopupOverlay.className = 'dict-popup-overlay';
  elPopupOverlay.id = 'dict-popup-overlay';

  elPopupOverlay.addEventListener('click', (e) => {
    if (e.target.id === 'dict-popup-overlay' || e.target.classList.contains('btn-close-popup')) {
      document.body.removeChild(elPopupOverlay);
    }
  });

  let imgUrl = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200';
  try {
    imgUrl = await fetchDogImage(dogKey);
  } catch (e) {
    console.error("ポップアップ用画像取得エラー:", e);
  }

  elPopupOverlay.innerHTML = `
    <div class="dict-popup">
      <img class="popup-image" src="${imgUrl}" alt="${dogData.japanese}">
      <h3>🐾 ${dogData.japanese} 🐾</h3>
      <p>${dogData.description}</p>
      <button class="btn btn-secondary btn-close-popup" style="padding: 8px 20px; font-size: 0.9rem;">とじる ❌</button>
    </div>
  `;

  document.body.appendChild(elPopupOverlay);
}

// インラインの onclick 属性で動作する関数をグローバルに公開
window.showDogDetailsPopup = showDogDetailsPopup;

/**
 * クイズ中断のカスタム確認ポップアップの表示を切り替えます。
 * @param {boolean} show - 表示するかどうか
 */
export function showQuitConfirmModal(show) {
  if (el.elQuitConfirmModal) {
    if (show) {
      el.elQuitConfirmModal.classList.remove('hidden');
    } else {
      el.elQuitConfirmModal.classList.add('hidden');
    }
  }
}
