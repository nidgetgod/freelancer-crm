/**
 * Task Validation Schema Tests
 * 任務資料驗證規則測試
 */

import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  reorderTasksSchema,
  taskQuerySchema,
  TaskStatus,
  Priority,
} from '@/lib/validations/task'

describe('Task Validation Schemas', () => {
  // ============================================
  // createTaskSchema Tests
  // ============================================
  describe('createTaskSchema', () => {
    describe('title 欄位', () => {
      it('應該要求 title', () => {
        const result = createTaskSchema.safeParse({})
        expect(result.success).toBe(false)
      })

      it('應該接受有效的任務標題', () => {
        const result = createTaskSchema.safeParse({
          title: '完成設計稿',
        })
        expect(result.success).toBe(true)
      })

      it('應該拒絕空的任務標題', () => {
        const result = createTaskSchema.safeParse({
          title: '',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('請輸入任務標題')
        }
      })

      it('應該拒絕超過 200 字的任務標題', () => {
        const result = createTaskSchema.safeParse({
          title: 'a'.repeat(201),
        })
        expect(result.success).toBe(false)
      })
    })

    describe('description 欄位', () => {
      it('應該接受有效的描述', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
          description: '這是任務描述',
        })
        expect(result.success).toBe(true)
      })

      it('應該拒絕超過 2000 字的描述', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
          description: 'a'.repeat(2001),
        })
        expect(result.success).toBe(false)
      })

      it('應該接受 null', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
          description: null,
        })
        expect(result.success).toBe(true)
      })
    })

    describe('status 欄位', () => {
      it('應該預設為 TODO', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe('TODO')
        }
      })

      it('應該接受所有有效的狀態', () => {
        const validStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']
        
        validStatuses.forEach((status) => {
          const result = createTaskSchema.safeParse({
            title: '測試任務',
            status,
          })
          expect(result.success).toBe(true)
        })
      })

      it('應該拒絕無效的狀態', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
          status: 'INVALID',
        })
        expect(result.success).toBe(false)
      })
    })

    describe('priority 欄位', () => {
      it('應該預設為 MEDIUM', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.priority).toBe('MEDIUM')
        }
      })
    })

    describe('dueDate 欄位', () => {
      it('應該接受有效的日期', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
          dueDate: '2026-01-15',
        })
        expect(result.success).toBe(true)
      })

      it('應該接受 ISO 日期格式', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
          dueDate: '2026-01-15T10:00:00.000Z',
        })
        expect(result.success).toBe(true)
      })
    })

    describe('estimatedMinutes 欄位', () => {
      it('應該接受有效的預估時間', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
          estimatedMinutes: 120,
        })
        expect(result.success).toBe(true)
      })

      it('應該接受 0', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
          estimatedMinutes: 0,
        })
        expect(result.success).toBe(true)
      })

      it('應該拒絕負數', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
          estimatedMinutes: -10,
        })
        expect(result.success).toBe(false)
      })

      it('應該拒絕小數', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
          estimatedMinutes: 30.5,
        })
        expect(result.success).toBe(false)
      })
    })

    describe('關聯欄位', () => {
      it('應該接受 projectId', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
          projectId: 'project-123',
        })
        expect(result.success).toBe(true)
      })

      it('應該接受 clientId', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
          clientId: 'client-123',
        })
        expect(result.success).toBe(true)
      })

      it('應該接受同時有 projectId 和 clientId', () => {
        const result = createTaskSchema.safeParse({
          title: '測試任務',
          projectId: 'project-123',
          clientId: 'client-123',
        })
        expect(result.success).toBe(true)
      })
    })

    describe('完整資料驗證', () => {
      it('應該接受完整有效的任務資料', () => {
        const validTask = {
          title: '完成首頁設計稿',
          description: '完成首頁 UI 設計並交付 Figma 連結',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          dueDate: '2026-01-15',
          projectId: 'project-123',
          clientId: 'client-123',
          estimatedMinutes: 480,
          reminderAt: '2026-01-14T09:00:00.000Z',
        }

        const result = createTaskSchema.safeParse(validTask)
        expect(result.success).toBe(true)
      })
    })
  })

  // ============================================
  // updateTaskSchema Tests
  // ============================================
  describe('updateTaskSchema', () => {
    it('應該允許所有欄位為可選', () => {
      const result = updateTaskSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('應該允許只更新標題', () => {
      const result = updateTaskSchema.safeParse({
        title: '新標題',
      })
      expect(result.success).toBe(true)
    })

    it('應該保持驗證規則', () => {
      const result = updateTaskSchema.safeParse({
        title: '', // 空標題仍然不允許
      })
      expect(result.success).toBe(false)
    })
  })

  // ============================================
  // updateTaskStatusSchema Tests
  // ============================================
  describe('updateTaskStatusSchema', () => {
    it('應該要求 status', () => {
      const result = updateTaskStatusSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('應該接受 DONE 狀態', () => {
      const result = updateTaskStatusSchema.safeParse({
        status: 'DONE',
      })
      expect(result.success).toBe(true)
    })
  })

  // ============================================
  // reorderTasksSchema Tests
  // ============================================
  describe('reorderTasksSchema', () => {
    it('應該要求至少一個任務', () => {
      const result = reorderTasksSchema.safeParse({
        tasks: [],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('請提供至少一個任務')
      }
    })

    it('應該接受有效的任務排序', () => {
      const result = reorderTasksSchema.safeParse({
        tasks: [
          { id: 'task-1', sortOrder: 0 },
          { id: 'task-2', sortOrder: 1 },
          { id: 'task-3', sortOrder: 2 },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('應該拒絕負數的 sortOrder', () => {
      const result = reorderTasksSchema.safeParse({
        tasks: [
          { id: 'task-1', sortOrder: -1 },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('應該要求每個任務有 id 和 sortOrder', () => {
      const result = reorderTasksSchema.safeParse({
        tasks: [
          { id: 'task-1' }, // 缺少 sortOrder
        ],
      })
      expect(result.success).toBe(false)
    })
  })

  // ============================================
  // taskQuerySchema Tests
  // ============================================
  describe('taskQuerySchema', () => {
    it('應該有正確的預設值', () => {
      const result = taskQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
        expect(result.data.sortBy).toBe('sortOrder')
        expect(result.data.sortOrder).toBe('asc')
      }
    })

    it('應該接受 dueToday 參數', () => {
      const result = taskQuerySchema.safeParse({
        dueToday: 'true',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.dueToday).toBe(true)
      }
    })

    it('應該接受 overdue 參數', () => {
      const result = taskQuerySchema.safeParse({
        overdue: 'true',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.overdue).toBe(true)
      }
    })
  })

  // ============================================
  // Enum Tests
  // ============================================
  describe('TaskStatus', () => {
    it('應該包含所有預期的狀態', () => {
      const expectedStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']
      
      expectedStatuses.forEach((status) => {
        const result = TaskStatus.safeParse(status)
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
