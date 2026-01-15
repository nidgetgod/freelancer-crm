/**
 * Invoice Validation Schemas
 * 發票資料驗證規則
 */

import { z } from 'zod'

// 發票狀態列舉
export const InvoiceStatus = z.enum([
  'DRAFT',
  'SENT',
  'VIEWED',
  'PAID',
  'PARTIAL',
  'OVERDUE',
  'CANCELLED',
  'REFUNDED',
])

// 付款方式列舉
export const PaymentMethod = z.enum([
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'CASH',
  'CHECK',
  'PAYPAL',
  'STRIPE',
  'OTHER',
])

// 發票項目 Schema
export const invoiceItemSchema = z.object({
  description: z.string().min(1, '請輸入項目說明').max(500, '項目說明不能超過 500 字'),
  quantity: z.number().min(0.01, '數量必須大於 0'),
  unitPrice: z.number().min(0, '單價不能為負數'),
})

// 建立發票 Schema
export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, '請選擇客戶'),
  projectId: z.string().optional().nullable(),
  dueDate: z.coerce.date(),
  taxRate: z.number().min(0, '稅率不能為負數').max(100, '稅率不能超過 100%').default(0),
  discount: z.number().min(0, '折扣不能為負數').default(0),
  notes: z.string().max(2000, '備註不能超過 2000 字').optional().nullable(),
  terms: z.string().max(2000, '條款不能超過 2000 字').optional().nullable(),
  footer: z.string().max(1000, '頁尾不能超過 1000 字').optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, '請至少新增一個項目'),
})

// 更新發票 Schema
export const updateInvoiceSchema = createInvoiceSchema.partial().omit({ clientId: true })

// 發送發票 Schema
export const sendInvoiceSchema = z.object({
  to: z.string().email('請輸入有效的 Email'),
  cc: z.array(z.string().email()).optional(),
  subject: z.string().min(1, '請輸入主旨').max(200),
  message: z.string().max(5000, '訊息不能超過 5000 字').optional(),
})

// 記錄付款 Schema
export const recordPaymentSchema = z.object({
  amount: z.number().min(0.01, '金額必須大於 0'),
  method: PaymentMethod.default('BANK_TRANSFER'),
  reference: z.string().max(100, '參考編號不能超過 100 字').optional().nullable(),
  paidAt: z.coerce.date().default(() => new Date()),
  notes: z.string().max(500, '備註不能超過 500 字').optional().nullable(),
})

// 發票查詢參數 Schema
export const invoiceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: InvoiceStatus.optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  overdue: z.coerce.boolean().optional(),
  sortBy: z.enum(['invoiceNumber', 'issueDate', 'dueDate', 'total', 'status']).default('issueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type SendInvoiceInput = z.infer<typeof sendInvoiceSchema>
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
export type InvoiceQueryInput = z.infer<typeof invoiceQuerySchema>
