/**
 * 犬種当てクイズ＆ポケット犬種図鑑
 * 【state.js】
 * 
 * 概要：
 * アプリケーションのすべての「状態（データ）」と、
 * セーブデータの保存・読み込み処理を管理するモジュールファイルです。
 */

// ================= 定数・ステート（状態）管理 ================= //
export const gameState = {
  // セーブデータ（犬種キー: 正解回数など）
  saveData: {},                             

  // 効果音設定（初期値）
  soundMuted: false,
  soundVolume: 0.5,

  // ゲームの進行状況を管理する変数
  currentQuizList: [],           // 今回のクイズで出題する犬種キーのリスト
  currentQuestionIndex: 0,       // 現在何問目か（0からスタート）
  currentQuestionDog: null,      // 現在出題中の犬のデータ
  currentDogImageUrl: "",        // 現在出題中の犬の画像URL
  currentScore: 0,               // 今回のクイズの正解数
  currentPoints: 0,              // 今回のクイズの獲得スコア（最大100点）
  hintCount: 0,                  // 現在の問題でヒントを使った回数（0〜3）
  quizMode: 'popular',           // 出題モード（'popular' or 'all'）
  difficulty: 'easy',            // 難易度（'easy' or 'hard'）
  isSuperHardMode: false,        // 激似2択モードが有効かどうか

  // 2択ゲーム用の追加ステート
  activeGameType: '4choices',    // '4choices', 'timeattack', 'endless'
  timeAttackStartTime: 0,        // タイムアタック開始時のミリ秒タイムスタンプ
  timeAttackTimerInterval: null, // タイムアタックのタイマー更新用インターバル
  timeAttackElapsedTime: 0,      // 実際に計測した秒数
  timeAttackPenaltySeconds: 0,   // 不正解による追加秒数の合計
  timeAttackWrongCount: 0,       // 間違えた回数
  endlessScore: 0,               // エンドレスの連続正解数
  endlessTimerInterval: null,    // エンドレスカウントダウン用のインターバル
  endlessTimeRemaining: 3.0,     // エンドレスの残り時間（秒）

  // 事前ロード（キャッシュ）済みの問題リスト
  preloadedQuestions: [],

  // 図鑑から選択されて開始した2択モードのお題犬種キー
  targetBreedKeyFromDict: null,

  // 今回のクイズで「新しく段階が上がった犬種」を記録する配列（結果画面用）
  newlyUnlockedDogs: [],

  // アプリケーション全体で使う定数
  ENDLESS_LIMIT_TIME: 3.0,       // 1問あたりの制限時間（3秒）
  STORAGE_KEY: 'dog_collection_save_data' // ローカルストレージに保存するキー名
};

// ================= セーブデータの読み書き処理 ================= //

/**
 * ローカルストレージからセーブデータを読み込みます。
 * データ破損に対するバリデーション付きです。
 */
export function loadSaveData() {
  const rawData = localStorage.getItem(gameState.STORAGE_KEY);
  gameState.saveData = {}; // 初期化
  if (rawData) {
    try {
      const parsed = JSON.parse(rawData);
      // データの形式チェック（オブジェクトかつ配列ではないこと）
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        gameState.saveData = parsed;
        
        // 効果音設定の復元
        gameState.soundMuted = parsed._sound_muted !== undefined ? parsed._sound_muted : false;
        gameState.soundVolume = parsed._sound_volume !== undefined ? parsed._sound_volume : 0.5;
        
        // 履歴データがない場合は初期化
        if (!parsed._play_records) {
          gameState.saveData._play_records = [];
        }
      } else {
        console.warn("セーブデータの形式が正しくありません。初期化します。");
        gameState.saveData._play_records = [];
      }
    } catch (e) {
      console.error("セーブデータの読み込みに失敗しました。初期化します。", e);
      gameState.saveData._play_records = [];
    }
  } else {
    gameState.saveData._play_records = [];
  }
}

/**
 * ローカルストレージに現在のセーブデータを保存します。
 */
export function saveGameData() {
  try {
    // 保存前に設定値をセーブデータオブジェクトに同期
    gameState.saveData._sound_muted = gameState.soundMuted;
    gameState.saveData._sound_volume = gameState.soundVolume;
    
    localStorage.setItem(gameState.STORAGE_KEY, JSON.stringify(gameState.saveData));
  } catch (e) {
    console.error("セーブデータの保存に失敗しました。", e);
  }
}

/**
 * プレイ記録を履歴に追加して保存します。
 * @param {string} mode - ゲームモード ('4choices', 'timeattack', 'endless', 'superhard')
 * @param {string} difficulty - 難易度 ('easy', 'hard')
 * @param {string} scoreText - スコアやタイムなどの結果文字列
 */
export function addPlayRecord(mode, difficulty, scoreText) {
  if (!gameState.saveData._play_records) {
    gameState.saveData._play_records = [];
  }
  
  const now = new Date();
  const dateString = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const record = {
    date: dateString,
    mode: mode,
    difficulty: difficulty,
    score: scoreText
  };
  
  // 先頭に追加（最新が上に来るように）
  gameState.saveData._play_records.unshift(record);
  
  // 最大20件まで保持
  if (gameState.saveData._play_records.length > 20) {
    gameState.saveData._play_records = gameState.saveData._play_records.slice(0, 20);
  }
  
  saveGameData();
}

/**
 * プレイ記録をすべて消去します。
 */
export function clearPlayRecords() {
  gameState.saveData._play_records = [];
  saveGameData();
}
