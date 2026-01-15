# FreelancerCRM - 自由工作者客戶管理系統

一個專為自由工作者設計的輕量級 CRM 系統，整合客戶管理、專案追蹤、發票開立於一體。

![FreelancerCRM](https://via.placeholder.com/1200x630/6366f1/ffffff?text=FreelancerCRM)

## ✨ 功能特色

- 📋 **客戶管理** - 集中管理所有客戶資訊、聯絡記錄和狀態追蹤
- 📁 **專案追蹤** - 看板式專案管理，輕鬆追蹤進度和預算
- 📄 **發票系統** - 專業發票生成、線上付款、自動提醒
- ✅ **任務管理** - 任務清單、到期提醒、時間追蹤
- 📊 **數據分析** - 收入統計、客戶分析、業務洞察
- 🏷️ **標籤系統** - 彈性分類客戶和專案

## 🛠️ 技術堆疊

### 前端
- **Next.js 14** - React 框架 (App Router)
- **TypeScript** - 類型安全
- **Tailwind CSS** - 樣式框架
- **Radix UI** - 無障礙 UI 組件
- **React Query** - 資料同步
- **Zustand** - 狀態管理
- **React Hook Form + Zod** - 表單處理與驗證

### 後端
- **Next.js API Routes** - API 端點
- **Prisma** - ORM
- **NextAuth.js v5** - 認證系統
- **PostgreSQL** - 資料庫 (Supabase)

### 第三方服務
- **Stripe** - 訂閱付款
- **Resend** - Email 服務
- **Cloudinary** - 檔案存儲

## 🚀 快速開始

### 系統需求

- Node.js 18.17+
- pnpm 8+ (推薦) 或 npm 10+
- PostgreSQL 資料庫

### 安裝步驟

1. **Clone 專案**
   ```bash
   git clone https://github.com/your-username/freelancer-crm.git
   cd freelancer-crm
   ```

2. **安裝依賴**
   ```bash
   pnpm install
   # 或
   npm install
   ```

3. **設置環境變數**
   ```bash
   cp .env.example .env.local
   ```
   
   編輯 `.env.local` 並填入必要的配置：
   - `DATABASE_URL` - PostgreSQL 連線字串
   - `NEXTAUTH_SECRET` - 認證密鑰 (可用 `openssl rand -base64 32` 生成)
   - 其他可選的第三方服務 API Key

4. **初始化資料庫**
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

5. **填入測試資料（可選）**
   ```bash
   pnpm prisma db seed
   ```

6. **啟動開發伺服器**
   ```bash
   pnpm dev
   ```

7. 打開瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

### 測試帳號

如果有執行 seed，可使用以下帳號登入：

- **Email:** demo@example.com
- **密碼:** password123

## 📁 專案結構

```
freelancer-crm/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認證頁面
│   ├── (dashboard)/       # 主應用頁面
│   ├── api/               # API 路由
│   └── page.tsx           # Landing Page
├── components/            # React 組件
│   ├── ui/               # 基礎 UI 組件
│   ├── layout/           # 佈局組件
│   ├── clients/          # 客戶相關組件
│   ├── projects/         # 專案相關組件
│   ├── invoices/         # 發票相關組件
│   └── tasks/            # 任務相關組件
├── lib/                   # 工具函數和配置
│   ├── auth.ts           # NextAuth 配置
│   ├── db.ts             # Prisma Client
│   ├── utils.ts          # 通用工具函數
│   └── validations/      # Zod Schemas
├── hooks/                 # 自定義 Hooks
├── prisma/               # Prisma Schema 和遷移
├── public/               # 靜態資源
└── types/                # TypeScript 類型
```

## 📊 資料模型

```
User (用戶)
 ├── Client (客戶) [1:N]
 │    ├── Project (專案) [1:N]
 │    │    ├── Task (任務) [1:N]
 │    │    └── Invoice (發票) [1:N]
 │    └── Communication (溝通記錄) [1:N]
 ├── Task (個人任務) [1:N]
 ├── Invoice (發票) [1:N]
 ├── Setting (設定) [1:1]
 └── Subscription (訂閱) [1:1]
```

## 🔐 API 端點

### 認證
- `POST /api/auth/register` - 註冊
- `POST /api/auth/signin` - 登入
- `POST /api/auth/signout` - 登出

### 客戶
- `GET /api/clients` - 取得客戶列表
- `POST /api/clients` - 建立客戶
- `GET /api/clients/:id` - 取得客戶詳情
- `PUT /api/clients/:id` - 更新客戶
- `DELETE /api/clients/:id` - 刪除客戶

### 專案
- `GET /api/projects` - 取得專案列表
- `POST /api/projects` - 建立專案
- `GET /api/projects/:id` - 取得專案詳情
- `PUT /api/projects/:id` - 更新專案
- `DELETE /api/projects/:id` - 刪除專案

### 發票
- `GET /api/invoices` - 取得發票列表
- `POST /api/invoices` - 建立發票
- `GET /api/invoices/:id` - 取得發票詳情
- `PUT /api/invoices/:id` - 更新發票
- `POST /api/invoices/:id/send` - 發送發票
- `POST /api/invoices/:id/payments` - 記錄付款

### 任務
- `GET /api/tasks` - 取得任務列表
- `POST /api/tasks` - 建立任務
- `PUT /api/tasks/:id` - 更新任務
- `DELETE /api/tasks/:id` - 刪除任務

## 🎨 設計系統

專案使用 Tailwind CSS 搭配自訂的設計 Token：

```css
/* 主要色彩 */
--primary: 238 84% 67%;      /* Indigo */
--secondary: 240 4.8% 95.9%; /* Gray */
--success: 142 76% 36%;      /* Green */
--warning: 38 92% 50%;       /* Amber */
--destructive: 0 84% 60%;    /* Red */
```

## 📝 開發指南

### 程式碼規範
- 使用 ESLint + Prettier 進行程式碼格式化
- 遵循 TypeScript 嚴格模式
- 組件使用 PascalCase 命名
- 函數使用 camelCase 命名

### Git 提交規範
```
feat: 新增功能
fix: 修復問題
docs: 文件更新
style: 程式碼格式
refactor: 重構
test: 測試相關
chore: 維護工作
```

### 常用指令
```bash
pnpm dev          # 啟動開發伺服器
pnpm build        # 建置生產版本
pnpm start        # 啟動生產伺服器
pnpm lint         # 執行 ESLint
pnpm prisma studio # 開啟 Prisma Studio
```

## 📄 授權

MIT License

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

Built with ❤️ for freelancers
