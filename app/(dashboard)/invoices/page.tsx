'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Send, 
  Clock, 
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Download,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  issueDate: string
  dueDate: string
  subtotal: number
  total: number
  amountPaid: number
  currency: string
  client: {
    id: string
    name: string
    company: string | null
  }
  project: {
    id: string
    name: string
  } | null
  isOverdue: boolean
  daysUntilDue: number
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-700', icon: FileText },
  SENT: { label: '已發送', color: 'bg-blue-100 text-blue-700', icon: Send },
  VIEWED: { label: '已查看', color: 'bg-purple-100 text-purple-700', icon: Eye },
  PAID: { label: '已付款', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  PARTIAL: { label: '部分付款', color: 'bg-yellow-100 text-yellow-700', icon: DollarSign },
  OVERDUE: { label: '逾期', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-500', icon: FileText },
}

export default function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { search, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      
      const res = await fetch(`/api/invoices?${params}`)
      if (!res.ok) throw new Error('Failed to fetch invoices')
      return res.json()
    }
  })

  const invoices: Invoice[] = data?.data || []

  // 計算統計
  const stats = {
    draft: invoices.filter(i => i.status === 'DRAFT').length,
    sent: invoices.filter(i => ['SENT', 'VIEWED'].includes(i.status)).length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    overdue: invoices.filter(i => i.isOverdue).length,
    totalOutstanding: invoices
      .filter(i => ['SENT', 'VIEWED', 'PARTIAL'].includes(i.status))
      .reduce((sum, i) => sum + (Number(i.total) - Number(i.amountPaid)), 0),
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">發票管理</h1>
          <p className="text-gray-500 mt-1">建立、發送和追蹤您的發票</p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新增發票
          </Button>
        </Link>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:border-gray-300 transition-colors"
          onClick={() => setStatusFilter(null)}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">待處理金額</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {formatCurrency(stats.totalOutstanding, 'TWD')}
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          "cursor-pointer transition-colors",
          statusFilter === 'DRAFT' ? 'border-gray-400' : 'hover:border-gray-300'
        )} onClick={() => setStatusFilter(statusFilter === 'DRAFT' ? null : 'DRAFT')}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">草稿</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card className={cn(
          "cursor-pointer transition-colors",
          statusFilter === 'SENT' ? 'border-blue-400' : 'hover:border-gray-300'
        )} onClick={() => setStatusFilter(statusFilter === 'SENT' ? null : 'SENT')}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">已發送</div>
            <div className="text-xl font-bold text-blue-600 mt-1">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card className={cn(
          "cursor-pointer transition-colors",
          statusFilter === 'PAID' ? 'border-green-400' : 'hover:border-gray-300'
        )} onClick={() => setStatusFilter(statusFilter === 'PAID' ? null : 'PAID')}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">已付款</div>
            <div className="text-xl font-bold text-green-600 mt-1">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-300 transition-colors"
          onClick={() => setStatusFilter('overdue')}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">逾期</div>
            <div className="text-xl font-bold text-red-600 mt-1">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* 搜尋和篩選 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜尋發票編號、客戶..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              {statusFilter ? statusConfig[statusFilter]?.label || statusFilter : '所有狀態'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter(null)}>
              所有狀態
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <DropdownMenuItem key={key} onClick={() => setStatusFilter(key)}>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 發票列表 */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-100 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">尚無發票</h3>
            <p className="text-gray-500 mb-4">建立您的第一張發票開始收款</p>
            <Link href="/invoices/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新增發票
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const status = invoice.isOverdue && invoice.status !== 'PAID' 
              ? statusConfig.OVERDUE 
              : statusConfig[invoice.status]
            const StatusIcon = status?.icon || FileText
            const balance = Number(invoice.total) - Number(invoice.amountPaid)

            return (
              <Card key={invoice.id} className="hover:border-gray-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/invoices/${invoice.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                          {invoice.invoiceNumber}
                        </Link>
                        <Badge className={status?.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status?.label}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                        <Link href={`/clients/${invoice.client.id}`} className="hover:text-gray-700">
                          {invoice.client.name}
                          {invoice.client.company && ` · ${invoice.client.company}`}
                        </Link>
                        {invoice.project && (
                          <span>專案: {invoice.project.name}</span>
                        )}
                        <span>開立: {formatDate(invoice.issueDate)}</span>
                        <span className={invoice.isOverdue ? 'text-red-600' : ''}>
                          到期: {formatDate(invoice.dueDate)}
                          {invoice.isOverdue && ' (已逾期)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(Number(invoice.total), invoice.currency)}
                        </div>
                        {invoice.status === 'PARTIAL' && (
                          <div className="text-sm text-gray-500">
                            餘額: {formatCurrency(balance, invoice.currency)}
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/invoices/${invoice.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              查看
                            </Link>
                          </DropdownMenuItem>
                          {invoice.status === 'DRAFT' && (
                            <DropdownMenuItem asChild>
                              <Link href={`/invoices/${invoice.id}/edit`}>
                                <Pencil className="w-4 h-4 mr-2" />
                                編輯
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {invoice.status === 'DRAFT' && (
                            <DropdownMenuItem>
                              <Send className="w-4 h-4 mr-2" />
                              發送
                            </DropdownMenuItem>
                          )}
                          {['SENT', 'VIEWED', 'PARTIAL'].includes(invoice.status) && (
                            <DropdownMenuItem>
                              <DollarSign className="w-4 h-4 mr-2" />
                              記錄付款
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            下載 PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {['DRAFT', 'CANCELLED'].includes(invoice.status) && (
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              刪除
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
