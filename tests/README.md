# FreelancerCRM 測試指南

## 目錄

- [概述](#概述)
- [測試架構](#測試架構)
- [執行測試](#執行測試)
- [測試類型](#測試類型)
- [撰寫測試](#撰寫測試)
- [測試覆蓋率](#測試覆蓋率)
- [CI/CD 整合](#cicd-整合)

---

## 概述

本專案使用 **Jest** 作為測試框架，搭配 **jest-mock-extended** 進行 Prisma mock，確保測試的隔離性和可靠性。

### 技術堆疊

| 工具 | 用途 |
|------|------|
| Jest | 測試框架 |
| ts-jest | TypeScript 支援 |
| jest-mock-extended | Prisma Client mock |
| @testing-library/react | React 組件測試 |

---

## 測試架構

```
tests/
├── setup.ts                    # 全域設定和 mock
├── validations/                # 驗證 Schema 測試
│   ├── client.test.ts
│   ├── project.test.ts
│   ├── task.test.ts
│   └── invoice.test.ts
├── api/                        # API 路由測試
│   ├── clients.test.ts
│   ├── projects.test.ts
│   ├── invoices.test.ts
│   ├── dashboard.test.ts
│   └── subscription.test.ts
├── hooks/                      # React Hooks 測試
│   └── hooks.test.ts
└── lib/                        # 工具函數測試
    └── utils.test.ts
```

---

## 執行測試

### 基本指令

```bash
# 執行所有測試
pnpm test

# 監聽模式（開發時使用）
pnpm test:watch

# 執行並產生覆蓋率報告
pnpm test:coverage

# CI 環境執行
pnpm test:ci
```

### 執行特定測試

```bash
# 只執行單元測試（驗證和工具函數）
pnpm test:unit

# 只執行 API 測試
pnpm test:api

# 只執行 Hooks 測試
pnpm test:hooks

# 執行特定檔案
pnpm test -- tests/validations/client.test.ts

# 執行符合名稱的測試
pnpm test -- --testNamePattern="客戶"
```

### 其他選項

```bash
# 詳細輸出
pnpm test:verbose

# 更新快照
pnpm test:update-snapshots

# 只執行變更的檔案
pnpm test -- --onlyChanged

# 執行失敗的測試
pnpm test -- --onlyFailures
```

---

## 測試類型

### 1. 驗證 Schema 測試

測試 Zod Schema 的驗證邏輯：

```typescript
// tests/validations/client.test.ts

describe('createClientSchema', () => {
  it('應該接受有效的客戶名稱', () => {
    const result = createClientSchema.safeParse({ name: '測試客戶' })
    expect(result.success).toBe(true)
  })

  it('應該拒絕空的客戶名稱', () => {
    const result = createClientSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })
})
```

### 2. API 路由測試

測試 API 端點的業務邏輯：

```typescript
// tests/api/clients.test.ts

describe('GET /api/clients', () => {
  it('應該返回用戶的客戶列表', async () => {
    const mockClients = [testDataFactory.client()]
    prismaMock.client.findMany.mockResolvedValue(mockClients)

    const result = await prismaMock.client.findMany({
      where: { userId: 'test-user-id' },
    })

    expect(result).toHaveLength(1)
  })
})
```

### 3. 工具函數測試

測試共用的工具函數：

```typescript
// tests/lib/utils.test.ts

describe('formatCurrency', () => {
  it('應該正確格式化 TWD', () => {
    const result = formatCurrency(50000, 'TWD')
    expect(result).toContain('50,000')
  })
})
```

### 4. React Hooks 測試

測試自定義 Hooks 的邏輯：

```typescript
// tests/hooks/hooks.test.ts

describe('useDebounce', () => {
  it('應該返回防抖後的值', () => {
    // 使用 @testing-library/react-hooks
    const { result } = renderHook(() => useDebounce('test', 300))
    expect(result.current).toBe('test')
  })
})
```

---

## 撰寫測試

### 測試命名規範

使用中文描述，讓測試意圖更清晰：

```typescript
describe('客戶 API', () => {
  describe('建立客戶', () => {
    it('應該成功建立新客戶', () => {})
    it('應該在 Free 方案達到限制時返回錯誤', () => {})
    it('應該驗證必填欄位', () => {})
  })
})
```

### 使用測試資料工廠

透過 `testDataFactory` 建立一致的測試資料：

```typescript
import { testDataFactory } from '../setup'

const client = testDataFactory.client({
  name: '自訂名稱',
  status: 'ACTIVE',
})

const project = testDataFactory.project({
  clientId: client.id,
})
```

### Mock Prisma Client

使用 `prismaMock` 模擬資料庫操作：

```typescript
import { prismaMock } from '../setup'

// Mock findMany
prismaMock.client.findMany.mockResolvedValue([client])

// Mock create
prismaMock.client.create.mockResolvedValue(newClient)

// Mock 錯誤
prismaMock.client.findMany.mockRejectedValue(new Error('Database error'))
```

### Mock Session

模擬不同的登入狀態：

```typescript
import { setMockSession } from '../setup'

// 已登入
setMockSession({
  user: { id: 'user-123', email: 'test@example.com' },
})

// 未登入
setMockSession(null)
```

---

## 測試覆蓋率

### 目標覆蓋率

| 指標 | 目標 |
|------|------|
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |
| Statements | 70% |

### 查看覆蓋率報告

```bash
# 產生報告
pnpm test:coverage

# 報告位置
open coverage/lcov-report/index.html
```

### 覆蓋率設定

在 `jest.config.js` 中配置：

```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  collectCoverageFrom: [
    'app/api/**/*.ts',
    'lib/**/*.ts',
    'hooks/**/*.ts',
    '!**/*.d.ts',
  ],
}
```

---

## CI/CD 整合

### GitHub Actions 配置

```yaml
# .github/workflows/test.yml

name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Generate Prisma Client
        run: pnpm db:generate

      - name: Run tests
        run: pnpm test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Pre-commit Hook

使用 Husky 在提交前執行測試：

```bash
# .husky/pre-commit

#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
pnpm test --onlyChanged
```

---

## 最佳實踐

### 1. 保持測試獨立

每個測試應該獨立運行，不依賴其他測試的狀態：

```typescript
beforeEach(() => {
  mockReset(prismaMock)
  jest.clearAllMocks()
})
```

### 2. 測試行為而非實作

專注於測試功能的行為，而非內部實作：

```typescript
// ✅ 好
it('應該在驗證失敗時返回錯誤', () => {})

// ❌ 不好
it('應該呼叫 validate 函數', () => {})
```

### 3. 使用有意義的斷言

```typescript
// ✅ 好
expect(result.status).toBe('ACTIVE')

// ❌ 不好
expect(result).toBeTruthy()
```

### 4. 分組相關測試

使用 `describe` 組織相關測試：

```typescript
describe('發票金額計算', () => {
  describe('小計', () => {
    it('應該正確計算項目小計', () => {})
  })

  describe('稅額', () => {
    it('應該正確計算稅額', () => {})
  })
})
```

### 5. 處理非同步操作

```typescript
it('應該成功建立客戶', async () => {
  prismaMock.client.create.mockResolvedValue(newClient)

  const result = await prismaMock.client.create({ data })

  expect(result.id).toBe('new-id')
})
```

---

## 常見問題

### Q: 測試執行很慢怎麼辦？

A: 使用以下方法加速：
- 使用 `--onlyChanged` 只測試變更的檔案
- 使用 `--maxWorkers=2` 限制並行數
- 檢查是否有不必要的 setup/teardown

### Q: Mock 不生效怎麼辦？

A: 確認：
1. Mock 在 `beforeEach` 中正確重置
2. Mock 的路徑與實際 import 路徑一致
3. 使用 `jest.mock()` 在檔案最上方

### Q: 如何測試私有函數？

A: 不建議直接測試私有函數。改為：
- 通過公開 API 測試其行為
- 如果需要單獨測試，考慮將其提取為獨立的工具函數

---

## 相關資源

- [Jest 官方文件](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [jest-mock-extended](https://github.com/marchaos/jest-mock-extended)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

---

**文件更新日期**: 2026-01-15
