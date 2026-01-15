import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createProjectSchema } from '@/lib/validations/project'

// GET /api/projects - 取得專案列表
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
    const clientId = searchParams.get('clientId')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where = {
      userId: session.user.id,
      archivedAt: null,
      ...(status && { status: status as any }),
      ...(clientId && { clientId }),
      ...(priority && { priority: priority as any }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, company: true },
          },
          tags: { include: { tag: true } },
          _count: { select: { tasks: true, invoices: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.project.count({ where }),
    ])

    // 計算進度
    const projectsWithProgress = projects.map(project => {
      const progress = project.estimatedHours
        ? Math.min(100, Math.round((project.trackedHours / project.estimatedHours) * 100))
        : 0

      return {
        ...project,
        tags: project.tags.map(t => t.tag),
        progress,
      }
    })

    return NextResponse.json({
      success: true,
      data: projectsWithProgress,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/projects error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// POST /api/projects - 建立新專案
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
    const result = createProjectSchema.safeParse(body)
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

    // 確認客戶存在
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, userId: session.user.id },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '客戶不存在' } },
        { status: 404 }
      )
    }

    // 建立專案
    const project = await prisma.project.create({
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
        client: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
      },
    })

    // 記錄活動
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATED',
        entityType: 'PROJECT',
        entityId: project.id,
        entityName: project.name,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          ...project,
          tags: project.tags.map(t => t.tag),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/projects error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}
