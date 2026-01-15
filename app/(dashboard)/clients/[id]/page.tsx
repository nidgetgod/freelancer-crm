import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Globe, 
  Building2, 
  MapPin,
  Edit,
  FolderKanban,
  FileText,
  MessageSquare,
  Calendar,
  DollarSign
} from 'lucide-react'
import { ClientActions } from '@/components/clients/client-actions'

interface ClientPageProps {
  params: { id: string }
}

async function getClient(id: string, userId: string) {
  const client = await prisma.client.findFirst({
    where: { id, userId },
    include: {
      tags: { include: { tag: true } },
      projects: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          dueDate: true,
          budget: true,
        },
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          dueDate: true,
          issueDate: true,
        },
      },
      communications: {
        orderBy: { occurredAt: 'desc' },
        take: 5,
      },
      _count: {
        select: {
          projects: true,
          invoices: true,
          tasks: true,
          communications: true,
        },
      },
    },
  })

  if (!client) return null

  // 計算統計資料
  const invoiceStats = await prisma.invoice.aggregate({
    where: { clientId: id, userId },
    _sum: { total: true, amountPaid: true },
  })

  return {
    ...client,
    tags: client.tags.map(t => t.tag),
    stats: {
      totalProjects: client._count.projects,
      totalInvoiced: Number(invoiceStats._sum.total || 0),
      totalPaid: Number(invoiceStats._sum.amountPaid || 0),
      outstandingBalance:
        Number(invoiceStats._sum.total || 0) -
        Number(invoiceStats._sum.amountPaid || 0),
    },
  }
}

export default async function ClientPage({ params }: ClientPageProps) {
  const session = await auth()
  if (!session?.user?.id) return null

  const client = await getClient(params.id, session.user.id)
  if (!client) notFound()

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
    LEAD: { label: '潛在', variant: 'secondary' },
    PROSPECT: { label: '洽談中', variant: 'default' },
    ACTIVE: { label: '進行中', variant: 'success' },
    COMPLETED: { label: '已完成', variant: 'default' },
    ON_HOLD: { label: '暫停', variant: 'warning' },
    CHURNED: { label: '流失', variant: 'destructive' },
  }

  const projectStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
    PLANNING: { label: '規劃中', variant: 'secondary' },
    IN_PROGRESS: { label: '進行中', variant: 'default' },
    ON_HOLD: { label: '暫停', variant: 'warning' },
    IN_REVIEW: { label: '審核中', variant: 'default' },
    COMPLETED: { label: '已完成', variant: 'success' },
    CANCELLED: { label: '已取消', variant: 'destructive' },
  }

  const invoiceStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
    DRAFT: { label: '草稿', variant: 'secondary' },
    SENT: { label: '已發送', variant: 'default' },
    VIEWED: { label: '已查看', variant: 'default' },
    PAID: { label: '已付款', variant: 'success' },
    PARTIAL: { label: '部分付款', variant: 'warning' },
    OVERDUE: { label: '逾期', variant: 'destructive' },
    CANCELLED: { label: '已取消', variant: 'secondary' },
    REFUNDED: { label: '已退款', variant: 'secondary' },
  }

  const commTypeConfig: Record<string, string> = {
    EMAIL: '📧 Email',
    PHONE_CALL: '📞 電話',
    VIDEO_CALL: '📹 視訊',
    IN_PERSON: '🤝 面談',
    MESSAGE: '💬 訊息',
    NOTE: '📝 備註',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <Badge variant={statusConfig[client.status]?.variant || 'secondary'}>
                {statusConfig[client.status]?.label || client.status}
              </Badge>
            </div>
            {client.company && (
              <p className="text-muted-foreground">{client.company}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/clients/${client.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              編輯
            </Link>
          </Button>
          <ClientActions clientId={client.id} clientName={client.name} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">專案數</p>
              <p className="text-2xl font-bold">{client.stats.totalProjects}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-500/10 p-3">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">總開發票</p>
              <p className="text-2xl font-bold">{formatCurrency(client.stats.totalInvoiced)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-500/10 p-3">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">已收款</p>
              <p className="text-2xl font-bold">{formatCurrency(client.stats.totalPaid)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-orange-500/10 p-3">
              <DollarSign className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">待收款</p>
              <p className="text-2xl font-bold">{formatCurrency(client.stats.outstandingBalance)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>聯絡資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="hover:underline">
                  {client.phone}
                </a>
              </div>
            )}
            {client.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {client.website}
                </a>
              </div>
            )}
            {client.company && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{client.company}</span>
              </div>
            )}
            {(client.address || client.city) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {client.address && <p>{client.address}</p>}
                  {(client.city || client.postalCode) && (
                    <p>{[client.postalCode, client.city].filter(Boolean).join(' ')}</p>
                  )}
                  {client.country && <p>{client.country}</p>}
                </div>
              </div>
            )}

            {/* Tags */}
            {client.tags.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">標籤</p>
                <div className="flex flex-wrap gap-2">
                  {client.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      style={{ borderColor: tag.color, color: tag.color }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Terms */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">付款設定</p>
              <p>幣別：{client.currency}</p>
              <p>付款期限：{client.paymentTerms} 天</p>
            </div>

            {/* Notes */}
            {client.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">備註</p>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}

            {/* Source & Dates */}
            <div className="pt-4 border-t text-sm text-muted-foreground">
              {client.source && <p>來源：{client.source}</p>}
              <p>建立於：{formatDate(client.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>專案</CardTitle>
                <CardDescription>此客戶的專案</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/new?clientId=${client.id}`}>
                  新增專案
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {client.projects.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">尚無專案</p>
              ) : (
                <div className="space-y-3">
                  {client.projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">{project.name}</p>
                        {project.dueDate && (
                          <p className="text-sm text-muted-foreground">
                            截止：{formatDate(project.dueDate)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {project.budget && (
                          <span className="text-sm">{formatCurrency(Number(project.budget))}</span>
                        )}
                        <Badge variant={projectStatusConfig[project.status]?.variant || 'secondary'}>
                          {projectStatusConfig[project.status]?.label || project.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  {client._count.projects > 5 && (
                    <Link
                      href={`/projects?clientId=${client.id}`}
                      className="block text-center text-sm text-primary hover:underline py-2"
                    >
                      查看全部 {client._count.projects} 個專案
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>發票</CardTitle>
                <CardDescription>此客戶的發票</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/invoices/new?clientId=${client.id}`}>
                  建立發票
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {client.invoices.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">尚無發票</p>
              ) : (
                <div className="space-y-3">
                  {client.invoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(invoice.issueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{formatCurrency(Number(invoice.total))}</span>
                        <Badge variant={invoiceStatusConfig[invoice.status]?.variant || 'secondary'}>
                          {invoiceStatusConfig[invoice.status]?.label || invoice.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  {client._count.invoices > 5 && (
                    <Link
                      href={`/invoices?clientId=${client.id}`}
                      className="block text-center text-sm text-primary hover:underline py-2"
                    >
                      查看全部 {client._count.invoices} 張發票
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Communications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>溝通記錄</CardTitle>
                <CardDescription>與此客戶的溝通歷史</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/clients/${client.id}/communications/new`}>
                  新增記錄
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {client.communications.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">尚無溝通記錄</p>
              ) : (
                <div className="space-y-3">
                  {client.communications.map((comm) => (
                    <div
                      key={comm.id}
                      className="p-3 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {commTypeConfig[comm.type] || comm.type}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(comm.occurredAt)}
                        </span>
                      </div>
                      {comm.subject && (
                        <p className="font-medium text-sm">{comm.subject}</p>
                      )}
                      {comm.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {comm.content}
                        </p>
                      )}
                    </div>
                  ))}
                  {client._count.communications > 5 && (
                    <Link
                      href={`/clients/${client.id}/communications`}
                      className="block text-center text-sm text-primary hover:underline py-2"
                    >
                      查看全部 {client._count.communications} 條記錄
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
