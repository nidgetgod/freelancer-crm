import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatRelativeTime, calculateDaysUntilDue } from '@/lib/utils'
import { Users, FolderKanban, FileText, CheckSquare, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

async function getDashboardData(userId: string) {
  const [
    clientsCount,
    activeProjectsCount,
    pendingTasksCount,
    recentClients,
    upcomingTasks,
    recentInvoices,
    stats,
  ] = await Promise.all([
    prisma.client.count({
      where: { userId, archivedAt: null },
    }),
    prisma.project.count({
      where: { userId, status: 'IN_PROGRESS' },
    }),
    prisma.task.count({
      where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
    }),
    prisma.client.findMany({
      where: { userId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        company: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { not: null },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        client: { select: { name: true } },
      },
    }),
    prisma.invoice.aggregate({
      where: { userId, status: 'PAID' },
      _sum: { amountPaid: true },
    }),
  ])

  return {
    clientsCount,
    activeProjectsCount,
    pendingTasksCount,
    recentClients,
    upcomingTasks,
    recentInvoices,
    totalRevenue: stats._sum.amountPaid || 0,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const data = await getDashboardData(session.user.id)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">
          歡迎回來，{session.user.name?.split(' ')[0] || '用戶'}！
        </h1>
        <p className="text-muted-foreground">這是你的工作概覽</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="客戶總數"
          value={data.clientsCount}
          icon={<Users className="h-5 w-5" />}
          href="/clients"
        />
        <StatsCard
          title="進行中專案"
          value={data.activeProjectsCount}
          icon={<FolderKanban className="h-5 w-5" />}
          href="/projects"
        />
        <StatsCard
          title="待辦任務"
          value={data.pendingTasksCount}
          icon={<CheckSquare className="h-5 w-5" />}
          href="/tasks"
        />
        <StatsCard
          title="總收入"
          value={formatCurrency(Number(data.totalRevenue))}
          icon={<TrendingUp className="h-5 w-5" />}
          href="/invoices"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>最近客戶</CardTitle>
              <CardDescription>最近新增的客戶</CardDescription>
            </div>
            <Link
              href="/clients"
              className="text-sm text-primary hover:underline"
            >
              查看全部
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentClients.length === 0 ? (
              <EmptyState
                message="還沒有客戶"
                action={{ label: '新增客戶', href: '/clients/new' }}
              />
            ) : (
              <div className="space-y-4">
                {data.recentClients.map((client) => (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    <div>
                      <p className="font-medium">{client.name}</p>
                      {client.company && (
                        <p className="text-sm text-muted-foreground">
                          {client.company}
                        </p>
                      )}
                    </div>
                    <ClientStatusBadge status={client.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>即將到期</CardTitle>
              <CardDescription>需要關注的任務</CardDescription>
            </div>
            <Link
              href="/tasks"
              className="text-sm text-primary hover:underline"
            >
              查看全部
            </Link>
          </CardHeader>
          <CardContent>
            {data.upcomingTasks.length === 0 ? (
              <EmptyState
                message="沒有待辦任務"
                action={{ label: '新增任務', href: '/tasks' }}
              />
            ) : (
              <div className="space-y-4">
                {data.upcomingTasks.map((task) => {
                  const daysUntilDue = task.dueDate
                    ? calculateDaysUntilDue(task.dueDate)
                    : null
                  const isOverdue = daysUntilDue !== null && daysUntilDue < 0
                  const isUrgent = daysUntilDue !== null && daysUntilDue <= 2

                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg p-2"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.project?.name || task.client?.name || '個人任務'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverdue ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            已逾期
                          </Badge>
                        ) : isUrgent ? (
                          <Badge variant="warning">
                            {daysUntilDue === 0 ? '今天' : `${daysUntilDue} 天`}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {daysUntilDue} 天
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>最近發票</CardTitle>
              <CardDescription>最近建立的發票</CardDescription>
            </div>
            <Link
              href="/invoices"
              className="text-sm text-primary hover:underline"
            >
              查看全部
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentInvoices.length === 0 ? (
              <EmptyState
                message="還沒有發票"
                action={{ label: '建立發票', href: '/invoices/new' }}
              />
            ) : (
              <div className="space-y-4">
                {data.recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.client.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium">
                        {formatCurrency(Number(invoice.total))}
                      </p>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatsCard({
  title,
  value,
  icon,
  href,
}: {
  title: string
  value: number | string
  icon: React.ReactNode
  href: string
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function EmptyState({
  message,
  action,
}: {
  message: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-muted-foreground">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-2 text-sm text-primary hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}

function ClientStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    LEAD: 'secondary',
    PROSPECT: 'info',
    ACTIVE: 'success',
    COMPLETED: 'default',
    ON_HOLD: 'warning',
    CHURNED: 'destructive',
  }
  const labels: Record<string, string> = {
    LEAD: '潛在',
    PROSPECT: '洽談中',
    ACTIVE: '進行中',
    COMPLETED: '已完成',
    ON_HOLD: '暫停',
    CHURNED: '流失',
  }

  return (
    <Badge variant={variants[status] || 'secondary'}>
      {labels[status] || status}
    </Badge>
  )
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    DRAFT: 'secondary',
    SENT: 'info',
    VIEWED: 'info',
    PAID: 'success',
    PARTIAL: 'warning',
    OVERDUE: 'destructive',
    CANCELLED: 'secondary',
    REFUNDED: 'secondary',
  }
  const labels: Record<string, string> = {
    DRAFT: '草稿',
    SENT: '已發送',
    VIEWED: '已查看',
    PAID: '已付款',
    PARTIAL: '部分付款',
    OVERDUE: '逾期',
    CANCELLED: '已取消',
    REFUNDED: '已退款',
  }

  return (
    <Badge variant={variants[status] || 'secondary'}>
      {labels[status] || status}
    </Badge>
  )
}
