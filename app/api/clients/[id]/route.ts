import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateClientSchema } from '@/lib/validations/client'

// GET /api/clients/[id] - 取得單一客戶
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

    const { searchParams } = new URL(request.url)
    const include = searchParams.get('include')?.split(',') || []

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        tags: { include: { tag: true } },
        ...(include.includes('projects') && {
          projects: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              name: true,
              status: true,
              dueDate: true,
              budget: true,
            },
          },
        }),
        ...(include.includes('invoices') && {
          invoices: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              total: true,
              dueDate: true,
            },
          },
        }),
        ...(include.includes('communications') && {
          communications: {
            orderBy: { occurredAt: 'desc' },
            take: 10,
          },
        }),
        _count: {
          select: {
            projects: true,
            invoices: true,
            tasks: true,
            communications: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '客戶不存在' } },
        { status: 404 }
      )
    }

    // 計算統計資料
    const [invoiceStats] = await Promise.all([
      prisma.invoice.aggregate({
        where: { clientId: params.id, userId: session.user.id },
        _sum: { total: true, amountPaid: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        ...client,
        tags: client.tags.map(t => t.tag),
        stats: {
          totalProjects: client._count.projects,
          totalInvoiced: invoiceStats._sum.total || 0,
          totalPaid: invoiceStats._sum.amountPaid || 0,
          outstandingBalance:
            Number(invoiceStats._sum.total || 0) -
            Number(invoiceStats._sum.amountPaid || 0),
        },
      },
    })
  } catch (error) {
    console.error('GET /api/clients/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - 更新客戶
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

    // 檢查客戶是否存在
    const existingClient = await prisma.client.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '客戶不存在' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    
    // 驗證
    const result = updateClientSchema.safeParse(body)
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

    // 更新客戶
    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(tagIds !== undefined && {
          tags: {
            deleteMany: {},
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
        action: 'UPDATED',
        entityType: 'CLIENT',
        entityId: client.id,
        entityName: client.name,
        metadata: { changes: Object.keys(data) },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...client,
        tags: client.tags.map(t => t.tag),
      },
    })
  } catch (error) {
    console.error('PUT /api/clients/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - 刪除客戶
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

    // 檢查客戶是否存在
    const client = await prisma.client.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        _count: {
          select: { projects: true, invoices: true },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '客戶不存在' } },
        { status: 404 }
      )
    }

    // 檢查是否有關聯資料
    if (client._count.projects > 0 || client._count.invoices > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_DEPENDENCIES',
            message: '此客戶有關聯的專案或發票，請先刪除或轉移',
          },
        },
        { status: 409 }
      )
    }

    // 刪除客戶
    await prisma.client.delete({
      where: { id: params.id },
    })

    // 記錄活動
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        action: 'DELETED',
        entityType: 'CLIENT',
        entityId: params.id,
        entityName: client.name,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/clients/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}
