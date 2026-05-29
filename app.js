/**
 * 犬種当てクイズ＆ポケット犬種図鑑
 * 【app.js】
 * 
 * 概要：
 * アプリのすべての動作（ゲーム進行、API通信、スコア計算、ヒント演出、図鑑表示、データ保存）
 * を制御するメインロジックファイルです。
 */

// ================= 定数・ステート（状態）管理 ================= //
const STORAGE_KEY = 'dog_collection_save_data'; // ローカルストレージに保存するキー名
let saveData = {};                             // セーブデータ（犬種キー: 正解回数）

// ゲームの進行状況を管理する変数
let currentQuizList = []; // 今回のクイズで出題する犬種キーのリスト
let currentQuestionIndex = 0; // 現在何問目か（0からスタート）
let currentQuestionDog = null; // 現在出題中の犬のデータ
let currentDogImageUrl = "";   // 現在出題中の犬の画像URL
let currentScore = 0;          // 今回のクイズの正解数
let currentPoints = 0;         // 今回のクイズの獲得スコア（最大100点）
let hintCount = 0;             // 現在の問題でヒントを使った回数（0〜4）
let quizMode = 'popular';      // 出題モード（'popular' or 'all'）
let difficulty = 'easy';       // 難易度（'easy' or 'hard'）

// 2択ゲーム用の追加ステート
let activeGameType = '4choices'; // '4choices'（4択）, 'timeattack'（2択タイムアタック）, 'endless'（2択エンドレス）
let timeAttackStartTime = 0;     // タイムアタック開始時のミリ秒タイムスタンプ
let timeAttackTimerInterval = null; // タイムアタックのタイマー更新用インターバル
let timeAttackElapsedTime = 0;   // 実際に計測した秒数
let timeAttackPenaltySeconds = 0; // 不正解による追加秒数の合計
let timeAttackWrongCount = 0;     // 間違えた回数
let endlessScore = 0;            // エンドレスの連続正解数
let endlessTimerInterval = null; // エンドレスカウントダウン用のインターバル
let endlessTimeRemaining = 3.0;  // エンドレスの残り時間（秒）
const ENDLESS_LIMIT_TIME = 3.0;  // 1問あたりの制限時間（3秒）

// 先読み（プリフェッチ）キャッシュ
let nextQuestionCache = {
  correctKey: "",
  wrongKey: "",
  urlLeft: "",
  urlRight: "",
  isLeftCorrect: false,
  loaded: false
};

// 今回のクイズで「新しく段階が上がった犬種」を記録する配列（結果画面用）
let newlyUnlockedDogs = [];

// HTML要素の取得
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
const elBtnQuit = document.getElementById('btn-quit-quiz'); // クイズをやめるボタン
const elBtnResultBackToMenu = document.getElementById('btn-result-back-to-menu'); // 結果画面からスタートに戻るボタン

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

// (結果画面の要素は上にマージされました)


// ================= アプリの初期起動処理 ================= //

window.addEventListener('DOMContentLoaded', () => {
  loadSaveData();      // セーブデータを読み込む
  setupEventListeners(); // ボタンのクリックイベントなどを設定する
});

// ローカルストレージからセーブデータを読み込む
function loadSaveData() {
  const rawData = localStorage.getItem(STORAGE_KEY);
  if (rawData) {
    try {
      saveData = JSON.parse(rawData);
    } catch (e) {
      console.error("セーブデータの読み込みに失敗しました。初期化します。", e);
      saveData = {};
    }
  } else {
    saveData = {};
  }
}

// ローカルストレージにセーブデータを保存する
function saveGameData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
}

// イベントリスナーの設定
function setupEventListeners() {
  // 画面遷移：スタート画面 -> クイズ画面（各ゲームモードに対応）
  elBtnStart.addEventListener('click', () => startQuizGame('4choices'));
  elBtnStartTimeAttack.addEventListener('click', () => startQuizGame('timeattack'));
  elBtnStartEndless.addEventListener('click', () => startQuizGame('endless'));

  // 画面遷移：クイズ画面 -> スタート画面（クイズを中断）
  elBtnQuit.addEventListener('click', quitQuiz);

  // 画面遷移：スタート画面 -> 図鑑画面
  elBtnViewDict.addEventListener('click', () => {
    switchScreen('dictionary-screen');
    renderDictionary();
  });

  // 画面遷移：図鑑画面 -> スタート画面
  elBtnBackToMenu.addEventListener('click', () => {
    switchScreen('start-screen');
  });

  // 画面遷移：結果画面 -> クイズ画面（もういちど遊ぶ。直前に遊んでいたモードを開始）
  elBtnRestart.addEventListener('click', () => startQuizGame(activeGameType));

  // 画面遷移：結果画面 -> 図鑑画面
  elBtnGoToDict.addEventListener('click', () => {
    switchScreen('dictionary-screen');
    renderDictionary();
  });

  // 画面遷移：結果画面 -> スタート画面
  elBtnResultBackToMenu.addEventListener('click', () => {
    switchScreen('start-screen');
  });

  // ヒントボタン
  elBtnHint.addEventListener('click', useHint);

  // 図鑑のフィルターボタン
  elBtnFilterAll.addEventListener('click', () => filterDictionary('all'));
  elBtnFilterCollected.addEventListener('click', () => filterDictionary('collected'));
  elBtnFilterUncollected.addEventListener('click', () => filterDictionary('uncollected'));
}

// すべてのタイマーを停止する関数
function clearAllTimers() {
  if (timeAttackTimerInterval) {
    clearInterval(timeAttackTimerInterval);
    timeAttackTimerInterval = null;
  }
  if (endlessTimerInterval) {
    clearInterval(endlessTimerInterval);
    endlessTimerInterval = null;
  }
}

// 画面を切り替えるユーティリティ関数
function switchScreen(screenId) {
  // すべての画面を非表示にする
  elStartScreen.classList.add('hidden');
  elQuizScreen.classList.add('hidden');
  elDictionaryScreen.classList.add('hidden');
  elResultScreen.classList.add('hidden');

  // 指定された画面だけ表示する
  document.getElementById(screenId).classList.remove('hidden');
}

// クイズを途中で終了する処理
function quitQuiz() {
  const confirmQuit = confirm("ゲームを途中でやめますか？\n（ここまでのスコアや記録は保存されません）");
  if (confirmQuit) {
    clearAllTimers(); // タイマーを確実に止める
    switchScreen('start-screen');
  }
}


// ================= クイズゲームのロジック ================= //

// クイズゲームを開始する
function startQuizGame(gameType) {
  activeGameType = gameType || '4choices';

  // 1. 設定値（出題モード・難易度）をラジオボタンから取得
  const selectedMode = document.querySelector('input[name="出題モード"]:checked').value;
  const selectedDiff = document.querySelector('input[name="難易度"]:checked').value;

  quizMode = selectedMode;
  difficulty = selectedDiff;

  // タイマーを確実にリセットする
  clearAllTimers();

  // 進行状況の初期化
  currentQuestionIndex = 0;
  currentScore = 0;
  currentPoints = 0;
  newlyUnlockedDogs = []; // 新規解放リストの初期化

  timeAttackElapsedTime = 0;
  timeAttackPenaltySeconds = 0;
  timeAttackWrongCount = 0;
  endlessScore = 0;

  // キャッシュの初期化
  nextQuestionCache.loaded = false;

  // 2. ゲームモードに応じたUIの切り替えと初期化
  if (activeGameType === '4choices') {
    // 4択クイズ用UI
    elFourChoicesImageArea.classList.remove('hidden');
    elFourChoicesOptionsArea.classList.remove('hidden');
    elTwoChoicesArea.classList.add('hidden');
    elQuizTimer.classList.add('hidden');
    elTimerBarContainer.classList.add('hidden');
    elQuizScore.classList.remove('hidden');

    // 10問の出題リストを作成
    generateQuizList(10);

    // 3. クイズ画面に切り替え、最初の問題を表示
    switchScreen('quiz-screen');
    showQuestion();
  } else {
    // 2択ゲーム（タイムアタック or エンドレス）用UI
    elFourChoicesImageArea.classList.add('hidden');
    elFourChoicesOptionsArea.classList.add('hidden');
    elHintActionArea.classList.add('hidden');
    elTwoChoicesArea.classList.remove('hidden');
    elQuizScore.classList.add('hidden'); // スコア表記は隠す（タイムや正解数は別の場所で表示）

    if (activeGameType === 'timeattack') {
      // タイムアタック用のタイマー表示をオン
      elQuizTimer.classList.remove('hidden');
      elTimerBarContainer.classList.add('hidden');
      elQuizTimer.textContent = "タイム: 0.00 秒";

      // 10問の出題リストを作成（1つの犬種に固定）
      generateQuizList(10, true);
      switchScreen('quiz-screen');

      // タイムアタック開始（50ミリ秒ごとに経過時間を画面更新）
      timeAttackStartTime = Date.now();
      timeAttackTimerInterval = setInterval(() => {
        timeAttackElapsedTime = (Date.now() - timeAttackStartTime) / 1000;
        const totalDisplayTime = timeAttackElapsedTime + timeAttackPenaltySeconds;
        elQuizTimer.textContent = `タイム: ${totalDisplayTime.toFixed(2)} 秒`;
      }, 50);

      showQuestion2Choices();
    } else {
      // エンドレス用のタイムバー表示をオン
      elQuizTimer.classList.add('hidden');
      elTimerBarContainer.classList.remove('hidden');

      // 多めに100問のリストを作っておく
      generateQuizList(100);
      switchScreen('quiz-screen');

      showQuestion2Choices();
    }
  }
}

// 出題リストを作成する
function generateQuizList(count, singleBreed = false) {
  // 今回のモードで出題可能な全犬種キーのリストを取得
  let candidates = [];
  if (quizMode === 'popular') {
    // おなじみモード：POPULAR_DOGSに登録されているキー
    candidates = Object.keys(POPULAR_DOGS);
  } else {
    // 全犬種モード：ALL_DOGS_DICTIONARYとPOPULAR_DOGSの全キー
    candidates = [...new Set([...Object.keys(POPULAR_DOGS), ...Object.keys(ALL_DOGS_DICTIONARY)])];
  }

  // 1種類のお題（犬種）に固定する場合（タイムアタック用）
  if (singleBreed) {
    // まだ図鑑で解放されていない犬種を優先して1つ選ぶ
    const uncompleted = candidates.filter(dogKey => (saveData[dogKey] || 0) < 3);
    let targetBreed = "";
    if (uncompleted.length > 0) {
      shuffleArray(uncompleted);
      targetBreed = uncompleted[0];
    } else {
      shuffleArray(candidates);
      targetBreed = candidates[0];
    }
    // 指定された件数すべて同じ犬種で出題リストを埋める
    currentQuizList = Array(count).fill(targetBreed);
    return;
  }

  // プレイヤーがまだ図鑑で解放完了していない（正解数3未満）犬種を優先リストとして抽出
  const uncompleted = candidates.filter(dogKey => {
    const currentWins = saveData[dogKey] || 0;
    return currentWins < 3;
  });

  // リストのシャッフル（フィッシャー・イェーツのシャッフルアルゴリズム）
  shuffleArray(uncompleted);
  shuffleArray(candidates);

  // 指定された件数の出題リストを決定する
  let selectedList = [];

  // まず未解放の犬種を入れられるだけ入れる
  selectedList = uncompleted.slice(0, count);

  // 件数に満たない場合は、すでに解放済みの犬種をランダムに足す
  if (selectedList.length < count) {
    const completedCandidates = candidates.filter(dogKey => !selectedList.includes(dogKey));
    const extraDogs = completedCandidates.slice(0, count - selectedList.length);
    selectedList = selectedList.concat(extraDogs);
  }

  // 最終的な順序をランダムにシャッフルする
  shuffleArray(selectedList);

  currentQuizList = selectedList;
}

// 配列をランダムに並び替える関数
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 問題を1問表示する
async function showQuestion() {
  hintCount = 0; // ヒントカウントのリセット
  elTextHintBox.classList.add('hidden'); // テキストヒントを隠す
  
  // 4択ボタンのスタイル初期化と無効化解除
  elOptions.forEach(opt => {
    opt.classList.remove('correct', 'incorrect');
    opt.disabled = false;
    opt.style.visibility = 'visible'; // 非表示になっていた選択肢を戻す
  });

  // 進行状況テキストの更新
  elQuizProgress.textContent = `第 ${currentQuestionIndex + 1} 問 / 10問中`;
  elQuizScore.textContent = `スコア：${currentPoints} 点 / せいかい：${currentScore}問`;

  // 現在の問題の犬種キー
  const dogKey = currentQuizList[currentQuestionIndex];
  currentQuestionDog = getDogData(dogKey);
  currentQuestionDog.key = dogKey; // キー自体も参照できるように保存

  // 難易度に応じたぼかしクラスの適用とヒント表示制御
  elQuizDogImg.className = ''; // クラス初期化
  if (difficulty === 'hard') {
    elQuizDogImg.classList.add('blur-level-4'); // 強いぼかし (25px)
    elHintActionArea.classList.remove('hidden'); // むずかしいモードではヒントを表示する
    elBtnHint.disabled = false;
    elHintStatus.textContent = "※おやつをあげると写真が見えやすくなるよ";
  } else {
    elQuizDogImg.classList.add('blur-level-0'); // ぼかしなし
    elHintActionArea.classList.add('hidden');    // かんたんモードではヒントを表示しない
    elBtnHint.disabled = true;
    elHintStatus.textContent = "";
  }

  // DogAPIから画像の取得（非同期処理）
  showLoading(true);
  try {
    // リトライ機能付きで画像をロード
    currentDogImageUrl = await loadDogImageWithRetry(dogKey);
    elQuizDogImg.src = currentDogImageUrl;
  } catch (error) {
    console.error("画像の取得に完全に失敗しました。別のお題でやり直します:", error);
    // お題を別の犬種に差し替えてやり直す
    regenerateQuestion4Choices();
    return;
  } finally {
    showLoading(false);
  }

  // 4つの選択肢を生成する
  setupQuizOptions(dogKey);
}

// ローディング表示の切り替え
function showLoading(isLoading) {
  if (isLoading) {
    elLoading.classList.remove('hidden');
  } else {
    elLoading.classList.add('hidden');
  }
}

// DogAPIからランダム画像URLを取得する
async function fetchDogImage(cleanKey) {
  // DogAPI側のキー名とのズレを調整
  let apiBreed = cleanKey;
  if (cleanKey === 'husky-siberian') {
    apiBreed = 'husky'; // DogAPIではシベリアンハスキーは単に 'husky' として管理されているため
  } else {
    // API用のブリード名に変換 (例: "poodle-toy" -> "poodle/toy")
    apiBreed = cleanKey.replace('-', '/');
  }
  
  // DogAPIの個別犬種画像取得API
  const url = `https://dog.ceo/api/breed/${apiBreed}/images/random`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.message; // 画像URLを返す
}

// 4択ボタンの中身をセットアップする
function setupQuizOptions(correctKey) {
  // 今回のモードで出題可能な全犬種キーリストをコピー
  let allCandidates = [];
  if (quizMode === 'popular') {
    allCandidates = Object.keys(POPULAR_DOGS);
  } else {
    allCandidates = [...new Set([...Object.keys(POPULAR_DOGS), ...Object.keys(ALL_DOGS_DICTIONARY)])];
  }

  // ハズレの選択肢候補（正解キーを除いたもの）
  const incorrectCandidates = allCandidates.filter(key => key !== correctKey);
  shuffleArray(incorrectCandidates);

  // ハズレを3つ選ぶ
  const wrongAnswers = incorrectCandidates.slice(0, 3);

  // 正解1つとハズレ3つの配列を作り、並び替える
  const choices = [correctKey, ...wrongAnswers];
  shuffleArray(choices);

  // ボタンに選択肢テキストとデータ（キー）をセット
  elOptions.forEach((btn, index) => {
    const choiceKey = choices[index];
    const dogData = getDogData(choiceKey);
    btn.textContent = dogData.japanese;
    btn.dataset.key = choiceKey; // 正誤判定のためにキーを保持

    // クリックイベントの設定（一度だけ動作するように）
    btn.onclick = () => selectAnswer(choiceKey, btn);
  });
}

// プレイヤーが回答を選択したときの処理
function selectAnswer(selectedKey, clickedBtn) {
  // すべての選択肢ボタンを無効化（連打防止）
  elOptions.forEach(btn => btn.disabled = true);
  elBtnHint.disabled = true; // ヒントも使えなくする

  const correctKey = currentQuestionDog.key;
  const isCorrect = (selectedKey === correctKey);

  // ぼかしを完全に解除する
  elQuizDogImg.className = 'blur-level-0';

  // 出題（回答）回数の更新
  const prevAttempts = saveData[`${correctKey}_attempts`] || 0;
  saveData[`${correctKey}_attempts`] = prevAttempts + 1;

  if (isCorrect) {
    // 正解の場合
    clickedBtn.classList.add('correct');
    currentScore++;
    
    // 難易度に応じた点数を計算
    let pointsEarned = 0;
    if (difficulty === 'easy') {
      pointsEarned = 4; // かんたんモードは一律4点
    } else {
      // むずかしいモード：ヒント回数に応じた点数を計算（ノーヒント:10点、1回:8点、2回:6点、3回:4点、4回:2点）
      if (hintCount === 0) pointsEarned = 10;
      else if (hintCount === 1) pointsEarned = 8;
      else if (hintCount === 2) pointsEarned = 6;
      else if (hintCount === 3) pointsEarned = 4;
      else if (hintCount === 4) pointsEarned = 2;
    }

    currentPoints += pointsEarned;
    elQuizScore.textContent = `スコア：${currentPoints} 点 / せいかい：${currentScore}問`;
    
    // セーブデータの更新（正解回数）
    const prevWins = saveData[correctKey] || 0;
    saveData[correctKey] = prevWins + 1;

    // 犬種ごとのベストスコア（ハイスコア）を保存する
    const prevHighScore = saveData[`${correctKey}_highscore`] || 0;
    if (pointsEarned > prevHighScore) {
      saveData[`${correctKey}_highscore`] = pointsEarned;
    }

    saveGameData(); // ローカルストレージに書き込み

    // 新しく図鑑情報が解放されたかチェック（1, 2, 3回目に達した時）
    const newWins = saveData[correctKey];
    if (newWins === 1 || newWins === 2 || newWins === 3) {
      newlyUnlockedDogs.push({
        name: currentQuestionDog.japanese,
        stage: newWins
      });
    }

    // 正解音の代わりの可愛いエフェクト等があればここで発火（今回は1.5秒後に次へ）
  } else {
    // 不正解の場合
    clickedBtn.classList.add('incorrect');
    
    // 正解のボタンを青く光らせて教えてあげる
    elOptions.forEach(btn => {
      if (btn.dataset.key === correctKey) {
        btn.classList.add('correct');
      }
    });

    saveGameData(); // 回答回数（attempts）を保存するため書き込み
  }

  // 1.8秒後に次の問題または結果画面へ
  setTimeout(() => {
    // クイズ画面が非表示（クイズをやめた場合）なら処理を中断するガード処理
    if (elQuizScreen.classList.contains('hidden')) return;

    currentQuestionIndex++;
    if (currentQuestionIndex < 10) {
      showQuestion();
    } else {
      showResultScreen();
    }
  }, 1800);
}

// -------------------------------------------------------------
// ================= 2択ゲーム（タイムアタック・エンドレス）の出題・回答処理 =================
// -------------------------------------------------------------

// 指定した犬種の画像URLを取得し、実際にロードが成功することを確認する関数（失敗時は自動リトライ）
async function loadDogImageWithRetry(dogKey, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 1. DogAPIから画像URLを取得
      const url = await fetchDogImage(dogKey);
      
      // 2. 実際に画像をロードしてみて、画像ファイルが正しく読み込めるか検証
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error("画像ファイルのロードに失敗しました"));
        img.src = url;
      });
      
      // ロードに成功した場合は画像URLを返す
      return url;
    } catch (error) {
      console.warn(`画像のロード試行 ${attempt}/${maxRetries} 失敗 (${dogKey}):`, error);
      if (attempt === maxRetries) {
        throw new Error(`画像ロードの最大試行回数に達しました (${dogKey})`);
      }
    }
  }
}

// 画像を事前に読み込んでキャッシュするヘルパー関数
function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error("画像ファイルのロードに失敗しました"));
    img.src = url;
  });
}

// 次の問題のデータを非同期で先読みし、キャッシュする関数
async function prefetchNextQuestion(nextIndex) {
  nextQuestionCache.loaded = false;

  // 出題リストの上限に達した場合は処理を分岐
  if (nextIndex >= currentQuizList.length) {
    if (activeGameType === 'endless') {
      // エンドレス用のリストを補填
      generateQuizList(100);
      nextIndex = 0;
    } else {
      // タイムアタックは10問で終了のため先読みしない
      return;
    }
  }

  const correctKey = currentQuizList[nextIndex];
  
  // 不正解の犬種キーをランダム決定
  let allCandidates = [];
  if (quizMode === 'popular') {
    allCandidates = Object.keys(POPULAR_DOGS);
  } else {
    allCandidates = [...new Set([...Object.keys(POPULAR_DOGS), ...Object.keys(ALL_DOGS_DICTIONARY)])];
  }
  const incorrectCandidates = allCandidates.filter(key => key !== correctKey);
  shuffleArray(incorrectCandidates);
  const wrongKey = incorrectCandidates[0];

  const isLeftCorrect = Math.random() < 0.5;

  nextQuestionCache.correctKey = correctKey;
  nextQuestionCache.wrongKey = wrongKey;
  nextQuestionCache.isLeftCorrect = isLeftCorrect;

  let urlLeft = "";
  let urlRight = "";

  try {
    // 左右それぞれの画像をリトライ機能付きでロード
    const results = await Promise.all([
      loadDogImageWithRetry(isLeftCorrect ? correctKey : wrongKey),
      loadDogImageWithRetry(isLeftCorrect ? wrongKey : correctKey)
    ]);
    urlLeft = results[0];
    urlRight = results[1];
  } catch (error) {
    console.error("先読み画像のロードに完全に失敗しました。この問題を差し替えます:", error);
    // 先読みが失敗したためキャッシュをクリア
    nextQuestionCache.loaded = false;

    // タイムアタック（お題固定）の場合：お題自体を別犬種に変更
    if (activeGameType === 'timeattack') {
      regenerateTimeAttackDog(correctKey);
    } else {
      // エンドレス等の場合：次のリスト項目の問題自体を別犬種に差し替える
      replaceQuizListItem(nextIndex);
    }
    return;
  }

  nextQuestionCache.urlLeft = urlLeft;
  nextQuestionCache.urlRight = urlRight;
  nextQuestionCache.loaded = true;
}

// 2択ゲームの1問を表示する
async function showQuestion2Choices() {
  clearEndlessTimer(); // エンドレス用のタイマーだけを止める（タイムアタックタイマーは継続）

  // 左右のボタンのスタイル初期化と有効化
  [elChoiceLeft, elChoiceRight].forEach(btn => {
    btn.classList.remove('correct', 'incorrect');
    btn.disabled = true; // 画像読み込み完了まで一時的に無効化
  });

  // 〇×フィードバック表示をリセット
  [elFeedbackLeft, elFeedbackRight].forEach(el => {
    el.className = 'choice-feedback hidden';
    el.textContent = '';
    el.style.fontSize = ''; // フォントサイズを通常に戻す
  });

  // 進捗テキストの更新
  if (activeGameType === 'timeattack') {
    elQuizProgress.textContent = `第 ${currentQuestionIndex + 1} / 10 問`;
  } else {
    elQuizProgress.textContent = `連続正解: ${endlessScore} 問`;
  }

  // 出題リストが上限に達した場合（エンドレス用）は再シャッフルして初期化
  if (currentQuestionIndex >= currentQuizList.length) {
    generateQuizList(100);
    currentQuestionIndex = 0;
  }

  // 正解の犬種キー
  const correctKey = currentQuizList[currentQuestionIndex];
  currentQuestionDog = getDogData(correctKey);
  currentQuestionDog.key = correctKey;

  // 画面のタイトルにお題の日本語名を表示
  elTwoChoicesDogName.textContent = currentQuestionDog.japanese;

  let urlLeft = "";
  let urlRight = "";
  let isLeftCorrect = false;

  // 事前ロード（キャッシュ）が有効に使えるかチェック
  if (nextQuestionCache.loaded && nextQuestionCache.correctKey === correctKey) {
    // キャッシュから瞬時に画像と配置を取得
    urlLeft = nextQuestionCache.urlLeft;
    urlRight = nextQuestionCache.urlRight;
    isLeftCorrect = nextQuestionCache.isLeftCorrect;
  } else {
    // キャッシュが使えない場合（初回など）は従来通りロード処理を実行
    elLoadingLeft.classList.remove('hidden');
    elLoadingRight.classList.remove('hidden');

    // 不正解の犬種キーをランダムに1つ決定
    let allCandidates = [];
    if (quizMode === 'popular') {
      allCandidates = Object.keys(POPULAR_DOGS);
    } else {
      allCandidates = [...new Set([...Object.keys(POPULAR_DOGS), ...Object.keys(ALL_DOGS_DICTIONARY)])];
    }
    const incorrectCandidates = allCandidates.filter(key => key !== correctKey);
    shuffleArray(incorrectCandidates);
    const wrongKey = incorrectCandidates[0];

    isLeftCorrect = Math.random() < 0.5;

    try {
      // 左右それぞれの画像をリトライ機能付きでロード
      const results = await Promise.all([
        loadDogImageWithRetry(isLeftCorrect ? correctKey : wrongKey),
        loadDogImageWithRetry(isLeftCorrect ? wrongKey : correctKey)
      ]);
      urlLeft = results[0];
      urlRight = results[1];
    } catch (error) {
      console.error("画像の取得に完全に失敗しました。別のお題でやり直します:", error);
      
      if (activeGameType === 'timeattack') {
        // タイムアタック（お題固定）：お題を変更してリスタート
        regenerateTimeAttackDog(correctKey);
      } else {
        // エンドレス等：現在の問題を別のお題に差し替えて再ロード
        replaceQuizListItem(currentQuestionIndex);
        showQuestion2Choices();
      }
      return;
    } finally {
      elLoadingLeft.classList.add('hidden');
      elLoadingRight.classList.add('hidden');
    }
  }

  // キャッシュ、または今ロードした画像を要素にセット
  elImgChoiceLeft.src = urlLeft;
  elImgChoiceRight.src = urlRight;

  // ボタンに正誤情報とキーを保存
  elChoiceLeft.dataset.isCorrect = isLeftCorrect ? "true" : "false";
  elChoiceRight.dataset.isCorrect = isLeftCorrect ? "false" : "true";
  elChoiceLeft.dataset.key = correctKey;
  elChoiceRight.dataset.key = correctKey;

  // ボタンを有効化
  elChoiceLeft.disabled = false;
  elChoiceRight.disabled = false;

  // ボタンクリック時のイベントを設定
  elChoiceLeft.onclick = () => selectAnswer2Choices(isLeftCorrect, elChoiceLeft);
  elChoiceRight.onclick = () => selectAnswer2Choices(!isLeftCorrect, elChoiceRight);

  // エンドレスモードの場合は3秒カウントダウンタイマーを始動
  if (activeGameType === 'endless') {
    startEndlessTimer();
  }

  // 画像が表示されたので、ただちに次の問題を先読み（バックグラウンドロード）開始
  prefetchNextQuestion(currentQuestionIndex + 1);
}

// エンドレスモードのカウントダウンタイマーを開始する
function startEndlessTimer() {
  endlessTimeRemaining = ENDLESS_LIMIT_TIME;
  elTimerBar.style.width = '100%';

  // 50ミリ秒ごとにゲージを減らす
  endlessTimerInterval = setInterval(() => {
    endlessTimeRemaining -= 0.05;
    
    // ゲージの長さをパーセンテージで変更
    const percentage = Math.max(0, (endlessTimeRemaining / ENDLESS_LIMIT_TIME) * 100);
    elTimerBar.style.width = `${percentage}%`;

    // 時間切れになった場合
    if (endlessTimeRemaining <= 0) {
      clearAllTimers();
      endGameEndless(true); // 時間切れゲームオーバー
    }
  }, 50);
}

// エンドレス用のタイマーのみを停止する関数
function clearEndlessTimer() {
  if (endlessTimerInterval) {
    clearInterval(endlessTimerInterval);
    endlessTimerInterval = null;
  }
}

// 2択ゲームでプレイヤーが回答を選択した時の処理
function selectAnswer2Choices(isCorrect, clickedBtn) {
  // 左右のボタンを無効化（連打防止）
  elChoiceLeft.disabled = true;
  elChoiceRight.disabled = true;

  // エンドレスタイマーの停止（タイムアタックタイマーは止めない）
  clearEndlessTimer();

  const correctKey = currentQuestionDog.key;

  // 出題（遭遇）回数の記録（図鑑の正答率用）
  const prevAttempts = saveData[`${correctKey}_attempts`] || 0;
  saveData[`${correctKey}_attempts`] = prevAttempts + 1;

  // 〇×フィードバック要素の特定
  const elFeedbackClicked = (clickedBtn === elChoiceLeft) ? elFeedbackLeft : elFeedbackRight;
  const elFeedbackOther = (clickedBtn === elChoiceLeft) ? elFeedbackRight : elFeedbackLeft;

  if (isCorrect) {
    // 正解の場合
    clickedBtn.classList.add('correct');
    
    // 正解の〇スタンプを表示
    elFeedbackClicked.textContent = '⭕';
    elFeedbackClicked.className = 'choice-feedback show';

    if (activeGameType === 'timeattack') {
      currentScore++;
    } else {
      endlessScore++;
      currentScore = endlessScore;
    }

    // セーブデータ更新（正解回数）
    const prevWins = saveData[correctKey] || 0;
    saveData[correctKey] = prevWins + 1;

    // 図鑑の新規解放チェック
    const newWins = saveData[correctKey];
    if (newWins === 1 || newWins === 2 || newWins === 3) {
      newlyUnlockedDogs.push({
        name: currentQuestionDog.japanese,
        stage: newWins
      });
    }

    saveGameData();
  } else {
    // 不正解の場合
    clickedBtn.classList.add('incorrect');
    
    // 選んだ画像に❌スタンプ、正解画像に⭕スタンプを表示
    elFeedbackClicked.textContent = '❌';
    elFeedbackClicked.className = 'choice-feedback show';

    elFeedbackOther.textContent = '⭕';
    elFeedbackOther.className = 'choice-feedback show';
    elFeedbackOther.style.fontSize = '3.5rem'; // 正解であることを控えめに示すサイズ

    // もう一方の正解ボタンを光らせる
    if (clickedBtn === elChoiceLeft) {
      elChoiceRight.classList.add('correct');
    } else {
      elChoiceLeft.classList.add('correct');
    }

    if (activeGameType === 'timeattack') {
      // タイムアタック：ペナルティ+3秒、間違えた回数カウントアップ
      timeAttackPenaltySeconds += 3;
      timeAttackWrongCount++;

      // 画面全体を一瞬赤く点滅させる演出
      elQuizScreen.classList.add('penalty-flash');
      elQuizScreen.addEventListener('animationend', () => {
        elQuizScreen.classList.remove('penalty-flash');
      }, { once: true });
    }

    saveGameData();
  }

  // 1.5秒後に次の問題または結果画面へ
  setTimeout(() => {
    // 画面が切り替わっている（やめた）場合はガード
    if (elQuizScreen.classList.contains('hidden')) return;

    if (activeGameType === 'timeattack') {
      currentQuestionIndex++;
      if (currentQuestionIndex < 10) {
        showQuestion2Choices();
      } else {
        endGameTimeAttack();
      }
    } else {
      // エンドレスモード
      if (isCorrect) {
        currentQuestionIndex++;
        showQuestion2Choices();
      } else {
        endGameEndless(false); // 不正解によるゲームオーバー
      }
    }
  }, 1500);
}

// タイムアタックゲーム終了時の処理
function endGameTimeAttack() {
  clearAllTimers();
  
  // 最終タイムの計算
  const finalTime = timeAttackElapsedTime + timeAttackPenaltySeconds;

  // ローカルストレージにベストタイムを保存する処理
  const bestTimeKey = `${quizMode}_timeattack_best`;
  const prevBestTime = saveData[bestTimeKey] || 999999;
  let isNewRecord = false;

  if (finalTime < prevBestTime) {
    saveData[bestTimeKey] = finalTime;
    saveGameData();
    isNewRecord = true;
  }

  // 結果画面の表示切り替え
  showResultScreen2Choices('timeattack', {
    finalTime: finalTime,
    rawTime: timeAttackElapsedTime,
    penalty: timeAttackPenaltySeconds,
    wrongCount: timeAttackWrongCount,
    isNewRecord: isNewRecord
  });
}

// エンドレスゲーム終了時の処理
function endGameEndless(isTimeout) {
  clearAllTimers();

  // ローカルストレージにハイスコアを保存する処理
  const highScoreKey = `${quizMode}_endless_best`;
  const prevHighScore = saveData[highScoreKey] || 0;
  let isNewRecord = false;

  if (endlessScore > prevHighScore) {
    saveData[highScoreKey] = endlessScore;
    saveGameData();
    isNewRecord = true;
  }

  // 結果画面の表示切り替え
  showResultScreen2Choices('endless', {
    score: endlessScore,
    isNewRecord: isNewRecord,
    isTimeout: isTimeout
  });
}

// ヒント機能（おやつをあげる）の処理
function useHint() {
  if (difficulty !== 'hard' || hintCount >= 4) return;

  hintCount++;

  if (hintCount === 1) {
    // 1回目のヒント：ぼかしを少し弱くする
    elQuizDogImg.className = '';
    elQuizDogImg.classList.add('blur-level-3');
    elHintStatus.textContent = "写真が少しだけ見えてきたよ！(ヒント残り3回)";
  } 
  else if (hintCount === 2) {
    // 2回目のヒント：さらにぼかしを弱くする
    elQuizDogImg.className = '';
    elQuizDogImg.classList.add('blur-level-2');
    elHintStatus.textContent = "写真がさらによく見えてきたよ！(ヒント残り2回)";
  } 
  else if (hintCount === 3) {
    // 3回目のヒント：さらにぼかしを弱くし、4つの選択肢から不正解を2つ消す
    elQuizDogImg.className = '';
    elQuizDogImg.classList.add('blur-level-1');
    
    // 選択肢の絞り込み（正解以外の選択肢を2つ隠す）
    const correctKey = currentQuestionDog.key;
    let hiddenCount = 0;
    
    // 選択肢ボタンをランダムにシャッフルしてループ
    const shuffledOptions = [...elOptions];
    shuffleArray(shuffledOptions);

    shuffledOptions.forEach(btn => {
      if (btn.dataset.key !== correctKey && hiddenCount < 2) {
        btn.style.visibility = 'hidden'; // 非表示にする
        hiddenCount++;
      }
    });

    elHintStatus.textContent = "ハズレの選択肢が２つ消えたよ！(ヒント残り1回)";
  } 
  else if (hintCount === 4) {
    // 4回目のヒント：ぼかしを解除し、頭文字ヒントを出す
    elQuizDogImg.className = '';
    elQuizDogImg.classList.add('blur-level-0');

    // 頭文字を取得する（例: 「トイプードル」なら「ト」）
    const jName = currentQuestionDog.japanese;
    const firstChar = jName.charAt(0);

    elTextHintBox.textContent = `💡 ヒント：この犬種は「${firstChar}」から始まるよ！`;
    elTextHintBox.classList.remove('hidden');

    elBtnHint.disabled = true;
    elHintStatus.textContent = "ヒントをすべて使いました！";
  }
}


// ================= 結果発表のロジック ================= //

// 結果画面を表示する
function showResultScreen() {
  switchScreen('result-screen');

  // 表示ブロックの制御
  elResult4ChoicesBox.classList.remove('hidden');
  elResultTimeAttackBox.classList.add('hidden');
  elResultEndlessBox.classList.add('hidden');
  elResultEndlessHighscoreMsg.classList.add('hidden');

  // スコア・正解数の表示
  elResultScoreVal.textContent = currentScore;
  elResultPointsVal.textContent = currentPoints;

  // 獲得スコアに応じたメッセージ
  if (currentPoints === 100) {
    elResultMessage.textContent = "パーフェクト！ノーヒントで全問大正解！あなたは立派なわんわん博士だね！🐶✨";
  } else if (currentPoints >= 80) {
    elResultMessage.textContent = "すごい！少ないヒントで高得点だね！🐾";
  } else if (currentPoints >= 50) {
    elResultMessage.textContent = "がんばったね！ヒントをうまく使ってクリアできたよ！📖";
  } else {
    elResultMessage.textContent = "クイズに挑戦してくれてありがとう！もう一回やってみよう！🐶";
  }

  // 新規図鑑解放の表示
  if (newlyUnlockedDogs.length > 0) {
    elNewUnlocksBox.classList.remove('hidden');
    elNewUnlocksList.innerHTML = ''; // クリア

    newlyUnlockedDogs.forEach(item => {
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
      elNewUnlocksList.appendChild(elItem);
    });
  } else {
    elNewUnlocksBox.classList.add('hidden');
  }
}

// 2択ゲーム用の結果画面を表示する
function showResultScreen2Choices(type, data) {
  switchScreen('result-screen');

  // 表示ブロックのリセット
  elResult4ChoicesBox.classList.add('hidden');
  elResultTimeAttackBox.classList.add('hidden');
  elResultEndlessBox.classList.add('hidden');
  elResultEndlessHighscoreMsg.classList.add('hidden');

  if (type === 'timeattack') {
    elResultTimeAttackBox.classList.remove('hidden');
    elResultTaTimeVal.textContent = data.finalTime.toFixed(2);
    elResultTaRawTime.textContent = data.rawTime.toFixed(2);
    elResultTaPenaltyVal.textContent = data.penalty;
    elResultTaWrongVal.textContent = data.wrongCount;

    // メッセージの決定
    if (data.isNewRecord) {
      elResultMessage.textContent = `🏆 自己ベスト更新！すごい！タイムアタック新記録達成です！ ⏱️✨`;
    } else {
      // 既存のベストタイムを取得して表示に添える
      const bestTimeKey = `${quizMode}_timeattack_best`;
      const bestTime = saveData[bestTimeKey] || 999999;
      elResultMessage.textContent = `30問クリアおめでとう！(自己ベスト: ${bestTime.toFixed(2)}秒) 次はもっと速く走れるかな？🐾`;
    }
  } else {
    // endless
    elResultEndlessBox.classList.remove('hidden');
    elResultEndlessScoreVal.textContent = data.score;

    if (data.isNewRecord) {
      elResultEndlessHighscoreMsg.classList.remove('hidden');
      elResultMessage.textContent = `🏆 ハイスコア更新！どこまでも正解し続けるわんわんマスターだね！ ♾️✨`;
    } else {
      const highScoreKey = `${quizMode}_endless_best`;
      const highScore = saveData[highScoreKey] || 0;
      const timeoutText = data.isTimeout ? "ああっ、時間切れ！" : "おっと、間違えちゃった！";
      elResultMessage.textContent = `${timeoutText} ${data.score}問連続正解したよ！ (自己ベスト: ${highScore}問) 次は記録を超えられるかな？🐶`;
    }
  }

  // 新規図鑑解放の表示
  if (newlyUnlockedDogs.length > 0) {
    elNewUnlocksBox.classList.remove('hidden');
    elNewUnlocksList.innerHTML = ''; // クリア

    newlyUnlockedDogs.forEach(item => {
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
      elNewUnlocksList.appendChild(elItem);
    });
  } else {
    elNewUnlocksBox.classList.add('hidden');
  }
}


// ================= ポケット犬種図鑑のロジック ================= //

let currentFilter = 'all'; // 図鑑画面の現在選択されているフィルター

// 図鑑の描画
function renderDictionary() {
  // 出題対象になりうる全犬種キー
  const allKeys = [...new Set([...Object.keys(POPULAR_DOGS), ...Object.keys(ALL_DOGS_DICTIONARY)])];
  // 読みやすいように五十音順（日本語名のあいうえお順）に並び替える
  allKeys.sort((a, b) => {
    const nameA = getDogData(a).japanese;
    const nameB = getDogData(b).japanese;
    return nameA.localeCompare(nameB, 'ja');
  });

  // 統計データの算出
  let collectedCount = 0;
  allKeys.forEach(key => {
    if ((saveData[key] || 0) > 0) {
      collectedCount++;
    }
  });

  const totalCount = allKeys.length;
  const percent = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  elCollectedCount.textContent = collectedCount;
  elTotalCount.textContent = totalCount;
  elCollectedPercent.textContent = percent;

  // グリッドをクリアし、カードを描画
  elDictGrid.innerHTML = '';
  
  allKeys.forEach(key => {
    const dogWins = saveData[key] || 0;
    const dogData = getDogData(key);
    const highScore = saveData[`${key}_highscore`] || (dogWins > 0 ? 10 : 0);
    const attempts = saveData[`${key}_attempts`] || dogWins;
    const accuracy = attempts > 0 ? Math.round((dogWins / attempts) * 100) : 0;

    // フィルターの適用
    if (currentFilter === 'collected' && dogWins === 0) return;
    if (currentFilter === 'uncollected' && dogWins > 0) return;

    // カード要素の作成
    const elCard = document.createElement('div');
    elCard.className = `dict-card locked`; // 初期値

    let nameHtml = '？？？';
    let imageHtml = '';
    let starsHtml = '';
    let actionBtnHtml = '';

    // 段階的解放の適用
    let infoHtml = ''; // 基本情報のHTML（原産国・大きさ）

    if (dogWins === 0) {
      // 0回：未解放（ロック）
      elCard.className = 'dict-card locked';
      starsHtml = `
        <div class="star-indicator">
          <span>🐾</span><span>🐾</span><span>🐾</span>
        </div>
      `;
    } 
    else if (dogWins === 1) {
      // 1回：カラー写真と名前のみ
      elCard.className = 'dict-card unlocked-1';
      nameHtml = dogData.japanese;
      
      // 画像を非同期で読み込む
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
    } 
    else if (dogWins === 2) {
      // 2回：生物情報（原産国・大きさ）も公開
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
    } 
    else if (dogWins >= 3) {
      // 3回以上：豆知識も解放
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
      // 豆知識を読むボタン
      actionBtnHtml = `<button class="dict-details-btn" onclick="showDogDetailsPopup('${key}')">豆知識 💡</button>`;
    }

    elCard.innerHTML = `
      <div class="dict-image-box">
        ${imageHtml}
      </div>
      <div class="dict-dog-name">${nameHtml}</div>
      ${infoHtml}
      ${starsHtml}
      ${actionBtnHtml}
    `;

    elDictGrid.appendChild(elCard);
  });
}

// 図鑑のフィルター切り替え
function filterDictionary(filterType) {
  currentFilter = filterType;

  // ボタンのアクティブ状態の切り替え
  elBtnFilterAll.classList.remove('active');
  elBtnFilterCollected.classList.remove('active');
  elBtnFilterUncollected.classList.remove('active');

  if (filterType === 'all') elBtnFilterAll.classList.add('active');
  if (filterType === 'collected') elBtnFilterCollected.classList.add('active');
  if (filterType === 'uncollected') elBtnFilterUncollected.classList.add('active');

  renderDictionary();
}

// 図鑑一覧の写真を非同期で DogAPI から取得してセットする関数
async function loadDictCardImage(dogKey) {
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
      // フォールバック
      imgElement.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=150';
    }
  }
}

// 豆知識ポップアップ（モーダル）を表示する関数
async function showDogDetailsPopup(dogKey) {
  const dogData = getDogData(dogKey);

  // ポップアップ用要素を動的に生成
  const elPopupOverlay = document.createElement('div');
  elPopupOverlay.className = 'dict-popup-overlay';
  elPopupOverlay.id = 'dict-popup-overlay';

  // ポップアップを閉じるためのクリックイベント
  elPopupOverlay.addEventListener('click', (e) => {
    if (e.target.id === 'dict-popup-overlay' || e.target.classList.contains('btn-close-popup')) {
      document.body.removeChild(elPopupOverlay);
    }
  });

  // ポップアップ用の画像を非同期取得
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

// グローバルスコープからポップアップ関数を呼べるようにwindowオブジェクトに登録
window.showDogDetailsPopup = showDogDetailsPopup;

// -------------------------------------------------------------
// ================= 画像取得エラー時の差し替え・スキップ処理ヘルパー =================
// -------------------------------------------------------------

// 4択クイズでお題となる犬種の画像取得が完全に失敗した場合、別のお題に差し替える
function regenerateQuestion4Choices() {
  let allCandidates = [];
  if (quizMode === 'popular') {
    allCandidates = Object.keys(POPULAR_DOGS);
  } else {
    allCandidates = [...new Set([...Object.keys(POPULAR_DOGS), ...Object.keys(ALL_DOGS_DICTIONARY)])];
  }
  
  // 現在のクイズリストに含まれていない画像候補を抽出
  const available = allCandidates.filter(key => !currentQuizList.includes(key));
  shuffleArray(available);
  
  if (available.length > 0) {
    // 現在の問題の犬種を、新しい取得可能な犬種に差し替える
    currentQuizList[currentQuestionIndex] = available[0];
    showQuestion(); // 再表示
  } else {
    // 万が一予備がない場合は結果画面へ進む
    showResultScreen();
  }
}

// 2択タイムアタック（1犬種固定）でお題犬種の画像取得が完全に失敗した場合、お題ごと変更して1問目から再ロード
function regenerateTimeAttackDog(failedBreed) {
  let allCandidates = [];
  if (quizMode === 'popular') {
    allCandidates = Object.keys(POPULAR_DOGS);
  } else {
    allCandidates = [...new Set([...Object.keys(POPULAR_DOGS), ...Object.keys(ALL_DOGS_DICTIONARY)])];
  }
  
  // 失敗した犬種以外の候補を抽出
  const available = allCandidates.filter(key => key !== failedBreed);
  shuffleArray(available);
  
  if (available.length > 0) {
    const newBreed = available[0];
    // タイムアタック用のリストをすべて新しい犬種で再生成
    currentQuizList = Array(10).fill(newBreed);
    currentQuestionIndex = 0; // 1問目に戻る
    
    // 計測データのリセット（エラー待ち時間をプレイヤーのタイムに含めないためのリセット）
    timeAttackStartTime = Date.now();
    timeAttackPenaltySeconds = 0;
    timeAttackWrongCount = 0;
    currentScore = 0;
    
    showQuestion2Choices();
  } else {
    // 候補が残っていない場合はスタート画面に戻る
    switchScreen('start-screen');
  }
}

// 2択クイズ（エンドレス等）でリスト内の特定インデックスの問題を別の犬種に差し替える
function replaceQuizListItem(index) {
  let allCandidates = [];
  if (quizMode === 'popular') {
    allCandidates = Object.keys(POPULAR_DOGS);
  } else {
    allCandidates = [...new Set([...Object.keys(POPULAR_DOGS), ...Object.keys(ALL_DOGS_DICTIONARY)])];
  }
  
  // 現在出題予定のリストに含まれていない犬種を抽出
  const currentKeys = currentQuizList;
  const available = allCandidates.filter(key => !currentKeys.includes(key));
  shuffleArray(available);
  
  if (available.length > 0) {
    currentQuizList[index] = available[0];
  }
}
