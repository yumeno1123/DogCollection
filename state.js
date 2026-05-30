/**
 * 犬種当てクイズ＆ポケット犬種図鑑
 * 【state.js】
 * 
 * 概要：
 * アプリケーションのすべての「状態（データ）」と、
 * セーブデータの保存・読み込み処理を管理するファイルです。
 */

// ================= 定数・ステート（状態）管理 ================= //
const STORAGE_KEY = 'dog_collection_save_data'; // ローカルストレージに保存するキー名
let saveData = {};                             // セーブデータ（犬種キー: 正解回数など）

// ゲームの進行状況を管理する変数
let currentQuizList = [];       // 今回のクイズで出題する犬種キーのリスト
let currentQuestionIndex = 0;   // 現在何問目か（0からスタート）
let currentQuestionDog = null;  // 現在出題中の犬のデータ
let currentDogImageUrl = "";     // 現在出題中の犬の画像URL
let currentScore = 0;            // 今回のクイズの正解数
let currentPoints = 0;           // 今回のクイズの獲得スコア（最大100点）
let hintCount = 0;               // 現在の問題でヒントを使った回数（0〜4）
let quizMode = 'popular';        // 出題モード（'popular' or 'all'）
let difficulty = 'easy';         // 難易度（'easy' or 'hard'）

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

// 事前ロード（キャッシュ）済みの問題リスト
let preloadedQuestions = [];

// 図鑑から選択されて開始した2択モードのお題犬種キー
let targetBreedKeyFromDict = null;

// 今回のクイズで「新しく段階が上がった犬種」を記録する配列（結果画面用）
let newlyUnlockedDogs = [];

// ================= セーブデータの読み書き処理 ================= //

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
