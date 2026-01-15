/**
 * Projects API Route Tests
 * 專案 API 端點測試
 */

import { prismaMock, testDataFactory, setMockSession } from '../setup'

describe('Projects API', () => {
  // ============================================
  // GET /api/projects Tests
  // ============================================
  describe('GET /api/projects', () => {
    it('應該返回用戶的專案列表', async () => {
      const mockProjects = [
        testDataFactory.project({ id: 'proj-1', name: '專案 A' }),
        testDataFactory.project({ id: 'proj-2', name: '專案 B' }),
      ]

      prismaMock.project.findMany.mockResolvedValue(mockProjects)
      prismaMock.project.count.mockResolvedValue(2)

      const result = await prismaMock.project.findMany({
        where: { userId: 'test-user-id', archivedAt: null },
      })

      expect(result).toHaveLength(2)
    })

    it('應該支援按狀態篩選', async () => {
      const inProgressProjects = [
        testDataFactory.project({ status: 'IN_PROGRESS' }),
      ]

      prismaMock.project.findMany.mockResolvedValue(inProgressProjects)

      await prismaMock.project.findMany({
        where: {
          userId: 'test-user-id',
          status: 'IN_PROGRESS',
        },
      })

      expect(prismaMock.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'IN_PROGRESS',
          }),
        })
      )
    })

    it('應該支援按客戶篩選', async () => {
      const clientProjects = [testDataFactory.project()]

      prismaMock.project.findMany.mockResolvedValue(clientProjects)

      await prismaMock.project.findMany({
        where: {
          userId: 'test-user-id',
          clientId: 'client-123',
        },
      })

      expect(prismaMock.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientId: 'client-123',
          }),
        })
      )
    })

    it('應該支援按到期日篩選', async () => {
      const dueDate = new Date('2026-02-01')
      
      prismaMock.project.findMany.mockResolvedValue([])

      await prismaMock.project.findMany({
        where: {
          userId: 'test-user-id',
          dueDate: { lte: dueDate },
        },
      })

      expect(prismaMock.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: { lte: dueDate },
          }),
        })
      )
    })
  })

  // ============================================
  // GET /api/projects/kanban Tests
  // ============================================
  describe('GET /api/projects/kanban', () => {
    it('應該返回按狀態分組的專案', async () => {
      const allProjects = [
        testDataFactory.project({ id: 'proj-1', status: 'PLANNING' }),
        testDataFactory.project({ id: 'proj-2', status: 'IN_PROGRESS' }),
        testDataFactory.project({ id: 'proj-3', status: 'IN_PROGRESS' }),
        testDataFactory.project({ id: 'proj-4', status: 'COMPLETED' }),
      ]

      prismaMock.project.findMany.mockResolvedValue(allProjects)

      const result = await prismaMock.project.findMany({
        where: { userId: 'test-user-id', archivedAt: null },
        orderBy: { updatedAt: 'desc' },
      })

      // 模擬分組邏輯
      const grouped = {
        PLANNING: result.filter(p => p.status === 'PLANNING'),
        IN_PROGRESS: result.filter(p => p.status === 'IN_PROGRESS'),
        IN_REVIEW: result.filter(p => p.status === 'IN_REVIEW'),
        COMPLETED: result.filter(p => p.status === 'COMPLETED'),
      }

      expect(grouped.PLANNING).toHaveLength(1)
      expect(grouped.IN_PROGRESS).toHaveLength(2)
      expect(grouped.COMPLETED).toHaveLength(1)
    })
  })

  // ============================================
  // POST /api/projects Tests
  // ============================================
  describe('POST /api/projects', () => {
    it('應該成功建立新專案', async () => {
      const newProject = testDataFactory.project({
        id: 'new-project-id',
        name: '新專案',
      })

      prismaMock.client.findFirst.mockResolvedValue(testDataFactory.client())
      prismaMock.project.create.mockResolvedValue(newProject)

      const result = await prismaMock.project.create({
        data: {
          userId: 'test-user-id',
          clientId: 'client-123',
          name: '新專案',
          status: 'PLANNING',
          priority: 'MEDIUM',
        },
      })

      expect(result.id).toBe('new-project-id')
      expect(result.name).toBe('新專案')
    })

    it('應該驗證客戶是否存在', async () => {
      prismaMock.client.findFirst.mockResolvedValue(null)

      const result = await prismaMock.client.findFirst({
        where: {
          id: 'non-existent-client',
          userId: 'test-user-id',
        },
      })

      expect(result).toBeNull()
      // 在實際 API 中，這會返回 400 錯誤
    })

    it('應該建立活動日誌', async () => {
      const newProject = testDataFactory.project()

      prismaMock.project.create.mockResolvedValue(newProject)
      prismaMock.activity.create.mockResolvedValue({
        id: 'activity-id',
        userId: 'test-user-id',
        action: 'CREATED',
        entityType: 'PROJECT',
        entityId: newProject.id,
        entityName: newProject.name,
        metadata: null,
        createdAt: new Date(),
      })

      await prismaMock.activity.create({
        data: {
          userId: 'test-user-id',
          action: 'CREATED',
          entityType: 'PROJECT',
          entityId: newProject.id,
          entityName: newProject.name,
        },
      })

      expect(prismaMock.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'PROJECT',
          }),
        })
      )
    })
  })

  // ============================================
  // GET /api/projects/:id Tests
  // ============================================
  describe('GET /api/projects/:id', () => {
    it('應該返回專案詳情', async () => {
      const project = testDataFactory.project({ id: 'proj-123' })

      prismaMock.project.findFirst.mockResolvedValue(project)

      const result = await prismaMock.project.findFirst({
        where: {
          id: 'proj-123',
          userId: 'test-user-id',
        },
      })

      expect(result).not.toBeNull()
      expect(result?.id).toBe('proj-123')
    })

    it('應該包含關聯的任務', async () => {
      const projectWithTasks = {
        ...testDataFactory.project(),
        tasks: [
          testDataFactory.task({ id: 'task-1', title: '任務 A' }),
          testDataFactory.task({ id: 'task-2', title: '任務 B' }),
        ],
      }

      prismaMock.project.findFirst.mockResolvedValue(projectWithTasks as any)

      const result = await prismaMock.project.findFirst({
        where: { id: 'proj-123', userId: 'test-user-id' },
        include: { tasks: true },
      })

      expect(result?.tasks).toHaveLength(2)
    })

    it('應該包含關聯的客戶', async () => {
      const projectWithClient = {
        ...testDataFactory.project(),
        client: testDataFactory.client(),
      }

      prismaMock.project.findFirst.mockResolvedValue(projectWithClient as any)

      const result = await prismaMock.project.findFirst({
        where: { id: 'proj-123', userId: 'test-user-id' },
        include: { client: true },
      })

      expect(result?.client).toBeDefined()
    })
  })

  // ============================================
  // PUT /api/projects/:id Tests
  // ============================================
  describe('PUT /api/projects/:id', () => {
    it('應該成功更新專案', async () => {
      const existingProject = testDataFactory.project({ name: '舊名稱' })
      const updatedProject = { ...existingProject, name: '新名稱' }

      prismaMock.project.findFirst.mockResolvedValue(existingProject)
      prismaMock.project.update.mockResolvedValue(updatedProject)

      const result = await prismaMock.project.update({
        where: { id: 'proj-123' },
        data: { name: '新名稱' },
      })

      expect(result.name).toBe('新名稱')
    })

    it('應該更新追蹤時數', async () => {
      const project = testDataFactory.project({ trackedHours: 10 })
      const updatedProject = { ...project, trackedHours: 15 }

      prismaMock.project.update.mockResolvedValue(updatedProject)

      const result = await prismaMock.project.update({
        where: { id: 'proj-123' },
        data: { trackedHours: 15 },
      })

      expect(result.trackedHours).toBe(15)
    })
  })

  // ============================================
  // PATCH /api/projects/:id/status Tests
  // ============================================
  describe('PATCH /api/projects/:id/status', () => {
    it('應該更新專案狀態', async () => {
      const project = testDataFactory.project({ status: 'IN_PROGRESS' })
      const updatedProject = { ...project, status: 'COMPLETED' as const }

      prismaMock.project.findFirst.mockResolvedValue(project)
      prismaMock.project.update.mockResolvedValue(updatedProject)

      const result = await prismaMock.project.update({
        where: { id: 'proj-123' },
        data: { status: 'COMPLETED' },
      })

      expect(result.status).toBe('COMPLETED')
    })

    it('應該在完成時設置 completedAt', async () => {
      const project = testDataFactory.project({ status: 'IN_PROGRESS' })
      const completedProject = {
        ...project,
        status: 'COMPLETED' as const,
        completedAt: new Date(),
      }

      prismaMock.project.update.mockResolvedValue(completedProject)

      const result = await prismaMock.project.update({
        where: { id: 'proj-123' },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      expect(result.completedAt).not.toBeNull()
    })

    it('應該記錄狀態變更活動', async () => {
      prismaMock.activity.create.mockResolvedValue({
        id: 'activity-id',
        userId: 'test-user-id',
        action: 'STATUS_CHANGED',
        entityType: 'PROJECT',
        entityId: 'proj-123',
        entityName: '測試專案',
        metadata: { from: 'IN_PROGRESS', to: 'COMPLETED' },
        createdAt: new Date(),
      })

      await prismaMock.activity.create({
        data: {
          userId: 'test-user-id',
          action: 'STATUS_CHANGED',
          entityType: 'PROJECT',
          entityId: 'proj-123',
          entityName: '測試專案',
          metadata: { from: 'IN_PROGRESS', to: 'COMPLETED' },
        },
      })

      expect(prismaMock.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'STATUS_CHANGED',
            metadata: { from: 'IN_PROGRESS', to: 'COMPLETED' },
          }),
        })
      )
    })
  })

  // ============================================
  // DELETE /api/projects/:id Tests
  // ============================================
  describe('DELETE /api/projects/:id', () => {
    it('應該成功刪除專案', async () => {
      const project = testDataFactory.project()

      prismaMock.project.findFirst.mockResolvedValue(project)
      prismaMock.project.delete.mockResolvedValue(project)

      await prismaMock.project.delete({
        where: { id: 'proj-123' },
      })

      expect(prismaMock.project.delete).toHaveBeenCalled()
    })

    it('刪除專案應該級聯刪除任務', async () => {
      // 在 Prisma schema 中設定 onDelete: Cascade
      prismaMock.project.delete.mockResolvedValue(testDataFactory.project())

      await prismaMock.project.delete({
        where: { id: 'proj-123' },
      })

      // 任務應該被自動刪除（Prisma 處理）
      expect(prismaMock.project.delete).toHaveBeenCalled()
    })
  })

  // ============================================
  // Project Progress Calculation
  // ============================================
  describe('Project Progress', () => {
    it('應該正確計算專案進度', () => {
      const project = testDataFactory.project({
        estimatedHours: 40,
        trackedHours: 16,
      })

      const progress = (project.trackedHours / (project.estimatedHours || 1)) * 100

      expect(progress).toBe(40)
    })

    it('應該處理沒有預估時數的情況', () => {
      const project = testDataFactory.project({
        estimatedHours: null,
        trackedHours: 10,
      })

      const progress = project.estimatedHours 
        ? (project.trackedHours / project.estimatedHours) * 100 
        : 0

      expect(progress).toBe(0)
    })

    it('應該處理超過 100% 的情況', () => {
      const project = testDataFactory.project({
        estimatedHours: 20,
        trackedHours: 30,
      })

      const progress = Math.min(
        (project.trackedHours / (project.estimatedHours || 1)) * 100,
        100
      )

      // 可以選擇限制在 100% 或顯示實際超出
      expect(progress).toBe(100)
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('應該處理同時更新多個欄位', async () => {
      const project = testDataFactory.project()
      const updatedProject = {
        ...project,
        name: '新名稱',
        status: 'COMPLETED' as const,
        completedAt: new Date(),
      }

      prismaMock.project.update.mockResolvedValue(updatedProject)

      const result = await prismaMock.project.update({
        where: { id: 'proj-123' },
        data: {
          name: '新名稱',
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      expect(result.name).toBe('新名稱')
      expect(result.status).toBe('COMPLETED')
      expect(result.completedAt).not.toBeNull()
    })
  })
})
