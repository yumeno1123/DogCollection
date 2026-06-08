/**
 * 犬種当てクイズ＆ポケット犬種図鑑
 * 【game.js】
 * 
 * 概要：
 * クイズのルール進行、回答判定、スコア計算、ヒント管理などの
 * 純粋なゲーム進行ロジックを管理するモジュールファイルです。
 */

import { gameState, saveGameData } from './state.js';
import { getDogData, POPULAR_DOGS, ALL_DOGS_DICTIONARY, SIMILAR_DOG_GROUPS } from './dictionary.js';
import { loadDogImageWithRetry, fetchDogImage } from './api.js';
import { el, switchScreen, showLoading, showPrepScreen, renderNewUnlocksList } from './ui.js';

// ================= 効果音再生 (Web Audio API) ================= //
let audioCtx = null;

/**
 * AudioContextを初期化または取得します。
 */
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * 正解時の効果音（ピンポーン）を合成再生します。
 */
function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // 1音目: ソ (784Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now); // G5 (ソ)
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // 2音目: ド (1046.5Hz) - 少し遅れて開始
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, now + 0.12); // C6 (ド)
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.08, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch (e) {
    console.error("効果音の再生に失敗しました (正解):", e);
  }
}

/**
 * 不正解時の効果音（ブッブー）を合成再生します。
 */
function playIncorrectSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // わずかに周波数をずらしたノコギリ波を重ねてうねりのあるブー音を作る
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.linearRampToValueAtTime(120, now + 0.4);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(143, now);
    osc2.frequency.linearRampToValueAtTime(123, now + 0.4);
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.4);
    osc2.start(now);
    osc2.stop(now + 0.4);
  } catch (e) {
    console.error("効果音の再生に失敗しました (不正解):", e);
  }
}

// ================= タイマー管理 ================= //

/**
 * すべてのタイマーを停止します。
 */
export function clearAllTimers() {
  if (gameState.timeAttackTimerInterval) {
    clearInterval(gameState.timeAttackTimerInterval);
    gameState.timeAttackTimerInterval = null;
  }
  if (gameState.endlessTimerInterval) {
    clearInterval(gameState.endlessTimerInterval);
    gameState.endlessTimerInterval = null;
  }
}

// ================= クイズゲームの中断処理 ================= //

/**
 * クイズを途中で終了し、スタート画面に戻ります。
 */
export function quitQuiz() {
  const confirmQuit = confirm("ゲームを途中でやめますか？\n（ここまでのスコアや記録は保存されません）");
  if (confirmQuit) {
    clearAllTimers(); // タイマーを確実に止める
    switchScreen('start-screen');
  }
}

// ================= クイズゲームの開始処理 ================= //

/**
 * 不正解の選択肢候補を難易度を考慮して取得します。
 */
function getIncorrectChoices(correctKey, count) {
  let allCandidates = [];
  if (gameState.quizMode === 'popular') {
    allCandidates = Object.keys(POPULAR_DOGS);
  } else {
    allCandidates = [...new Set([...Object.keys(POPULAR_DOGS), ...Object.keys(ALL_DOGS_DICTIONARY)])];
  }

  let candidates = allCandidates.filter(key => key !== correctKey);

  if (gameState.difficulty === 'hard') {
    let similarBreeds = [];
    SIMILAR_DOG_GROUPS.forEach(group => {
      if (group.includes(correctKey)) {
        group.forEach(breed => {
          if (breed !== correctKey && !similarBreeds.includes(breed) && candidates.includes(breed)) {
            similarBreeds.push(breed);
          }
        });
      }
    });

    if (similarBreeds.length > 0) {
      shuffleArray(similarBreeds);
      const otherBreeds = candidates.filter(key => !similarBreeds.includes(key));
      shuffleArray(otherBreeds);
      candidates = [...similarBreeds, ...otherBreeds];
    } else {
      shuffleArray(candidates);
    }
  } else {
    shuffleArray(candidates);
  }

  return candidates.slice(0, count);
}

/**
 * 他のクイズで使われていない代替犬種を取得します。
 */
function getAlternativeBreed(excludeList) {
  let allCandidates = [];
  if (gameState.quizMode === 'popular') {
    allCandidates = Object.keys(POPULAR_DOGS);
  } else {
    allCandidates = [...new Set([...Object.keys(POPULAR_DOGS), ...Object.keys(ALL_DOGS_DICTIONARY)])];
  }
  const available = allCandidates.filter(key => !excludeList.includes(key));
  shuffleArray(available);
  return available.length > 0 ? available[0] : allCandidates[0];
}

/**
 * 4択クイズの選択肢生成（プリロード用）
 */
function setupChoicesForPreload(correctKey) {
  const incorrectChoices = getIncorrectChoices(correctKey, 3);
  const choices = [correctKey, ...incorrectChoices];
  shuffleArray(choices);
  return choices;
}

/**
 * クイズの画像とデータを一括してプリロードします。
 */
/**
 * クイズの画像とデータを一括してプリロードします。
 */
async function preloadQuizData(gameType, count, onProgress) {
  gameState.preloadedQuestions = [];
  let loadedCount = 0;
  const totalCount = gameType === 'endless' ? 20 : count; // エンドレスは初期20問分

  const prepList = [];
  
  if (gameType === '4choices') {
    for (let i = 0; i < count; i++) {
      const correctKey = gameState.currentQuizList[i];
      const choices = setupChoicesForPreload(correctKey);
      prepList.push({
        correctKey,
        choices
      });
    }
  } else {
    // 2択ゲーム
    for (let i = 0; i < totalCount; i++) {
      const correctKey = gameState.currentQuizList[i];
      const wrongKey = getIncorrectChoices(correctKey, 1)[0];
      const isLeftCorrect = Math.random() < 0.5;
      prepList.push({
        correctKey,
        wrongKey,
        isLeftCorrect
      });
    }
  }

  // 1つずつ順番に画像をダウンロードする（APIの通信詰まり対策）
  const results = [];
  for (let i = 0; i < prepList.length; i++) {
    const item = prepList[i];
    try {
      if (gameType === '4choices') {
        const imageUrl = await loadDogImageWithRetry(item.correctKey);
        item.imageUrl = imageUrl;
      } else {
        // 2択ゲームの左右の画像。1問ごとにロードすることで同時リクエスト数を制限する
        const [urlLeft, urlRight] = await Promise.all([
          loadDogImageWithRetry(item.isLeftCorrect ? item.correctKey : item.wrongKey),
          loadDogImageWithRetry(item.isLeftCorrect ? item.wrongKey : item.correctKey)
        ]);
        item.urlLeft = urlLeft;
        item.urlRight = urlRight;
      }
      loadedCount++;
      if (onProgress) {
        onProgress(loadedCount, totalCount);
      }
      results.push(item);
    } catch (err) {
      console.warn(`プリロード失敗。別の画像でリトライまたは差し替えます:`, err);
      let success = false;
      
      for (let retry = 0; retry < 5; retry++) {
        try {
          if (gameType === '4choices') {
            const newBreed = getAlternativeBreed(gameState.currentQuizList);
            const imageUrl = await loadDogImageWithRetry(newBreed);
            item.correctKey = newBreed;
            item.choices = setupChoicesForPreload(newBreed);
            item.imageUrl = imageUrl;
            gameState.currentQuizList[i] = newBreed;
          } else {
            if (gameState.activeGameType === 'timeattack') {
              const newWrong = getIncorrectChoices(item.correctKey, 1)[0];
              item.wrongKey = newWrong;
              const [urlLeft, urlRight] = await Promise.all([
                loadDogImageWithRetry(item.isLeftCorrect ? item.correctKey : newWrong),
                loadDogImageWithRetry(item.isLeftCorrect ? newWrong : item.correctKey)
              ]);
              item.urlLeft = urlLeft;
              item.urlRight = urlRight;
            } else {
              const newBreed = getAlternativeBreed(gameState.currentQuizList);
              const newWrong = getIncorrectChoices(newBreed, 1)[0];
              item.correctKey = newBreed;
              item.wrongKey = newWrong;
              const [urlLeft, urlRight] = await Promise.all([
                loadDogImageWithRetry(item.isLeftCorrect ? newBreed : newWrong),
                loadDogImageWithRetry(item.isLeftCorrect ? newWrong : newBreed)
              ]);
              item.urlLeft = urlLeft;
              item.urlRight = urlRight;
              gameState.currentQuizList[i] = newBreed;
            }
          }
          success = true;
          break;
        } catch (retryErr) {
          console.warn(`代替プリロード失敗、再試行します:`, retryErr);
        }
      }
      
      if (!success) {
        throw new Error("プリロードの代替リトライがすべて失敗しました");
      }
      
      loadedCount++;
      if (onProgress) {
        onProgress(loadedCount, totalCount);
      }
      results.push(item);
    }
  }

  gameState.preloadedQuestions = results;
}

/**
 * クイズゲームを開始します。
 */
export async function startQuizGame(gameType, targetBreedKey = null) {
  gameState.activeGameType = gameType || '4choices';

  const selectedMode = document.querySelector('input[name="出題モード"]:checked').value;
  const selectedDiff = document.querySelector('input[name="難易度"]:checked').value;

  gameState.quizMode = selectedMode;
  gameState.difficulty = selectedDiff;

  clearAllTimers();

  gameState.currentQuestionIndex = 0;
  gameState.currentScore = 0;
  gameState.currentPoints = 0;
  gameState.newlyUnlockedDogs = [];

  gameState.timeAttackElapsedTime = 0;
  gameState.timeAttackPenaltySeconds = 0;
  gameState.timeAttackWrongCount = 0;
  gameState.endlessScore = 0;
  gameState.preloadedQuestions = [];

  if (gameState.activeGameType === '4choices') {
    generateQuizList(10);
  } else if (gameState.activeGameType === 'timeattack') {
    const finalTargetBreed = targetBreedKey || gameState.targetBreedKeyFromDict;
    if (finalTargetBreed) {
      gameState.currentQuizList = Array(10).fill(finalTargetBreed);
    } else {
      generateQuizList(10, true);
    }
  } else {
    generateQuizList(100);
  }

  switchScreen('quiz-screen');
  showPrepScreen(true);

  if (gameState.activeGameType === 'timeattack') {
    el.elPrepTargetBox.classList.remove('hidden');
    el.elPrepGeneralBox.classList.add('hidden');
    
    const targetBreed = gameState.currentQuizList[0];
    const targetData = getDogData(targetBreed);
    el.elPrepTargetDogName.textContent = targetData.japanese;
    el.elPrepTargetLoading.classList.remove('hidden');
    el.elPrepTargetImage.src = "";
    
    try {
      const sampleUrl = await fetchDogImage(targetBreed);
      el.elPrepTargetImage.src = sampleUrl;
    } catch (err) {
      console.error("見本画像の取得に失敗しました:", err);
      el.elPrepTargetImage.src = "https://images.dog.ceo/breeds/beagle/n02088024_2111.jpg";
    } finally {
      el.elPrepTargetLoading.classList.add('hidden');
    }
  } else {
    el.elPrepTargetBox.classList.add('hidden');
    el.elPrepGeneralBox.classList.remove('hidden');
  }

  el.elPrepProgressBar.style.width = '0%';
  el.elPrepStatusText.textContent = "画像準備中 (0%) ... 🐾";

  const sleepPromise = new Promise(resolve => setTimeout(resolve, 3000));
  const updateProgress = (loaded, total) => {
    const percent = Math.round((loaded / total) * 100);
    el.elPrepProgressBar.style.width = `${percent}%`;
    el.elPrepStatusText.textContent = `画像を準備しています... (${percent}%) 🐾`;
  };

  try {
    const totalToLoad = gameState.activeGameType === 'endless' ? 20 : 10;
    await Promise.all([
      preloadQuizData(gameState.activeGameType, totalToLoad, updateProgress),
      sleepPromise
    ]);
  } catch (err) {
    console.error("プリロード処理で重大なエラーが発生しました:", err);
  }

  el.elPrepCountdown.classList.remove('hidden');
  el.elPrepProgressBar.parentElement.classList.add('hidden');
  el.elPrepStatusText.classList.add('hidden');

  for (let sec = 3; sec > 0; sec--) {
    el.elPrepCountdown.textContent = sec;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  el.elPrepCountdown.textContent = "スタート！🐾";
  await new Promise(resolve => setTimeout(resolve, 800));

  el.elPrepCountdown.classList.add('hidden');
  el.elPrepProgressBar.parentElement.classList.remove('hidden');
  el.elPrepStatusText.classList.remove('hidden');

  showPrepScreen(false);

  if (gameState.activeGameType === '4choices') {
    el.elQuizCard.classList.remove('two-choices-mode'); // 4択は通常余白
    el.elFourChoicesImageArea.classList.remove('hidden');
    el.elFourChoicesOptionsArea.classList.remove('hidden');
    el.elTwoChoicesArea.classList.add('hidden');
    el.elQuizTimer.classList.add('hidden');
    el.elTimerBarContainer.classList.add('hidden');
    el.elQuizScore.classList.remove('hidden');

    showQuestion();
  } else {
    el.elQuizCard.classList.add('two-choices-mode'); // 2択は余白を狭めて画像を大きくする
    el.elFourChoicesImageArea.classList.add('hidden');
    el.elFourChoicesOptionsArea.classList.add('hidden');
    el.elHintActionArea.classList.add('hidden');
    el.elTwoChoicesArea.classList.remove('hidden');
    el.elQuizScore.classList.add('hidden');

    if (gameState.activeGameType === 'timeattack') {
      el.elQuizTimer.classList.remove('hidden');
      el.elTimerBarContainer.classList.add('hidden');
      el.elQuizTimer.textContent = "タイム: 0.00 秒";

      gameState.timeAttackStartTime = Date.now();
      gameState.timeAttackTimerInterval = setInterval(() => {
        gameState.timeAttackElapsedTime = (Date.now() - gameState.timeAttackStartTime) / 1000;
        const totalDisplayTime = gameState.timeAttackElapsedTime + gameState.timeAttackPenaltySeconds;
        el.elQuizTimer.textContent = `タイム: ${totalDisplayTime.toFixed(2)} 秒`;
      }, 50);

      showQuestion2Choices();
    } else {
      el.elQuizTimer.classList.add('hidden');
      el.elTimerBarContainer.classList.remove('hidden');

      showQuestion2Choices();
    }
  }
}

/**
 * 出題リストを作成します。
 */
function generateQuizList(count, singleBreed = false) {
  let candidates = [];
  if (gameState.quizMode === 'popular') {
    candidates = Object.keys(POPULAR_DOGS);
  } else {
    candidates = [...new Set([...Object.keys(POPULAR_DOGS), ...Object.keys(ALL_DOGS_DICTIONARY)])];
  }

  if (singleBreed) {
    const uncompleted = candidates.filter(dogKey => (gameState.saveData[dogKey] || 0) < 3);
    let targetBreed = "";
    if (uncompleted.length > 0) {
      shuffleArray(uncompleted);
      targetBreed = uncompleted[0];
    } else {
      shuffleArray(candidates);
      targetBreed = candidates[0];
    }
    gameState.currentQuizList = Array(count).fill(targetBreed);
    return;
  }

  const uncompleted = candidates.filter(dogKey => {
    const currentWins = gameState.saveData[dogKey] || 0;
    return currentWins < 3;
  });

  shuffleArray(uncompleted);
  shuffleArray(candidates);

  let selectedList = [];
  selectedList = uncompleted.slice(0, count);

  if (selectedList.length < count) {
    const completedCandidates = candidates.filter(dogKey => !selectedList.includes(dogKey));
    const extraDogs = completedCandidates.slice(0, count - selectedList.length);
    selectedList = selectedList.concat(extraDogs);
  }

  shuffleArray(selectedList);
  gameState.currentQuizList = selectedList;
}

/**
 * 配列をランダムに並び替えます。
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ================= 4択クイズの出題・回答処理 ================= //

/**
 * 問題を1問表示します。
 */
async function showQuestion() {
  gameState.hintCount = 0;
  el.elTextHintBox.classList.add('hidden');
  
  el.elOptions.forEach(opt => {
    opt.classList.remove('correct', 'incorrect');
    opt.disabled = false;
    opt.style.visibility = 'visible';
  });

  el.elQuizProgress.textContent = `第 ${gameState.currentQuestionIndex + 1} 問 / 10問中`;
  el.elQuizScore.textContent = `スコア：${gameState.currentPoints} 点 / せいかい：${gameState.currentScore}問`;

  const qData = gameState.preloadedQuestions[gameState.currentQuestionIndex];
  const dogKey = qData.correctKey;
  gameState.currentQuestionDog = getDogData(dogKey);
  gameState.currentQuestionDog.key = dogKey;

  el.elQuizDogImg.className = '';
  el.elQuizDogImg.classList.add('blur-level-0');

  if (gameState.difficulty === 'hard') {
    el.elHintActionArea.classList.remove('hidden');
    el.elBtnHint.disabled = false;
    el.elBtnHint.innerHTML = '<span class="hint-icon">🍖</span> おやつ（ヒント）をあげる！ (残り4回)';
    el.elHintStatus.textContent = "※おやつをあげると選択肢が減ったり頭文字がわかるよ";
  } else {
    el.elHintActionArea.classList.add('hidden');
    el.elBtnHint.disabled = true;
    el.elHintStatus.textContent = "";
  }

  gameState.currentDogImageUrl = qData.imageUrl;
  el.elQuizDogImg.src = gameState.currentDogImageUrl;

  setupQuizOptionsFromPreload(qData.choices);
}

/**
 * 4択ボタンの中身をセットアップします（プリロードされた選択肢を使用）。
 */
function setupQuizOptionsFromPreload(choices) {
  el.elOptions.forEach((btn, index) => {
    const choiceKey = choices[index];
    const dogData = getDogData(choiceKey);
    btn.textContent = dogData.japanese;
    btn.dataset.key = choiceKey;

    btn.onclick = () => selectAnswer(choiceKey, btn);
  });
}

/**
 * プレイヤーが回答を選択したときの処理です。
 */
function selectAnswer(selectedKey, clickedBtn) {
  el.elOptions.forEach(btn => btn.disabled = true);
  el.elBtnHint.disabled = true;

  const correctKey = gameState.currentQuestionDog.key;
  const isCorrect = (selectedKey === correctKey);

  el.elQuizDogImg.className = 'blur-level-0';

  const prevAttempts = gameState.saveData[`${correctKey}_attempts`] || 0;
  gameState.saveData[`${correctKey}_attempts`] = prevAttempts + 1;

  if (isCorrect) {
    playCorrectSound(); // 正解の効果音を再生
    clickedBtn.classList.add('correct');
    gameState.currentScore++;
    
    let pointsEarned = 0;
    if (gameState.difficulty === 'easy') {
      pointsEarned = 4;
    } else {
      if (gameState.hintCount === 0) pointsEarned = 10;
      else if (gameState.hintCount === 1) pointsEarned = 8;
      else if (gameState.hintCount === 2) pointsEarned = 6;
      else if (gameState.hintCount === 3) pointsEarned = 4;
      else if (gameState.hintCount === 4) pointsEarned = 2;
    }

    gameState.currentPoints += pointsEarned;
    el.elQuizScore.textContent = `スコア：${gameState.currentPoints} 点 / せいかい：${gameState.currentScore}問`;
    
    const prevWins = gameState.saveData[correctKey] || 0;
    gameState.saveData[correctKey] = prevWins + 1;

    const prevHighScore = gameState.saveData[`${correctKey}_highscore`] || 0;
    if (pointsEarned > prevHighScore) {
      gameState.saveData[`${correctKey}_highscore`] = pointsEarned;
    }

    saveGameData();

    const newWins = gameState.saveData[correctKey];
    if (newWins === 1 || newWins === 2 || newWins === 3) {
      gameState.newlyUnlockedDogs.push({
        name: gameState.currentQuestionDog.japanese,
        stage: newWins
      });
    }
  } else {
    playIncorrectSound(); // 不正解の効果音を再生
    clickedBtn.classList.add('incorrect');
    
    el.elOptions.forEach(btn => {
      if (btn.dataset.key === correctKey) {
        btn.classList.add('correct');
      }
    });

    saveGameData();
  }

  setTimeout(() => {
    if (el.elQuizScreen.classList.contains('hidden')) return;

    gameState.currentQuestionIndex++;
    if (gameState.currentQuestionIndex < 10) {
      showQuestion();
    } else {
      showResultScreen();
    }
  }, 1800);
}

// ================= 2択ゲームの出題・回答処理 ================= //

/**
 * エンドレスモード用のキャッシュ補充処理です。
 */
async function supplementEndlessCache() {
  if (gameState.preloadedQuestions.length >= 15) return;
  
  const needed = 20 - gameState.preloadedQuestions.length;
  
  for (let i = 0; i < needed; i++) {
    const nextIndex = gameState.currentQuestionIndex + gameState.preloadedQuestions.length + 1;
    if (nextIndex >= gameState.currentQuizList.length) {
      generateQuizList(100);
    }
    
    const correctKey = gameState.currentQuizList[nextIndex % gameState.currentQuizList.length];
    const wrongKey = getIncorrectChoices(correctKey, 1)[0];
    const isLeftCorrect = Math.random() < 0.5;
    
    try {
      const [urlLeft, urlRight] = await Promise.all([
        loadDogImageWithRetry(isLeftCorrect ? correctKey : wrongKey),
        loadDogImageWithRetry(isLeftCorrect ? wrongKey : correctKey)
      ]);
      gameState.preloadedQuestions.push({
        correctKey,
        wrongKey,
        urlLeft,
        urlRight,
        isLeftCorrect
      });
    } catch (err) {
      console.warn("バックグラウンドでのキャッシュ補充に失敗しました:", err);
    }
  }
}

/**
 * 2択ゲームの1問を表示します。
 */
async function showQuestion2Choices() {
  clearEndlessTimer();

  [el.elChoiceLeft, el.elChoiceRight].forEach(btn => {
    btn.classList.remove('correct', 'incorrect');
    btn.disabled = false;
  });

  [el.elFeedbackLeft, el.elFeedbackRight].forEach(element => {
    element.className = 'choice-feedback hidden';
    element.textContent = '';
    element.style.fontSize = '';
  });

  // 不正解時の犬種名表示をクリアして非表示にする
  [el.elBreedNameLeft, el.elBreedNameRight].forEach(element => {
    if (element) {
      element.classList.add('hidden');
      element.textContent = '';
    }
  });

  if (gameState.activeGameType === 'timeattack') {
    el.elQuizProgress.textContent = `第 ${gameState.currentQuestionIndex + 1} / 10 問`;
  } else {
    el.elQuizProgress.textContent = `連続正解: ${gameState.endlessScore} 問`;
  }

  let qData;
  if (gameState.activeGameType === 'timeattack') {
    qData = gameState.preloadedQuestions[gameState.currentQuestionIndex];
  } else {
    qData = gameState.preloadedQuestions.shift();
    supplementEndlessCache();
  }

  if (!qData) {
    console.error("プリロードキャッシュが空です！フォールバックを開始します");
    try {
      const correctKey = gameState.currentQuizList[gameState.currentQuestionIndex % gameState.currentQuizList.length];
      const wrongKey = getIncorrectChoices(correctKey, 1)[0];
      const isLeftCorrect = Math.random() < 0.5;
      const [urlLeft, urlRight] = await Promise.all([
        loadDogImageWithRetry(isLeftCorrect ? correctKey : wrongKey),
        loadDogImageWithRetry(isLeftCorrect ? wrongKey : correctKey)
      ]);
      qData = { correctKey, wrongKey, urlLeft, urlRight, isLeftCorrect };
    } catch (e) {
      switchScreen('start-screen');
      return;
    }
  }

  const correctKey = qData.correctKey;
  gameState.currentQuestionDog = getDogData(correctKey);
  gameState.currentQuestionDog.key = correctKey;

  el.elTwoChoicesDogName.textContent = gameState.currentQuestionDog.japanese;

  el.elImgChoiceLeft.src = qData.urlLeft;
  el.elImgChoiceRight.src = qData.urlRight;

  el.elChoiceLeft.dataset.isCorrect = qData.isLeftCorrect ? "true" : "false";
  el.elChoiceRight.dataset.isCorrect = qData.isLeftCorrect ? "false" : "true";
  el.elChoiceLeft.dataset.key = correctKey;
  el.elChoiceRight.dataset.key = correctKey;

  // 各選択肢が表す本来の犬種キーを保存
  el.elChoiceLeft.dataset.breedKey = qData.isLeftCorrect ? qData.correctKey : qData.wrongKey;
  el.elChoiceRight.dataset.breedKey = qData.isLeftCorrect ? qData.wrongKey : qData.correctKey;

  el.elChoiceLeft.onclick = () => selectAnswer2Choices(qData.isLeftCorrect, el.elChoiceLeft);
  el.elChoiceRight.onclick = () => selectAnswer2Choices(!qData.isLeftCorrect, el.elChoiceRight);

  if (gameState.activeGameType === 'endless') {
    startEndlessTimer();
  }
}

/**
 * エンドレスモードのカウントダウンタイマーを開始します。
 */
function startEndlessTimer() {
  gameState.endlessTimeRemaining = gameState.ENDLESS_LIMIT_TIME;
  el.elTimerBar.style.width = '100%';

  gameState.endlessTimerInterval = setInterval(() => {
    gameState.endlessTimeRemaining -= 0.05;
    
    const percentage = Math.max(0, (gameState.endlessTimeRemaining / gameState.ENDLESS_LIMIT_TIME) * 100);
    el.elTimerBar.style.width = `${percentage}%`;

    if (gameState.endlessTimeRemaining <= 0) {
      clearAllTimers();
      endGameEndless(true);
    }
  }, 50);
}

/**
 * エンドレス用のタイマーのみを停止します。
 */
function clearEndlessTimer() {
  if (gameState.endlessTimerInterval) {
    clearInterval(gameState.endlessTimerInterval);
    gameState.endlessTimerInterval = null;
  }
}

/**
 * 2択ゲームでプレイヤーが回答を選択した時の処理です。
 */
function selectAnswer2Choices(isCorrect, clickedBtn) {
  el.elChoiceLeft.disabled = true;
  el.elChoiceRight.disabled = true;

  clearEndlessTimer();

  const correctKey = gameState.currentQuestionDog.key;

  const prevAttempts = gameState.saveData[`${correctKey}_attempts`] || 0;
  gameState.saveData[`${correctKey}_attempts`] = prevAttempts + 1;

  const elFeedbackClicked = (clickedBtn === el.elChoiceLeft) ? el.elFeedbackLeft : el.elFeedbackRight;
  const elFeedbackOther = (clickedBtn === el.elChoiceLeft) ? el.elFeedbackRight : el.elFeedbackLeft;

  // 不正解（正解ではない方）の画像に犬種名を表示する
  const isLeftCorrect = el.elChoiceLeft.dataset.isCorrect === "true";
  if (isLeftCorrect) {
    // 左が正解ということは、右が不正解
    const wrongBreedKey = el.elChoiceRight.dataset.breedKey;
    const wrongBreedData = getDogData(wrongBreedKey);
    if (el.elBreedNameRight && wrongBreedData) {
      el.elBreedNameRight.textContent = wrongBreedData.japanese;
      el.elBreedNameRight.classList.remove('hidden');
    }
  } else {
    // 右が正解ということは、leftが不正解
    const wrongBreedKey = el.elChoiceLeft.dataset.breedKey;
    const wrongBreedData = getDogData(wrongBreedKey);
    if (el.elBreedNameLeft && wrongBreedData) {
      el.elBreedNameLeft.textContent = wrongBreedData.japanese;
      el.elBreedNameLeft.classList.remove('hidden');
    }
  }

  if (isCorrect) {
    playCorrectSound(); // 正解の効果音を再生
    clickedBtn.classList.add('correct');
    elFeedbackClicked.textContent = '⭕';
    elFeedbackClicked.className = 'choice-feedback show';

    if (gameState.activeGameType === 'timeattack') {
      gameState.currentScore++;
    } else {
      gameState.endlessScore++;
      gameState.currentScore = gameState.endlessScore;
    }

    const prevWins = gameState.saveData[correctKey] || 0;
    gameState.saveData[correctKey] = prevWins + 1;

    const newWins = gameState.saveData[correctKey];
    if (newWins === 1 || newWins === 2 || newWins === 3) {
      gameState.newlyUnlockedDogs.push({
        name: gameState.currentQuestionDog.japanese,
        stage: newWins
      });
    }

    saveGameData();
  } else {
    playIncorrectSound(); // 不正解の効果音を再生
    clickedBtn.classList.add('incorrect');
    
    elFeedbackClicked.textContent = '❌';
    elFeedbackClicked.className = 'choice-feedback show';

    elFeedbackOther.textContent = '⭕';
    elFeedbackOther.className = 'choice-feedback show';
    elFeedbackOther.style.fontSize = '3.5rem';

    if (clickedBtn === el.elChoiceLeft) {
      el.elChoiceRight.classList.add('correct');
    } else {
      el.elChoiceLeft.classList.add('correct');
    }

    if (gameState.activeGameType === 'timeattack') {
      gameState.timeAttackPenaltySeconds += 3;
      gameState.timeAttackWrongCount++;

      el.elQuizScreen.classList.add('penalty-flash');
      el.elQuizScreen.addEventListener('animationend', () => {
        el.elQuizScreen.classList.remove('penalty-flash');
      }, { once: true });
    }

    saveGameData();
  }

  setTimeout(() => {
    if (el.elQuizScreen.classList.contains('hidden')) return;

    if (gameState.activeGameType === 'timeattack') {
      gameState.currentQuestionIndex++;
      if (gameState.currentQuestionIndex < 10) {
        showQuestion2Choices();
      } else {
        endGameTimeAttack();
      }
    } else {
      if (isCorrect) {
        gameState.currentQuestionIndex++;
        showQuestion2Choices();
      } else {
        endGameEndless(false);
      }
    }
  }, 1500);
}

/**
 * タイムアタックゲーム終了時の処理です。
 */
function endGameTimeAttack() {
  clearAllTimers();
  
  const finalTime = gameState.timeAttackElapsedTime + gameState.timeAttackPenaltySeconds;

  const bestTimeKey = `${gameState.quizMode}_timeattack_best`;
  const prevBestTime = gameState.saveData[bestTimeKey] || 999999;
  let isNewRecord = false;

  if (finalTime < prevBestTime) {
    gameState.saveData[bestTimeKey] = finalTime;
    saveGameData();
    isNewRecord = true;
  }

  showResultScreen2Choices('timeattack', {
    finalTime: finalTime,
    rawTime: gameState.timeAttackElapsedTime,
    penalty: gameState.timeAttackPenaltySeconds,
    wrongCount: gameState.timeAttackWrongCount,
    isNewRecord: isNewRecord
  });
}

/**
 * エンドレスゲーム終了時の処理です。
 */
function endGameEndless(isTimeout) {
  clearAllTimers();

  const highScoreKey = `${gameState.quizMode}_endless_best`;
  const prevHighScore = gameState.saveData[highScoreKey] || 0;
  let isNewRecord = false;

  if (gameState.endlessScore > prevHighScore) {
    gameState.saveData[highScoreKey] = gameState.endlessScore;
    saveGameData();
    isNewRecord = true;
  }

  showResultScreen2Choices('endless', {
    score: gameState.endlessScore,
    isNewRecord: isNewRecord,
    isTimeout: isTimeout
  });
}

// ================= ヒント機能（おやつをあげる）の処理 ================= //

/**
 * クイズ画面でヒント（おやつ）を使用します。
 */
export function useHint() {
  if (gameState.difficulty !== 'hard' || gameState.hintCount >= 4) return;

  gameState.hintCount++;
  el.elBtnHint.innerHTML = `<span class="hint-icon">🍖</span> おやつ（ヒント）をあげる！ (残り${4 - gameState.hintCount}回)`;

  if (gameState.hintCount === 1) {
    el.elHintStatus.textContent = "おやつを喜んで食べているよ！(ヒント残り3回)";
  } 
  else if (gameState.hintCount === 2) {
    el.elHintStatus.textContent = "美味しい！ともっと喜んでいます！(ヒント残り2回)";
  } 
  else if (gameState.hintCount === 3) {
    const correctKey = gameState.currentQuestionDog.key;
    let hiddenCount = 0;
    
    const shuffledOptions = [...el.elOptions];
    shuffleArray(shuffledOptions);

    shuffledOptions.forEach(btn => {
      if (btn.dataset.key !== correctKey && hiddenCount < 2) {
        btn.style.visibility = 'hidden';
        hiddenCount++;
      }
    });

    el.elHintStatus.textContent = "ハズレの選択肢が２つ消えたよ！(ヒント残り1回)";
  } 
  else if (gameState.hintCount === 4) {
    const jName = gameState.currentQuestionDog.japanese;
    const firstChar = jName.charAt(0);

    el.elTextHintBox.textContent = `💡 ヒント：この犬種は「${firstChar}」から始まるよ！`;
    el.elTextHintBox.classList.remove('hidden');

    el.elBtnHint.disabled = true;
    el.elHintStatus.textContent = "ヒントをすべて使いました！";
  }
}

// ================= 結果画面の描画処理 ================= //

/**
 * 結果画面を表示します（4択クイズ用）。
 */
function showResultScreen() {
  switchScreen('result-screen');

  el.elResult4ChoicesBox.classList.remove('hidden');
  el.elResultTimeAttackBox.classList.add('hidden');
  el.elResultEndlessBox.classList.add('hidden');
  el.elResultEndlessHighscoreMsg.classList.add('hidden');

  el.elResultScoreVal.textContent = gameState.currentScore;
  el.elResultPointsVal.textContent = gameState.currentPoints;

  if (gameState.currentPoints === 100) {
    el.elResultMessage.textContent = "パーフェクト！ノーヒントで全問大正解！あなたは立派なわんわん博士だね！🐶✨";
  } else if (gameState.currentPoints >= 80) {
    el.elResultMessage.textContent = "すごい！少ないヒントで高得点だね！🐾";
  } else if (gameState.currentPoints >= 50) {
    el.elResultMessage.textContent = "がんばったね！ヒントをうまく使ってクリアできたよ！📖";
  } else {
    el.elResultMessage.textContent = "クイズに挑戦してくれてありがとう！もう一回やってみよう！🐶";
  }

  renderNewUnlocksList();
}

/**
 * 結果画面を表示します（2択ゲーム用）。
 */
function showResultScreen2Choices(type, data) {
  switchScreen('result-screen');

  el.elResult4ChoicesBox.classList.add('hidden');
  el.elResultTimeAttackBox.classList.add('hidden');
  el.elResultEndlessBox.classList.add('hidden');
  el.elResultEndlessHighscoreMsg.classList.add('hidden');

  if (type === 'timeattack') {
    el.elResultTimeAttackBox.classList.remove('hidden');
    el.elResultTaTimeVal.textContent = data.finalTime.toFixed(2);
    el.elResultTaRawTime.textContent = data.rawTime.toFixed(2);
    el.elResultTaPenaltyVal.textContent = data.penalty;
    el.elResultTaWrongVal.textContent = data.wrongCount;

    if (data.isNewRecord) {
      el.elResultMessage.textContent = `🏆 自己ベスト更新！すごい！タイムアタック新記録達成です！ ⏱️✨`;
    } else {
      const bestTimeKey = `${gameState.quizMode}_timeattack_best`;
      const bestTime = gameState.saveData[bestTimeKey] || 999999;
      el.elResultMessage.textContent = `30問クリアおめでとう！(自己ベスト: ${bestTime.toFixed(2)}秒) 次はもっと速く走れるかな？🐾`;
    }
  } else {
    el.elResultEndlessBox.classList.remove('hidden');
    el.elResultEndlessScoreVal.textContent = data.score;

    if (data.isNewRecord) {
      el.elResultEndlessHighscoreMsg.classList.remove('hidden');
      el.elResultMessage.textContent = `🏆 ハイスコア更新！どこまでも正解し続けるわんわんマスターだね！ ♾️✨`;
    } else {
      const highScoreKey = `${gameState.quizMode}_endless_best`;
      const highScore = gameState.saveData[highScoreKey] || 0;
      const timeoutText = data.isTimeout ? "ああっ、時間切れ！" : "おっと、間違えちゃった！";
      el.elResultMessage.textContent = `${timeoutText} ${data.score}問連続正解したよ！ (自己ベスト: ${highScore}問) 次は記録を超えられるかな？🐶`;
    }
  }

  renderNewUnlocksList();
}

/**
 * 図鑑から直接2択タイムアタックを開始します。
 */
export function startTimeAttackFromDict(dogKey) {
  gameState.targetBreedKeyFromDict = dogKey;
  startQuizGame('timeattack', dogKey);
}

// グローバルスコープに登録（図鑑のインライン onclick 属性に対応するため）
window.startTimeAttackFromDict = startTimeAttackFromDict;

// ================= 自動テスト用グローバルブリッジ ================= //
if (typeof window !== 'undefined') {
  window.showQuestion = showQuestion;
  
  // テストコード（app.spec.js）が直接参照するグローバル変数へのエイリアス定義
  Object.defineProperty(window, 'currentQuestionDog', {
    get: () => gameState.currentQuestionDog
  });
  Object.defineProperty(window, 'preloadedQuestions', {
    get: () => gameState.preloadedQuestions,
    set: (val) => { gameState.preloadedQuestions = val; }
  });
  Object.defineProperty(window, 'currentQuestionIndex', {
    get: () => gameState.currentQuestionIndex
  });
}
