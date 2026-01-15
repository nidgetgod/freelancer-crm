# CLAUDE.md - AI Assistant Development Guide

> **Last Updated:** 2026-01-15
> **Repository:** FreelancerCRM - Freelancer Customer Relationship Management System
> **Version:** 1.0.0

This document provides comprehensive guidance for AI assistants working with the FreelancerCRM codebase. It covers architecture, conventions, workflows, and best practices.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & File Structure](#architecture--file-structure)
4. [Database Schema](#database-schema)
5. [Development Workflows](#development-workflows)
6. [Coding Conventions](#coding-conventions)
7. [API Patterns](#api-patterns)
8. [State Management](#state-management)
9. [Form Handling](#form-handling)
10. [Testing Guidelines](#testing-guidelines)
11. [Common Tasks](#common-tasks)
12. [Key Patterns to Follow](#key-patterns-to-follow)
13. [Troubleshooting](#troubleshooting)

---

## Project Overview

### Purpose
FreelancerCRM is a lightweight CRM system designed specifically for freelancers to manage clients, projects, invoices, and tasks in one integrated platform.

### Core Features
- **Client Management** - Track client information, status, and communication history
- **Project Tracking** - Kanban-style project management with budget and time tracking
- **Invoice System** - Professional invoice generation with Stripe integration
- **Task Management** - Personal and project-linked tasks with time tracking
- **Dashboard Analytics** - Revenue statistics, client insights, and business metrics
- **Subscription System** - Tiered plans (FREE, SOLO, PRO, AGENCY) with feature limits

### Key Characteristics
- **TypeScript-first** - Strict type safety throughout
- **Server-first** - Uses Next.js App Router with Server Components by default
- **Type-safe APIs** - Zod validation for all API inputs
- **Database-first** - Prisma ORM with comprehensive schema
- **Test-driven** - 70% coverage requirement with Jest

---

## Technology Stack

### Frontend Framework
- **Next.js 14** - React framework using App Router (not Pages Router)
- **React 18.3** - UI library with Server Components
- **TypeScript 5.9** - Strict mode enabled

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS with custom design tokens
- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React** - Icon library
- **class-variance-authority** - Component variant management
- **tailwind-merge** - Utility for merging Tailwind classes

### State & Data Fetching
- **TanStack Query (React Query) 5.90** - Server state management
- **Zustand 5.0** - Lightweight client state
- **React Hook Form 7.71** - Form state management
- **Zod 3.25** - Runtime schema validation

### Backend & Database
- **Next.js API Routes** - RESTful endpoints
- **Prisma 6.19** - ORM with type-safe client
- **PostgreSQL** - Primary database (via Supabase)
- **NextAuth.js 5.0.0-beta** - Authentication with JWT strategy

### Third-Party Services
- **Stripe 17.7** - Payment processing and subscriptions
- **Resend 4.8** - Transactional email delivery
- **@react-pdf/renderer** - PDF generation for invoices

### Development Tools
- **Jest 28** - Testing framework
- **ESLint 9.39** - Code linting with TypeScript support
- **Prettier 3.8** - Code formatting
- **ts-node** - TypeScript execution for scripts

---

## Architecture & File Structure

### Next.js App Router Structure

```
app/
├── (auth)/                    # Authentication route group (no navbar/sidebar)
│   ├── login/page.tsx         # Login page
│   ├── register/page.tsx      # Registration page
│   └── layout.tsx             # Auth-specific layout (centers content)
│
├── (dashboard)/               # Protected dashboard route group
│   ├── layout.tsx             # Dashboard layout (sidebar, header, auth check)
│   ├── page.tsx               # Dashboard home (/dashboard) - stats overview
│   ├── clients/               # Client management module
│   │   ├── page.tsx           # Client list view
│   │   ├── new/page.tsx       # Create client form
│   │   ├── [id]/page.tsx      # Client detail view
│   │   └── [id]/edit/page.tsx # Edit client form
│   ├── projects/              # Project management module
│   │   ├── page.tsx           # Project list view
│   │   ├── new/page.tsx       # Create project form
│   │   ├── [id]/page.tsx      # Project detail view
│   │   └── [id]/edit/page.tsx # Edit project form
│   ├── invoices/              # Invoice management module
│   │   ├── page.tsx           # Invoice list view
│   │   ├── new/page.tsx       # Create invoice form
│   │   └── [id]/page.tsx      # Invoice detail view
│   ├── tasks/page.tsx         # Task management
│   └── settings/page.tsx      # User settings
│
├── api/                       # REST API endpoints
│   ├── auth/
│   │   ├── [...nextauth]/route.ts    # NextAuth handlers
│   │   └── register/route.ts         # User registration
│   ├── clients/
│   │   ├── route.ts           # GET (list), POST (create)
│   │   └── [id]/route.ts      # GET, PUT, DELETE
│   ├── projects/
│   │   ├── route.ts           # GET, POST
│   │   └── [id]/route.ts      # GET, PUT, DELETE
│   ├── invoices/
│   │   ├── route.ts           # GET, POST
│   │   ├── [id]/route.ts      # GET, PUT, DELETE
│   │   ├── [id]/send/route.ts # Send invoice email
│   │   └── [id]/payments/route.ts # Record payment
│   ├── tasks/
│   │   ├── route.ts           # GET, POST
│   │   └── [id]/route.ts      # PUT, DELETE
│   ├── dashboard/stats/route.ts      # Analytics data
│   └── settings/
│       ├── route.ts           # GET, PUT settings
│       └── profile/route.ts   # PUT user profile
│
├── page.tsx                   # Public landing page
├── layout.tsx                 # Root layout (Providers, fonts, metadata)
└── globals.css                # Global styles & Tailwind directives
```

### Component Structure

```
components/
├── ui/                        # Base UI primitives (Radix UI wrappers)
│   ├── button.tsx             # Button with variants (default, destructive, etc.)
│   ├── card.tsx               # Card, CardHeader, CardContent, CardFooter
│   ├── badge.tsx              # Status badges
│   ├── input.tsx              # Form input
│   ├── label.tsx              # Form label
│   ├── dropdown-menu.tsx      # Dropdown menu (Radix)
│   ├── alert-dialog.tsx       # Confirmation dialogs
│   ├── toast.tsx              # Toast notification
│   └── toaster.tsx            # Toast container
│
├── layout/                    # Layout components
│   ├── sidebar.tsx            # Navigation sidebar (dashboard)
│   ├── header.tsx             # Top header with user menu
│   └── footer.tsx             # Footer (if exists)
│
├── clients/                   # Client-specific components
│   ├── client-form.tsx        # Client create/edit form
│   └── client-actions.tsx     # Client action buttons
│
├── projects/                  # Project-specific components
│   └── project-form.tsx       # Project create/edit form
│
├── invoices/                  # Invoice-specific components
│   └── invoice-form.tsx       # Invoice create/edit form
│
└── providers.tsx              # Root providers (QueryClient, SessionProvider)
```

### Library Structure

```
lib/
├── auth.ts                    # NextAuth configuration & auth utilities
├── db.ts                      # Prisma Client singleton instance
├── utils.ts                   # Utility functions (formatCurrency, cn, etc.)
└── validations/               # Zod schemas for validation
    ├── client.ts              # Client validation schemas
    ├── project.ts             # Project validation schemas
    ├── invoice.ts             # Invoice validation schemas
    └── task.ts                # Task validation schemas
```

### Hooks Structure

```
hooks/
├── use-clients.ts             # Client CRUD hooks (React Query)
├── use-toast.ts               # Toast notification hook
└── [other hooks]              # Additional custom hooks
```

### Database Structure

```
prisma/
├── schema.prisma              # Database schema (16 models)
└── seed.ts                    # Database seeding script
```

### Test Structure

```
tests/
├── setup.ts                   # Jest configuration, mocks, test factories
├── validations/               # Schema validation tests
│   ├── client.test.ts
│   ├── project.test.ts
│   ├── invoice.test.ts
│   └── task.test.ts
├── api/                       # API route tests
│   ├── clients.test.ts
│   ├── projects.test.ts
│   ├── invoices.test.ts
│   ├── dashboard.test.ts
│   └── subscription.test.ts
├── hooks/                     # React hooks tests
│   └── hooks.test.ts
└── lib/                       # Utility function tests
    └── utils.test.ts
```

---

## Database Schema

### Core Entities

#### User
```prisma
model User {
  id       String  @id @default(cuid())
  email    String  @unique
  password String?
  name     String?

  // Business info
  businessName    String?
  businessEmail   String?
  businessPhone   String?
  businessAddress String?
  taxId           String?

  // Relations
  clients        Client[]
  projects       Project[]
  tasks          Task[]
  invoices       Invoice[]
  subscription   Subscription?
  settings       Setting?
}
```

#### Client
```prisma
model Client {
  id      String       @id @default(cuid())
  userId  String
  name    String       // Required
  email   String?
  phone   String?
  company String?
  status  ClientStatus @default(LEAD)

  // Relations
  projects       Project[]
  invoices       Invoice[]
  communications Communication[]
  tags           TagsOnClients[]
}

enum ClientStatus {
  LEAD       // Initial contact
  PROSPECT   // Qualified lead
  ACTIVE     // Paying customer
  COMPLETED  // Project finished
  ON_HOLD    // Temporarily paused
  CHURNED    // Lost customer
}
```

#### Project
```prisma
model Project {
  id          String        @id @default(cuid())
  userId      String
  clientId    String
  name        String
  status      ProjectStatus @default(PLANNING)
  priority    Priority      @default(MEDIUM)

  budget         Decimal?
  hourlyRate     Decimal?
  estimatedHours Float?
  trackedHours   Float    @default(0)

  // Relations
  client   Client
  tasks    Task[]
  invoices Invoice[]
}

enum ProjectStatus {
  PLANNING     // Initial planning phase
  IN_PROGRESS  // Active development
  ON_HOLD      // Temporarily paused
  IN_REVIEW    // Awaiting review/approval
  COMPLETED    // Successfully finished
  CANCELLED    // Terminated early
}
```

#### Invoice
```prisma
model Invoice {
  id            String        @id @default(cuid())
  invoiceNumber String        @unique
  status        InvoiceStatus @default(DRAFT)

  subtotal   Decimal
  taxRate    Decimal
  taxAmount  Decimal
  discount   Decimal
  total      Decimal
  amountPaid Decimal @default(0)

  // Relations
  client   Client
  items    InvoiceItem[]
  payments Payment[]
}

enum InvoiceStatus {
  DRAFT      // Not yet sent
  SENT       // Sent to client
  VIEWED     // Client opened invoice
  PAID       // Fully paid
  PARTIAL    // Partially paid
  OVERDUE    // Past due date
  CANCELLED  // Cancelled
  REFUNDED   // Refunded
}
```

#### Task
```prisma
model Task {
  id          String     @id @default(cuid())
  userId      String
  projectId   String?    // Optional - can be personal task
  title       String
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)

  estimatedMinutes Int?
  trackedMinutes   Int  @default(0)
}

enum TaskStatus {
  TODO        // Not started
  IN_PROGRESS // Currently working
  IN_REVIEW   // Awaiting review
  DONE        // Completed
  CANCELLED   // Cancelled
}
```

### Subscription System

```prisma
model Subscription {
  userId String @unique
  plan   SubscriptionPlan   @default(FREE)
  status SubscriptionStatus @default(ACTIVE)

  clientsCount      Int      @default(0)
  invoicesThisMonth Int      @default(0)
}

enum SubscriptionPlan {
  FREE    // 5 clients max
  SOLO    // Individual freelancer
  PRO     // Professional
  AGENCY  // Agency/team
}
```

### Key Relationships

```
User (1) ───── (*) Client (1) ───── (*) Project (1) ───── (*) Task
         │                   │                     │
         │                   └─── (*) Invoice      └─── (*) Invoice
         │
         └─── (1) Subscription
         └─── (1) Setting
         └─── (*) Activity (audit log)
```

---

## Development Workflows

### Environment Setup

1. **Required Environment Variables:**
```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Stripe (required for subscriptions)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (required for invoice sending)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
```

2. **Database Setup:**
```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Seed test data (optional)
pnpm db:seed
```

3. **Development Server:**
```bash
pnpm dev  # Starts on http://localhost:3000
```

### Git Workflow

**Commit Message Convention:**
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Code formatting
refactor: Code refactoring
test: Add/update tests
chore: Maintenance tasks
```

**Examples:**
```bash
git commit -m "feat: Add invoice PDF export functionality"
git commit -m "fix: Correct client status filter in API"
git commit -m "refactor: Extract invoice calculation logic"
```

### Testing Workflow

```bash
# Run all tests
pnpm test

# Run tests in watch mode (development)
pnpm test:watch

# Run with coverage report
pnpm test:coverage

# Run specific test file
pnpm test -- tests/api/clients.test.ts

# Run tests matching pattern
pnpm test -- --testNamePattern="客戶"
```

**Coverage Requirements:**
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

---

## Coding Conventions

### File Naming

- **Components:** PascalCase (e.g., `ClientForm.tsx`)
- **Utilities:** kebab-case (e.g., `format-currency.ts`)
- **API Routes:** kebab-case (e.g., `route.ts` in directory structure)
- **Test Files:** Same as source + `.test.ts` (e.g., `client.test.ts`)

### Component Patterns

**Server Components (Default):**
```tsx
// app/(dashboard)/clients/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function ClientsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const clients = await prisma.client.findMany({
    where: { userId: session.user.id }
  })

  return <div>{/* render clients */}</div>
}
```

**Client Components:**
```tsx
'use client'

import { useState } from 'react'
import { useClients } from '@/hooks/use-clients'

export function ClientList() {
  const { data, isLoading } = useClients()

  if (isLoading) return <div>Loading...</div>

  return <div>{/* render client list */}</div>
}
```

### Import Order

1. React/Next imports
2. Third-party libraries
3. Local components
4. Local utilities/types
5. Styles

```tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { createClientSchema } from '@/lib/validations/client'
import { cn } from '@/lib/utils'
```

### Type Safety

**Always use TypeScript types:**
```tsx
// ✅ Good - Type-safe
interface ClientFormProps {
  clientId?: string
  onSuccess?: (client: Client) => void
}

export function ClientForm({ clientId, onSuccess }: ClientFormProps) {
  // ...
}

// ❌ Bad - No types
export function ClientForm({ clientId, onSuccess }) {
  // ...
}
```

**Use Zod for runtime validation:**
```tsx
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email().optional()
})

type FormData = z.infer<typeof schema>
```

### Error Handling

**API Routes:**
```tsx
try {
  // Operation
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('Error context:', error)
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'ERROR_CODE',
        message: 'User-friendly message'
      }
    },
    { status: 500 }
  )
}
```

**Client-side:**
```tsx
const mutation = useMutation({
  mutationFn: createClient,
  onSuccess: () => {
    toast({ title: 'Client created successfully' })
  },
  onError: (error) => {
    toast({
      title: 'Failed to create client',
      description: error.message,
      variant: 'destructive'
    })
  }
})
```

---

## API Patterns

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { /* entity or array */ },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "name", "message": "Name is required" }
    ]
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401) - Not authenticated
- `FORBIDDEN` (403) - Not authorized
- `VALIDATION_ERROR` (400) - Invalid input data
- `NOT_FOUND` (404) - Resource not found
- `PLAN_LIMIT_REACHED` (422) - Subscription limit exceeded
- `INTERNAL_ERROR` (500) - Server error

### API Route Template

```tsx
// app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createClientSchema } from '@/lib/validations/client'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 3. Query database
    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where: { userId: session.user.id },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.client.count({ where: { userId: session.user.id } })
    ])

    // 4. Return response
    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('GET /api/clients error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    // 2. Parse and validate body
    const body = await request.json()
    const result = createClientSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '請求資料驗證失敗',
            details: result.error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          }
        },
        { status: 400 }
      )
    }

    // 3. Check subscription limits (if applicable)
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    if (subscription?.plan === 'FREE') {
      const count = await prisma.client.count({
        where: { userId: session.user.id }
      })

      if (count >= 5) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PLAN_LIMIT_REACHED',
              message: '免費方案最多可建立 5 位客戶'
            }
          },
          { status: 422 }
        )
      }
    }

    // 4. Create entity
    const client = await prisma.client.create({
      data: {
        ...result.data,
        userId: session.user.id
      }
    })

    // 5. Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATED',
        entityType: 'CLIENT',
        entityId: client.id,
        entityName: client.name
      }
    })

    // 6. Return response
    return NextResponse.json(
      { success: true, data: client },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/clients error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}
```

---

## State Management

### Server State (React Query)

**Hook Pattern:**
```tsx
// hooks/use-clients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useClients(params?: ClientQueryParams) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => fetchClients(params),
    staleTime: 60000 // 60 seconds
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })
}
```

**Usage in Components:**
```tsx
'use client'

import { useClients, useCreateClient } from '@/hooks/use-clients'

export function ClientList() {
  const { data, isLoading, error } = useClients()
  const createMutation = useCreateClient()

  const handleCreate = (data: CreateClientInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: 'Client created' })
      }
    })
  }

  // ...
}
```

### Client State (Zustand)

```tsx
import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open })
}))
```

---

## Form Handling

### React Hook Form + Zod Pattern

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClientSchema, type CreateClientInput } from '@/lib/validations/client'

export function ClientForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      status: 'LEAD',
      country: 'Taiwan',
      currency: 'TWD',
      paymentTerms: 30
    }
  })

  const onSubmit = async (data: CreateClientInput) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to create client')

      const result = await response.json()
      // Handle success
    } catch (error) {
      // Handle error
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('name')}
        placeholder="Client Name"
      />
      {errors.name && (
        <span className="text-sm text-destructive">
          {errors.name.message}
        </span>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Client'}
      </Button>
    </form>
  )
}
```

---

## Testing Guidelines

### Test Structure

```tsx
// tests/api/clients.test.ts
import { prismaMock, testDataFactory, setMockSession } from '../setup'

describe('Client API', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
  })

  describe('GET /api/clients', () => {
    it('應該返回用戶的客戶列表', async () => {
      // Arrange
      const mockClients = [
        testDataFactory.client({ name: '測試客戶 1' }),
        testDataFactory.client({ name: '測試客戶 2' })
      ]

      setMockSession({
        user: { id: 'test-user-id', email: 'test@example.com' }
      })

      prismaMock.client.findMany.mockResolvedValue(mockClients)
      prismaMock.client.count.mockResolvedValue(2)

      // Act
      const result = await prismaMock.client.findMany({
        where: { userId: 'test-user-id' }
      })

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('測試客戶 1')
    })

    it('應該在未登入時返回 401', async () => {
      // Arrange
      setMockSession(null)

      // Act & Assert
      // Test unauthorized access
    })
  })

  describe('POST /api/clients', () => {
    it('應該成功建立新客戶', async () => {
      // Test implementation
    })

    it('應該在 Free 方案達到限制時返回錯誤', async () => {
      // Test subscription limit
    })
  })
})
```

### Using Test Factories

```tsx
// tests/setup.ts exports testDataFactory
const client = testDataFactory.client({
  name: 'Custom Name',
  status: 'ACTIVE'
})

const project = testDataFactory.project({
  clientId: client.id,
  name: 'Custom Project'
})
```

### Mocking Prisma

```tsx
import { prismaMock } from '../setup'

// Mock successful query
prismaMock.client.findMany.mockResolvedValue([client1, client2])

// Mock creation
prismaMock.client.create.mockResolvedValue(newClient)

// Mock error
prismaMock.client.findMany.mockRejectedValue(new Error('Database error'))

// Mock count
prismaMock.client.count.mockResolvedValue(10)
```

---

## Common Tasks

### Adding a New Feature Module

1. **Create Database Model** (if needed):
```prisma
// prisma/schema.prisma
model NewEntity {
  id        String   @id @default(cuid())
  userId    String
  name      String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("new_entities")
}
```

2. **Generate Prisma Client**:
```bash
pnpm db:generate
pnpm db:push
```

3. **Create Validation Schema**:
```tsx
// lib/validations/new-entity.ts
import { z } from 'zod'

export const createNewEntitySchema = z.object({
  name: z.string().min(1, 'Name is required')
})

export const updateNewEntitySchema = createNewEntitySchema.partial()

export type CreateNewEntityInput = z.infer<typeof createNewEntitySchema>
```

4. **Create API Routes**:
```tsx
// app/api/new-entities/route.ts
// Implement GET (list), POST (create)

// app/api/new-entities/[id]/route.ts
// Implement GET (detail), PUT (update), DELETE (delete)
```

5. **Create React Query Hook**:
```tsx
// hooks/use-new-entities.ts
export function useNewEntities() { /* ... */ }
export function useCreateNewEntity() { /* ... */ }
export function useUpdateNewEntity() { /* ... */ }
```

6. **Create UI Components**:
```tsx
// components/new-entities/new-entity-form.tsx
// Form component with React Hook Form + Zod

// app/(dashboard)/new-entities/page.tsx
// List view page

// app/(dashboard)/new-entities/new/page.tsx
// Create page

// app/(dashboard)/new-entities/[id]/page.tsx
// Detail view page
```

7. **Write Tests**:
```tsx
// tests/validations/new-entity.test.ts
// tests/api/new-entities.test.ts
// tests/hooks/use-new-entities.test.ts
```

### Modifying Existing API Endpoint

1. **Update validation schema** (if input changed):
```tsx
// lib/validations/client.ts
export const createClientSchema = z.object({
  // Add new field
  taxId: z.string().optional()
})
```

2. **Update API route handler**:
```tsx
// app/api/clients/route.ts
export async function POST(request: NextRequest) {
  // Handle new field
}
```

3. **Update tests**:
```tsx
// tests/api/clients.test.ts
it('應該接受新的 taxId 欄位', async () => {
  // Test new functionality
})
```

4. **Update TypeScript types** (if needed)

5. **Update UI forms** (if user-facing)

### Adding New UI Component

1. **Create component file**:
```tsx
// components/ui/new-component.tsx
import { cn } from '@/lib/utils'

interface NewComponentProps {
  variant?: 'default' | 'outline'
  className?: string
}

export function NewComponent({ variant = 'default', className }: NewComponentProps) {
  return (
    <div className={cn('base-styles', className)}>
      {/* Component content */}
    </div>
  )
}
```

2. **Use Radix UI if applicable** for accessibility

3. **Export from index** (if using barrel exports)

4. **Document props and variants**

---

## Key Patterns to Follow

### 1. Authentication Check Pattern

**API Routes:**
```tsx
const session = await auth()

if (!session?.user?.id) {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
    { status: 401 }
  )
}
```

**Server Components:**
```tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function ProtectedPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Continue with page logic
}
```

### 2. Subscription Limit Pattern

```tsx
// Check subscription plan limits
const subscription = await prisma.subscription.findUnique({
  where: { userId: session.user.id }
})

if (subscription?.plan === 'FREE') {
  const count = await prisma.client.count({
    where: { userId: session.user.id, archivedAt: null }
  })

  if (count >= 5) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PLAN_LIMIT_REACHED',
          message: '免費方案最多可建立 5 位客戶，請升級方案'
        }
      },
      { status: 422 }
    )
  }
}
```

### 3. Activity Logging Pattern

```tsx
// After creating/updating/deleting an entity
await prisma.activity.create({
  data: {
    userId: session.user.id,
    action: 'CREATED', // or UPDATED, DELETED, etc.
    entityType: 'CLIENT',
    entityId: client.id,
    entityName: client.name,
    metadata: { /* optional additional data */ }
  }
})
```

### 4. Query with Pagination Pattern

```tsx
const { searchParams } = new URL(request.url)
const page = parseInt(searchParams.get('page') || '1')
const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Cap at 100

const [data, total] = await Promise.all([
  prisma.entity.findMany({
    where: { userId: session.user.id },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  }),
  prisma.entity.count({ where: { userId: session.user.id } })
])

return NextResponse.json({
  success: true,
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
})
```

### 5. Soft Delete Pattern

```tsx
// Instead of deleting, set archivedAt
await prisma.client.update({
  where: { id: clientId },
  data: { archivedAt: new Date() }
})

// Filter out archived by default
const clients = await prisma.client.findMany({
  where: {
    userId: session.user.id,
    archivedAt: null // Only active clients
  }
})
```

### 6. Transaction Pattern

```tsx
// Use transaction for related operations
await prisma.$transaction(async (tx) => {
  // Create invoice
  const invoice = await tx.invoice.create({ data: invoiceData })

  // Create invoice items
  await tx.invoiceItem.createMany({
    data: items.map(item => ({
      ...item,
      invoiceId: invoice.id
    }))
  })

  // Log activity
  await tx.activity.create({ data: activityData })
})
```

### 7. Toast Notification Pattern

```tsx
import { useToast } from '@/hooks/use-toast'

export function MyComponent() {
  const { toast } = useToast()

  const handleAction = async () => {
    try {
      await performAction()

      toast({
        title: '成功',
        description: '操作已成功完成'
      })
    } catch (error) {
      toast({
        title: '錯誤',
        description: error.message,
        variant: 'destructive'
      })
    }
  }
}
```

### 8. Optimistic Update Pattern

```tsx
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: updateClient,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['clients'] })

    // Snapshot previous value
    const previous = queryClient.getQueryData(['clients'])

    // Optimistically update
    queryClient.setQueryData(['clients'], (old) => ({
      ...old,
      data: old.data.map(c => c.id === newData.id ? { ...c, ...newData } : c)
    }))

    return { previous }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['clients'], context.previous)
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['clients'] })
  }
})
```

---

## Troubleshooting

### Common Issues

**Issue: Prisma Client not generating types**
```bash
# Solution: Regenerate Prisma Client
pnpm db:generate
```

**Issue: Database migration failing**
```bash
# Solution: Reset database (development only!)
pnpm prisma db push --force-reset
```

**Issue: TypeScript errors in Prisma queries**
```typescript
// Problem: Type inference not working
const client = await prisma.client.findUnique({ where: { id } })

// Solution: Use include/select to help TypeScript
const client = await prisma.client.findUnique({
  where: { id },
  include: { projects: true }
})
```

**Issue: NextAuth session not persisting**
```typescript
// Check: NEXTAUTH_SECRET is set correctly in .env
// Check: NEXTAUTH_URL matches your app URL
```

**Issue: Test mocks not working**
```typescript
// Ensure you're importing from the setup file
import { prismaMock } from '../setup'

// Reset mocks in beforeEach
beforeEach(() => {
  jest.clearAllMocks()
})
```

**Issue: React Query not updating after mutation**
```typescript
// Make sure to invalidate queries
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['clients'] })
}
```

### Performance Tips

1. **Use parallel queries when possible:**
```typescript
const [clients, projects, invoices] = await Promise.all([
  prisma.client.findMany(),
  prisma.project.findMany(),
  prisma.invoice.findMany()
])
```

2. **Select only needed fields:**
```typescript
const clients = await prisma.client.findMany({
  select: {
    id: true,
    name: true,
    email: true
    // Don't select unnecessary fields
  }
})
```

3. **Use database indexes** (already defined in schema):
```prisma
@@index([userId])
@@index([status])
@@index([createdAt])
```

4. **Implement pagination** for large lists

5. **Use React Query staleTime** to reduce unnecessary refetches:
```typescript
useQuery({
  queryKey: ['clients'],
  queryFn: fetchClients,
  staleTime: 60000 // 1 minute
})
```

---

## Additional Resources

### Internal Documentation
- **README.md** - Project overview and setup instructions
- **tests/README.md** - Comprehensive testing guide
- **prisma/schema.prisma** - Full database schema with comments

### External Resources
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zod Documentation](https://zod.dev)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)

---

## Version History

- **1.0.0** (2026-01-15) - Initial CLAUDE.md creation
  - Comprehensive documentation of project structure
  - Development workflows and conventions
  - API patterns and testing guidelines
  - Common tasks and troubleshooting guide

---

**Notes for AI Assistants:**

1. **Always read this file first** when working with this codebase
2. **Follow the established patterns** - consistency is crucial
3. **Write tests** for new features (70% coverage requirement)
4. **Use TypeScript strictly** - no `any` types unless absolutely necessary
5. **Validate all inputs** with Zod schemas
6. **Check authentication** on all API routes
7. **Log activities** for audit trail
8. **Use transactions** for related database operations
9. **Handle errors gracefully** with user-friendly messages
10. **Keep documentation updated** when making structural changes

This codebase prioritizes **type safety**, **maintainability**, and **developer experience**. When in doubt, ask for clarification rather than guessing implementation details.
