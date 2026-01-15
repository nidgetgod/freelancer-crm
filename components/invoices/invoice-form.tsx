'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { useEffect } from 'react'

const invoiceItemSchema = z.object({
  description: z.string().min(1, '請輸入項目說明'),
  quantity: z.coerce.number().min(0.01, '數量必須大於 0'),
  unitPrice: z.coerce.number().min(0, '單價不能為負數'),
})

const invoiceSchema = z.object({
  clientId: z.string().min(1, '請選擇客戶'),
  projectId: z.string().optional(),
  dueDate: z.string().min(1, '請選擇到期日'),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().max(2000).optional(),
  terms: z.string().max(2000).optional(),
  items: z.array(invoiceItemSchema).min(1, '請至少新增一個項目'),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface Client {
  id: string
  name: string
  company: string | null
}

interface Project {
  id: string
  name: string
  clientId: string
}

interface InvoiceFormProps {
  invoice?: {
    id: string
    clientId: string
    projectId: string | null
    dueDate: Date
    taxRate: number
    discount: number
    notes: string | null
    terms: string | null
    items: Array<{
      description: string
      quantity: number
      unitPrice: number
    }>
  }
  clients: Client[]
  projects: Project[]
  defaultClientId?: string
  defaultProjectId?: string
}

export function InvoiceForm({ 
  invoice, 
  clients, 
  projects,
  defaultClientId,
  defaultProjectId 
}: InvoiceFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEditing = !!invoice

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice
      ? {
          clientId: invoice.clientId,
          projectId: invoice.projectId || '',
          dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
          taxRate: Number(invoice.taxRate),
          discount: Number(invoice.discount),
          notes: invoice.notes || '',
          terms: invoice.terms || '',
          items: invoice.items.map(item => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        }
      : {
          clientId: defaultClientId || '',
          projectId: defaultProjectId || '',
          taxRate: 5,
          discount: 0,
          items: [{ description: '', quantity: 1, unitPrice: 0 }],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = watch('items')
  const watchedTaxRate = watch('taxRate') || 0
  const watchedDiscount = watch('discount') || 0
  const watchedClientId = watch('clientId')

  // 過濾專案，只顯示選擇客戶的專案
  const filteredProjects = projects.filter(p => p.clientId === watchedClientId)

  // 當客戶變更時，清空專案選擇
  useEffect(() => {
    if (watchedClientId) {
      const currentProjectId = watch('projectId')
      const projectBelongsToClient = filteredProjects.some(p => p.id === currentProjectId)
      if (!projectBelongsToClient) {
        setValue('projectId', '')
      }
    }
  }, [watchedClientId, filteredProjects, setValue, watch])

  // 計算金額
  const subtotal = watchedItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0)
  }, 0)
  const taxAmount = subtotal * (watchedTaxRate / 100)
  const total = subtotal + taxAmount - watchedDiscount

  const createInvoice = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '建立發票失敗')
      return json
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast({ title: '成功', description: '發票建立成功' })
      router.push(`/invoices/${data.data.id}`)
    },
    onError: (error: Error) => {
      toast({ title: '錯誤', description: error.message, variant: 'destructive' })
    },
  })

  const updateInvoice = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const res = await fetch(`/api/invoices/${invoice!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '更新發票失敗')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast({ title: '成功', description: '發票更新成功' })
      router.push(`/invoices/${invoice!.id}`)
    },
    onError: (error: Error) => {
      toast({ title: '錯誤', description: error.message, variant: 'destructive' })
    },
  })

  const onSubmit = async (data: InvoiceFormData) => {
    if (isEditing) {
      await updateInvoice.mutateAsync(data)
    } else {
      await createInvoice.mutateAsync(data)
    }
  }

  const isPending = createInvoice.isPending || updateInvoice.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
        {/* 基本資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientId">客戶 *</Label>
              <select
                id="clientId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('clientId')}
              >
                <option value="">選擇客戶</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.company && `(${client.company})`}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-sm text-destructive">{errors.clientId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">專案（選填）</Label>
              <select
                id="projectId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('projectId')}
                disabled={!watchedClientId}
              >
                <option value="">選擇專案</option>
                {filteredProjects.map((project) => (
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
                {...register('dueDate')}
              />
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">稅率 (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register('taxRate')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 項目明細 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>項目明細</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
            >
              <Plus className="mr-2 h-4 w-4" />
              新增項目
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                <div className="col-span-5">說明</div>
                <div className="col-span-2">數量</div>
                <div className="col-span-2">單價</div>
                <div className="col-span-2 text-right">金額</div>
                <div className="col-span-1"></div>
              </div>

              {/* Items */}
              {fields.map((field, index) => {
                const quantity = watchedItems[index]?.quantity || 0
                const unitPrice = watchedItems[index]?.unitPrice || 0
                const amount = quantity * unitPrice

                return (
                  <div key={field.id} className="grid gap-4 md:grid-cols-12 items-start">
                    <div className="md:col-span-5 space-y-2">
                      <Label className="md:hidden">說明</Label>
                      <Input
                        placeholder="項目說明"
                        {...register(`items.${index}.description`)}
                      />
                      {errors.items?.[index]?.description && (
                        <p className="text-sm text-destructive">
                          {errors.items[index]?.description?.message}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="md:hidden">數量</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        {...register(`items.${index}.quantity`)}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="md:hidden">單價</Label>
                      <Input
                        type="number"
                        min="0"
                        {...register(`items.${index}.unitPrice`)}
                      />
                    </div>
                    <div className="md:col-span-2 text-right flex items-center justify-end h-10">
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                    <div className="md:col-span-1 flex items-center h-10">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fields.length > 1 && remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                )
              })}

              {errors.items?.message && (
                <p className="text-sm text-destructive">{errors.items.message}</p>
              )}

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>小計</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>稅額 ({watchedTaxRate}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                {watchedDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>折扣</span>
                    <span>-{formatCurrency(watchedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>總計</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 折扣與備註 */}
        <Card>
          <CardHeader>
            <CardTitle>其他設定</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discount">折扣金額</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                {...register('discount')}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="notes">備註</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="發票備註..."
                {...register('notes')}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="terms">付款條款</Label>
              <textarea
                id="terms"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="付款條款說明..."
                {...register('terms')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 按鈕 */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending || isSubmitting}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? '更新發票' : '建立發票'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            取消
          </Button>
        </div>
      </div>
    </form>
  )
}
