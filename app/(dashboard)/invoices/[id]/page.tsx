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
  Send,
  Download,
  CheckCircle,
  AlertCircle,
  Calendar,
  Building2,
  User
} from 'lucide-react'
import Link from 'next/link'

async function getInvoice(id: string, userId: string) {
  return prisma.invoice.findFirst({
    where: { id, userId },
    include: {
      client: {
        select: { 
          id: true, 
          name: true, 
          company: true, 
          email: true,
          phone: true,
          address: true,
          city: true,
          postalCode: true,
          country: true
        }
      },
      project: {
        select: { id: true, name: true }
      },
      items: {
        orderBy: { sortOrder: 'asc' }
      },
      payments: {
        orderBy: { paidAt: 'desc' }
      }
    }
  })
}

async function getUserBusiness(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      businessName: true,
      businessEmail: true,
      businessPhone: true,
      businessAddress: true,
      taxId: true,
    }
  })
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const [invoice, business] = await Promise.all([
    getInvoice(params.id, session.user.id),
    getUserBusiness(session.user.id)
  ])

  if (!invoice) notFound()

  const daysUntilDue = calculateDaysUntilDue(invoice.dueDate)
  const isOverdue = daysUntilDue < 0 && !['PAID', 'CANCELLED', 'REFUNDED'].includes(invoice.status)
  const outstandingAmount = Number(invoice.total) - Number(invoice.amountPaid)
  const isPaid = invoice.status === 'PAID'
  const canEdit = invoice.status === 'DRAFT'
  const canSend = invoice.status === 'DRAFT'
  const canRecordPayment = ['SENT', 'VIEWED', 'PARTIAL', 'OVERDUE'].includes(invoice.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-muted-foreground">
              {invoice.client.company || invoice.client.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canSend && (
            <Button>
              <Send className="mr-2 h-4 w-4" />
              發送發票
            </Button>
          )}
          {canRecordPayment && (
            <Button variant="outline">
              <CheckCircle className="mr-2 h-4 w-4" />
              記錄付款
            </Button>
          )}
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            下載 PDF
          </Button>
          {canEdit && (
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                編輯
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Alert for overdue */}
      {isOverdue && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>此發票已逾期 {Math.abs(daysUntilDue)} 天</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Invoice Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-8">
              {/* Invoice Header */}
              <div className="flex justify-between mb-8">
                <div>
                  {business?.businessName && (
                    <h2 className="text-2xl font-bold">{business.businessName}</h2>
                  )}
                  {business?.businessAddress && (
                    <p className="text-muted-foreground">{business.businessAddress}</p>
                  )}
                  {business?.businessEmail && (
                    <p className="text-muted-foreground">{business.businessEmail}</p>
                  )}
                  {business?.businessPhone && (
                    <p className="text-muted-foreground">{business.businessPhone}</p>
                  )}
                  {business?.taxId && (
                    <p className="text-muted-foreground">統編：{business.taxId}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-muted-foreground">發票</p>
                  <p className="text-xl font-medium mt-2">{invoice.invoiceNumber}</p>
                </div>
              </div>

              {/* Client & Dates */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">客戶</p>
                  <p className="font-medium">{invoice.client.name}</p>
                  {invoice.client.company && (
                    <p>{invoice.client.company}</p>
                  )}
                  {invoice.client.address && (
                    <p className="text-muted-foreground">{invoice.client.address}</p>
                  )}
                  {(invoice.client.city || invoice.client.postalCode) && (
                    <p className="text-muted-foreground">
                      {invoice.client.postalCode} {invoice.client.city}
                    </p>
                  )}
                  {invoice.client.email && (
                    <p className="text-muted-foreground">{invoice.client.email}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <p className="text-sm text-muted-foreground">開立日期</p>
                    <p className="font-medium">{formatDate(invoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">到期日</p>
                    <p className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                      {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden mb-8">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">說明</th>
                      <th className="text-right p-3 font-medium w-24">數量</th>
                      <th className="text-right p-3 font-medium w-32">單價</th>
                      <th className="text-right p-3 font-medium w-32">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">{item.description}</td>
                        <td className="p-3 text-right">{Number(item.quantity)}</td>
                        <td className="p-3 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                        <td className="p-3 text-right">{formatCurrency(Number(item.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>小計</span>
                    <span>{formatCurrency(Number(invoice.subtotal))}</span>
                  </div>
                  {Number(invoice.taxRate) > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>稅額 ({Number(invoice.taxRate)}%)</span>
                      <span>{formatCurrency(Number(invoice.taxAmount))}</span>
                    </div>
                  )}
                  {Number(invoice.discount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>折扣</span>
                      <span>-{formatCurrency(Number(invoice.discount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>總計</span>
                    <span>{formatCurrency(Number(invoice.total))}</span>
                  </div>
                  {Number(invoice.amountPaid) > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>已付款</span>
                        <span>{formatCurrency(Number(invoice.amountPaid))}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>餘額</span>
                        <span>{formatCurrency(outstandingAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes & Terms */}
              {(invoice.notes || invoice.terms) && (
                <div className="mt-8 pt-8 border-t space-y-4">
                  {invoice.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">備註</p>
                      <p className="whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">付款條款</p>
                      <p className="whitespace-pre-wrap">{invoice.terms}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">總金額</span>
                <span className="font-bold text-xl">{formatCurrency(Number(invoice.total))}</span>
              </div>
              {!isPaid && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">待收款</span>
                  <span className={`font-bold ${outstandingAmount > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                    {formatCurrency(outstandingAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">到期日</span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
              {!isPaid && daysUntilDue > 0 && (
                <p className="text-sm text-muted-foreground">
                  還有 {daysUntilDue} 天到期
                </p>
              )}
            </CardContent>
          </Card>

          {/* Client */}
          <Card>
            <CardHeader>
              <CardTitle>客戶</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/clients/${invoice.client.id}`}
                className="flex items-center gap-3 hover:bg-muted p-2 rounded-lg transition-colors -mx-2"
              >
                <div className="rounded-full bg-primary/10 p-2">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{invoice.client.name}</p>
                  {invoice.client.company && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {invoice.client.company}
                    </p>
                  )}
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Project */}
          {invoice.project && (
            <Card>
              <CardHeader>
                <CardTitle>專案</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/projects/${invoice.project.id}`}
                  className="text-primary hover:underline"
                >
                  {invoice.project.name}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Payments History */}
          {invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>付款記錄</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{formatCurrency(Number(payment.amount))}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.paidAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getPaymentMethodLabel(payment.method)}
                        </p>
                      </div>
                      <Badge variant="success">已收款</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>時間軸</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">建立時間</span>
                  <span>{formatDate(invoice.createdAt)}</span>
                </div>
                {invoice.sentAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">發送時間</span>
                    <span>{formatDate(invoice.sentAt)}</span>
                  </div>
                )}
                {invoice.viewedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">查看時間</span>
                    <span>{formatDate(invoice.viewedAt)}</span>
                  </div>
                )}
                {invoice.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">付款時間</span>
                    <span>{formatDate(invoice.paidAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
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
  return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    BANK_TRANSFER: '銀行轉帳',
    CREDIT_CARD: '信用卡',
    CASH: '現金',
    CHECK: '支票',
    PAYPAL: 'PayPal',
    STRIPE: 'Stripe',
    OTHER: '其他',
  }
  return labels[method] || method
}
