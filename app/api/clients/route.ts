import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createClientSchema } from '@/lib/validations/client'

// GET /api/clients - 取得客戶列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const archived = searchParams.get('archived') === 'true'

    const where = {
      userId: session.user.id,
      archivedAt: archived ? { not: null } : null,
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { company: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          _count: { select: { projects: true, invoices: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: clients.map(client => ({
        ...client,
        tags: client.tags.map(t => t.tag),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/clients error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// POST /api/clients - 建立新客戶
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // 驗證
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
              message: e.message,
            })),
          },
        },
        { status: 400 }
      )
    }

    const { tagIds, ...data } = result.data

    // 檢查方案限制（Free 方案最多 5 個客戶）
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (subscription?.plan === 'FREE') {
      const clientsCount = await prisma.client.count({
        where: { userId: session.user.id, archivedAt: null },
      })
      
      if (clientsCount >= 5) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PLAN_LIMIT_REACHED',
              message: '免費方案最多可建立 5 位客戶，請升級方案',
            },
          },
          { status: 422 }
        )
      }
    }

    // 建立客戶
    const client = await prisma.client.create({
      data: {
        ...data,
        userId: session.user.id,
        ...(tagIds?.length && {
          tags: {
            create: tagIds.map(tagId => ({ tagId })),
          },
        }),
      },
      include: {
        tags: { include: { tag: true } },
      },
    })

    // 記錄活動
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATED',
        entityType: 'CLIENT',
        entityId: client.id,
        entityName: client.name,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          ...client,
          tags: client.tags.map(t => t.tag),
        },
      },
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
