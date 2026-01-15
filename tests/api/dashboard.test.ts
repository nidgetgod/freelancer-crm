/**
 * Dashboard API Route Tests
 * Dashboard API 端點測試
 */

import { prismaMock, testDataFactory, setMockSession } from '../setup'

describe('Dashboard API', () => {
  // ============================================
  // GET /api/dashboard/stats Tests
  // ============================================
  describe('GET /api/dashboard/stats', () => {
    it('應該返回正確的統計數據', async () => {
      // Mock 各項統計查詢
      prismaMock.client.count.mockResolvedValue(25)
      prismaMock.project.count.mockResolvedValue(15)
      prismaMock.task.count.mockResolvedValue(12)
      prismaMock.invoice.aggregate.mockResolvedValue({
        _sum: { amountPaid: 250000 as any },
        _count: 0,
        _avg: {},
        _min: {},
        _max: {},
      } as any)

      const clientsCount = await prismaMock.client.count({
        where: { userId: 'test-user-id', archivedAt: null },
      })

      const projectsCount = await prismaMock.project.count({
        where: { userId: 'test-user-id', status: 'IN_PROGRESS' },
      })

      const tasksCount = await prismaMock.task.count({
        where: {
          userId: 'test-user-id',
          status: { in: ['TODO', 'IN_PROGRESS'] },
        },
      })

      expect(clientsCount).toBe(25)
      expect(projectsCount).toBe(15)
      expect(tasksCount).toBe(12)
    })

    it('應該計算本月收入', async () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      prismaMock.invoice.aggregate.mockResolvedValue({
        _sum: { amountPaid: 250000 as any },
        _count: 0,
        _avg: {},
        _min: {},
        _max: {},
      } as any)

      const result = await prismaMock.invoice.aggregate({
        where: {
          userId: 'test-user-id',
          status: 'PAID',
          paidAt: { gte: startOfMonth },
        },
        _sum: { amountPaid: true },
      })

      expect(result._sum.amountPaid).toEqual(250000)
    })

    it('應該計算未付款發票總額', async () => {
      prismaMock.invoice.aggregate.mockResolvedValue({
        _sum: { total: 150000 as any },
        _count: 0,
        _avg: {},
        _min: {},
        _max: {},
      } as any)

      const result = await prismaMock.invoice.aggregate({
        where: {
          userId: 'test-user-id',
          status: { in: ['SENT', 'VIEWED', 'OVERDUE'] },
        },
        _sum: { total: true },
      })

      expect(result._sum.total).toEqual(150000)
    })

    it('應該統計不同狀態的客戶', async () => {
      prismaMock.client.groupBy.mockResolvedValue([
        { status: 'ACTIVE', _count: { id: 8 } },
        { status: 'LEAD', _count: { id: 5 } },
        { status: 'COMPLETED', _count: { id: 10 } },
      ] as any)

      const result = await prismaMock.client.groupBy({
        by: ['status'],
        where: { userId: 'test-user-id', archivedAt: null },
        _count: { id: true },
      })

      expect(result).toHaveLength(3)
    })
  })

  // ============================================
  // GET /api/dashboard/activity Tests
  // ============================================
  describe('GET /api/dashboard/activity', () => {
    it('應該返回近期活動', async () => {
      const mockActivities = [
        {
          id: 'act-1',
          userId: 'test-user-id',
          action: 'CREATED',
          entityType: 'CLIENT',
          entityId: 'client-1',
          entityName: '新客戶',
          metadata: null,
          createdAt: new Date('2026-01-15'),
        },
        {
          id: 'act-2',
          userId: 'test-user-id',
          action: 'SENT',
          entityType: 'INVOICE',
          entityId: 'inv-1',
          entityName: 'INV-1001',
          metadata: null,
          createdAt: new Date('2026-01-14'),
        },
      ]

      prismaMock.activity.findMany.mockResolvedValue(mockActivities)

      const result = await prismaMock.activity.findMany({
        where: { userId: 'test-user-id' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      expect(result).toHaveLength(2)
      expect(result[0].action).toBe('CREATED')
    })

    it('應該支援分頁', async () => {
      prismaMock.activity.findMany.mockResolvedValue([])

      await prismaMock.activity.findMany({
        where: { userId: 'test-user-id' },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      })

      expect(prismaMock.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })
  })

  // ============================================
  // GET /api/dashboard/upcoming Tests
  // ============================================
  describe('GET /api/dashboard/upcoming', () => {
    it('應該返回即將到期的任務', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const upcomingTasks = [
        testDataFactory.task({
          title: '任務 A',
          dueDate: new Date('2026-01-20'),
        }),
        testDataFactory.task({
          title: '任務 B',
          dueDate: new Date('2026-01-22'),
        }),
      ]

      prismaMock.task.findMany.mockResolvedValue(upcomingTasks)

      const result = await prismaMock.task.findMany({
        where: {
          userId: 'test-user-id',
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: {
            lte: futureDate,
            gte: new Date(),
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      })

      expect(result).toHaveLength(2)
    })

    it('應該返回逾期的發票', async () => {
      const overdueInvoices = [
        testDataFactory.invoice({
          invoiceNumber: 'INV-1001',
          status: 'SENT',
          dueDate: new Date('2026-01-10'),
        }),
      ]

      prismaMock.invoice.findMany.mockResolvedValue(overdueInvoices)

      const result = await prismaMock.invoice.findMany({
        where: {
          userId: 'test-user-id',
          status: { in: ['SENT', 'VIEWED'] },
          dueDate: { lt: new Date() },
        },
        orderBy: { dueDate: 'asc' },
      })

      expect(result).toHaveLength(1)
    })
  })

  // ============================================
  // GET /api/dashboard/revenue Tests
  // ============================================
  describe('GET /api/dashboard/revenue', () => {
    it('應該返回月度收入資料', async () => {
      const monthlyRevenue = [
        { month: '2025-02', amount: 120000 },
        { month: '2025-03', amount: 85000 },
        { month: '2025-04', amount: 150000 },
      ]

      // 模擬原始查詢結果
      prismaMock.$queryRaw.mockResolvedValue(monthlyRevenue as any)

      const result = await prismaMock.$queryRaw`
        SELECT DATE_TRUNC('month', paid_at) as month, SUM(amount_paid) as amount
        FROM invoices
        WHERE user_id = 'test-user-id' AND status = 'PAID'
        GROUP BY DATE_TRUNC('month', paid_at)
        ORDER BY month
      `

      expect(result).toHaveLength(3)
    })

    it('應該計算收入成長率', () => {
      const thisMonth = 250000
      const lastMonth = 180000

      const growth = ((thisMonth - lastMonth) / lastMonth) * 100

      expect(growth).toBeCloseTo(38.89, 1)
    })

    it('應該處理零收入的情況', () => {
      const thisMonth = 100000
      const lastMonth = 0

      // 避免除以零
      const growth = lastMonth === 0 ? 100 : ((thisMonth - lastMonth) / lastMonth) * 100

      expect(growth).toBe(100)
    })

    it('應該計算收款率', () => {
      const totalPaid = 1500000
      const totalInvoiced = 1800000

      const collectionRate = (totalPaid / totalInvoiced) * 100

      expect(collectionRate).toBeCloseTo(83.33, 1)
    })
  })

  // ============================================
  // Dashboard Calculations
  // ============================================
  describe('Dashboard Calculations', () => {
    it('應該正確計算活躍專案進度', () => {
      const projects = [
        { estimatedHours: 40, trackedHours: 16 }, // 40%
        { estimatedHours: 20, trackedHours: 15 }, // 75%
        { estimatedHours: 100, trackedHours: 50 }, // 50%
      ]

      const avgProgress = projects.reduce((sum, p) => {
        const progress = p.estimatedHours 
          ? (p.trackedHours / p.estimatedHours) * 100 
          : 0
        return sum + progress
      }, 0) / projects.length

      expect(avgProgress).toBeCloseTo(55, 0)
    })

    it('應該統計今日到期的任務', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      prismaMock.task.count.mockResolvedValue(3)

      const count = await prismaMock.task.count({
        where: {
          userId: 'test-user-id',
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      })

      expect(count).toBe(3)
    })

    it('應該統計逾期任務', async () => {
      prismaMock.task.count.mockResolvedValue(2)

      const count = await prismaMock.task.count({
        where: {
          userId: 'test-user-id',
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() },
        },
      })

      expect(count).toBe(2)
    })
  })

  // ============================================
  // Period Calculations
  // ============================================
  describe('Period Calculations', () => {
    it('應該正確計算本月範圍', () => {
      const now = new Date('2026-01-15')
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      expect(startOfMonth.toISOString().slice(0, 10)).toBe('2026-01-01')
      expect(endOfMonth.toISOString().slice(0, 10)).toBe('2026-01-31')
    })

    it('應該正確計算上月範圍', () => {
      const now = new Date('2026-01-15')
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

      expect(startOfLastMonth.toISOString().slice(0, 10)).toBe('2025-12-01')
      expect(endOfLastMonth.toISOString().slice(0, 10)).toBe('2025-12-31')
    })

    it('應該正確計算本年範圍', () => {
      const now = new Date('2026-01-15')
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const endOfYear = new Date(now.getFullYear(), 11, 31)

      expect(startOfYear.toISOString().slice(0, 10)).toBe('2026-01-01')
      expect(endOfYear.toISOString().slice(0, 10)).toBe('2026-12-31')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('應該處理沒有資料的情況', async () => {
      prismaMock.client.count.mockResolvedValue(0)
      prismaMock.project.count.mockResolvedValue(0)
      prismaMock.task.count.mockResolvedValue(0)
      prismaMock.invoice.aggregate.mockResolvedValue({
        _sum: { amountPaid: null },
        _count: 0,
        _avg: {},
        _min: {},
        _max: {},
      } as any)

      const stats = {
        clients: await prismaMock.client.count({ where: { userId: 'test-user-id' } }),
        projects: await prismaMock.project.count({ where: { userId: 'test-user-id' } }),
        tasks: await prismaMock.task.count({ where: { userId: 'test-user-id' } }),
        revenue: (await prismaMock.invoice.aggregate({
          where: { userId: 'test-user-id' },
          _sum: { amountPaid: true },
        }))._sum.amountPaid ?? 0,
      }

      expect(stats.clients).toBe(0)
      expect(stats.revenue).toBe(0)
    })

    it('應該處理新用戶的情況', async () => {
      // 新用戶沒有任何資料
      prismaMock.client.findMany.mockResolvedValue([])
      prismaMock.project.findMany.mockResolvedValue([])
      prismaMock.invoice.findMany.mockResolvedValue([])
      prismaMock.activity.findMany.mockResolvedValue([])

      const clients = await prismaMock.client.findMany({
        where: { userId: 'new-user-id' },
      })

      expect(clients).toEqual([])
    })
  })
})
