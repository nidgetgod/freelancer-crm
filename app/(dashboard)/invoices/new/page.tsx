'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save,
  Loader2,
  Calculator
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'

const invoiceItemSchema = z.object({
  description: z.string().min(1, '請輸入項目說明'),
  quantity: z.number().min(0.01, '數量必須大於 0'),
  unitPrice: z.number().min(0, '單價不能為負數'),
})

const createInvoiceSchema = z.object({
  clientId: z.string().min(1, '請選擇客戶'),
  projectId: z.string().optional(),
  dueDate: z.string().min(1, '請選擇到期日'),
  taxRate: z.number().min(0).max(100),
  discount: z.number().min(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, '請至少新增一個項目'),
})

type FormData = z.infer<typeof createInvoiceSchema>

export default function NewInvoicePage() {
  const router = useRouter()
  const { toast } = useToast()

  // 取得客戶列表
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients?limit=100')
      if (!res.ok) throw new Error('Failed to fetch clients')
      return res.json()
    }
  })

  // 取得專案列表
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects?limit=100')
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    }
  })

  // 取得設定
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      return res.json()
    }
  })

  const clients = clientsData?.data || []
  const projects = projectsData?.data || []
  const settings = settingsData?.data

  const form = useForm<FormData>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      clientId: '',
      projectId: '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      taxRate: settings?.defaultTaxRate || 0,
      discount: 0,
      notes: settings?.invoiceNotes || '',
      terms: settings?.invoiceTerms || '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const watchItems = form.watch('items')
  const watchTaxRate = form.watch('taxRate')
  const watchDiscount = form.watch('discount')
  const watchClientId = form.watch('clientId')

  // 計算金額
  const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const taxAmount = subtotal * (watchTaxRate / 100)
  const total = subtotal + taxAmount - watchDiscount

  // 篩選該客戶的專案
  const clientProjects = projects.filter((p: any) => p.clientId === watchClientId)

  const createInvoice = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error?.message || '建立發票失敗')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast({ title: '發票已建立' })
      router.push(`/invoices/${data.data.id}`)
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: 'destructive' })
    }
  })

  const onSubmit = (data: FormData) => {
    createInvoice.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新增發票</h1>
          <p className="text-gray-500 mt-1">建立一張新的發票</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要內容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本資訊 */}
          <Card>
            <CardHeader>
              <CardTitle>基本資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">客戶 *</Label>
                  <select
                    id="clientId"
                    {...form.register('clientId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">選擇客戶</option>
                    {clients.map((client: any) => (
                      <option key={client.id} value={client.id}>
                        {client.name}{client.company && ` (${client.company})`}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.clientId && (
                    <p className="text-sm text-red-500">{form.formState.errors.clientId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">專案（選填）</Label>
                  <select
                    id="projectId"
                    {...form.register('projectId')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={!watchClientId}
                  >
                    <option value="">選擇專案</option>
                    {clientProjects.map((project: any) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">到期日 *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...form.register('dueDate')}
                  />
                  {form.formState.errors.dueDate && (
                    <p className="text-sm text-red-500">{form.formState.errors.dueDate.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 發票項目 */}
          <Card>
            <CardHeader>
              <CardTitle>發票項目</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 表頭 */}
              <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 px-2">
                <div className="col-span-6">說明</div>
                <div className="col-span-2">數量</div>
                <div className="col-span-2">單價</div>
                <div className="col-span-2 text-right">金額</div>
              </div>

              {/* 項目列表 */}
              {fields.map((field, index) => {
                const quantity = watchItems[index]?.quantity || 0
                const unitPrice = watchItems[index]?.unitPrice || 0
                const amount = quantity * unitPrice

                return (
                  <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-12 md:col-span-6">
                      <Label className="md:hidden mb-2 block">說明</Label>
                      <Input
                        placeholder="項目說明"
                        {...form.register(`items.${index}.description`)}
                      />
                      {form.formState.errors.items?.[index]?.description && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.items[index]?.description?.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label className="md:hidden mb-2 block">數量</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1"
                        {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label className="md:hidden mb-2 block">單價</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-2">
                      <span className="text-sm font-medium">
                        {formatCurrency(amount, 'TWD')}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}

              <Button
                type="button"
                variant="outline"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增項目
              </Button>
            </CardContent>
          </Card>

          {/* 備註 */}
          <Card>
            <CardHeader>
              <CardTitle>備註與條款</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">備註</Label>
                <textarea
                  id="notes"
                  {...form.register('notes')}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="顯示在發票上的備註"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">付款條款</Label>
                <textarea
                  id="terms"
                  {...form.register('terms')}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="付款條款說明"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 側邊欄 */}
        <div className="space-y-6">
          {/* 金額計算 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                金額計算
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">小計</span>
                <span className="font-medium">{formatCurrency(subtotal, 'TWD')}</span>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="taxRate" className="text-gray-600">稅率 (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  className="w-24 text-right"
                  {...form.register('taxRate', { valueAsNumber: true })}
                />
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">稅額</span>
                <span className="font-medium">{formatCurrency(taxAmount, 'TWD')}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="discount" className="text-gray-600">折扣</Label>
                <Input
                  id="discount"
                  type="number"
                  className="w-24 text-right"
                  {...form.register('discount', { valueAsNumber: true })}
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">總計</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(total, 'TWD')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 動作按鈕 */}
          <div className="flex flex-col gap-3">
            <Button 
              type="submit" 
              size="lg" 
              disabled={createInvoice.isPending}
            >
              {createInvoice.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              建立發票
            </Button>
            <Link href="/invoices">
              <Button type="button" variant="outline" size="lg" className="w-full">
                取消
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
