'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  User, 
  Building2, 
  FileText, 
  Bell, 
  CreditCard,
  Save,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

const profileSchema = z.object({
  name: z.string().min(1, '請輸入姓名'),
  email: z.string().email('請輸入有效的 Email'),
  phone: z.string().optional(),
  businessName: z.string().optional(),
  businessEmail: z.string().email().optional().or(z.literal('')),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
  taxId: z.string().optional(),
})

const invoiceSettingsSchema = z.object({
  invoicePrefix: z.string().min(1).max(10),
  defaultPaymentTerms: z.number().min(0).max(365),
  defaultTaxRate: z.number().min(0).max(100),
  invoiceNotes: z.string().optional(),
  invoiceTerms: z.string().optional(),
  invoiceFooter: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>
type InvoiceSettingsFormData = z.infer<typeof invoiceSettingsSchema>

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const [activeTab, setActiveTab] = useState('profile')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // 取得設定
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      return res.json()
    }
  })

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      phone: '',
      businessName: '',
      businessEmail: '',
      businessPhone: '',
      businessAddress: '',
      taxId: '',
    }
  })

  // Invoice settings form
  const invoiceForm = useForm<InvoiceSettingsFormData>({
    resolver: zodResolver(invoiceSettingsSchema),
    values: {
      invoicePrefix: settings?.data?.invoicePrefix || 'INV',
      defaultPaymentTerms: settings?.data?.defaultPaymentTerms || 30,
      defaultTaxRate: settings?.data?.defaultTaxRate || 0,
      invoiceNotes: settings?.data?.invoiceNotes || '',
      invoiceTerms: settings?.data?.invoiceTerms || '',
      invoiceFooter: settings?.data?.invoiceFooter || '',
    }
  })

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update profile')
      return res.json()
    },
    onSuccess: () => {
      toast({ title: '個人資料已更新' })
      updateSession()
    },
    onError: () => {
      toast({ title: '更新失敗', variant: 'destructive' })
    }
  })

  const updateInvoiceSettings = useMutation({
    mutationFn: async (data: InvoiceSettingsFormData) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update settings')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast({ title: '發票設定已更新' })
    },
    onError: () => {
      toast({ title: '更新失敗', variant: 'destructive' })
    }
  })

  const tabs = [
    { id: 'profile', label: '個人資料', icon: User },
    { id: 'business', label: '商業資訊', icon: Building2 },
    { id: 'invoice', label: '發票設定', icon: FileText },
    { id: 'notifications', label: '通知設定', icon: Bell },
    { id: 'billing', label: '訂閱方案', icon: CreditCard },
  ]

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-500 mt-1">管理您的帳戶和偏好設定</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* 側邊選單 */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* 內容區 */}
        <div className="flex-1">
          {/* 個人資料 */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>個人資料</CardTitle>
                <CardDescription>更新您的基本資訊</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit((data) => updateProfile.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">姓名</Label>
                      <Input 
                        id="name" 
                        {...profileForm.register('name')}
                        placeholder="您的姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email"
                        {...profileForm.register('email')}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">電話</Label>
                      <Input 
                        id="phone" 
                        {...profileForm.register('phone')}
                        placeholder="0912-345-678"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    儲存變更
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* 商業資訊 */}
          {activeTab === 'business' && (
            <Card>
              <CardHeader>
                <CardTitle>商業資訊</CardTitle>
                <CardDescription>這些資訊將顯示在您的發票上</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit((data) => updateProfile.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">公司/工作室名稱</Label>
                      <Input 
                        id="businessName" 
                        {...profileForm.register('businessName')}
                        placeholder="小明設計工作室"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">統一編號</Label>
                      <Input 
                        id="taxId" 
                        {...profileForm.register('taxId')}
                        placeholder="12345678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessEmail">商業 Email</Label>
                      <Input 
                        id="businessEmail" 
                        type="email"
                        {...profileForm.register('businessEmail')}
                        placeholder="contact@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">商業電話</Label>
                      <Input 
                        id="businessPhone" 
                        {...profileForm.register('businessPhone')}
                        placeholder="02-1234-5678"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="businessAddress">商業地址</Label>
                      <Input 
                        id="businessAddress" 
                        {...profileForm.register('businessAddress')}
                        placeholder="台北市信義區信義路五段7號"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    儲存變更
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* 發票設定 */}
          {activeTab === 'invoice' && (
            <Card>
              <CardHeader>
                <CardTitle>發票設定</CardTitle>
                <CardDescription>自訂您的發票格式和預設值</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={invoiceForm.handleSubmit((data) => updateInvoiceSettings.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoicePrefix">發票編號前綴</Label>
                      <Input 
                        id="invoicePrefix" 
                        {...invoiceForm.register('invoicePrefix')}
                        placeholder="INV"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultPaymentTerms">預設付款期限（天）</Label>
                      <Input 
                        id="defaultPaymentTerms" 
                        type="number"
                        {...invoiceForm.register('defaultPaymentTerms', { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultTaxRate">預設稅率（%）</Label>
                      <Input 
                        id="defaultTaxRate" 
                        type="number"
                        step="0.01"
                        {...invoiceForm.register('defaultTaxRate', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNotes">發票備註</Label>
                    <textarea
                      id="invoiceNotes"
                      {...invoiceForm.register('invoiceNotes')}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="感謝您的惠顧！"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceTerms">付款條款</Label>
                    <textarea
                      id="invoiceTerms"
                      {...invoiceForm.register('invoiceTerms')}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="請於期限內完成付款"
                    />
                  </div>
                  <Button type="submit" disabled={updateInvoiceSettings.isPending}>
                    {updateInvoiceSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    儲存變更
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* 通知設定 */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>通知設定</CardTitle>
                <CardDescription>管理您的通知偏好</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <div className="font-medium">Email 通知</div>
                      <div className="text-sm text-gray-500">接收重要通知的 Email</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <div className="font-medium">發票到期提醒</div>
                      <div className="text-sm text-gray-500">在發票到期前 3 天發送提醒</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <div className="font-medium">任務到期提醒</div>
                      <div className="text-sm text-gray-500">在任務到期前發送提醒</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium">付款通知</div>
                      <div className="text-sm text-gray-500">當收到付款時發送通知</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 訂閱方案 */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>目前方案</CardTitle>
                  <CardDescription>您目前使用的訂閱方案</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-lg">免費方案</div>
                      <div className="text-sm text-gray-500">5 位客戶 · 10 張發票/月</div>
                    </div>
                    <Button>升級方案</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Solo</CardTitle>
                    <CardDescription>適合個人自由工作者</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">$12<span className="text-base font-normal text-gray-500">/月</span></div>
                    <ul className="mt-4 space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> 無限客戶
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> 無限發票
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> 專案管理
                      </li>
                    </ul>
                    <Button className="w-full mt-4" variant="outline">選擇方案</Button>
                  </CardContent>
                </Card>

                <Card className="border-blue-500">
                  <CardHeader>
                    <CardTitle>Pro</CardTitle>
                    <CardDescription>進階功能</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">$24<span className="text-base font-normal text-gray-500">/月</span></div>
                    <ul className="mt-4 space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> 所有 Solo 功能
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> 時間追蹤
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> 進階報表
                      </li>
                    </ul>
                    <Button className="w-full mt-4">選擇方案</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Agency</CardTitle>
                    <CardDescription>團隊協作</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">$49<span className="text-base font-normal text-gray-500">/月</span></div>
                    <ul className="mt-4 space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> 所有 Pro 功能
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> 5 位團隊成員
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> 團隊協作
                      </li>
                    </ul>
                    <Button className="w-full mt-4" variant="outline">選擇方案</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
