import { Suspense } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Plus, Search, Building2, Mail, Phone } from 'lucide-react'
import { getInitials, formatRelativeTime } from '@/lib/utils'

async function getClients(userId: string) {
  return prisma.client.findMany({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      tags: { include: { tag: true } },
      _count: { select: { projects: true, invoices: true } },
    },
  })
}

export default async function ClientsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const clients = await getClients(session.user.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">客戶</h1>
          <p className="text-muted-foreground">管理你的所有客戶</p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新增客戶
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="搜尋客戶..." className="pl-9" />
        </div>
      </div>

      {/* Client List */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">還沒有客戶</h3>
            <p className="mt-2 text-center text-muted-foreground">
              開始新增你的第一個客戶吧
            </p>
            <Link href="/clients/new" className="mt-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新增客戶
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{client.name}</h3>
                        <ClientStatusBadge status={client.status} />
                      </div>
                      {client.company && (
                        <p className="text-sm text-muted-foreground">
                          {client.company}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {client.phone}
                      </div>
                    )}
                  </div>

                  {client.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      {client.tags.map(({ tag }) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
                    <span>{client._count.projects} 個專案</span>
                    <span>{client._count.invoices} 張發票</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function ClientStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
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
