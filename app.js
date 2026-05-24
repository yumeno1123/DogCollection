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
let currentQuizList = []; // 今回のクイズで出題する犬種キーのリスト（10問分）
let currentQuestionIndex = 0; // 現在何問目か（0〜9）
let currentQuestionDog = null; // 現在出題中の犬のデータ
let currentDogImageUrl = "";   // 現在出題中の犬の画像URL
let currentScore = 0;          // 今回のクイズの正解数
let currentPoints = 0;         // 今回のクイズの獲得スコア（最大100点）
let hintCount = 0;             // 現在の問題でヒントを使った回数（0〜4）
let quizMode = 'popular';      // 出題モード（'popular' or 'all'）
let difficulty = 'easy';       // 難易度（'easy' or 'hard'）

// 今回のクイズで「新しく段階が上がった犬種」を記録する配列（結果画面用）
let newlyUnlockedDogs = [];

// HTML要素の取得
const elStartScreen = document.getElementById('start-screen');
const elQuizScreen = document.getElementById('quiz-screen');
const elDictionaryScreen = document.getElementById('dictionary-screen');
const elResultScreen = document.getElementById('result-screen');

// ボタン類
const elBtnStart = document.getElementById('btn-start-game');
const elBtnViewDict = document.getElementById('btn-view-dictionary');
const elBtnBackToMenu = document.getElementById('btn-back-to-menu');
const elBtnRestart = document.getElementById('btn-restart-game');
const elBtnGoToDict = document.getElementById('btn-go-to-dict');
const elBtnHint = document.getElementById('btn-quiz-hint');
const elBtnQuit = document.getElementById('btn-quit-quiz'); // クイズをやめるボタン
const elBtnResultBackToMenu = document.getElementById('btn-result-back-to-menu'); // 結果画面からスタートに戻るボタン

// クイズ画面の要素
const elQuizProgress = document.getElementById('quiz-progress-text');
const elQuizScore = document.getElementById('quiz-score-text');
const elQuizDogImg = document.getElementById('quiz-dog-image');
const elTextHintBox = document.getElementById('text-hint-box');
const elLoading = document.getElementById('loading-indicator');
const elHintActionArea = document.getElementById('hint-action-area');
const elHintStatus = document.getElementById('hint-status-text');
const elOptions = [
  document.getElementById('opt-1'),
  document.getElementById('opt-2'),
  document.getElementById('opt-3'),
  document.getElementById('opt-4')
];

// 図鑑画面の要素
const elDictGrid = document.getElementById('dictionary-grid');
const elCollectedCount = document.getElementById('collected-count');
const elTotalCount = document.getElementById('total-count');
const elCollectedPercent = document.getElementById('collected-percent');
const elBtnFilterAll = document.getElementById('btn-filter-all');
const elBtnFilterCollected = document.getElementById('btn-filter-collected');
const elBtnFilterUncollected = document.getElementById('btn-filter-uncollected');

// 結果画面の要素
const elResultScoreVal = document.getElementById('result-score-val');
const elResultPointsVal = document.getElementById('result-points-val');
const elResultMessage = document.getElementById('result-message');
const elNewUnlocksBox = document.getElementById('new-unlocks-box');
const elNewUnlocksList = document.getElementById('new-unlocks-list');


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
  // 画面遷移：スタート画面 -> クイズ画面
  elBtnStart.addEventListener('click', startQuizGame);

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

  // 画面遷移：結果画面 -> クイズ画面（もういちど遊ぶ）
  elBtnRestart.addEventListener('click', startQuizGame);

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
  const confirmQuit = confirm("クイズを途中でやめますか？\n（ここまでの正解数は図鑑に保存されません）");
  if (confirmQuit) {
    switchScreen('start-screen');
  }
}


// ================= クイズゲームのロジック ================= //

// クイズゲームを開始する
function startQuizGame() {
  // 1. 設定値（出題モード・難易度）をラジオボタンから取得
  const selectedMode = document.querySelector('input[name="出題モード"]:checked').value;
  const selectedDiff = document.querySelector('input[name="難易度"]:checked').value;

  quizMode = selectedMode;
  difficulty = selectedDiff;

  // 進行状況の初期化
  currentQuestionIndex = 0;
  currentScore = 0;
  currentPoints = 0;
  newlyUnlockedDogs = []; // 新規解放リストの初期化

  // 2. 出題する10問の犬種リストを作成
  generateQuizList();

  // 3. クイズ画面に切り替え、最初の問題を表示
  switchScreen('quiz-screen');
  showQuestion();
}

// 出題リスト（10問分）を作成する
function generateQuizList() {
  // 今回のモードで出題可能な全犬種キーのリストを取得
  let candidates = [];
  if (quizMode === 'popular') {
    // おなじみモード：POPULAR_DOGSに登録されているキー
    candidates = Object.keys(POPULAR_DOGS);
  } else {
    // 全犬種モード：ALL_DOGS_DICTIONARYとPOPULAR_DOGSの全キー
    candidates = [...new Set([...Object.keys(POPULAR_DOGS), ...Object.keys(ALL_DOGS_DICTIONARY)])];
  }

  // プレイヤーがまだ図鑑で解放完了していない（正解数3未満）犬種を優先リストとして抽出
  const uncompleted = candidates.filter(dogKey => {
    const currentWins = saveData[dogKey] || 0;
    return currentWins < 3;
  });

  // リストのシャッフル（フィッシャー・イェーツのシャッフルアルゴリズム）
  shuffleArray(uncompleted);
  shuffleArray(candidates);

  // 10問の出題リストを決定する
  let selectedList = [];

  // まず未解放の犬種を入れられるだけ入れる（最大10問）
  selectedList = uncompleted.slice(0, 10);

  // 10問に満たない場合は、すでに解放済みの犬種をランダムに足す
  if (selectedList.length < 10) {
    const completedCandidates = candidates.filter(dogKey => !selectedList.includes(dogKey));
    const extraDogs = completedCandidates.slice(0, 10 - selectedList.length);
    selectedList = selectedList.concat(extraDogs);
  }

  // 最終的な10問の順序をランダムにシャッフルする
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
    currentDogImageUrl = await fetchDogImage(dogKey);
    elQuizDogImg.src = currentDogImageUrl;
  } catch (error) {
    console.error("画像の取得に失敗しました:", error);
    // エラー時の代替（フォールバック）画像
    elQuizDogImg.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400';
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
