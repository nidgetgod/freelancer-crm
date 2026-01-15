'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClientSchema, type CreateClientInput } from '@/lib/validations/client'
import { useCreateClient, useUpdateClient, type Client } from '@/hooks/use-clients'
import { Loader2 } from 'lucide-react'

interface ClientFormProps {
  client?: Client
  mode?: 'create' | 'edit'
}

const statusOptions = [
  { value: 'LEAD', label: '潛在客戶' },
  { value: 'PROSPECT', label: '洽談中' },
  { value: 'ACTIVE', label: '進行中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'ON_HOLD', label: '暫停' },
  { value: 'CHURNED', label: '流失' },
]

export function ClientForm({ client, mode = 'create' }: ClientFormProps) {
  const router = useRouter()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  
  const isEditing = mode === 'edit' && client
  const isLoading = createClient.isPending || updateClient.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: isEditing
      ? {
          name: client.name,
          email: client.email || '',
          phone: client.phone || '',
          company: client.company || '',
          website: client.website || '',
          status: client.status as any,
          source: client.source || '',
          notes: client.notes || '',
          address: client.address || '',
          city: client.city || '',
          state: client.state || '',
          postalCode: client.postalCode || '',
          country: client.country || 'Taiwan',
          currency: client.currency || 'TWD',
          paymentTerms: client.paymentTerms || 30,
        }
      : {
          status: 'LEAD',
          country: 'Taiwan',
          currency: 'TWD',
          paymentTerms: 30,
        },
  })

  const onSubmit = async (data: CreateClientInput) => {
    // Clean up empty strings to null
    const cleanedData = {
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      website: data.website || null,
      source: data.source || null,
      notes: data.notes || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.postalCode || null,
    }

    if (isEditing) {
      await updateClient.mutateAsync({ id: client.id, data: cleanedData })
      router.push(`/clients/${client.id}`)
    } else {
      const result = await createClient.mutateAsync(cleanedData)
      router.push(`/clients/${result.data.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 基本資訊 */}
      <Card>
        <CardHeader>
          <CardTitle>基本資訊</CardTitle>
          <CardDescription>客戶的主要聯絡資訊</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">
              客戶名稱 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="輸入客戶名稱"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">公司名稱</Label>
            <Input
              id="company"
              placeholder="輸入公司名稱"
              {...register('company')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="client@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">電話</Label>
            <Input
              id="phone"
              placeholder="0912-345-678"
              {...register('phone')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">網站</Label>
            <Input
              id="website"
              placeholder="https://example.com"
              {...register('website')}
            />
            {errors.website && (
              <p className="text-sm text-destructive">{errors.website.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">來源</Label>
            <Input
              id="source"
              placeholder="例如：朋友推薦、網站詢問"
              {...register('source')}
            />
          </div>
        </CardContent>
      </Card>

      {/* 狀態與分類 */}
      <Card>
        <CardHeader>
          <CardTitle>狀態</CardTitle>
          <CardDescription>客戶的目前狀態</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="status">客戶狀態</Label>
            <select
              id="status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('status')}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 地址 */}
      <Card>
        <CardHeader>
          <CardTitle>地址</CardTitle>
          <CardDescription>客戶的聯絡地址</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">地址</Label>
            <Input
              id="address"
              placeholder="街道地址"
              {...register('address')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">城市</Label>
            <Input
              id="city"
              placeholder="台北市"
              {...register('city')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">州/省</Label>
            <Input
              id="state"
              placeholder="台北市"
              {...register('state')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">郵遞區號</Label>
            <Input
              id="postalCode"
              placeholder="100"
              {...register('postalCode')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">國家</Label>
            <Input
              id="country"
              placeholder="Taiwan"
              {...register('country')}
            />
          </div>
        </CardContent>
      </Card>

      {/* 付款設定 */}
      <Card>
        <CardHeader>
          <CardTitle>付款設定</CardTitle>
          <CardDescription>預設的付款條件</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currency">幣別</Label>
            <select
              id="currency"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('currency')}
            >
              <option value="TWD">TWD - 新台幣</option>
              <option value="USD">USD - 美元</option>
              <option value="EUR">EUR - 歐元</option>
              <option value="JPY">JPY - 日圓</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentTerms">付款期限（天）</Label>
            <Input
              id="paymentTerms"
              type="number"
              min={0}
              max={365}
              {...register('paymentTerms', { valueAsNumber: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 備註 */}
      <Card>
        <CardHeader>
          <CardTitle>備註</CardTitle>
          <CardDescription>關於此客戶的額外備註</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">備註</Label>
            <textarea
              id="notes"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="輸入備註..."
              {...register('notes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* 提交按鈕 */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? '更新客戶' : '建立客戶'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          取消
        </Button>
      </div>
    </form>
  )
}
