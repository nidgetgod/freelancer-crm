/**
 * Jest Configuration for FreelancerCRM
 * @type {import('jest').Config}
 */
const config = {
  // 測試環境
  testEnvironment: 'node',

  // 設定檔案
  setupFilesAfterEnv: ['<rootDir>/tests/setup-sqlite.ts'],

  // 模組路徑別名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // TypeScript 轉換
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },

  // 測試檔案匹配
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts',
  ],

  // 覆蓋率設定
  collectCoverageFrom: [
    'app/api/**/*.ts',
    'lib/**/*.ts',
    'hooks/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  // 覆蓋率門檻
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // 忽略的檔案
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
  ],

  // 模組檔案副檔名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // 清除 mock
  clearMocks: true,

  // 詳細輸出
  verbose: true,

  // 測試超時時間
  testTimeout: 30000,
}

module.exports = config
