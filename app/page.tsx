import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FolderKanban, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Shield,
  Clock
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">F</span>
            </div>
            <span className="text-xl font-bold">FreelancerCRM</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              定價
            </Link>
            <Link href="/login">
              <Button variant="ghost">登入</Button>
            </Link>
            <Link href="/register">
              <Button>免費開始</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-8 py-24 text-center md:py-32">
        <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
          <span className="mr-2">🎉</span>
          <span>專為自由工作者打造</span>
        </div>
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          簡單、整合、
          <span className="text-primary">輕量</span>
          <br />
          的客戶管理系統
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          5 分鐘上手，無需複雜設定。CRM + 專案管理 + 發票，一站式解決你的工作流程。
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              免費開始使用
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              了解更多
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">一站式解決方案</h2>
          <p className="text-lg text-muted-foreground">
            只有你需要的功能，沒有企業級的臃腫
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Users className="h-10 w-10" />}
            title="客戶管理"
            description="輕鬆管理所有客戶資訊、溝通記錄和專案歷史，再也不會遺漏重要細節。"
          />
          <FeatureCard
            icon={<FolderKanban className="h-10 w-10" />}
            title="專案追蹤"
            description="直覺的看板視圖，清楚掌握每個專案的進度和里程碑。"
          />
          <FeatureCard
            icon={<FileText className="h-10 w-10" />}
            title="發票管理"
            description="專業的發票模板，一鍵發送並追蹤付款狀態，讓收款變得簡單。"
          />
          <FeatureCard
            icon={<CheckCircle2 className="h-10 w-10" />}
            title="任務待辦"
            description="不再錯過任何截止日期，智能提醒讓你專注於真正重要的工作。"
          />
          <FeatureCard
            icon={<Zap className="h-10 w-10" />}
            title="快速上手"
            description="簡潔直覺的介面設計，5 分鐘內即可開始使用，無需複雜培訓。"
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10" />}
            title="安全可靠"
            description="銀行級加密保護你的數據安全，自動備份讓你無後顧之憂。"
          />
        </div>
      </section>

      {/* Target Users Section */}
      <section className="border-y bg-muted/50 py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">適合各類自由工作者</h2>
            <p className="text-lg text-muted-foreground">
              無論你的專業領域為何，FreelancerCRM 都能滿足你的需求
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <UserTypeCard
              emoji="🎨"
              title="設計師"
              description="同時服務多位客戶，輕鬆追蹤每個設計專案的進度和收款狀況。"
            />
            <UserTypeCard
              emoji="💻"
              title="開發者"
              description="管理長期專案，追蹤里程碑，確保每個 Sprint 都在掌控之中。"
            />
            <UserTypeCard
              emoji="✍️"
              title="內容創作者"
              description="快速周轉的專案需要高效管理，即時追蹤每篇文章的狀態和稿費。"
            />
            <UserTypeCard
              emoji="📊"
              title="顧問"
              description="專業的報價和發票，建立可信賴的品牌形象，提升客戶信心。"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            準備好提升你的工作效率了嗎？
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            加入數千位自由工作者的行列，開始更聰明地工作。
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              <Clock className="h-4 w-4" />
              免費試用 14 天
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            無需信用卡，隨時可取消
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <span className="text-sm font-bold text-primary-foreground">F</span>
            </div>
            <span className="font-semibold">FreelancerCRM</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 FreelancerCRM. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              隱私政策
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              服務條款
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              聯繫我們
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group rounded-lg border bg-card p-6 transition-colors hover:border-primary/50">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function UserTypeCard({
  emoji,
  title,
  description,
}: {
  emoji: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center">
      <div className="mb-4 text-4xl">{emoji}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
