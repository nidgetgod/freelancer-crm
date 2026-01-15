/**
 * Task Validation Schemas
 * 任務資料驗證規則
 */

import { z } from 'zod'

// 任務狀態列舉
export const TaskStatus = z.enum([
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'CANCELLED',
])

// 優先級列舉
export const Priority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

// 建立任務 Schema
export const createTaskSchema = z.object({
  title: z.string().min(1, '請輸入任務標題').max(200, '任務標題不能超過 200 字'),
  description: z.string().max(2000, '描述不能超過 2000 字').optional().nullable(),
  status: TaskStatus.default('TODO'),
  priority: Priority.default('MEDIUM'),
  dueDate: z.coerce.date().optional().nullable(),
  projectId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  estimatedMinutes: z.number().int().min(0, '預估時間不能為負數').optional().nullable(),
  reminderAt: z.coerce.date().optional().nullable(),
})

// 更新任務 Schema
export const updateTaskSchema = createTaskSchema.partial()

// 更新任務狀態 Schema
export const updateTaskStatusSchema = z.object({
  status: TaskStatus,
})

// 重新排序任務 Schema
export const reorderTasksSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number().int().min(0),
    })
  ).min(1, '請提供至少一個任務'),
})

// 任務查詢參數 Schema
export const taskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: TaskStatus.optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  priority: Priority.optional(),
  dueBefore: z.coerce.date().optional(),
  dueToday: z.coerce.boolean().optional(),
  overdue: z.coerce.boolean().optional(),
  sortBy: z.enum(['title', 'dueDate', 'priority', 'createdAt', 'sortOrder']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>
export type TaskQueryInput = z.infer<typeof taskQuerySchema>
