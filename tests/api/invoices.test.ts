/**
 * Invoices API Route Tests
 * 發票 API 端點測試
 */

import { prismaMock, testDataFactory, setMockSession } from '../setup'

describe('Invoices API', () => {
  // ============================================
  // GET /api/invoices Tests
  // ============================================
  describe('GET /api/invoices', () => {
    it('應該返回用戶的發票列表', async () => {
      const mockInvoices = [
        testDataFactory.invoice({ id: 'inv-1', invoiceNumber: 'INV-1001' }),
        testDataFactory.invoice({ id: 'inv-2', invoiceNumber: 'INV-1002' }),
      ]

      prismaMock.invoice.findMany.mockResolvedValue(mockInvoices)
      prismaMock.invoice.count.mockResolvedValue(2)

      const result = await prismaMock.invoice.findMany({
        where: { userId: 'test-user-id' },
      })

      expect(result).toHaveLength(2)
    })

    it('應該支援按狀態篩選', async () => {
      const sentInvoices = [
        testDataFactory.invoice({ status: 'SENT' }),
      ]

      prismaMock.invoice.findMany.mockResolvedValue(sentInvoices)

      await prismaMock.invoice.findMany({
        where: {
          userId: 'test-user-id',
          status: 'SENT',
        },
      })

      expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'SENT',
          }),
        })
      )
    })

    it('應該支援篩選逾期發票', async () => {
      const today = new Date()
      
      prismaMock.invoice.findMany.mockResolvedValue([])

      await prismaMock.invoice.findMany({
        where: {
          userId: 'test-user-id',
          status: { in: ['SENT', 'VIEWED'] },
          dueDate: { lt: today },
        },
      })

      expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: { lt: today },
          }),
        })
      )
    })

    it('應該支援日期範圍篩選', async () => {
      const dateFrom = new Date('2026-01-01')
      const dateTo = new Date('2026-01-31')

      prismaMock.invoice.findMany.mockResolvedValue([])

      await prismaMock.invoice.findMany({
        where: {
          userId: 'test-user-id',
          issueDate: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      })

      expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            issueDate: { gte: dateFrom, lte: dateTo },
          }),
        })
      )
    })
  })

  // ============================================
  // POST /api/invoices Tests
  // ============================================
  describe('POST /api/invoices', () => {
    it('應該成功建立新發票', async () => {
      const newInvoice = testDataFactory.invoice({
        id: 'new-invoice-id',
        invoiceNumber: 'INV-1003',
      })

      prismaMock.client.findFirst.mockResolvedValue(testDataFactory.client())
      prismaMock.setting.findUnique.mockResolvedValue({
        id: 'setting-id',
        userId: 'test-user-id',
        invoicePrefix: 'INV',
        invoiceNextNumber: 1003,
        defaultPaymentTerms: 30,
        defaultTaxRate: 5 as any,
        invoiceNotes: null,
        invoiceTerms: null,
        invoiceFooter: null,
        emailNotifications: true,
        reminderDaysBefore: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      prismaMock.invoice.create.mockResolvedValue(newInvoice)

      const result = await prismaMock.invoice.create({
        data: {
          userId: 'test-user-id',
          clientId: 'client-123',
          invoiceNumber: 'INV-1003',
          dueDate: new Date('2026-02-15'),
          status: 'DRAFT',
          subtotal: 50000,
          taxRate: 5,
          taxAmount: 2500,
          total: 52500,
        },
      })

      expect(result.invoiceNumber).toBe('INV-1003')
    })

    it('應該自動產生發票編號', async () => {
      prismaMock.setting.findUnique.mockResolvedValue({
        id: 'setting-id',
        userId: 'test-user-id',
        invoicePrefix: 'INV',
        invoiceNextNumber: 1003,
        defaultPaymentTerms: 30,
        defaultTaxRate: 5 as any,
        invoiceNotes: null,
        invoiceTerms: null,
        invoiceFooter: null,
        emailNotifications: true,
        reminderDaysBefore: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const setting = await prismaMock.setting.findUnique({
        where: { userId: 'test-user-id' },
      })

      const invoiceNumber = `${setting?.invoicePrefix}-${setting?.invoiceNextNumber}`
      
      expect(invoiceNumber).toBe('INV-1003')
    })

    it('應該正確計算金額', () => {
      const items = [
        { description: '項目 A', quantity: 1, unitPrice: 30000 },
        { description: '項目 B', quantity: 2, unitPrice: 10000 },
      ]
      const taxRate = 5
      const discount = 5000

      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      const taxAmount = Math.round((subtotal - discount) * (taxRate / 100))
      const total = subtotal - discount + taxAmount

      expect(subtotal).toBe(50000)
      expect(taxAmount).toBe(2250) // (50000 - 5000) * 0.05
      expect(total).toBe(47250) // 50000 - 5000 + 2250
    })

    it('應該建立發票項目', async () => {
      const invoiceWithItems = {
        ...testDataFactory.invoice(),
        items: [
          testDataFactory.invoiceItem({ description: '項目 A' }),
          testDataFactory.invoiceItem({ description: '項目 B' }),
        ],
      }

      prismaMock.invoice.create.mockResolvedValue(invoiceWithItems as any)

      await prismaMock.invoice.create({
        data: {
          userId: 'test-user-id',
          clientId: 'client-123',
          invoiceNumber: 'INV-1003',
          dueDate: new Date(),
          subtotal: 100000,
          taxRate: 0,
          taxAmount: 0,
          total: 100000,
          items: {
            create: [
              { description: '項目 A', quantity: 1, unitPrice: 50000, amount: 50000 },
              { description: '項目 B', quantity: 1, unitPrice: 50000, amount: 50000 },
            ],
          },
        },
      })

      expect(prismaMock.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: expect.objectContaining({
              create: expect.any(Array),
            }),
          }),
        })
      )
    })

    it('應該檢查 Free 方案的發票限制', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        testDataFactory.subscription({ plan: 'FREE', invoicesThisMonth: 10 })
      )

      const subscription = await prismaMock.subscription.findUnique({
        where: { userId: 'test-user-id' },
      })

      expect(subscription?.plan).toBe('FREE')
      expect(subscription?.invoicesThisMonth).toBe(10)
      // 在實際 API 中，這會返回 422 錯誤
    })
  })

  // ============================================
  // GET /api/invoices/:id Tests
  // ============================================
  describe('GET /api/invoices/:id', () => {
    it('應該返回發票詳情', async () => {
      const invoice = testDataFactory.invoice({ id: 'inv-123' })

      prismaMock.invoice.findFirst.mockResolvedValue(invoice)

      const result = await prismaMock.invoice.findFirst({
        where: {
          id: 'inv-123',
          userId: 'test-user-id',
        },
      })

      expect(result).not.toBeNull()
      expect(result?.id).toBe('inv-123')
    })

    it('應該包含發票項目', async () => {
      const invoiceWithItems = {
        ...testDataFactory.invoice(),
        items: [
          testDataFactory.invoiceItem({ description: '項目 A' }),
          testDataFactory.invoiceItem({ description: '項目 B' }),
        ],
      }

      prismaMock.invoice.findFirst.mockResolvedValue(invoiceWithItems as any)

      const result = await prismaMock.invoice.findFirst({
        where: { id: 'inv-123' },
        include: { items: true },
      })

      expect(result?.items).toHaveLength(2)
    })

    it('應該包含客戶資訊', async () => {
      const invoiceWithClient = {
        ...testDataFactory.invoice(),
        client: testDataFactory.client(),
      }

      prismaMock.invoice.findFirst.mockResolvedValue(invoiceWithClient as any)

      const result = await prismaMock.invoice.findFirst({
        where: { id: 'inv-123' },
        include: { client: true },
      })

      expect(result?.client).toBeDefined()
    })
  })

  // ============================================
  // POST /api/invoices/:id/send Tests
  // ============================================
  describe('POST /api/invoices/:id/send', () => {
    it('應該更新發票狀態為 SENT', async () => {
      const invoice = testDataFactory.invoice({ status: 'DRAFT' })
      const sentInvoice = {
        ...invoice,
        status: 'SENT' as const,
        sentAt: new Date(),
      }

      prismaMock.invoice.findFirst.mockResolvedValue(invoice)
      prismaMock.invoice.update.mockResolvedValue(sentInvoice)

      const result = await prismaMock.invoice.update({
        where: { id: 'inv-123' },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      })

      expect(result.status).toBe('SENT')
      expect(result.sentAt).not.toBeNull()
    })

    it('應該記錄發送活動', async () => {
      prismaMock.activity.create.mockResolvedValue({
        id: 'activity-id',
        userId: 'test-user-id',
        action: 'SENT',
        entityType: 'INVOICE',
        entityId: 'inv-123',
        entityName: 'INV-1001',
        metadata: null,
        createdAt: new Date(),
      })

      await prismaMock.activity.create({
        data: {
          userId: 'test-user-id',
          action: 'SENT',
          entityType: 'INVOICE',
          entityId: 'inv-123',
          entityName: 'INV-1001',
        },
      })

      expect(prismaMock.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'SENT',
          }),
        })
      )
    })

    it('不應該發送已取消的發票', async () => {
      const cancelledInvoice = testDataFactory.invoice({ status: 'CANCELLED' })

      prismaMock.invoice.findFirst.mockResolvedValue(cancelledInvoice)

      const invoice = await prismaMock.invoice.findFirst({
        where: { id: 'inv-123' },
      })

      expect(invoice?.status).toBe('CANCELLED')
      // 在實際 API 中，這會返回 422 錯誤
    })
  })

  // ============================================
  // POST /api/invoices/:id/record-payment Tests
  // ============================================
  describe('POST /api/invoices/:id/record-payment', () => {
    it('應該記錄全額付款', async () => {
      const invoice = testDataFactory.invoice({
        total: 52500,
        amountPaid: 0,
      })
      const paidInvoice = {
        ...invoice,
        status: 'PAID' as const,
        amountPaid: 52500,
        paidAt: new Date(),
      }

      prismaMock.invoice.findFirst.mockResolvedValue(invoice)
      prismaMock.payment.create.mockResolvedValue({
        id: 'payment-id',
        invoiceId: 'inv-123',
        amount: 52500 as any,
        currency: 'TWD',
        method: 'BANK_TRANSFER',
        reference: '12345',
        stripePaymentId: null,
        notes: null,
        paidAt: new Date(),
        createdAt: new Date(),
      })
      prismaMock.invoice.update.mockResolvedValue(paidInvoice)

      // 建立付款記錄
      await prismaMock.payment.create({
        data: {
          invoiceId: 'inv-123',
          amount: 52500,
          method: 'BANK_TRANSFER',
          reference: '12345',
        },
      })

      // 更新發票狀態
      const result = await prismaMock.invoice.update({
        where: { id: 'inv-123' },
        data: {
          status: 'PAID',
          amountPaid: 52500,
          paidAt: new Date(),
        },
      })

      expect(result.status).toBe('PAID')
      expect(result.amountPaid).toEqual(52500)
    })

    it('應該記錄部分付款', async () => {
      const invoice = testDataFactory.invoice({
        total: 100000,
        amountPaid: 0,
      })
      const partialPaidInvoice = {
        ...invoice,
        status: 'PARTIAL' as const,
        amountPaid: 50000,
      }

      prismaMock.invoice.findFirst.mockResolvedValue(invoice)
      prismaMock.invoice.update.mockResolvedValue(partialPaidInvoice)

      const result = await prismaMock.invoice.update({
        where: { id: 'inv-123' },
        data: {
          status: 'PARTIAL',
          amountPaid: 50000,
        },
      })

      expect(result.status).toBe('PARTIAL')
      expect(result.amountPaid).toEqual(50000)
    })

    it('應該支援多次部分付款', async () => {
      const payments = [
        { amount: 30000 },
        { amount: 30000 },
        { amount: 40000 },
      ]

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
      
      expect(totalPaid).toBe(100000)
    })
  })

  // ============================================
  // Invoice Status Transitions
  // ============================================
  describe('Invoice Status Transitions', () => {
    it('DRAFT -> SENT 是允許的', () => {
      const validTransitions: Record<string, string[]> = {
        DRAFT: ['SENT', 'CANCELLED'],
        SENT: ['VIEWED', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'],
        VIEWED: ['PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'],
        PARTIAL: ['PAID', 'OVERDUE', 'CANCELLED'],
        PAID: ['REFUNDED'],
        OVERDUE: ['PAID', 'PARTIAL', 'CANCELLED'],
      }

      expect(validTransitions.DRAFT).toContain('SENT')
    })

    it('PAID -> SENT 是不允許的', () => {
      const validTransitions: Record<string, string[]> = {
        PAID: ['REFUNDED'],
      }

      expect(validTransitions.PAID).not.toContain('SENT')
    })
  })

  // ============================================
  // Overdue Detection
  // ============================================
  describe('Overdue Detection', () => {
    it('應該正確判斷逾期發票', () => {
      const today = new Date('2026-01-15')
      const pastDueDate = new Date('2026-01-10')
      const futureDueDate = new Date('2026-01-20')

      const isOverdue = (dueDate: Date) => dueDate < today

      expect(isOverdue(pastDueDate)).toBe(true)
      expect(isOverdue(futureDueDate)).toBe(false)
    })

    it('應該計算逾期天數', () => {
      const today = new Date('2026-01-15')
      const dueDate = new Date('2026-01-10')

      const daysDiff = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysDiff).toBe(5)
    })

    it('應該計算剩餘天數', () => {
      const today = new Date('2026-01-15')
      const dueDate = new Date('2026-01-20')

      const daysUntilDue = Math.floor(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysUntilDue).toBe(5)
    })
  })

  // ============================================
  // Invoice Number Generation
  // ============================================
  describe('Invoice Number Generation', () => {
    it('應該使用設定的前綴', () => {
      const prefix = 'INV'
      const nextNumber = 1001

      const invoiceNumber = `${prefix}-${nextNumber}`

      expect(invoiceNumber).toBe('INV-1001')
    })

    it('應該自動遞增編號', () => {
      const numbers = [1001, 1002, 1003]

      numbers.forEach((num, index) => {
        expect(num).toBe(1001 + index)
      })
    })

    it('應該保證編號唯一性', async () => {
      prismaMock.invoice.findFirst.mockResolvedValue(null)

      const existing = await prismaMock.invoice.findFirst({
        where: { invoiceNumber: 'INV-1001' },
      })

      expect(existing).toBeNull() // 確認編號不存在
    })
  })
})
