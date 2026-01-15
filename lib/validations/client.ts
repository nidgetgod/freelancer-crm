/**
 * Client Validation Schemas
 * 客戶資料驗證規則
 */

import { z } from 'zod'

// 客戶狀態列舉
export const ClientStatus = z.enum([
  'LEAD',
  'PROSPECT', 
  'ACTIVE',
  'COMPLETED',
  'ON_HOLD',
  'CHURNED',
])

// 建立客戶 Schema
export const createClientSchema = z.object({
  name: z.string().min(1, '請輸入客戶名稱').max(100, '客戶名稱不能超過 100 字'),
  email: z.string().email('請輸入有效的 Email').optional().nullable(),
  phone: z.string().max(20, '電話號碼不能超過 20 字').optional().nullable(),
  company: z.string().max(100, '公司名稱不能超過 100 字').optional().nullable(),
  website: z.string().url('請輸入有效的網址').optional().nullable(),
  status: ClientStatus.default('LEAD'),
  source: z.string().max(50, '來源不能超過 50 字').optional().nullable(),
  notes: z.string().max(5000, '備註不能超過 5000 字').optional().nullable(),
  address: z.string().max(200, '地址不能超過 200 字').optional().nullable(),
  city: z.string().max(50, '城市不能超過 50 字').optional().nullable(),
  state: z.string().max(50, '州/省不能超過 50 字').optional().nullable(),
  postalCode: z.string().max(20, '郵遞區號不能超過 20 字').optional().nullable(),
  country: z.string().max(50, '國家不能超過 50 字').default('Taiwan'),
  currency: z.string().length(3, '貨幣代碼必須為 3 個字元').default('TWD'),
  paymentTerms: z.number().int().min(0).max(365, '付款期限不能超過 365 天').default(30),
  tagIds: z.array(z.string()).optional(),
})

// 更新客戶 Schema
export const updateClientSchema = createClientSchema.partial()

// 客戶查詢參數 Schema
export const clientQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: ClientStatus.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'email', 'company', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  tags: z.string().optional(), // 逗號分隔的 tag IDs
  archived: z.coerce.boolean().default(false),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type ClientQueryInput = z.infer<typeof clientQuerySchema>
