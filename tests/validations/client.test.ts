/**
 * Client Validation Schema Tests
 * 客戶資料驗證規則測試
 */

import {
  createClientSchema,
  updateClientSchema,
  clientQuerySchema,
  ClientStatus,
} from '@/lib/validations/client'

describe('Client Validation Schemas', () => {
  // ============================================
  // createClientSchema Tests
  // ============================================
  describe('createClientSchema', () => {
    describe('name 欄位', () => {
      it('應該接受有效的客戶名稱', () => {
        const result = createClientSchema.safeParse({ name: '測試客戶' })
        expect(result.success).toBe(true)
      })

      it('應該拒絕空的客戶名稱', () => {
        const result = createClientSchema.safeParse({ name: '' })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('請輸入客戶名稱')
        }
      })

      it('應該拒絕超過 100 字的客戶名稱', () => {
        const longName = 'a'.repeat(101)
        const result = createClientSchema.safeParse({ name: longName })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('客戶名稱不能超過 100 字')
        }
      })

      it('應該接受剛好 100 字的客戶名稱', () => {
        const exactName = 'a'.repeat(100)
        const result = createClientSchema.safeParse({ name: exactName })
        expect(result.success).toBe(true)
      })
    })

    describe('email 欄位', () => {
      it('應該接受有效的 Email', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
          email: 'test@example.com',
        })
        expect(result.success).toBe(true)
      })

      it('應該拒絕無效的 Email', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
          email: 'invalid-email',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('請輸入有效的 Email')
        }
      })

      it('應該接受 null 或 undefined 的 Email', () => {
        const resultNull = createClientSchema.safeParse({
          name: '測試客戶',
          email: null,
        })
        expect(resultNull.success).toBe(true)

        const resultUndefined = createClientSchema.safeParse({
          name: '測試客戶',
        })
        expect(resultUndefined.success).toBe(true)
      })
    })

    describe('phone 欄位', () => {
      it('應該接受有效的電話號碼', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
          phone: '0912-345-678',
        })
        expect(result.success).toBe(true)
      })

      it('應該拒絕超過 20 字的電話號碼', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
          phone: '123456789012345678901',
        })
        expect(result.success).toBe(false)
      })
    })

    describe('status 欄位', () => {
      it('應該預設為 LEAD', () => {
        const result = createClientSchema.safeParse({ name: '測試客戶' })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe('LEAD')
        }
      })

      it('應該接受所有有效的狀態', () => {
        const validStatuses = ['LEAD', 'PROSPECT', 'ACTIVE', 'COMPLETED', 'ON_HOLD', 'CHURNED']
        
        validStatuses.forEach((status) => {
          const result = createClientSchema.safeParse({
            name: '測試客戶',
            status,
          })
          expect(result.success).toBe(true)
        })
      })

      it('應該拒絕無效的狀態', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
          status: 'INVALID_STATUS',
        })
        expect(result.success).toBe(false)
      })
    })

    describe('website 欄位', () => {
      it('應該接受有效的 URL', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
          website: 'https://example.com',
        })
        expect(result.success).toBe(true)
      })

      it('應該拒絕無效的 URL', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
          website: 'not-a-url',
        })
        expect(result.success).toBe(false)
      })
    })

    describe('currency 欄位', () => {
      it('應該預設為 TWD', () => {
        const result = createClientSchema.safeParse({ name: '測試客戶' })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.currency).toBe('TWD')
        }
      })

      it('應該接受 3 個字元的貨幣代碼', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
          currency: 'USD',
        })
        expect(result.success).toBe(true)
      })

      it('應該拒絕非 3 個字元的貨幣代碼', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
          currency: 'US',
        })
        expect(result.success).toBe(false)
      })
    })

    describe('paymentTerms 欄位', () => {
      it('應該預設為 30', () => {
        const result = createClientSchema.safeParse({ name: '測試客戶' })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.paymentTerms).toBe(30)
        }
      })

      it('應該接受 0-365 之間的值', () => {
        const validValues = [0, 30, 60, 90, 365]
        
        validValues.forEach((value) => {
          const result = createClientSchema.safeParse({
            name: '測試客戶',
            paymentTerms: value,
          })
          expect(result.success).toBe(true)
        })
      })

      it('應該拒絕超過 365 的值', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
          paymentTerms: 366,
        })
        expect(result.success).toBe(false)
      })

      it('應該拒絕負數', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
          paymentTerms: -1,
        })
        expect(result.success).toBe(false)
      })
    })

    describe('tagIds 欄位', () => {
      it('應該接受字串陣列', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
          tagIds: ['tag1', 'tag2'],
        })
        expect(result.success).toBe(true)
      })

      it('應該接受空陣列', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
          tagIds: [],
        })
        expect(result.success).toBe(true)
      })

      it('應該接受 undefined', () => {
        const result = createClientSchema.safeParse({
          name: '測試客戶',
        })
        expect(result.success).toBe(true)
      })
    })

    describe('完整資料驗證', () => {
      it('應該接受完整有效的客戶資料', () => {
        const validClient = {
          name: '張小明',
          email: 'xiaoming@example.com',
          phone: '0912-345-678',
          company: 'ABC 科技有限公司',
          website: 'https://abc-tech.com',
          status: 'ACTIVE',
          source: '朋友推薦',
          notes: '重要客戶，優先處理',
          address: '台北市信義區信義路五段7號',
          city: '台北市',
          state: '台北',
          postalCode: '110',
          country: 'Taiwan',
          currency: 'TWD',
          paymentTerms: 30,
          tagIds: ['tag1', 'tag2'],
        }

        const result = createClientSchema.safeParse(validClient)
        expect(result.success).toBe(true)
      })
    })
  })

  // ============================================
  // updateClientSchema Tests
  // ============================================
  describe('updateClientSchema', () => {
    it('應該允許所有欄位為可選', () => {
      const result = updateClientSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('應該允許只更新部分欄位', () => {
      const result = updateClientSchema.safeParse({
        name: '新名稱',
        status: 'COMPLETED',
      })
      expect(result.success).toBe(true)
    })

    it('應該保持驗證規則', () => {
      const result = updateClientSchema.safeParse({
        email: 'invalid-email',
      })
      expect(result.success).toBe(false)
    })
  })

  // ============================================
  // clientQuerySchema Tests
  // ============================================
  describe('clientQuerySchema', () => {
    it('應該有正確的預設值', () => {
      const result = clientQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
        expect(result.data.sortBy).toBe('createdAt')
        expect(result.data.sortOrder).toBe('desc')
        expect(result.data.archived).toBe(false)
      }
    })

    it('應該正確解析字串數字', () => {
      const result = clientQuerySchema.safeParse({
        page: '2',
        limit: '50',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(50)
      }
    })

    it('應該限制 limit 最大為 100', () => {
      const result = clientQuerySchema.safeParse({
        limit: '200',
      })
      expect(result.success).toBe(false)
    })

    it('應該接受有效的排序欄位', () => {
      const validSortFields = ['name', 'email', 'company', 'createdAt', 'updatedAt']
      
      validSortFields.forEach((sortBy) => {
        const result = clientQuerySchema.safeParse({ sortBy })
        expect(result.success).toBe(true)
      })
    })

    it('應該拒絕無效的排序欄位', () => {
      const result = clientQuerySchema.safeParse({
        sortBy: 'invalid_field',
      })
      expect(result.success).toBe(false)
    })
  })

  // ============================================
  // ClientStatus Enum Tests
  // ============================================
  describe('ClientStatus', () => {
    it('應該包含所有預期的狀態', () => {
      const expectedStatuses = ['LEAD', 'PROSPECT', 'ACTIVE', 'COMPLETED', 'ON_HOLD', 'CHURNED']
      
      expectedStatuses.forEach((status) => {
        const result = ClientStatus.safeParse(status)
        expect(result.success).toBe(true)
      })
    })
  })
})
