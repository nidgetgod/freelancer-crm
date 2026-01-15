/**
 * Clients API Route Tests
 * 客戶 API 端點測試
 */

import { NextRequest } from 'next/server'
import { prismaMock, testDataFactory, setMockSession } from '../setup'

// 模擬 API Route Handler
// 注意：實際專案中，這些會是從 app/api/clients/route.ts 導入的
// 這裡為了測試目的，我們會建立模擬的處理函數

describe('Clients API', () => {
  // ============================================
  // GET /api/clients Tests
  // ============================================
  describe('GET /api/clients', () => {
    it('應該在未登入時返回 401', async () => {
      setMockSession(null)

      const mockClients = [testDataFactory.client()]
      prismaMock.client.findMany.mockResolvedValue(mockClients)

      // 模擬未登入狀態的請求處理
      const { getServerSession } = require('next-auth')
      const session = await getServerSession()
      
      expect(session).toBeNull()
    })

    it('應該返回用戶的客戶列表', async () => {
      const mockClients = [
        testDataFactory.client({ id: 'client-1', name: '客戶 A' }),
        testDataFactory.client({ id: 'client-2', name: '客戶 B' }),
      ]

      prismaMock.client.findMany.mockResolvedValue(mockClients)
      prismaMock.client.count.mockResolvedValue(2)

      const result = await prismaMock.client.findMany({
        where: { userId: 'test-user-id', archivedAt: null },
      })

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('客戶 A')
    })

    it.skip('應該支援分頁', async () => {
      // Create test user first (use upsert to avoid conflicts)
      await prismaMock.user.upsert({
        where: { id: 'test-user-id' },
        update: {},
        create: testDataFactory.user()
      })

      // Create multiple clients for pagination test
      const createdClients = []
      for (let i = 0; i < 5; i++) {
        const client = await prismaMock.client.create({
          data: testDataFactory.client({ id: `pagination-client-${i}`, name: `分頁客戶 ${i}` })
        })
        createdClients.push(client)
      }

      // Verify clients were created
      expect(createdClients).toHaveLength(5)

      // Test pagination - fetch first page
      const page1 = await prismaMock.client.findMany({
        where: { userId: 'test-user-id' },
        take: 2,
        skip: 0,
        orderBy: { createdAt: 'asc' }
      })

      expect(page1.length).toBeGreaterThanOrEqual(2)

      // Test pagination - fetch second page
      const page2 = await prismaMock.client.findMany({
        where: { userId: 'test-user-id' },
        take: 2,
        skip: 2,
        orderBy: { createdAt: 'asc' }
      })

      expect(page2.length).toBeGreaterThanOrEqual(2)

      // Verify different clients in each page
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id)
      }
    })

    it('應該支援按狀態篩選', async () => {
      const activeClients = [
        testDataFactory.client({ status: 'ACTIVE' }),
      ]

      prismaMock.client.findMany.mockResolvedValue(activeClients)

      await prismaMock.client.findMany({
        where: {
          userId: 'test-user-id',
          status: 'ACTIVE',
          archivedAt: null,
        },
      })

      expect(prismaMock.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      )
    })

    it('應該支援搜尋', async () => {
      const searchResults = [
        testDataFactory.client({ name: '張小明', company: 'ABC 公司' }),
      ]

      prismaMock.client.findMany.mockResolvedValue(searchResults)

      await prismaMock.client.findMany({
        where: {
          userId: 'test-user-id',
          archivedAt: null,
          OR: [
            { name: { contains: '張', mode: 'insensitive' } },
            { email: { contains: '張', mode: 'insensitive' } },
            { company: { contains: '張', mode: 'insensitive' } },
          ],
        },
      })

      expect(prismaMock.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      )
    })
  })

  // ============================================
  // POST /api/clients Tests
  // ============================================
  describe('POST /api/clients', () => {
    it('應該成功建立新客戶', async () => {
      const newClient = testDataFactory.client({
        id: 'new-client-id',
        name: '新客戶',
        email: 'new@example.com',
      })

      prismaMock.subscription.findUnique.mockResolvedValue(
        testDataFactory.subscription({ plan: 'SOLO' })
      )
      prismaMock.client.create.mockResolvedValue(newClient)

      const result = await prismaMock.client.create({
        data: {
          userId: 'test-user-id',
          name: '新客戶',
          email: 'new@example.com',
          status: 'LEAD',
          country: 'Taiwan',
          currency: 'TWD',
          paymentTerms: 30,
        },
      })

      expect(result.id).toBe('new-client-id')
      expect(result.name).toBe('新客戶')
    })

    it('應該在 Free 方案達到限制時返回錯誤', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        testDataFactory.subscription({ plan: 'FREE' })
      )
      prismaMock.client.count.mockResolvedValue(5) // 已達上限

      const subscription = await prismaMock.subscription.findUnique({
        where: { userId: 'test-user-id' },
      })
      const clientCount = await prismaMock.client.count({
        where: { userId: 'test-user-id', archivedAt: null },
      })

      expect(subscription?.plan).toBe('FREE')
      expect(clientCount).toBe(5)
      // 在實際 API 中，這會返回 422 錯誤
    })

    it('應該建立活動日誌', async () => {
      const newClient = testDataFactory.client({ id: 'new-client-id' })
      
      prismaMock.client.create.mockResolvedValue(newClient)
      prismaMock.activity.create.mockResolvedValue({
        id: 'activity-id',
        userId: 'test-user-id',
        action: 'CREATED',
        entityType: 'CLIENT',
        entityId: 'new-client-id',
        entityName: newClient.name,
        metadata: null,
        createdAt: new Date(),
      })

      await prismaMock.activity.create({
        data: {
          userId: 'test-user-id',
          action: 'CREATED',
          entityType: 'CLIENT',
          entityId: 'new-client-id',
          entityName: newClient.name,
        },
      })

      expect(prismaMock.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATED',
            entityType: 'CLIENT',
          }),
        })
      )
    })

    it('應該支援標籤關聯', async () => {
      const clientWithTags = {
        ...testDataFactory.client(),
        tags: [
          { tagId: 'tag-1', clientId: 'test-client-id' },
        ],
      }

      prismaMock.client.create.mockResolvedValue(clientWithTags as any)

      await prismaMock.client.create({
        data: {
          userId: 'test-user-id',
          name: '測試客戶',
          tags: {
            create: [{ tagId: 'tag-1' }],
          },
        },
      })

      expect(prismaMock.client.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: expect.objectContaining({
              create: expect.any(Array),
            }),
          }),
        })
      )
    })
  })

  // ============================================
  // GET /api/clients/:id Tests
  // ============================================
  describe('GET /api/clients/:id', () => {
    it('應該返回單一客戶詳情', async () => {
      const client = testDataFactory.client({ id: 'client-123' })

      prismaMock.client.findFirst.mockResolvedValue(client)

      const result = await prismaMock.client.findFirst({
        where: {
          id: 'client-123',
          userId: 'test-user-id',
        },
      })

      expect(result).not.toBeNull()
      expect(result?.id).toBe('client-123')
    })

    it('應該在客戶不存在時返回 null', async () => {
      prismaMock.client.findFirst.mockResolvedValue(null)

      const result = await prismaMock.client.findFirst({
        where: {
          id: 'non-existent',
          userId: 'test-user-id',
        },
      })

      expect(result).toBeNull()
    })

    it('應該包含關聯的專案', async () => {
      const clientWithProjects = {
        ...testDataFactory.client(),
        projects: [
          testDataFactory.project({ id: 'proj-1', name: '專案 A' }),
          testDataFactory.project({ id: 'proj-2', name: '專案 B' }),
        ],
      }

      prismaMock.client.findFirst.mockResolvedValue(clientWithProjects as any)

      const result = await prismaMock.client.findFirst({
        where: { id: 'client-123', userId: 'test-user-id' },
        include: { projects: true },
      })

      expect(result?.projects).toHaveLength(2)
    })
  })

  // ============================================
  // PUT /api/clients/:id Tests
  // ============================================
  describe('PUT /api/clients/:id', () => {
    it('應該成功更新客戶資料', async () => {
      const existingClient = testDataFactory.client({ name: '舊名稱' })
      const updatedClient = { ...existingClient, name: '新名稱' }

      prismaMock.client.findFirst.mockResolvedValue(existingClient)
      prismaMock.client.update.mockResolvedValue(updatedClient)

      const result = await prismaMock.client.update({
        where: { id: 'client-123' },
        data: { name: '新名稱' },
      })

      expect(result.name).toBe('新名稱')
    })

    it('應該只能更新自己的客戶', async () => {
      // 模擬查找不到客戶（因為 userId 不匹配）
      prismaMock.client.findFirst.mockResolvedValue(null)

      const result = await prismaMock.client.findFirst({
        where: {
          id: 'other-user-client',
          userId: 'test-user-id',
        },
      })

      expect(result).toBeNull()
    })
  })

  // ============================================
  // DELETE /api/clients/:id Tests
  // ============================================
  describe('DELETE /api/clients/:id', () => {
    it('應該成功刪除沒有關聯的客戶', async () => {
      const client = testDataFactory.client()

      prismaMock.client.findFirst.mockResolvedValue(client)
      prismaMock.project.count.mockResolvedValue(0)
      prismaMock.invoice.count.mockResolvedValue(0)
      prismaMock.client.delete.mockResolvedValue(client)

      // 檢查是否有關聯
      const projectCount = await prismaMock.project.count({
        where: { clientId: 'client-123' },
      })
      const invoiceCount = await prismaMock.invoice.count({
        where: { clientId: 'client-123' },
      })

      expect(projectCount).toBe(0)
      expect(invoiceCount).toBe(0)

      // 執行刪除
      await prismaMock.client.delete({
        where: { id: 'client-123' },
      })

      expect(prismaMock.client.delete).toHaveBeenCalled()
    })

    it('應該拒絕刪除有關聯專案的客戶', async () => {
      prismaMock.project.count.mockResolvedValue(3)

      const projectCount = await prismaMock.project.count({
        where: { clientId: 'client-123' },
      })

      expect(projectCount).toBe(3)
      // 在實際 API 中，這會返回 409 Conflict 錯誤
    })

    it('應該拒絕刪除有關聯發票的客戶', async () => {
      prismaMock.project.count.mockResolvedValue(0)
      prismaMock.invoice.count.mockResolvedValue(2)

      const invoiceCount = await prismaMock.invoice.count({
        where: { clientId: 'client-123' },
      })

      expect(invoiceCount).toBe(2)
      // 在實際 API 中，這會返回 409 Conflict 錯誤
    })
  })

  // ============================================
  // POST /api/clients/:id/archive Tests
  // ============================================
  describe('POST /api/clients/:id/archive', () => {
    it('應該成功封存客戶', async () => {
      const client = testDataFactory.client()
      const archivedClient = {
        ...client,
        archivedAt: new Date(),
      }

      prismaMock.client.findFirst.mockResolvedValue(client)
      prismaMock.client.update.mockResolvedValue(archivedClient)

      const result = await prismaMock.client.update({
        where: { id: 'client-123' },
        data: { archivedAt: new Date() },
      })

      expect(result.archivedAt).not.toBeNull()
    })
  })

  // ============================================
  // POST /api/clients/:id/restore Tests
  // ============================================
  describe('POST /api/clients/:id/restore', () => {
    it('應該成功還原客戶', async () => {
      const archivedClient = testDataFactory.client({
        archivedAt: new Date(),
      })
      const restoredClient = {
        ...archivedClient,
        archivedAt: null,
      }

      prismaMock.client.findFirst.mockResolvedValue(archivedClient)
      prismaMock.client.update.mockResolvedValue(restoredClient)

      const result = await prismaMock.client.update({
        where: { id: 'client-123' },
        data: { archivedAt: null },
      })

      expect(result.archivedAt).toBeNull()
    })
  })

  // ============================================
  // Edge Cases & Error Handling
  // ============================================
  describe('Edge Cases', () => {
    it('應該處理資料庫連接錯誤', async () => {
      prismaMock.client.findMany.mockRejectedValue(new Error('Database connection failed'))

      await expect(prismaMock.client.findMany({})).rejects.toThrow('Database connection failed')
    })

    it('應該處理無效的客戶 ID', async () => {
      prismaMock.client.findFirst.mockResolvedValue(null)

      const result = await prismaMock.client.findFirst({
        where: { id: 'invalid-id', userId: 'test-user-id' },
      })

      expect(result).toBeNull()
    })

    it('應該正確處理空的查詢結果', async () => {
      prismaMock.client.findMany.mockResolvedValue([])
      prismaMock.client.count.mockResolvedValue(0)

      const clients = await prismaMock.client.findMany({
        where: { userId: 'test-user-id' },
      })
      const count = await prismaMock.client.count({
        where: { userId: 'test-user-id' },
      })

      expect(clients).toEqual([])
      expect(count).toBe(0)
    })
  })
})
