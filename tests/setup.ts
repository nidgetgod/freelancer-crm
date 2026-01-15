/**
 * Jest 測試設定檔
 * 設定全域 mock 和測試工具
 */

import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

// ============================================
// Prisma Mock
// ============================================

export type MockPrismaClient = DeepMockProxy<PrismaClient>

export const prismaMock = mockDeep<PrismaClient>()

jest.mock('@/lib/db', () => ({
  __esModule: true,
  prisma: prismaMock,
  default: prismaMock,
}))

// ============================================
// NextAuth Mock
// ============================================

const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve(mockSession)),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// ============================================
// Next.js Request/Response Helpers
// ============================================

export function createMockRequest(options: {
  method?: string
  url?: string
  body?: any
  headers?: Record<string, string>
  searchParams?: Record<string, string>
} = {}) {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body,
    headers = {},
    searchParams = {},
  } = options

  const urlObj = new URL(url)
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })

  return {
    method,
    url: urlObj.toString(),
    headers: new Map(Object.entries(headers)),
    json: jest.fn().mockResolvedValue(body),
    nextUrl: urlObj,
  } as any
}

// ============================================
// Test Data Factories
// ============================================

export const testDataFactory = {
  user: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed_password',
    phone: '0912-345-678',
    timezone: 'Asia/Taipei',
    currency: 'TWD',
    locale: 'zh-TW',
    businessName: null,
    businessEmail: null,
    businessPhone: null,
    businessAddress: null,
    taxId: null,
    emailVerified: null,
    image: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }),

  client: (overrides = {}) => ({
    id: 'test-client-id',
    userId: 'test-user-id',
    name: '測試客戶',
    email: 'client@example.com',
    phone: '0922-111-222',
    company: 'Test Company',
    website: null,
    status: 'ACTIVE',
    source: '網站',
    notes: null,
    address: null,
    city: null,
    state: null,
    postalCode: null,
    country: 'Taiwan',
    currency: 'TWD',
    paymentTerms: 30,
    creditLimit: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    archivedAt: null,
    ...overrides,
  }),

  project: (overrides = {}) => ({
    id: 'test-project-id',
    userId: 'test-user-id',
    clientId: 'test-client-id',
    name: '測試專案',
    description: '專案描述',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    startDate: new Date('2026-01-01'),
    dueDate: new Date('2026-02-28'),
    completedAt: null,
    budget: 100000,
    currency: 'TWD',
    hourlyRate: null,
    estimatedHours: 40,
    trackedHours: 10,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    archivedAt: null,
    ...overrides,
  }),

  task: (overrides = {}) => ({
    id: 'test-task-id',
    userId: 'test-user-id',
    projectId: 'test-project-id',
    clientId: 'test-client-id',
    title: '測試任務',
    description: '任務描述',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: new Date('2026-01-15'),
    completedAt: null,
    estimatedMinutes: 120,
    trackedMinutes: 0,
    sortOrder: 0,
    reminderAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }),

  invoice: (overrides = {}) => ({
    id: 'test-invoice-id',
    userId: 'test-user-id',
    clientId: 'test-client-id',
    projectId: 'test-project-id',
    invoiceNumber: 'INV-1001',
    status: 'DRAFT',
    issueDate: new Date('2026-01-01'),
    dueDate: new Date('2026-01-31'),
    paidAt: null,
    subtotal: 50000,
    taxRate: 5,
    taxAmount: 2500,
    discount: 0,
    total: 52500,
    amountPaid: 0,
    currency: 'TWD',
    notes: null,
    terms: null,
    footer: null,
    stripeInvoiceId: null,
    stripePaymentIntent: null,
    stripePaymentUrl: null,
    sentAt: null,
    viewedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }),

  invoiceItem: (overrides = {}) => ({
    id: 'test-invoice-item-id',
    invoiceId: 'test-invoice-id',
    description: '測試項目',
    quantity: 1,
    unitPrice: 50000,
    amount: 50000,
    sortOrder: 0,
    ...overrides,
  }),

  tag: (overrides = {}) => ({
    id: 'test-tag-id',
    userId: 'test-user-id',
    name: 'VIP',
    color: '#f59e0b',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }),

  subscription: (overrides = {}) => ({
    id: 'test-subscription-id',
    userId: 'test-user-id',
    plan: 'SOLO',
    status: 'ACTIVE',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    currentPeriodStart: new Date('2026-01-01'),
    currentPeriodEnd: new Date('2026-02-01'),
    cancelAtPeriodEnd: false,
    clientsCount: 5,
    invoicesThisMonth: 3,
    lastInvoiceReset: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }),
}

// ============================================
// Helper Functions
// ============================================

export function getMockSession(overrides = {}) {
  return {
    ...mockSession,
    ...overrides,
  }
}

export function setMockSession(session: typeof mockSession | null) {
  const { getServerSession } = require('next-auth')
  ;(getServerSession as jest.Mock).mockResolvedValue(session)
}

// ============================================
// Reset Mocks Before Each Test
// ============================================

beforeEach(() => {
  mockReset(prismaMock)
  jest.clearAllMocks()
  
  // 重設預設 session
  setMockSession(mockSession)
})
