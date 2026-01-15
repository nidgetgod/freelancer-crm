import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateProjectSchema = z.object({
  clientId: z.string().min(1).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  startDate: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  budget: z.coerce.number().min(0).optional().nullable(),
  hourlyRate: z.coerce.number().min(0).optional().nullable(),
  estimatedHours: z.coerce.number().min(0).optional().nullable(),
})

// GET /api/projects/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true }
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: { tag: true }
        },
        _count: {
          select: { tasks: true, invoices: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '專案不存在' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        tags: project.tags.map(t => t.tag),
      }
    })
  } catch (error) {
    console.error('GET /api/projects/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const existingProject = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id }
    })

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '專案不存在' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const result = updateProjectSchema.safeParse(body)

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

    // 如果狀態變更為 COMPLETED，設置完成時間
    const completedAt = data.status === 'COMPLETED' && existingProject.status !== 'COMPLETED'
      ? new Date()
      : data.status !== 'COMPLETED'
        ? null
        : existingProject.completedAt

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...data,
        completedAt,
      },
      include: {
        client: {
          select: { id: true, name: true }
        }
      }
    })

    // 記錄活動
    if (data.status && data.status !== existingProject.status) {
      await prisma.activity.create({
        data: {
          userId: session.user.id,
          action: 'STATUS_CHANGED',
          entityType: 'PROJECT',
          entityId: project.id,
          entityName: project.name,
          metadata: { from: existingProject.status, to: data.status },
        },
      })
    } else {
      await prisma.activity.create({
        data: {
          userId: session.user.id,
          action: 'UPDATED',
          entityType: 'PROJECT',
          entityId: project.id,
          entityName: project.name,
        },
      })
    }

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error('PUT /api/projects/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        _count: { select: { invoices: true } }
      }
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '專案不存在' } },
        { status: 404 }
      )
    }

    // 檢查是否有發票關聯
    if (project._count.invoices > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_DEPENDENCIES',
            message: '此專案有關聯的發票，請先刪除發票'
          }
        },
        { status: 409 }
      )
    }

    // 刪除相關任務
    await prisma.task.deleteMany({
      where: { projectId: params.id }
    })

    // 刪除專案標籤關聯
    await prisma.tagsOnProjects.deleteMany({
      where: { projectId: params.id }
    })

    // 刪除專案
    await prisma.project.delete({
      where: { id: params.id }
    })

    // 記錄活動
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        action: 'DELETED',
        entityType: 'PROJECT',
        entityId: project.id,
        entityName: project.name,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}
