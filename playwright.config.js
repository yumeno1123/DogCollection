/**
 * Playwright 設定ファイル
 * 【playwright.config.js】
 * 
 * 概要：
 * E2Eテストツールの動作設定を行うファイルです。
 * ローカルWebサーバーの起動、使用するブラウザ、テスト結果レポートの出力形式を設定します。
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // テストファイルが配置されているディレクトリ
  testDir: './tests',
  
  // テストを並列で実行するかどうか
  fullyParallel: false,
  
  // テストのタイムアウト時間（30秒）
  timeout: 30 * 1000,
  
  // アサーションのタイムアウト時間（5秒）
  expect: {
    timeout: 5000,
  },
  
  // テスト失敗時のリトライ回数
  retries: 0,
  
  // 並列実行時のワーカー数
  workers: 1,
  
  // テスト結果レポートの出力形式
  reporter: 'html',
  
  // 全テストに適用される共有設定
  use: {
    // テスト対象となるベースURL
    baseURL: 'http://localhost:8080',
    
    // テスト実行時のアクションをトレース（記録）するかどうか（失敗時に記録）
    trace: 'retain-on-failure',
    
    // テスト実行時のスクリーンショット（失敗時に撮影）
    screenshot: 'only-on-failure',
    
    // テスト実行時の動画（失敗時に録画）
    video: 'retain-on-failure',
  },

  // テストを実行するブラウザの設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // テスト実行前に自動でローカルのWebサーバーを起動する設定
  webServer: {
    // http-server を使って現在のフォルダ（プロジェクトルート）をポート8080でホストする
    command: 'npx http-server . -p 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 10 * 1000, // 起動タイムアウト（10秒）
  },
});
