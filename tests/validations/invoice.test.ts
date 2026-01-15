/**
 * Invoice Validation Schema Tests
 * 發票資料驗證規則測試
 */

import {
  createInvoiceSchema,
  updateInvoiceSchema,
  sendInvoiceSchema,
  recordPaymentSchema,
  invoiceQuerySchema,
  invoiceItemSchema,
  InvoiceStatus,
  PaymentMethod,
} from '@/lib/validations/invoice'

describe('Invoice Validation Schemas', () => {
  // ============================================
  // invoiceItemSchema Tests
  // ============================================
  describe('invoiceItemSchema', () => {
    it('應該接受有效的項目資料', () => {
      const result = invoiceItemSchema.safeParse({
        description: '網頁設計服務',
        quantity: 1,
        unitPrice: 50000,
      })
      expect(result.success).toBe(true)
    })

    it('應該要求 description', () => {
      const result = invoiceItemSchema.safeParse({
        quantity: 1,
        unitPrice: 50000,
      })
      expect(result.success).toBe(false)
    })

    it('應該拒絕空的 description', () => {
      const result = invoiceItemSchema.safeParse({
        description: '',
        quantity: 1,
        unitPrice: 50000,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('請輸入項目說明')
      }
    })

    it('應該拒絕超過 500 字的 description', () => {
      const result = invoiceItemSchema.safeParse({
        description: 'a'.repeat(501),
        quantity: 1,
        unitPrice: 50000,
      })
      expect(result.success).toBe(false)
    })

    it('應該要求 quantity 大於 0', () => {
      const result = invoiceItemSchema.safeParse({
        description: '網頁設計服務',
        quantity: 0,
        unitPrice: 50000,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('數量必須大於 0')
      }
    })

    it('應該接受小數 quantity', () => {
      const result = invoiceItemSchema.safeParse({
        description: '設計服務（小時）',
        quantity: 2.5,
        unitPrice: 2000,
      })
      expect(result.success).toBe(true)
    })

    it('應該拒絕負數 unitPrice', () => {
      const result = invoiceItemSchema.safeParse({
        description: '網頁設計服務',
        quantity: 1,
        unitPrice: -1000,
      })
      expect(result.success).toBe(false)
    })

    it('應該接受 0 unitPrice', () => {
      const result = invoiceItemSchema.safeParse({
        description: '免費贈品',
        quantity: 1,
        unitPrice: 0,
      })
      expect(result.success).toBe(true)
    })
  })

  // ============================================
  // createInvoiceSchema Tests
  // ============================================
  describe('createInvoiceSchema', () => {
    const validItem = {
      description: '網頁設計服務',
      quantity: 1,
      unitPrice: 50000,
    }

    describe('必填欄位', () => {
      it('應該要求 clientId', () => {
        const result = createInvoiceSchema.safeParse({
          dueDate: '2026-01-31',
          items: [validItem],
        })
        expect(result.success).toBe(false)
      })

      it('應該要求 dueDate', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client-123',
          items: [validItem],
        })
        expect(result.success).toBe(false)
      })

      it('應該要求至少一個項目', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client-123',
          dueDate: '2026-01-31',
          items: [],
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          const itemsError = result.error.errors.find(e => e.path.includes('items'))
          expect(itemsError?.message).toBe('請至少新增一個項目')
        }
      })

      it('應該接受最小必要資料', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client-123',
          dueDate: '2026-01-31',
          items: [validItem],
        })
        expect(result.success).toBe(true)
      })
    })

    describe('taxRate 欄位', () => {
      it('應該預設為 0', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client-123',
          dueDate: '2026-01-31',
          items: [validItem],
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.taxRate).toBe(0)
        }
      })

      it('應該接受 0-100 之間的值', () => {
        const validRates = [0, 5, 10, 20, 100]
        
        validRates.forEach((taxRate) => {
          const result = createInvoiceSchema.safeParse({
            clientId: 'client-123',
            dueDate: '2026-01-31',
            items: [validItem],
            taxRate,
          })
          expect(result.success).toBe(true)
        })
      })

      it('應該拒絕超過 100 的值', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client-123',
          dueDate: '2026-01-31',
          items: [validItem],
          taxRate: 101,
        })
        expect(result.success).toBe(false)
      })

      it('應該拒絕負數', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client-123',
          dueDate: '2026-01-31',
          items: [validItem],
          taxRate: -5,
        })
        expect(result.success).toBe(false)
      })
    })

    describe('discount 欄位', () => {
      it('應該預設為 0', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client-123',
          dueDate: '2026-01-31',
          items: [validItem],
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.discount).toBe(0)
        }
      })

      it('應該接受有效的折扣金額', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client-123',
          dueDate: '2026-01-31',
          items: [validItem],
          discount: 5000,
        })
        expect(result.success).toBe(true)
      })

      it('應該拒絕負數折扣', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client-123',
          dueDate: '2026-01-31',
          items: [validItem],
          discount: -1000,
        })
        expect(result.success).toBe(false)
      })
    })

    describe('文字欄位', () => {
      it('應該接受有效的 notes', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client-123',
          dueDate: '2026-01-31',
          items: [validItem],
          notes: '感謝您的惠顧！',
        })
        expect(result.success).toBe(true)
      })

      it('應該拒絕超過 2000 字的 notes', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client-123',
          dueDate: '2026-01-31',
          items: [validItem],
          notes: 'a'.repeat(2001),
        })
        expect(result.success).toBe(false)
      })

      it('應該拒絕超過 1000 字的 footer', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client-123',
          dueDate: '2026-01-31',
          items: [validItem],
          footer: 'a'.repeat(1001),
        })
        expect(result.success).toBe(false)
      })
    })

    describe('多個項目', () => {
      it('應該接受多個項目', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client-123',
          dueDate: '2026-01-31',
          items: [
            { description: '首頁設計', quantity: 1, unitPrice: 30000 },
            { description: '內頁設計', quantity: 5, unitPrice: 8000 },
            { description: '後台功能開發', quantity: 20, unitPrice: 2000 },
          ],
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.items).toHaveLength(3)
        }
      })
    })

    describe('完整資料驗證', () => {
      it('應該接受完整有效的發票資料', () => {
        const validInvoice = {
          clientId: 'client-123',
          projectId: 'project-456',
          dueDate: '2026-02-15',
          taxRate: 5,
          discount: 5000,
          notes: '官網改版第二期款項',
          terms: '請於期限內完成付款，逾期將加收滯納金。',
          footer: '感謝您的支持！',
          items: [
            { description: '首頁設計與開發', quantity: 1, unitPrice: 50000 },
            { description: '內頁設計（5頁）', quantity: 5, unitPrice: 8000 },
          ],
        }

        const result = createInvoiceSchema.safeParse(validInvoice)
        expect(result.success).toBe(true)
      })
    })
  })

  // ============================================
  // updateInvoiceSchema Tests
  // ============================================
  describe('updateInvoiceSchema', () => {
    it('應該允許所有欄位為可選', () => {
      const result = updateInvoiceSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('應該不包含 clientId', () => {
      const result = updateInvoiceSchema.safeParse({
        clientId: 'new-client',
        taxRate: 10,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('clientId')
      }
    })
  })

  // ============================================
  // sendInvoiceSchema Tests
  // ============================================
  describe('sendInvoiceSchema', () => {
    it('應該要求有效的收件人 Email', () => {
      const result = sendInvoiceSchema.safeParse({
        to: 'client@example.com',
        subject: '發票 INV-1001',
      })
      expect(result.success).toBe(true)
    })

    it('應該拒絕無效的收件人 Email', () => {
      const result = sendInvoiceSchema.safeParse({
        to: 'invalid-email',
        subject: '發票 INV-1001',
      })
      expect(result.success).toBe(false)
    })

    it('應該接受 cc 欄位', () => {
      const result = sendInvoiceSchema.safeParse({
        to: 'client@example.com',
        cc: ['accounting@example.com', 'manager@example.com'],
        subject: '發票 INV-1001',
      })
      expect(result.success).toBe(true)
    })

    it('應該拒絕 cc 中的無效 Email', () => {
      const result = sendInvoiceSchema.safeParse({
        to: 'client@example.com',
        cc: ['valid@example.com', 'invalid-email'],
        subject: '發票 INV-1001',
      })
      expect(result.success).toBe(false)
    })

    it('應該要求主旨', () => {
      const result = sendInvoiceSchema.safeParse({
        to: 'client@example.com',
      })
      expect(result.success).toBe(false)
    })

    it('應該拒絕空的主旨', () => {
      const result = sendInvoiceSchema.safeParse({
        to: 'client@example.com',
        subject: '',
      })
      expect(result.success).toBe(false)
    })
  })

  // ============================================
  // recordPaymentSchema Tests
  // ============================================
  describe('recordPaymentSchema', () => {
    it('應該要求金額大於 0', () => {
      const result = recordPaymentSchema.safeParse({
        amount: 0,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('金額必須大於 0')
      }
    })

    it('應該接受有效的付款資料', () => {
      const result = recordPaymentSchema.safeParse({
        amount: 52500,
        method: 'BANK_TRANSFER',
        reference: '末五碼 12345',
        paidAt: '2026-01-20',
        notes: '客戶已匯款',
      })
      expect(result.success).toBe(true)
    })

    it('應該預設 method 為 BANK_TRANSFER', () => {
      const result = recordPaymentSchema.safeParse({
        amount: 50000,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.method).toBe('BANK_TRANSFER')
      }
    })

    it('應該接受所有有效的付款方式', () => {
      const validMethods = ['BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'CHECK', 'PAYPAL', 'STRIPE', 'OTHER']
      
      validMethods.forEach((method) => {
        const result = recordPaymentSchema.safeParse({
          amount: 50000,
          method,
        })
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕超過 100 字的 reference', () => {
      const result = recordPaymentSchema.safeParse({
        amount: 50000,
        reference: 'a'.repeat(101),
      })
      expect(result.success).toBe(false)
    })
  })

  // ============================================
  // invoiceQuerySchema Tests
  // ============================================
  describe('invoiceQuerySchema', () => {
    it('應該有正確的預設值', () => {
      const result = invoiceQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
        expect(result.data.sortBy).toBe('issueDate')
        expect(result.data.sortOrder).toBe('desc')
      }
    })

    it('應該接受日期範圍篩選', () => {
      const result = invoiceQuerySchema.safeParse({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      })
      expect(result.success).toBe(true)
    })

    it('應該接受 overdue 參數', () => {
      const result = invoiceQuerySchema.safeParse({
        overdue: 'true',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.overdue).toBe(true)
      }
    })

    it('應該接受有效的排序欄位', () => {
      const validSortFields = ['invoiceNumber', 'issueDate', 'dueDate', 'total', 'status']
      
      validSortFields.forEach((sortBy) => {
        const result = invoiceQuerySchema.safeParse({ sortBy })
        expect(result.success).toBe(true)
      })
    })
  })

  // ============================================
  // Enum Tests
  // ============================================
  describe('InvoiceStatus', () => {
    it('應該包含所有預期的狀態', () => {
      const expectedStatuses = ['DRAFT', 'SENT', 'VIEWED', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED', 'REFUNDED']
      
      expectedStatuses.forEach((status) => {
        const result = InvoiceStatus.safeParse(status)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('PaymentMethod', () => {
    it('應該包含所有預期的付款方式', () => {
      const expectedMethods = ['BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'CHECK', 'PAYPAL', 'STRIPE', 'OTHER']
      
      expectedMethods.forEach((method) => {
        const result = PaymentMethod.safeParse(method)
        expect(result.success).toBe(true)
      })
    })
  })
})
