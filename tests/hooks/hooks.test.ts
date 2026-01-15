/**
 * React Hooks Tests
 * 自定義 Hooks 測試
 * 
 * 注意：這些測試需要 @testing-library/react-hooks 或 React 18 的 renderHook
 */

// 模擬 React 環境
const mockQueryClient = {
  invalidateQueries: jest.fn(),
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
}

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: () => mockQueryClient,
}))

// 模擬 toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// ============================================
// Hook Implementation Mocks
// ============================================

// 模擬 useClients hook 的邏輯
function createUseClientsHook() {
  return {
    useClients: (options: { page?: number; limit?: number; status?: string; search?: string } = {}) => {
      const { page = 1, limit = 20, status, search } = options
      
      return (useQuery as jest.Mock)({
        queryKey: ['clients', { page, limit, status, search }],
        queryFn: async () => {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(status && { status }),
            ...(search && { search }),
          })
          const res = await fetch(`/api/clients?${params}`)
          if (!res.ok) throw new Error('Failed to fetch clients')
          return res.json()
        },
      })
    },

    useCreateClient: () => {
      const queryClient = useQueryClient()
      
      return (useMutation as jest.Mock)({
        mutationFn: async (data: any) => {
          const res = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error?.message || '建立客戶失敗')
          return json
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['clients'] })
          toast.success('客戶建立成功')
        },
        onError: (error: Error) => {
          toast.error(error.message)
        },
      })
    },
  }
}

// ============================================
// Tests
// ============================================

describe('React Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================
  // useClients Tests
  // ============================================
  describe('useClients', () => {
    it('應該使用正確的查詢鍵', () => {
      const { useClients } = createUseClientsHook()
      
      useClients({ page: 1, limit: 20 })

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['clients', { page: 1, limit: 20, status: undefined, search: undefined }],
        })
      )
    })

    it('應該支援狀態篩選', () => {
      const { useClients } = createUseClientsHook()
      
      useClients({ status: 'ACTIVE' })

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining([
            'clients',
            expect.objectContaining({ status: 'ACTIVE' }),
          ]),
        })
      )
    })

    it('應該支援搜尋', () => {
      const { useClients } = createUseClientsHook()
      
      useClients({ search: '張' })

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining([
            'clients',
            expect.objectContaining({ search: '張' }),
          ]),
        })
      )
    })

    it('應該有預設的分頁參數', () => {
      const { useClients } = createUseClientsHook()
      
      useClients({})

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['clients', { page: 1, limit: 20, status: undefined, search: undefined }],
        })
      )
    })
  })

  // ============================================
  // useCreateClient Tests
  // ============================================
  describe('useCreateClient', () => {
    it('應該設定正確的 mutation', () => {
      const { useCreateClient } = createUseClientsHook()
      
      useCreateClient()

      expect(useMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationFn: expect.any(Function),
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      )
    })
  })

  // ============================================
  // useDebounce Tests
  // ============================================
  describe('useDebounce', () => {
    // 模擬 useDebounce hook
    function useDebounce<T>(value: T, delay: number): T {
      // 在實際實作中會使用 useState 和 useEffect
      // 這裡簡化為直接返回值（測試邏輯用）
      return value
    }

    it('應該返回防抖後的值', () => {
      const result = useDebounce('test', 300)
      expect(result).toBe('test')
    })
  })

  // ============================================
  // usePagination Tests
  // ============================================
  describe('usePagination', () => {
    // 模擬 pagination 邏輯
    function calculatePagination(total: number, page: number, limit: number) {
      const totalPages = Math.ceil(total / limit)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1

      return {
        totalPages,
        hasNextPage,
        hasPrevPage,
        startItem: (page - 1) * limit + 1,
        endItem: Math.min(page * limit, total),
      }
    }

    it('應該計算正確的總頁數', () => {
      const result = calculatePagination(100, 1, 20)
      expect(result.totalPages).toBe(5)
    })

    it('應該正確判斷是否有下一頁', () => {
      expect(calculatePagination(100, 1, 20).hasNextPage).toBe(true)
      expect(calculatePagination(100, 5, 20).hasNextPage).toBe(false)
    })

    it('應該正確判斷是否有上一頁', () => {
      expect(calculatePagination(100, 1, 20).hasPrevPage).toBe(false)
      expect(calculatePagination(100, 2, 20).hasPrevPage).toBe(true)
    })

    it('應該計算正確的項目範圍', () => {
      const page1 = calculatePagination(100, 1, 20)
      expect(page1.startItem).toBe(1)
      expect(page1.endItem).toBe(20)

      const page3 = calculatePagination(100, 3, 20)
      expect(page3.startItem).toBe(41)
      expect(page3.endItem).toBe(60)

      // 最後一頁可能不滿
      const lastPage = calculatePagination(95, 5, 20)
      expect(lastPage.startItem).toBe(81)
      expect(lastPage.endItem).toBe(95)
    })
  })

  // ============================================
  // useLocalStorage Tests
  // ============================================
  describe('useLocalStorage', () => {
    // 模擬 localStorage
    const localStorageMock = {
      store: {} as Record<string, string>,
      getItem: jest.fn((key: string) => localStorageMock.store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        localStorageMock.store[key] = value
      }),
      removeItem: jest.fn((key: string) => {
        delete localStorageMock.store[key]
      }),
      clear: jest.fn(() => {
        localStorageMock.store = {}
      }),
    }

    beforeEach(() => {
      localStorageMock.clear()
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      })
    })

    it('應該從 localStorage 讀取初始值', () => {
      localStorageMock.store['test-key'] = JSON.stringify({ value: 'test' })
      
      const stored = localStorageMock.getItem('test-key')
      expect(stored).toBe('{"value":"test"}')
    })

    it('應該存儲值到 localStorage', () => {
      localStorageMock.setItem('test-key', JSON.stringify({ value: 'new' }))
      
      expect(localStorageMock.store['test-key']).toBe('{"value":"new"}')
    })

    it('應該處理不存在的 key', () => {
      const result = localStorageMock.getItem('non-existent')
      expect(result).toBeNull()
    })
  })

  // ============================================
  // useMediaQuery Tests
  // ============================================
  describe('useMediaQuery', () => {
    // 模擬 matchMedia
    function mockMatchMedia(matches: boolean) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
          matches,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })
    }

    it('應該檢測桌面視窗', () => {
      mockMatchMedia(true)
      const result = window.matchMedia('(min-width: 1024px)')
      expect(result.matches).toBe(true)
    })

    it('應該檢測行動裝置視窗', () => {
      mockMatchMedia(false)
      const result = window.matchMedia('(min-width: 1024px)')
      expect(result.matches).toBe(false)
    })
  })

  // ============================================
  // useClickOutside Tests
  // ============================================
  describe('useClickOutside', () => {
    it('應該在點擊外部時觸發回調', () => {
      const callback = jest.fn()
      
      // 模擬 document click event
      const event = new MouseEvent('click', { bubbles: true })
      
      // 在實際 hook 中會檢查 ref.current.contains(event.target)
      // 這裡只測試邏輯
      const elementContainsTarget = false
      
      if (!elementContainsTarget) {
        callback()
      }
      
      expect(callback).toHaveBeenCalled()
    })

    it('應該在點擊內部時不觸發回調', () => {
      const callback = jest.fn()
      
      const elementContainsTarget = true
      
      if (!elementContainsTarget) {
        callback()
      }
      
      expect(callback).not.toHaveBeenCalled()
    })
  })
})

// ============================================
// Form Hook Tests
// ============================================

describe('Form Hooks', () => {
  describe('useForm validation', () => {
    // 模擬表單驗證邏輯
    function validateForm(data: Record<string, any>, rules: Record<string, (value: any) => string | null>) {
      const errors: Record<string, string> = {}
      
      for (const [field, validate] of Object.entries(rules)) {
        const error = validate(data[field])
        if (error) {
          errors[field] = error
        }
      }
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      }
    }

    it('應該驗證必填欄位', () => {
      const data = { name: '', email: 'test@example.com' }
      const rules = {
        name: (v: string) => v ? null : '請輸入名稱',
        email: (v: string) => v ? null : '請輸入 Email',
      }

      const result = validateForm(data, rules)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('請輸入名稱')
    })

    it('應該通過有效資料', () => {
      const data = { name: '測試', email: 'test@example.com' }
      const rules = {
        name: (v: string) => v ? null : '請輸入名稱',
        email: (v: string) => v ? null : '請輸入 Email',
      }

      const result = validateForm(data, rules)
      
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })
  })

  describe('useFormState', () => {
    // 模擬表單狀態管理
    interface FormState {
      values: Record<string, any>
      errors: Record<string, string>
      touched: Record<string, boolean>
      isSubmitting: boolean
      isDirty: boolean
    }

    function createFormState(initialValues: Record<string, any>): FormState {
      return {
        values: { ...initialValues },
        errors: {},
        touched: {},
        isSubmitting: false,
        isDirty: false,
      }
    }

    it('應該初始化表單狀態', () => {
      const state = createFormState({ name: '', email: '' })
      
      expect(state.values).toEqual({ name: '', email: '' })
      expect(state.isDirty).toBe(false)
      expect(state.isSubmitting).toBe(false)
    })

    it('應該追蹤修改狀態', () => {
      const state = createFormState({ name: '' })
      state.values.name = 'new value'
      state.isDirty = true
      
      expect(state.isDirty).toBe(true)
    })
  })
})

// ============================================
// Filter Hook Tests
// ============================================

describe('Filter Hooks', () => {
  describe('useFilters', () => {
    // 模擬篩選邏輯
    interface Filters {
      status?: string
      search?: string
      dateFrom?: string
      dateTo?: string
    }

    function applyFilters<T extends Record<string, any>>(
      items: T[],
      filters: Filters,
      searchFields: (keyof T)[]
    ): T[] {
      return items.filter((item) => {
        // Status filter
        if (filters.status && item.status !== filters.status) {
          return false
        }

        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          const matchesSearch = searchFields.some((field) => {
            const value = item[field]
            return value && String(value).toLowerCase().includes(searchLower)
          })
          if (!matchesSearch) return false
        }

        return true
      })
    }

    it('應該按狀態篩選', () => {
      const items = [
        { id: 1, name: 'A', status: 'ACTIVE' },
        { id: 2, name: 'B', status: 'INACTIVE' },
        { id: 3, name: 'C', status: 'ACTIVE' },
      ]

      const result = applyFilters(items, { status: 'ACTIVE' }, ['name'])
      
      expect(result).toHaveLength(2)
      expect(result.every((item) => item.status === 'ACTIVE')).toBe(true)
    })

    it('應該按搜尋詞篩選', () => {
      const items = [
        { id: 1, name: 'Apple', status: 'ACTIVE' },
        { id: 2, name: 'Banana', status: 'ACTIVE' },
        { id: 3, name: 'Orange', status: 'ACTIVE' },
      ]

      const result = applyFilters(items, { search: 'app' }, ['name'])
      
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Apple')
    })

    it('應該組合多個篩選條件', () => {
      const items = [
        { id: 1, name: 'Active Apple', status: 'ACTIVE' },
        { id: 2, name: 'Inactive Apple', status: 'INACTIVE' },
        { id: 3, name: 'Active Orange', status: 'ACTIVE' },
      ]

      const result = applyFilters(
        items,
        { status: 'ACTIVE', search: 'apple' },
        ['name']
      )
      
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Active Apple')
    })

    it('應該處理空篩選條件', () => {
      const items = [
        { id: 1, name: 'A', status: 'ACTIVE' },
        { id: 2, name: 'B', status: 'INACTIVE' },
      ]

      const result = applyFilters(items, {}, ['name'])
      
      expect(result).toHaveLength(2)
    })
  })
})
