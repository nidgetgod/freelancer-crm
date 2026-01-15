/**
 * Project Validation Schema Tests
 * 專案資料驗證規則測試
 */

import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  projectQuerySchema,
  ProjectStatus,
  Priority,
} from '@/lib/validations/project'

describe('Project Validation Schemas', () => {
  // ============================================
  // createProjectSchema Tests
  // ============================================
  describe('createProjectSchema', () => {
    describe('必填欄位', () => {
      it('應該要求 clientId', () => {
        const result = createProjectSchema.safeParse({
          name: '測試專案',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          const clientIdError = result.error.errors.find(e => e.path.includes('clientId'))
          expect(clientIdError).toBeDefined()
        }
      })

      it('應該要求 name', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
        })
        expect(result.success).toBe(false)
      })

      it('應該接受最小必要資料', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
        })
        expect(result.success).toBe(true)
      })
    })

    describe('name 欄位', () => {
      it('應該拒絕空的專案名稱', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '',
        })
        expect(result.success).toBe(false)
      })

      it('應該拒絕超過 200 字的專案名稱', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: 'a'.repeat(201),
        })
        expect(result.success).toBe(false)
      })
    })

    describe('status 欄位', () => {
      it('應該預設為 PLANNING', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe('PLANNING')
        }
      })

      it('應該接受所有有效的狀態', () => {
        const validStatuses = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']
        
        validStatuses.forEach((status) => {
          const result = createProjectSchema.safeParse({
            clientId: 'client-123',
            name: '測試專案',
            status,
          })
          expect(result.success).toBe(true)
        })
      })
    })

    describe('priority 欄位', () => {
      it('應該預設為 MEDIUM', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.priority).toBe('MEDIUM')
        }
      })

      it('應該接受所有有效的優先級', () => {
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
        
        validPriorities.forEach((priority) => {
          const result = createProjectSchema.safeParse({
            clientId: 'client-123',
            name: '測試專案',
            priority,
          })
          expect(result.success).toBe(true)
        })
      })
    })

    describe('日期欄位', () => {
      it('應該接受有效的日期', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
          startDate: '2026-01-01',
          dueDate: '2026-02-28',
        })
        expect(result.success).toBe(true)
      })

      it('應該拒絕開始日期晚於結束日期', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
          startDate: '2026-03-01',
          dueDate: '2026-02-01',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          const dateError = result.error.errors.find(e => e.path.includes('dueDate'))
          expect(dateError?.message).toBe('開始日期不能晚於結束日期')
        }
      })

      it('應該接受相同的開始和結束日期', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
          startDate: '2026-01-15',
          dueDate: '2026-01-15',
        })
        expect(result.success).toBe(true)
      })

      it('應該接受只有 startDate 沒有 dueDate', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
          startDate: '2026-01-01',
        })
        expect(result.success).toBe(true)
      })
    })

    describe('budget 欄位', () => {
      it('應該接受有效的預算', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
          budget: 100000,
        })
        expect(result.success).toBe(true)
      })

      it('應該接受 0 預算', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
          budget: 0,
        })
        expect(result.success).toBe(true)
      })

      it('應該拒絕負數預算', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
          budget: -1000,
        })
        expect(result.success).toBe(false)
      })
    })

    describe('hourlyRate 欄位', () => {
      it('應該接受有效的時薪', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
          hourlyRate: 2000,
        })
        expect(result.success).toBe(true)
      })

      it('應該拒絕負數時薪', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
          hourlyRate: -100,
        })
        expect(result.success).toBe(false)
      })
    })

    describe('estimatedHours 欄位', () => {
      it('應該接受有效的預估時數', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
          estimatedHours: 40,
        })
        expect(result.success).toBe(true)
      })

      it('應該接受小數時數', () => {
        const result = createProjectSchema.safeParse({
          clientId: 'client-123',
          name: '測試專案',
          estimatedHours: 10.5,
        })
        expect(result.success).toBe(true)
      })
    })

    describe('完整資料驗證', () => {
      it('應該接受完整有效的專案資料', () => {
        const validProject = {
          clientId: 'client-123',
          name: '企業官網改版',
          description: '重新設計公司官網，包含 RWD 響應式設計',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          startDate: '2026-01-01',
          dueDate: '2026-02-28',
          budget: 150000,
          currency: 'TWD',
          hourlyRate: 2000,
          estimatedHours: 80,
          tagIds: ['tag1', 'tag2'],
        }

        const result = createProjectSchema.safeParse(validProject)
        expect(result.success).toBe(true)
      })
    })
  })

  // ============================================
  // updateProjectSchema Tests
  // ============================================
  describe('updateProjectSchema', () => {
    it('應該允許所有欄位為可選', () => {
      const result = updateProjectSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('應該不包含 clientId', () => {
      const result = updateProjectSchema.safeParse({
        clientId: 'new-client-id',
        name: '新專案名稱',
      })
      // clientId 應該被忽略
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('clientId')
      }
    })

    it('應該允許只更新狀態', () => {
      const result = updateProjectSchema.safeParse({
        status: 'COMPLETED',
      })
      expect(result.success).toBe(true)
    })
  })

  // ============================================
  // updateProjectStatusSchema Tests
  // ============================================
  describe('updateProjectStatusSchema', () => {
    it('應該要求 status 欄位', () => {
      const result = updateProjectStatusSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('應該接受有效的狀態', () => {
      const result = updateProjectStatusSchema.safeParse({
        status: 'COMPLETED',
      })
      expect(result.success).toBe(true)
    })

    it('應該拒絕無效的狀態', () => {
      const result = updateProjectStatusSchema.safeParse({
        status: 'INVALID',
      })
      expect(result.success).toBe(false)
    })
  })

  // ============================================
  // projectQuerySchema Tests
  // ============================================
  describe('projectQuerySchema', () => {
    it('應該有正確的預設值', () => {
      const result = projectQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
        expect(result.data.sortBy).toBe('createdAt')
        expect(result.data.sortOrder).toBe('desc')
      }
    })

    it('應該接受有效的查詢參數', () => {
      const result = projectQuerySchema.safeParse({
        page: '2',
        limit: '10',
        status: 'IN_PROGRESS',
        clientId: 'client-123',
        priority: 'HIGH',
        search: '官網',
      })
      expect(result.success).toBe(true)
    })

    it('應該接受日期範圍篩選', () => {
      const result = projectQuerySchema.safeParse({
        dueBefore: '2026-03-01',
        dueAfter: '2026-01-01',
      })
      expect(result.success).toBe(true)
    })
  })

  // ============================================
  // Enum Tests
  // ============================================
  describe('ProjectStatus', () => {
    it('應該包含所有預期的狀態', () => {
      const expectedStatuses = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']
      
      expectedStatuses.forEach((status) => {
        const result = ProjectStatus.safeParse(status)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Priority', () => {
    it('應該包含所有預期的優先級', () => {
      const expectedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
      
      expectedPriorities.forEach((priority) => {
        const result = Priority.safeParse(priority)
        expect(result.success).toBe(true)
      })
    })
  })
})
