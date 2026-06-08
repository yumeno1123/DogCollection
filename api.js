/**
 * 犬種当てクイズ＆ポケット犬種図鑑
 * 【api.js】
 * 
 * 概要：
 * DogAPIとの通信および画像の読み込み処理（リトライ処理を含む）を担当する
 * 通信専門のモジュールファイルです。
 */

/**
 * DogAPIから指定された犬種のランダム画像URLを取得します。
 * @param {string} cleanKey - 統一された犬種キー名（例: "poodle-toy"）
 * @returns {Promise<string>} 画像URL
 */
export async function fetchDogImage(cleanKey) {
  // DogAPI側のキー名とのズレを調整
  let apiBreed = cleanKey;
  if (cleanKey === 'husky-siberian') {
    apiBreed = 'husky'; // DogAPIではシベリアンハスキーは単に 'husky' として管理されているため
  } else {
    // API用のブリード名に変換 (例: "poodle-toy" -> "poodle/toy")
    apiBreed = cleanKey.replace('-', '/');
  }
  
  const url = `https://dog.ceo/api/breed/${apiBreed}/images/random`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTPエラー! ステータス: ${response.status}`);
  }
  const data = await response.json();
  return data.message; // 画像URLを返す
}

/**
 * 指定した犬種の画像URLを取得し、実際にロードが成功することを確認します（失敗時は自動リトライ）。
 * @param {string} dogKey - 統一された犬種キー名
 * @param {number} maxRetries - 最大リトライ回数
 * @returns {Promise<string>} ロードが成功した画像URL
 */
export async function loadDogImageWithRetry(dogKey, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 1. DogAPIから画像URLを取得
      const url = await fetchDogImage(dogKey);
      
      // 2. 実際に画像をロードしてみて、画像ファイルが正しく読み込めるか検証（5秒タイムアウト付き）
      await new Promise((resolve, reject) => {
        const img = new Image();
        
        // 5秒経過してもロードが終わらない場合はタイムアウトエラーにする
        const timeoutId = setTimeout(() => {
          img.src = ""; // ロード処理をキャンセル
          reject(new Error("画像ロードタイムアウト (5秒)"));
        }, 5000);
        
        img.onload = () => {
          clearTimeout(timeoutId);
          resolve(url);
        };
        img.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error("画像ファイルのロードに失敗しました"));
        };
        img.src = url;
      });
      
      return url;
    } catch (error) {
      console.warn(`画像のロード試行 ${attempt}/${maxRetries} 失敗 (${dogKey}):`, error);
      if (attempt === maxRetries) {
        throw new Error(`画像ロードの最大試行回数に達しました (${dogKey})`);
      }
    }
  }
}

