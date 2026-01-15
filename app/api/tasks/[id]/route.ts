import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateTaskSchema } from '@/lib/validations/task'

// GET /api/tasks/:id - 取得單一任務
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const task = await prisma.task.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      }
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '找不到此任務' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    console.error('GET /api/tasks/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// PUT /api/tasks/:id - 更新任務
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const existing = await prisma.task.findFirst({
      where: { id: params.id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '找不到此任務' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const result = updateTaskSchema.safeParse(body)
    
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

    // 如果狀態變為 DONE，設置完成時間
    let completedAt = existing.completedAt
    if (data.status === 'DONE' && existing.status !== 'DONE') {
      completedAt = new Date()
    } else if (data.status && data.status !== 'DONE') {
      completedAt = null
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.reminderAt !== undefined && { reminderAt: data.reminderAt ? new Date(data.reminderAt) : null }),
        completedAt,
      },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      }
    })

    // 記錄活動
    if (data.status && data.status !== existing.status) {
      await prisma.activity.create({
        data: {
          userId: session.user.id,
          action: 'STATUS_CHANGED',
          entityType: 'TASK',
          entityId: task.id,
          entityName: task.title,
          metadata: { from: existing.status, to: data.status },
        }
      })
    } else {
      await prisma.activity.create({
        data: {
          userId: session.user.id,
          action: 'UPDATED',
          entityType: 'TASK',
          entityId: task.id,
          entityName: task.title,
        }
      })
    }

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    console.error('PUT /api/tasks/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// PATCH /api/tasks/:id - 部分更新任務 (狀態、優先級等)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const existing = await prisma.task.findFirst({
      where: { id: params.id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '找不到此任務' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { status, priority, sortOrder } = body

    // 如果狀態變為 DONE，設置完成時間
    let completedAt = existing.completedAt
    if (status === 'DONE' && existing.status !== 'DONE') {
      completedAt = new Date()
    } else if (status && status !== 'DONE') {
      completedAt = null
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(sortOrder !== undefined && { sortOrder }),
        completedAt,
      },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      }
    })

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    console.error('PATCH /api/tasks/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/:id - 刪除任務
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const existing = await prisma.task.findFirst({
      where: { id: params.id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '找不到此任務' } },
        { status: 404 }
      )
    }

    await prisma.task.delete({ where: { id: params.id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}
