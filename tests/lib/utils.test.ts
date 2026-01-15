/**
 * Utility Functions Tests
 * 工具函數測試
 */

// 模擬工具函數（實際專案中會從 lib/utils.ts 導入）
// 這裡定義測試用的工具函數

// ============================================
// Currency Formatting
// ============================================

function formatCurrency(
  amount: number,
  currency: string = 'TWD',
  locale: string = 'zh-TW'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ============================================
// Date Formatting
// ============================================

function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'relative' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'short') {
    return d.toLocaleDateString('zh-TW')
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  
  // relative
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays} 天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`
  return `${Math.floor(diffDays / 30)} 個月前`
}

// ============================================
// String Utilities
// ============================================

function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// ============================================
// Number Utilities
// ============================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

function percentage(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * 100
}

// ============================================
// Invoice Utilities
// ============================================

function calculateInvoiceTotal(
  items: Array<{ quantity: number; unitPrice: number }>,
  taxRate: number = 0,
  discount: number = 0
): {
  subtotal: number
  taxAmount: number
  total: number
} {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const taxableAmount = subtotal - discount
  const taxAmount = Math.round(taxableAmount * (taxRate / 100))
  const total = taxableAmount + taxAmount

  return { subtotal, taxAmount, total }
}

function generateInvoiceNumber(prefix: string, nextNumber: number): string {
  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`
}

// ============================================
// Validation Utilities
// ============================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[0-9-+() ]{8,20}$/
  return phoneRegex.test(phone)
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ============================================
// Class Name Utilities (like clsx/cn)
// ============================================

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ============================================
// Tests
// ============================================

describe('Utility Functions', () => {
  // ============================================
  // Currency Formatting Tests
  // ============================================
  describe('formatCurrency', () => {
    it('應該正確格式化 TWD', () => {
      const result = formatCurrency(50000, 'TWD', 'zh-TW')
      expect(result).toContain('50,000')
    })

    it('應該正確格式化 USD', () => {
      const result = formatCurrency(1000, 'USD', 'en-US')
      expect(result).toContain('1,000')
    })

    it('應該處理小數', () => {
      const result = formatCurrency(1234.56, 'USD', 'en-US')
      expect(result).toContain('1,234.56')
    })

    it('應該處理零', () => {
      const result = formatCurrency(0, 'TWD')
      expect(result).toContain('0')
    })

    it('應該處理負數', () => {
      const result = formatCurrency(-1000, 'TWD')
      expect(result).toContain('1,000')
    })
  })

  // ============================================
  // Date Formatting Tests
  // ============================================
  describe('formatDate', () => {
    it('應該格式化短日期', () => {
      const result = formatDate(new Date('2026-01-15'), 'short')
      expect(result).toMatch(/2026/)
    })

    it('應該格式化長日期', () => {
      const result = formatDate(new Date('2026-01-15'), 'long')
      expect(result).toMatch(/2026/)
    })

    it('應該顯示今天', () => {
      const today = new Date()
      const result = formatDate(today, 'relative')
      expect(result).toBe('今天')
    })

    it('應該顯示昨天', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const result = formatDate(yesterday, 'relative')
      expect(result).toBe('昨天')
    })

    it('應該顯示幾天前', () => {
      const fiveDaysAgo = new Date()
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
      const result = formatDate(fiveDaysAgo, 'relative')
      expect(result).toBe('5 天前')
    })

    it('應該接受字串日期', () => {
      const result = formatDate('2026-01-15', 'short')
      expect(result).toMatch(/2026/)
    })
  })

  // ============================================
  // String Utilities Tests
  // ============================================
  describe('truncate', () => {
    it('應該截斷過長的字串', () => {
      const result = truncate('這是一個很長的字串', 5)
      expect(result).toBe('這是一個很...')
    })

    it('應該不改變短字串', () => {
      const result = truncate('短', 10)
      expect(result).toBe('短')
    })

    it('應該處理剛好長度的字串', () => {
      const result = truncate('12345', 5)
      expect(result).toBe('12345')
    })

    it('應該處理空字串', () => {
      const result = truncate('', 10)
      expect(result).toBe('')
    })
  })

  describe('slugify', () => {
    it('應該轉換為小寫', () => {
      const result = slugify('Hello World')
      expect(result).toBe('hello-world')
    })

    it('應該移除特殊字元', () => {
      const result = slugify('Hello! World?')
      expect(result).toBe('hello-world')
    })

    it('應該用連字號取代空格', () => {
      const result = slugify('hello world')
      expect(result).toBe('hello-world')
    })

    it('應該處理多個空格', () => {
      const result = slugify('hello   world')
      expect(result).toBe('hello-world')
    })

    it('應該移除首尾連字號', () => {
      const result = slugify(' hello world ')
      expect(result).toBe('hello-world')
    })
  })

  describe('capitalize', () => {
    it('應該首字母大寫', () => {
      const result = capitalize('hello')
      expect(result).toBe('Hello')
    })

    it('應該處理全大寫', () => {
      const result = capitalize('HELLO')
      expect(result).toBe('Hello')
    })

    it('應該處理單字元', () => {
      const result = capitalize('h')
      expect(result).toBe('H')
    })

    it('應該處理空字串', () => {
      const result = capitalize('')
      expect(result).toBe('')
    })
  })

  // ============================================
  // Number Utilities Tests
  // ============================================
  describe('clamp', () => {
    it('應該限制最大值', () => {
      const result = clamp(150, 0, 100)
      expect(result).toBe(100)
    })

    it('應該限制最小值', () => {
      const result = clamp(-50, 0, 100)
      expect(result).toBe(0)
    })

    it('應該不改變範圍內的值', () => {
      const result = clamp(50, 0, 100)
      expect(result).toBe(50)
    })

    it('應該處理邊界值', () => {
      expect(clamp(0, 0, 100)).toBe(0)
      expect(clamp(100, 0, 100)).toBe(100)
    })
  })

  describe('roundTo', () => {
    it('應該四捨五入到指定小數位', () => {
      expect(roundTo(1.234, 2)).toBe(1.23)
      expect(roundTo(1.235, 2)).toBe(1.24)
    })

    it('應該處理整數', () => {
      expect(roundTo(1.5, 0)).toBe(2)
      expect(roundTo(1.4, 0)).toBe(1)
    })

    it('應該處理負數', () => {
      expect(roundTo(-1.234, 2)).toBe(-1.23)
    })
  })

  describe('percentage', () => {
    it('應該計算百分比', () => {
      expect(percentage(25, 100)).toBe(25)
      expect(percentage(1, 4)).toBe(25)
    })

    it('應該處理零總數', () => {
      expect(percentage(10, 0)).toBe(0)
    })

    it('應該處理零值', () => {
      expect(percentage(0, 100)).toBe(0)
    })

    it('應該處理超過 100%', () => {
      expect(percentage(150, 100)).toBe(150)
    })
  })

  // ============================================
  // Invoice Utilities Tests
  // ============================================
  describe('calculateInvoiceTotal', () => {
    it('應該計算小計', () => {
      const items = [
        { quantity: 1, unitPrice: 30000 },
        { quantity: 2, unitPrice: 10000 },
      ]
      const result = calculateInvoiceTotal(items)
      expect(result.subtotal).toBe(50000)
    })

    it('應該計算稅額', () => {
      const items = [{ quantity: 1, unitPrice: 100000 }]
      const result = calculateInvoiceTotal(items, 5)
      expect(result.taxAmount).toBe(5000)
    })

    it('應該計算折扣後的稅額', () => {
      const items = [{ quantity: 1, unitPrice: 100000 }]
      const result = calculateInvoiceTotal(items, 5, 10000)
      // (100000 - 10000) * 0.05 = 4500
      expect(result.taxAmount).toBe(4500)
    })

    it('應該計算總額', () => {
      const items = [{ quantity: 1, unitPrice: 100000 }]
      const result = calculateInvoiceTotal(items, 5, 10000)
      // 100000 - 10000 + 4500 = 94500
      expect(result.total).toBe(94500)
    })

    it('應該處理空項目', () => {
      const result = calculateInvoiceTotal([])
      expect(result.subtotal).toBe(0)
      expect(result.total).toBe(0)
    })

    it('應該處理小數數量', () => {
      const items = [{ quantity: 2.5, unitPrice: 2000 }]
      const result = calculateInvoiceTotal(items)
      expect(result.subtotal).toBe(5000)
    })
  })

  describe('generateInvoiceNumber', () => {
    it('應該產生正確格式的發票編號', () => {
      expect(generateInvoiceNumber('INV', 1)).toBe('INV-0001')
      expect(generateInvoiceNumber('INV', 1001)).toBe('INV-1001')
    })

    it('應該支援不同前綴', () => {
      expect(generateInvoiceNumber('QUOTE', 1)).toBe('QUOTE-0001')
      expect(generateInvoiceNumber('PO', 123)).toBe('PO-0123')
    })

    it('應該正確補零', () => {
      expect(generateInvoiceNumber('INV', 1)).toBe('INV-0001')
      expect(generateInvoiceNumber('INV', 12)).toBe('INV-0012')
      expect(generateInvoiceNumber('INV', 123)).toBe('INV-0123')
      expect(generateInvoiceNumber('INV', 1234)).toBe('INV-1234')
      expect(generateInvoiceNumber('INV', 12345)).toBe('INV-12345')
    })
  })

  // ============================================
  // Validation Utilities Tests
  // ============================================
  describe('isValidEmail', () => {
    it('應該接受有效的 Email', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.com')).toBe(true)
    })

    it('應該拒絕無效的 Email', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('invalid@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('應該接受有效的電話號碼', () => {
      expect(isValidPhone('0912-345-678')).toBe(true)
      expect(isValidPhone('02-1234-5678')).toBe(true)
      expect(isValidPhone('+886912345678')).toBe(true)
      expect(isValidPhone('(02) 1234-5678')).toBe(true)
    })

    it('應該拒絕無效的電話號碼', () => {
      expect(isValidPhone('')).toBe(false)
      expect(isValidPhone('123')).toBe(false)
      expect(isValidPhone('abc-def-ghij')).toBe(false)
    })
  })

  describe('isValidUrl', () => {
    it('應該接受有效的 URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://example.com')).toBe(true)
      expect(isValidUrl('https://example.com/path?query=1')).toBe(true)
    })

    it('應該拒絕無效的 URL', () => {
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('example.com')).toBe(false)
    })
  })

  // ============================================
  // Class Name Utilities Tests
  // ============================================
  describe('cn', () => {
    it('應該合併類名', () => {
      expect(cn('a', 'b', 'c')).toBe('a b c')
    })

    it('應該過濾 falsy 值', () => {
      expect(cn('a', false, 'b', null, 'c', undefined)).toBe('a b c')
    })

    it('應該處理條件類名', () => {
      const isActive = true
      const isDisabled = false
      expect(cn('btn', isActive && 'active', isDisabled && 'disabled')).toBe('btn active')
    })

    it('應該處理空輸入', () => {
      expect(cn()).toBe('')
    })
  })
})

// ============================================
// Date Helper Functions Tests
// ============================================

describe('Date Helpers', () => {
  describe('getDaysInMonth', () => {
    function getDaysInMonth(year: number, month: number): number {
      return new Date(year, month + 1, 0).getDate()
    }

    it('應該返回正確的天數', () => {
      expect(getDaysInMonth(2026, 0)).toBe(31) // January
      expect(getDaysInMonth(2026, 1)).toBe(28) // February (non-leap)
      expect(getDaysInMonth(2024, 1)).toBe(29) // February (leap)
      expect(getDaysInMonth(2026, 3)).toBe(30) // April
    })
  })

  describe('isLeapYear', () => {
    function isLeapYear(year: number): boolean {
      return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    }

    it('應該正確判斷閏年', () => {
      expect(isLeapYear(2024)).toBe(true)
      expect(isLeapYear(2025)).toBe(false)
      expect(isLeapYear(2000)).toBe(true)
      expect(isLeapYear(1900)).toBe(false)
    })
  })

  describe('addDays', () => {
    function addDays(date: Date, days: number): Date {
      const result = new Date(date)
      result.setDate(result.getDate() + days)
      return result
    }

    it('應該正確加天數', () => {
      const date = new Date('2026-01-15')
      const result = addDays(date, 10)
      expect(result.getDate()).toBe(25)
    })

    it('應該正確處理跨月', () => {
      const date = new Date('2026-01-25')
      const result = addDays(date, 10)
      expect(result.getMonth()).toBe(1) // February
      expect(result.getDate()).toBe(4)
    })

    it('應該正確減天數', () => {
      const date = new Date('2026-01-15')
      const result = addDays(date, -10)
      expect(result.getDate()).toBe(5)
    })
  })

  describe('getStartOfWeek', () => {
    function getStartOfWeek(date: Date): Date {
      const result = new Date(date)
      const day = result.getDay()
      result.setDate(result.getDate() - day)
      result.setHours(0, 0, 0, 0)
      return result
    }

    it('應該返回週日', () => {
      const wednesday = new Date('2026-01-14') // Wednesday
      const result = getStartOfWeek(wednesday)
      expect(result.getDay()).toBe(0) // Sunday
    })
  })
})

// ============================================
// Status Helper Functions Tests
// ============================================

describe('Status Helpers', () => {
  describe('getStatusColor', () => {
    function getStatusColor(status: string): string {
      const colors: Record<string, string> = {
        LEAD: 'gray',
        PROSPECT: 'blue',
        ACTIVE: 'green',
        COMPLETED: 'purple',
        ON_HOLD: 'yellow',
        CHURNED: 'red',
        // Project statuses
        PLANNING: 'gray',
        IN_PROGRESS: 'blue',
        IN_REVIEW: 'yellow',
        CANCELLED: 'red',
        // Invoice statuses
        DRAFT: 'gray',
        SENT: 'blue',
        VIEWED: 'indigo',
        PAID: 'green',
        PARTIAL: 'yellow',
        OVERDUE: 'red',
        REFUNDED: 'purple',
      }
      return colors[status] || 'gray'
    }

    it('應該返回正確的顏色', () => {
      expect(getStatusColor('ACTIVE')).toBe('green')
      expect(getStatusColor('IN_PROGRESS')).toBe('blue')
      expect(getStatusColor('PAID')).toBe('green')
      expect(getStatusColor('OVERDUE')).toBe('red')
    })

    it('應該為未知狀態返回預設顏色', () => {
      expect(getStatusColor('UNKNOWN')).toBe('gray')
    })
  })

  describe('getStatusLabel', () => {
    function getStatusLabel(status: string): string {
      const labels: Record<string, string> = {
        LEAD: '潛在客戶',
        PROSPECT: '洽談中',
        ACTIVE: '進行中',
        COMPLETED: '已完成',
        ON_HOLD: '暫停',
        CHURNED: '流失',
        PLANNING: '規劃中',
        IN_PROGRESS: '進行中',
        IN_REVIEW: '審核中',
        CANCELLED: '已取消',
        TODO: '待辦',
        DONE: '完成',
        DRAFT: '草稿',
        SENT: '已發送',
        VIEWED: '已查看',
        PAID: '已付款',
        PARTIAL: '部分付款',
        OVERDUE: '逾期',
      }
      return labels[status] || status
    }

    it('應該返回正確的標籤', () => {
      expect(getStatusLabel('ACTIVE')).toBe('進行中')
      expect(getStatusLabel('PAID')).toBe('已付款')
      expect(getStatusLabel('OVERDUE')).toBe('逾期')
    })

    it('應該為未知狀態返回原始值', () => {
      expect(getStatusLabel('UNKNOWN')).toBe('UNKNOWN')
    })
  })
})
