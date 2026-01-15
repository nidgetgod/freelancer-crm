/**
 * Project Validation Schemas
 * 專案資料驗證規則
 */

import { z } from 'zod'

// 專案狀態列舉
export const ProjectStatus = z.enum([
  'PLANNING',
  'IN_PROGRESS',
  'ON_HOLD',
  'IN_REVIEW',
  'COMPLETED',
  'CANCELLED',
])

// 優先級列舉
export const Priority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

// 建立專案 Schema
export const createProjectSchema = z.object({
  clientId: z.string().min(1, '請選擇客戶'),
  name: z.string().min(1, '請輸入專案名稱').max(200, '專案名稱不能超過 200 字'),
  description: z.string().max(5000, '描述不能超過 5000 字').optional().nullable(),
  status: ProjectStatus.default('PLANNING'),
  priority: Priority.default('MEDIUM'),
  startDate: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  budget: z.number().min(0, '預算不能為負數').optional().nullable(),
  currency: z.string().length(3, '貨幣代碼必須為 3 個字元').default('TWD'),
  hourlyRate: z.number().min(0, '時薪不能為負數').optional().nullable(),
  estimatedHours: z.number().min(0, '預估時數不能為負數').optional().nullable(),
  tagIds: z.array(z.string()).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.dueDate) {
      return data.startDate <= data.dueDate
    }
    return true
  },
  {
    message: '開始日期不能晚於結束日期',
    path: ['dueDate'],
  }
)

// 更新專案 Schema
export const updateProjectSchema = createProjectSchema.partial().omit({ clientId: true })

// 更新專案狀態 Schema
export const updateProjectStatusSchema = z.object({
  status: ProjectStatus,
})

// 專案查詢參數 Schema
export const projectQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: ProjectStatus.optional(),
  clientId: z.string().optional(),
  priority: Priority.optional(),
  search: z.string().optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  sortBy: z.enum(['name', 'dueDate', 'budget', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type UpdateProjectStatusInput = z.infer<typeof updateProjectStatusSchema>
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>
