/**
 * 犬種当てクイズ＆ポケット犬種図鑑
 * 【ui.js】
 * 
 * 概要：
 * HTMLの画面（DOM要素）の取得と、
 * 画面切り替えやローディングアニメーションの表示制御を担当するファイルです。
 */

// ================= HTML要素の取得 ================= //
// 各画面
const elStartScreen = document.getElementById('start-screen');
const elQuizScreen = document.getElementById('quiz-screen');
const elDictionaryScreen = document.getElementById('dictionary-screen');
const elResultScreen = document.getElementById('result-screen');

// ボタン類
const elBtnStart = document.getElementById('btn-start-game');
const elBtnStartTimeAttack = document.getElementById('btn-start-timeattack');
const elBtnStartEndless = document.getElementById('btn-start-endless');
const elBtnViewDict = document.getElementById('btn-view-dictionary');
const elBtnBackToMenu = document.getElementById('btn-back-to-menu');
const elBtnRestart = document.getElementById('btn-restart-game');
const elBtnGoToDict = document.getElementById('btn-go-to-dict');
const elBtnHint = document.getElementById('btn-quiz-hint');
const elBtnQuit = document.getElementById('btn-quit-quiz');
const elBtnResultBackToMenu = document.getElementById('btn-result-back-to-menu');

// クイズ画面の共通・4択用要素
const elQuizProgress = document.getElementById('quiz-progress-text');
const elQuizTimer = document.getElementById('quiz-timer-text');
const elQuizScore = document.getElementById('quiz-score-text');
const elTimerBarContainer = document.getElementById('timer-bar-container');
const elTimerBar = document.getElementById('timer-bar');

const elFourChoicesImageArea = document.getElementById('four-choices-image-area');
const elQuizDogImg = document.getElementById('quiz-dog-image');
const elTextHintBox = document.getElementById('text-hint-box');
const elLoading = document.getElementById('loading-indicator');
const elHintActionArea = document.getElementById('hint-action-area');
const elHintStatus = document.getElementById('hint-status-text');
const elFourChoicesOptionsArea = document.getElementById('four-choices-options-area');
const elOptions = [
  document.getElementById('opt-1'),
  document.getElementById('opt-2'),
  document.getElementById('opt-3'),
  document.getElementById('opt-4')
];

// クイズ画面の2択用要素
const elTwoChoicesArea = document.getElementById('two-choices-area');
const elTwoChoicesDogName = document.getElementById('two-choices-dog-name');
const elChoiceLeft = document.getElementById('choice-left');
const elChoiceRight = document.getElementById('choice-right');
const elImgChoiceLeft = document.getElementById('img-choice-left');
const elImgChoiceRight = document.getElementById('img-choice-right');
const elLoadingLeft = document.getElementById('loading-left');
const elLoadingRight = document.getElementById('loading-right');
const elFeedbackLeft = document.getElementById('feedback-left');
const elFeedbackRight = document.getElementById('feedback-right');
// 準備画面用の要素
const elPrepArea = document.getElementById('prep-area');
const elPrepTargetBox = document.getElementById('prep-target-box');
const elPrepTargetDogName = document.getElementById('prep-target-dog-name');
const elPrepTargetImage = document.getElementById('prep-target-image');
const elPrepTargetLoading = document.getElementById('prep-target-loading');
const elPrepGeneralBox = document.getElementById('prep-general-box');
const elPrepProgressBar = document.getElementById('prep-progress-bar');
const elPrepStatusText = document.getElementById('prep-status-text');
const elPrepCountdown = document.getElementById('prep-countdown');
const elQuizMainContents = document.getElementById('quiz-main-contents');

// 結果画面の要素
const elResult4ChoicesBox = document.getElementById('result-4choices-box');
const elResultTimeAttackBox = document.getElementById('result-timeattack-box');
const elResultEndlessBox = document.getElementById('result-endless-box');

const elResultScoreVal = document.getElementById('result-score-val');
const elResultPointsVal = document.getElementById('result-points-val');
const elResultTaTimeVal = document.getElementById('result-ta-time-val');
const elResultTaRawTime = document.getElementById('result-ta-raw-time');
const elResultTaPenaltyVal = document.getElementById('result-ta-penalty-val');
const elResultTaWrongVal = document.getElementById('result-ta-wrong-val');
const elResultEndlessScoreVal = document.getElementById('result-endless-score-val');
const elResultEndlessHighscoreMsg = document.getElementById('result-endless-highscore-msg');

const elResultMessage = document.getElementById('result-message');
const elNewUnlocksBox = document.getElementById('new-unlocks-box');
const elNewUnlocksList = document.getElementById('new-unlocks-list');

// 図鑑画面の要素
const elDictGrid = document.getElementById('dictionary-grid');
const elCollectedCount = document.getElementById('collected-count');
const elTotalCount = document.getElementById('total-count');
const elCollectedPercent = document.getElementById('collected-percent');
const elBtnFilterAll = document.getElementById('btn-filter-all');
const elBtnFilterCollected = document.getElementById('btn-filter-collected');
const elBtnFilterUncollected = document.getElementById('btn-filter-uncollected');

// ================= UI表示制御の共通関数 ================= //

// 画面を切り替える関数
function switchScreen(screenId) {
  // すべての画面を非表示にする
  elStartScreen.classList.add('hidden');
  elQuizScreen.classList.add('hidden');
  elDictionaryScreen.classList.add('hidden');
  elResultScreen.classList.add('hidden');

  // 指定された画面だけ表示する
  document.getElementById(screenId).classList.remove('hidden');
}

// 4択クイズの画像ローディング表示切り替え
function showLoading(isLoading) {
  if (isLoading) {
    elLoading.classList.remove('hidden');
  } else {
    elLoading.classList.add('hidden');
  }
}

// 準備画面とクイズメインの表示切り替え
function showPrepScreen(showPrep) {
  if (showPrep) {
    elPrepArea.classList.remove('hidden');
    elQuizMainContents.classList.add('hidden');
  } else {
    elPrepArea.classList.add('hidden');
    elQuizMainContents.classList.remove('hidden');
  }
}
