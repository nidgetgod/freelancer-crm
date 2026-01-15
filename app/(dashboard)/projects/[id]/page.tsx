import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, calculateDaysUntilDue } from '@/lib/utils'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Clock,
  CheckSquare,
  User,
  Building2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

async function getProject(id: string, userId: string) {
  return prisma.project.findFirst({
    where: { id, userId },
    include: {
      client: {
        select: { id: true, name: true, company: true, email: true }
      },
      tasks: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          issueDate: true,
        }
      },
      tags: {
        include: { tag: true }
      },
      _count: {
        select: { tasks: true, invoices: true }
      }
    }
  })
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const project = await getProject(params.id, session.user.id)
  if (!project) notFound()

  const completedTasks = project.tasks.filter(t => t.status === 'DONE').length
  const totalTasks = project._count.tasks
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  
  const daysUntilDue = project.dueDate ? calculateDaysUntilDue(project.dueDate) : null
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && project.status !== 'COMPLETED'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
            <p className="text-muted-foreground">
              {project.client.company || project.client.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              編輯
            </Button>
          </Link>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            刪除
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-2">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">預算</p>
              <p className="text-xl font-bold">
                {project.budget ? formatCurrency(Number(project.budget)) : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-500/10 p-2">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">追蹤時數</p>
              <p className="text-xl font-bold">
                {project.trackedHours} / {project.estimatedHours || '?'} 小時
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-500/10 p-2">
              <CheckSquare className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">進度</p>
              <p className="text-xl font-bold">{progress}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`rounded-full p-2 ${isOverdue ? 'bg-destructive/10' : 'bg-orange-500/10'}`}>
              <Calendar className={`h-5 w-5 ${isOverdue ? 'text-destructive' : 'text-orange-500'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">到期日</p>
              <p className="text-xl font-bold">
                {project.dueDate ? formatDate(project.dueDate) : '-'}
              </p>
              {isOverdue && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  已逾期 {Math.abs(daysUntilDue!)} 天
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle>專案描述</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{project.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>任務</CardTitle>
                <CardDescription>{completedTasks} / {totalTasks} 已完成</CardDescription>
              </div>
              <Link href={`/tasks?projectId=${project.id}`}>
                <Button variant="outline" size="sm">查看全部</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {/* Progress Bar */}
              <div className="mb-4 h-2 rounded-full bg-muted">
                <div 
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {project.tasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  還沒有任務
                </p>
              ) : (
                <div className="space-y-2">
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          task.status === 'DONE' ? 'bg-green-500' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                          'bg-muted-foreground'
                        }`} />
                        <span className={task.status === 'DONE' ? 'line-through text-muted-foreground' : ''}>
                          {task.title}
                        </span>
                      </div>
                      <TaskStatusBadge status={task.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>發票</CardTitle>
                <CardDescription>此專案相關發票</CardDescription>
              </div>
              <Link href={`/invoices/new?projectId=${project.id}`}>
                <Button size="sm">建立發票</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {project.invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  還沒有發票
                </p>
              ) : (
                <div className="space-y-2">
                  {project.invoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(invoice.issueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {formatCurrency(Number(invoice.total))}
                        </span>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>客戶</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href={`/clients/${project.client.id}`}
                className="flex items-center gap-3 hover:bg-muted p-2 rounded-lg transition-colors -mx-2"
              >
                <div className="rounded-full bg-primary/10 p-2">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{project.client.name}</p>
                  {project.client.company && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {project.client.company}
                    </p>
                  )}
                </div>
              </Link>
              {project.client.email && (
                <p className="text-sm text-muted-foreground">
                  {project.client.email}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>專案資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">開始日期</p>
                <p className="font-medium">
                  {project.startDate ? formatDate(project.startDate) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">截止日期</p>
                <p className="font-medium">
                  {project.dueDate ? formatDate(project.dueDate) : '-'}
                </p>
              </div>
              {project.hourlyRate && (
                <div>
                  <p className="text-sm text-muted-foreground">時薪</p>
                  <p className="font-medium">
                    {formatCurrency(Number(project.hourlyRate))}/小時
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">建立時間</p>
                <p className="font-medium">{formatDate(project.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {project.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>標籤</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map(({ tag }) => (
                    <Badge
                      key={tag.id}
                      style={{ backgroundColor: tag.color }}
                      className="text-white"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    PLANNING: 'secondary',
    IN_PROGRESS: 'default',
    ON_HOLD: 'warning',
    IN_REVIEW: 'default',
    COMPLETED: 'success',
    CANCELLED: 'destructive',
  }
  const labels: Record<string, string> = {
    PLANNING: '規劃中',
    IN_PROGRESS: '進行中',
    ON_HOLD: '暫停',
    IN_REVIEW: '審核中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  }
  return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>
}

function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'warning' | 'destructive'> = {
    LOW: 'secondary',
    MEDIUM: 'default',
    HIGH: 'warning',
    URGENT: 'destructive',
  }
  const labels: Record<string, string> = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    URGENT: '緊急',
  }
  if (priority === 'MEDIUM') return null
  return <Badge variant={variants[priority]}>{labels[priority]}</Badge>
}

function TaskStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'success'> = {
    TODO: 'secondary',
    IN_PROGRESS: 'default',
    IN_REVIEW: 'default',
    DONE: 'success',
    CANCELLED: 'secondary',
  }
  const labels: Record<string, string> = {
    TODO: '待辦',
    IN_PROGRESS: '進行中',
    IN_REVIEW: '審核中',
    DONE: '完成',
    CANCELLED: '取消',
  }
  return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    DRAFT: 'secondary',
    SENT: 'default',
    VIEWED: 'default',
    PAID: 'success',
    PARTIAL: 'warning',
    OVERDUE: 'destructive',
    CANCELLED: 'secondary',
  }
  const labels: Record<string, string> = {
    DRAFT: '草稿',
    SENT: '已發送',
    VIEWED: '已查看',
    PAID: '已付款',
    PARTIAL: '部分付款',
    OVERDUE: '逾期',
    CANCELLED: '已取消',
  }
  return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>
}
