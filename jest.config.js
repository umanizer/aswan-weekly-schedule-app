const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.js アプリのディレクトリパスを指定
  dir: './',
})

// カスタムJest設定
const customJestConfig = {
  // テスト環境の設定
  testEnvironment: 'jsdom',
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // テストファイルのパターン
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.spec.{js,jsx,ts,tsx}'
  ],
  
  // カバレッジ設定
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{js,ts}',
  ],
  
  // モジュールパスのマッピング（Next.jsのエイリアス対応）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // 変換対象外のファイル
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  
  // テスト環境変数
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  
  // モックファイル
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
}

// Next.js設定とマージしてエクスポート
module.exports = createJestConfig(customJestConfig)