import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTaskSchema } from '@/lib/validations/task'

// GET /api/tasks - 取得任務列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')
    const clientId = searchParams.get('clientId')
    const priority = searchParams.get('priority')
    const dueToday = searchParams.get('dueToday') === 'true'
    const overdue = searchParams.get('overdue') === 'true'

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const where: any = {
      userId: session.user.id,
      ...(status && { status }),
      ...(projectId && { projectId }),
      ...(clientId && { clientId }),
      ...(priority && { priority }),
    }

    if (dueToday) {
      where.dueDate = { gte: today, lt: tomorrow }
      where.status = { not: 'DONE' }
    }

    if (overdue) {
      where.dueDate = { lt: today }
      where.status = { notIn: ['DONE', 'CANCELLED'] }
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
        },
        orderBy: [
          { sortOrder: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ])

    // 標記逾期任務
    const data = tasks.map(task => {
      const isOverdue = task.dueDate && 
        new Date(task.dueDate) < today && 
        !['DONE', 'CANCELLED'].includes(task.status)
      
      return { ...task, isOverdue }
    })

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/tasks error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// POST /api/tasks - 建立任務
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = createTaskSchema.safeParse(body)
    
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

    const data = result.data

    // 取得最大排序值
    const maxSortOrder = await prisma.task.aggregate({
      where: { userId: session.user.id, projectId: data.projectId },
      _max: { sortOrder: true },
    })

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title: data.title,
        description: data.description,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId,
        clientId: data.clientId,
        estimatedMinutes: data.estimatedMinutes,
        reminderAt: data.reminderAt ? new Date(data.reminderAt) : null,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      }
    })

    // 記錄活動
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATED',
        entityType: 'TASK',
        entityId: task.id,
        entityName: task.title,
      }
    })

    return NextResponse.json({ success: true, data: task }, { status: 201 })
  } catch (error) {
    console.error('POST /api/tasks error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}
