import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, calculateDaysUntilDue } from '@/lib/utils'
import { Plus, Search, FolderKanban, Calendar, DollarSign, Clock } from 'lucide-react'
import Link from 'next/link'

interface ProjectsPageProps {
  searchParams: { 
    status?: string
    clientId?: string
    search?: string
  }
}

async function getProjects(userId: string, filters: { status?: string; clientId?: string; search?: string }) {
  const where = {
    userId,
    archivedAt: null,
    ...(filters.status && { status: filters.status as any }),
    ...(filters.clientId && { clientId: filters.clientId }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' as const } },
        { description: { contains: filters.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  return prisma.project.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, company: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: [
      { status: 'asc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ],
  })
}

async function getClients(userId: string) {
  return prisma.client.findMany({
    where: { userId, archivedAt: null },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const session = await auth()
  if (!session?.user?.id) return null

  const [projects, clients] = await Promise.all([
    getProjects(session.user.id, searchParams),
    getClients(session.user.id),
  ])

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; order: number }> = {
    PLANNING: { label: '規劃中', variant: 'secondary', order: 1 },
    IN_PROGRESS: { label: '進行中', variant: 'default', order: 2 },
    ON_HOLD: { label: '暫停', variant: 'warning', order: 3 },
    IN_REVIEW: { label: '審核中', variant: 'default', order: 4 },
    COMPLETED: { label: '已完成', variant: 'success', order: 5 },
    CANCELLED: { label: '已取消', variant: 'destructive', order: 6 },
  }

  const priorityConfig: Record<string, { label: string; color: string }> = {
    LOW: { label: '低', color: 'text-gray-500' },
    MEDIUM: { label: '中', color: 'text-blue-500' },
    HIGH: { label: '高', color: 'text-orange-500' },
    URGENT: { label: '緊急', color: 'text-red-500' },
  }

  // Group projects by status
  const groupedProjects = projects.reduce((acc, project) => {
    const status = project.status
    if (!acc[status]) acc[status] = []
    acc[status].push(project)
    return acc
  }, {} as Record<string, typeof projects>)

  // Sort status groups
  const sortedStatuses = Object.keys(groupedProjects).sort(
    (a, b) => (statusConfig[a]?.order || 99) - (statusConfig[b]?.order || 99)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">專案管理</h1>
          <p className="text-muted-foreground">管理你的所有專案</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            新增專案
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <form className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="search"
                  placeholder="搜尋專案..."
                  defaultValue={searchParams.search}
                  className="w-full pl-10 pr-4 py-2 border rounded-md"
                />
              </div>
            </div>
            <select
              name="status"
              defaultValue={searchParams.status || ''}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">所有狀態</option>
              {Object.entries(statusConfig).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              name="clientId"
              defaultValue={searchParams.clientId || ''}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">所有客戶</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <Button type="submit">篩選</Button>
          </form>
        </CardContent>
      </Card>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">尚無專案</h3>
            <p className="text-muted-foreground mb-4">建立你的第一個專案來開始追蹤工作</p>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                新增專案
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedStatuses.map((status) => (
            <div key={status}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold">
                  {statusConfig[status]?.label || status}
                </h2>
                <Badge variant="outline">{groupedProjects[status].length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedProjects[status].map((project) => {
                  const daysUntilDue = project.dueDate
                    ? calculateDaysUntilDue(project.dueDate)
                    : null
                  const isOverdue = daysUntilDue !== null && daysUntilDue < 0
                  const progress = project.estimatedHours
                    ? Math.min(100, Math.round((project.trackedHours / project.estimatedHours) * 100))
                    : 0

                  return (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">
                                {project.name}
                              </CardTitle>
                              <CardDescription className="truncate">
                                {project.client.name}
                                {project.client.company && ` · ${project.client.company}`}
                              </CardDescription>
                            </div>
                            <Badge 
                              variant="outline"
                              className={priorityConfig[project.priority]?.color}
                            >
                              {priorityConfig[project.priority]?.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {project.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                          )}

                          {/* Progress Bar */}
                          {project.estimatedHours && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>進度</span>
                                <span>{progress}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Info Grid */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {project.dueDate && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span className={isOverdue ? 'text-destructive' : ''}>
                                  {isOverdue
                                    ? `逾期 ${Math.abs(daysUntilDue!)} 天`
                                    : daysUntilDue === 0
                                    ? '今天'
                                    : `${daysUntilDue} 天`}
                                </span>
                              </div>
                            )}
                            {project.budget && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatCurrency(Number(project.budget), project.currency)}</span>
                              </div>
                            )}
                            {project.estimatedHours && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{project.trackedHours}/{project.estimatedHours}h</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <FolderKanban className="h-4 w-4" />
                              <span>{project._count.tasks} 任務</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
