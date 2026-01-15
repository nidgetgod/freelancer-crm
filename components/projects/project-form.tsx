'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

const projectSchema = z.object({
  clientId: z.string().min(1, '請選擇客戶'),
  name: z.string().min(1, '請輸入專案名稱').max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  budget: z.coerce.number().min(0).optional().or(z.literal('')),
  hourlyRate: z.coerce.number().min(0).optional().or(z.literal('')),
  estimatedHours: z.coerce.number().min(0).optional().or(z.literal('')),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface Client {
  id: string
  name: string
  company: string | null
}

interface Project {
  id: string
  clientId: string
  name: string
  description: string | null
  status: string
  priority: string
  startDate: Date | null
  dueDate: Date | null
  budget: number | null
  hourlyRate: number | null
  estimatedHours: number | null
}

interface ProjectFormProps {
  project?: Project
  clients: Client[]
}

const statusOptions = [
  { value: 'PLANNING', label: '規劃中' },
  { value: 'IN_PROGRESS', label: '進行中' },
  { value: 'ON_HOLD', label: '暫停' },
  { value: 'IN_REVIEW', label: '審核中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
]

const priorityOptions = [
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' },
  { value: 'URGENT', label: '緊急' },
]

export function ProjectForm({ project, clients }: ProjectFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEditing = !!project

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          clientId: project.clientId,
          name: project.name,
          description: project.description || '',
          status: project.status as ProjectFormData['status'],
          priority: project.priority as ProjectFormData['priority'],
          startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
          dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '',
          budget: project.budget || '',
          hourlyRate: project.hourlyRate || '',
          estimatedHours: project.estimatedHours || '',
        }
      : {
          status: 'PLANNING',
          priority: 'MEDIUM',
        },
  })

  const createProject = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '建立專案失敗')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast({ title: '成功', description: '專案建立成功' })
      router.push('/projects')
    },
    onError: (error: Error) => {
      toast({ title: '錯誤', description: error.message, variant: 'destructive' })
    },
  })

  const updateProject = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const res = await fetch(`/api/projects/${project!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '更新專案失敗')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast({ title: '成功', description: '專案更新成功' })
      router.push(`/projects/${project!.id}`)
    },
    onError: (error: Error) => {
      toast({ title: '錯誤', description: error.message, variant: 'destructive' })
    },
  })

  const onSubmit = async (data: ProjectFormData) => {
    const cleanData = {
      ...data,
      budget: data.budget || null,
      hourlyRate: data.hourlyRate || null,
      estimatedHours: data.estimatedHours || null,
      startDate: data.startDate || null,
      dueDate: data.dueDate || null,
    }

    if (isEditing) {
      await updateProject.mutateAsync(cleanData)
    } else {
      await createProject.mutateAsync(cleanData)
    }
  }

  const isPending = createProject.isPending || updateProject.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
        {/* 基本資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">專案名稱 *</Label>
              <Input
                id="name"
                placeholder="輸入專案名稱"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

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
              <Label htmlFor="status">狀態</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('status')}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">優先級</Label>
              <select
                id="priority"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('priority')}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">描述</Label>
              <textarea
                id="description"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="輸入專案描述..."
                {...register('description')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 時程 */}
        <Card>
          <CardHeader>
            <CardTitle>時程</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">開始日期</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">截止日期</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 財務與時間 */}
        <Card>
          <CardHeader>
            <CardTitle>財務與時間</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="budget">預算 (TWD)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                placeholder="0"
                {...register('budget')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">時薪 (TWD)</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                placeholder="0"
                {...register('hourlyRate')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">預估時數</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="0"
                placeholder="0"
                {...register('estimatedHours')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 按鈕 */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending || isSubmitting}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? '更新專案' : '建立專案'}
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
