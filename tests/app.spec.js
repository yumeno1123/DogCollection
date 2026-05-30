/**
 * アプリケーションE2Eテストコード
 * 【tests/app.spec.js】
 * 
 * 概要：
 * 「犬種当てクイズ＆ポケット犬種図鑑」の基本的な画面表示や
 * 画面遷移、ボタン操作が正しく機能するかを自動検証するテストです。
 */

import { test, expect } from '@playwright/test';

test.describe('犬種当てクイズ＆ポケット犬種図鑑 アプリケーション基本動作テスト', () => {

  // 各テストが実行される前に、APIリクエストや画像取得をモック（疑似データ化）し、
  // その後アプリのトップページ（localhost:8080）を開きます。
  test.beforeEach(async ({ page }) => {
    // DogAPIのランダム画像取得APIをモック化
    await page.route('https://dog.ceo/api/breed/**/images/random', async route => {
      // どの犬種がリクエストされても、適当なダミー画像URLを返します
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: "success",
          message: "https://images.dog.ceo/breeds/beagle/n02088024_2111.jpg"
        })
      });
    });

    // DogAPIの画像配信サーバーをモック化（1x1の透明GIF画像を即座に返す）
    await page.route('https://images.dog.ceo/**', async route => {
      const dummyGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      await route.fulfill({
        status: 200,
        contentType: 'image/gif',
        body: dummyGif
      });
    });

    // Unsplash（図鑑のエラー用画像などの外部サーバー）もモック化
    await page.route('https://images.unsplash.com/**', async route => {
      const dummyGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      await route.fulfill({
        status: 200,
        contentType: 'image/gif',
        body: dummyGif
      });
    });

    await page.goto('/');
  });

  test('1. スタート画面が正しく表示されること', async ({ page }) => {
    // 画面タイトル（わんわんクイズ＆ポケット犬種図鑑）が表示されているか
    await expect(page.locator('h1')).toContainText('わんわんクイズ＆ポケット犬種図鑑');
    
    // 主要なボタンが表示され、クリック可能であることを確認
    const btnStart = page.locator('#btn-start-game');
    const btnTimeAttack = page.locator('#btn-start-timeattack');
    const btnEndless = page.locator('#btn-start-endless');
    const btnViewDict = page.locator('#btn-view-dictionary');

    await expect(btnStart).toBeVisible();
    await expect(btnTimeAttack).toBeVisible();
    await expect(btnEndless).toBeVisible();
    await expect(btnViewDict).toBeVisible();

    // デフォルトの設定（出題モード：おなじみ、難易度：かんたん）が選択されているか確認
    const radioPopular = page.locator('input[name="出題モード"][value="popular"]');
    const radioEasy = page.locator('input[name="難易度"][value="easy"]');

    await expect(radioPopular).toBeChecked();
    await expect(radioEasy).toBeChecked();
  });

  test('2. クイズを開始するとクイズ画面に切り替わること（かんたんモード）', async ({ page }) => {
    // クイズ開始ボタンをクリック
    await page.locator('#btn-start-game').click();

    // スタート画面が非表示（hiddenクラスが付与されている）になり、クイズ画面が表示されているか確認
    await expect(page.locator('#start-screen')).toHaveClass(/hidden/);
    await expect(page.locator('#quiz-screen')).not.toHaveClass(/hidden/);

    // 準備画面（先読み・カウントダウン）が終了してメインクイズが始まるのを待つ
    await expect(page.locator('#quiz-main-contents')).not.toHaveClass(/hidden/, { timeout: 10000 });

    // クイズ画面の進行状況テキストが表示されていることを確認
    await expect(page.locator('#quiz-progress-text')).toContainText('第 1 問');

    // 「かんたん」モードで始めたので、ヒントボタンエリアが表示されていないことを確認
    await expect(page.locator('#hint-action-area')).toHaveClass(/hidden/);
  });

  test('3. クイズを途中で終了するとスタート画面に戻ること', async ({ page }) => {
    // クイズを開始する
    await page.locator('#btn-start-game').click();
    await expect(page.locator('#quiz-screen')).not.toHaveClass(/hidden/);

    // 準備画面が終了するのを待つ
    await expect(page.locator('#quiz-main-contents')).not.toHaveClass(/hidden/, { timeout: 10000 });

    // 確認ダイアログ（window.confirm）がポップアップしたときに「OK」を押すようにPlaywrightにリスナーを登録
    page.once('dialog', async dialog => {
      // ダイアログのメッセージ内容を確認
      expect(dialog.message()).toContain('ゲームを途中でやめますか？');
      // 「OK」を押してダイアログを閉じる
      await dialog.accept();
    });

    // 「クイズをやめる」ボタンをクリック
    await page.locator('#btn-quit-quiz').click();

    // スタート画面に戻り、クイズ画面が隠れたことを確認
    await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);
    await expect(page.locator('#quiz-screen')).toHaveClass(/hidden/);
  });

  test('4. 「図鑑を見る」ボタンを押すと図鑑画面が表示されること', async ({ page }) => {
    // スタート画面で「図鑑を見る」ボタンをクリック
    await page.locator('#btn-view-dictionary').click();

    // 図鑑画面が表示されていることを確認
    await expect(page.locator('#dictionary-screen')).not.toHaveClass(/hidden/);
    await expect(page.locator('#start-screen')).toHaveClass(/hidden/);

    // 図鑑のコレクション情報（獲得数）が表示されていることを確認
    await expect(page.locator('#dictionary-stats')).toBeVisible();

    // 「スタート画面に戻る」ボタンを押して、スタート画面に戻れるか確認
    await page.locator('#btn-back-to-menu').click();
    await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);
    await expect(page.locator('#dictionary-screen')).toHaveClass(/hidden/);
  });

  test('5. 【複雑】クイズのヒントと得点減点システムの検証', async ({ page }) => {
    // 1. 難易度「むずかしい（ぼかしあり）」を選択
    await page.locator('#diff-hard').click();

    // 2. 4択クイズを開始
    await page.locator('#btn-start-game').click();
    await expect(page.locator('#quiz-screen')).not.toHaveClass(/hidden/);

    // 準備画面が終了するのを待つ
    await expect(page.locator('#quiz-main-contents')).not.toHaveClass(/hidden/, { timeout: 10000 });

    // 3. おやつ（ヒント）ボタンを 2回 クリック
    const btnHint = page.locator('#btn-quiz-hint');
    await expect(btnHint).toBeVisible();
    await btnHint.click();
    await expect(page.locator('#hint-status-text')).toContainText('ヒント残り3回');
    await btnHint.click();
    await expect(page.locator('#hint-status-text')).toContainText('ヒント残り2回');

    // ぼかしは廃止されたため、常に「blur-level-0」（ぼかしなし）であることを確認
    await expect(page.locator('#quiz-dog-image')).toHaveClass(/blur-level-0/);

    // 4. 現在の問題の正解キーをブラウザのグローバル変数から取得
    const correctKey = await page.evaluate(() => currentQuestionDog.key);

    // 5. 正解のボタンをクリック
    await page.locator(`.btn-option[data-key="${correctKey}"]`).click();

    // 6. 得点（ヒント2回で6点）が正しく加算されていることを確認（初期0点 + 6点 = 6点）
    await expect(page.locator('#quiz-score-text')).toContainText('スコア：6 点');
  });

  test('6. 【複雑】2択タイムアタックのペナルティ計算検証', async ({ page }) => {
    // タイムアウト時間を60秒に延長（準備演出や複数問題の解答時間があるため）
    test.setTimeout(60000);

    // 1. 2択タイムアタックを開始
    await page.locator('#btn-start-timeattack').click();
    await expect(page.locator('#quiz-screen')).not.toHaveClass(/hidden/);

    // 準備画面が終了するのを待つ
    await expect(page.locator('#quiz-main-contents')).not.toHaveClass(/hidden/, { timeout: 10000 });

    // 10問分クリックを繰り返してゲームを完走させる
    for (let i = 0; i < 10; i++) {
      // 進行状況のテキスト表示を待つ
      await expect(page.locator('#quiz-progress-text')).toContainText(`第 ${i + 1} / 10 問`);

      if (i === 0) {
        // 1問目はわざと「不正解」の画像をクリック
        const incorrectChoice = page.locator('.btn-choice[data-is-correct="false"]');
        await incorrectChoice.click();
      } else {
        // 残りの問題は「正解」の画像をクリックして進める
        const correctChoice = page.locator('.btn-choice[data-is-correct="true"]');
        await correctChoice.click();
      }

      // 回答後、自動的に次の問題に切り替わるのを待つためのウェイト（アニメーション後に切り替わるのをアサート）
      if (i < 9) {
        await expect(page.locator('#quiz-progress-text')).toContainText(`第 ${i + 2} / 10 問`, { timeout: 5000 });
      }
    }

    // 10問解き終わると自動で結果画面に遷移するのを待つ
    await expect(page.locator('#result-screen')).not.toHaveClass(/hidden/, { timeout: 5000 });
    await expect(page.locator('#result-timeattack-box')).not.toHaveClass(/hidden/);

    // 結果画面で間違えた回数「1」と、ペナルティ秒数「3」が正しく計算・表示されているか検証
    await expect(page.locator('#result-ta-wrong-val')).toContainText('1');
    await expect(page.locator('#result-ta-penalty-val')).toContainText('3');
  });

  test('7. 【複雑】図鑑の段階解放とデータの保存検証', async ({ page }) => {
    // 1. テスト開始前に LocalStorage に「ビーグル (beagle)」の正解数を「2」にセット
    await page.evaluate(() => {
      const STORAGE_KEY = 'dog_collection_save_data';
      const data = { 'beagle': 2, 'beagle_attempts': 2, 'beagle_highscore': 6 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    });

    // ページを再読み込みしてデータを適用
    await page.reload();

    // 2. スタート画面から「図鑑を見る」ボタンをクリック
    await page.locator('#btn-view-dictionary').click();
    await expect(page.locator('#dictionary-screen')).not.toHaveClass(/hidden/);

    // 3. ビーグルのカードが「unlocked-2」（2段階目解放）であり、原産国と大きさが正しく表示されているか確認
    const beagleCard = page.locator('.dict-card.unlocked-2').filter({ hasText: 'ビーグル' });
    await expect(beagleCard).toBeVisible();
    await expect(beagleCard).toContainText('原産国：イギリス');
    await expect(beagleCard).toContainText('大きさ：中型犬');

    // 4. 一旦スタート画面に戻る
    await page.locator('#btn-back-to-menu').click();
    await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);

    // 5. 4択クイズを開始し、最初の問題を強制的に「ビーグル」に書き換えて正解させる
    await page.locator('#btn-start-game').click();
    
    // 準備画面が終了するのを待つ
    await expect(page.locator('#quiz-main-contents')).not.toHaveClass(/hidden/, { timeout: 10000 });

    // クイズ開始直後に、お題リストの1問目を「beagle」に書き換えて再描画
    await page.evaluate(() => {
      preloadedQuestions[currentQuestionIndex] = {
        correctKey: 'beagle',
        choices: ['beagle', 'chihuahua', 'shiba', 'poodle-toy'],
        imageUrl: 'https://images.dog.ceo/breeds/beagle/n02088024_2111.jpg'
      };
      showQuestion();
    });

    // ビーグルの問題が表示されているので、正解「ビーグル」の選択肢をクリック
    await page.locator('.btn-option[data-key="beagle"]').click();

    // 回答演出（1.8秒後）を経て第2問に進むまで待つ
    await expect(page.locator('#quiz-progress-text')).toContainText('第 2 問', { timeout: 3000 });

    // クイズを中断してスタート画面に戻る
    page.once('dialog', async dialog => {
      await dialog.accept(); // 中断確認ダイアログの「OK」をクリック
    });
    await page.locator('#btn-quit-quiz').click();
    await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);

    // 6. 再び図鑑を開く
    await page.locator('#btn-view-dictionary').click();

    // 7. 正解数が 3回 に達したため、3段階目（unlocked-3）になり、豆知識ボタンが表示されていることを確認
    const beagleCard3 = page.locator('.dict-card.unlocked-3').filter({ hasText: 'ビーグル' });
    await expect(beagleCard3).toBeVisible();
    await expect(beagleCard3.locator('.dict-details-btn')).toBeVisible();
  });
});

