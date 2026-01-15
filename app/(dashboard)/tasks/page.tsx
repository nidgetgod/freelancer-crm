'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Calendar,
  Flag,
  Pencil,
  Trash2,
  User,
  Folder
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  completedAt: string | null
  project: { id: string; name: string } | null
  client: { id: string; name: string } | null
  isOverdue: boolean
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  TODO: { label: '待辦', icon: Circle, color: 'text-gray-500' },
  IN_PROGRESS: { label: '進行中', icon: Clock, color: 'text-blue-500' },
  IN_REVIEW: { label: '待審核', icon: AlertCircle, color: 'text-yellow-500' },
  DONE: { label: '完成', icon: CheckCircle2, color: 'text-green-500' },
  CANCELLED: { label: '取消', icon: Circle, color: 'text-gray-400' },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: '低', color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: '中', color: 'bg-blue-100 text-blue-600' },
  HIGH: { label: '高', color: 'bg-orange-100 text-orange-600' },
  URGENT: { label: '緊急', color: 'bg-red-100 text-red-600' },
}

export default function TasksPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { search, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      
      const res = await fetch(`/api/tasks?${params}`)
      if (!res.ok) throw new Error('Failed to fetch tasks')
      return res.json()
    }
  })

  const createTask = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      if (!res.ok) throw new Error('Failed to create task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setNewTaskTitle('')
      setShowNewTask(false)
      toast({ title: '任務已建立' })
    }
  })

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({ title: '任務已刪除' })
    }
  })

  const tasks: Task[] = data?.data || []

  // 計算統計
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: tasks.filter(t => t.status === 'DONE').length,
    overdue: tasks.filter(t => t.isOverdue).length,
  }

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTaskTitle.trim()) {
      createTask.mutate(newTaskTitle.trim())
    }
  }

  const toggleTaskStatus = (task: Task) => {
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
    updateTaskStatus.mutate({ id: task.id, status: newStatus })
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">任務管理</h1>
          <p className="text-gray-500 mt-1">追蹤您的待辦事項和專案任務</p>
        </div>
        <Button onClick={() => setShowNewTask(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新增任務
        </Button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className={cn(
          "cursor-pointer transition-colors",
          !statusFilter ? 'border-gray-400' : 'hover:border-gray-300'
        )} onClick={() => setStatusFilter(null)}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">全部</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className={cn(
          "cursor-pointer transition-colors",
          statusFilter === 'TODO' ? 'border-gray-400' : 'hover:border-gray-300'
        )} onClick={() => setStatusFilter(statusFilter === 'TODO' ? null : 'TODO')}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">待辦</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{stats.todo}</div>
          </CardContent>
        </Card>
        <Card className={cn(
          "cursor-pointer transition-colors",
          statusFilter === 'IN_PROGRESS' ? 'border-blue-400' : 'hover:border-gray-300'
        )} onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? null : 'IN_PROGRESS')}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">進行中</div>
            <div className="text-xl font-bold text-blue-600 mt-1">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card className={cn(
          "cursor-pointer transition-colors",
          statusFilter === 'DONE' ? 'border-green-400' : 'hover:border-gray-300'
        )} onClick={() => setStatusFilter(statusFilter === 'DONE' ? null : 'DONE')}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">已完成</div>
            <div className="text-xl font-bold text-green-600 mt-1">{stats.done}</div>
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
            placeholder="搜尋任務..."
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

      {/* 快速新增任務 */}
      {showNewTask && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleCreateTask} className="flex gap-2">
              <Input
                placeholder="輸入任務標題..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
              />
              <Button type="submit" disabled={!newTaskTitle.trim() || createTask.isPending}>
                新增
              </Button>
              <Button type="button" variant="ghost" onClick={() => {
                setShowNewTask(false)
                setNewTaskTitle('')
              }}>
                取消
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 任務列表 */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-12 bg-gray-100 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">尚無任務</h3>
            <p className="text-gray-500 mb-4">建立任務來追蹤您的工作進度</p>
            <Button onClick={() => setShowNewTask(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新增任務
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const status = statusConfig[task.status]
            const priority = priorityConfig[task.priority]
            const StatusIcon = status?.icon || Circle

            return (
              <Card key={task.id} className={cn(
                "hover:border-gray-300 transition-colors",
                task.status === 'DONE' && "opacity-60"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* 狀態勾選 */}
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className={cn(
                        "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        task.status === 'DONE' 
                          ? "border-green-500 bg-green-500 text-white" 
                          : "border-gray-300 hover:border-green-500"
                      )}
                    >
                      {task.status === 'DONE' && (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                    </button>

                    {/* 任務內容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium",
                          task.status === 'DONE' && "line-through text-gray-500"
                        )}>
                          {task.title}
                        </span>
                        <Badge className={priority?.color} variant="secondary">
                          {priority?.label}
                        </Badge>
                        {task.status !== 'DONE' && task.status !== 'TODO' && (
                          <Badge variant="outline" className={status?.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status?.label}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {task.dueDate && (
                          <span className={cn(
                            "flex items-center gap-1",
                            task.isOverdue && "text-red-600"
                          )}>
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.dueDate)}
                            {task.isOverdue && " (逾期)"}
                          </span>
                        )}
                        {task.client && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.client.name}
                          </span>
                        )}
                        {task.project && (
                          <span className="flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {task.project.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 動作 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="w-4 h-4 mr-2" />
                          編輯
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {Object.entries(statusConfig).map(([key, { label }]) => (
                          <DropdownMenuItem 
                            key={key} 
                            onClick={() => updateTaskStatus.mutate({ id: task.id, status: key })}
                            disabled={task.status === key}
                          >
                            設為{label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deleteTask.mutate(task.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          刪除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
