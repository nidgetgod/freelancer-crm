import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateInvoiceSchema } from '@/lib/validations/invoice'

// GET /api/invoices/:id - 取得單一發票
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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '找不到此發票' } },
        { status: 404 }
      )
    }

    // 計算額外資訊
    const now = new Date()
    const dueDate = new Date(invoice.dueDate)
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isOverdue = daysUntilDue < 0 && ['SENT', 'VIEWED'].includes(invoice.status)
    const balance = Number(invoice.total) - Number(invoice.amountPaid)

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        isOverdue,
        daysUntilDue,
        balance,
      }
    })
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// PUT /api/invoices/:id - 更新發票
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

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '找不到此發票' } },
        { status: 404 }
      )
    }

    // 只有草稿可以編輯
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '只能編輯草稿發票' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const result = updateInvoiceSchema.safeParse(body)
    
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

    const { items, ...data } = result.data

    // 如果有更新項目，重新計算金額
    let subtotal = Number(existing.subtotal)
    let taxAmount = Number(existing.taxAmount)
    let total = Number(existing.total)

    if (items) {
      subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
      const taxRate = data.taxRate ?? Number(existing.taxRate)
      taxAmount = subtotal * (taxRate / 100)
      const discount = data.discount ?? Number(existing.discount)
      total = subtotal + taxAmount - discount
    }

    // 更新發票
    const invoice = await prisma.$transaction(async (tx) => {
      // 如果有更新項目，先刪除舊項目
      if (items) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: params.id } })
      }

      return tx.invoice.update({
        where: { id: params.id },
        data: {
          ...data,
          ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
          ...(items && {
            subtotal,
            taxAmount,
            total,
            items: {
              create: items.map((item, index) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.quantity * item.unitPrice,
                sortOrder: index,
              }))
            }
          })
        },
        include: {
          client: { select: { id: true, name: true, company: true } },
          project: { select: { id: true, name: true } },
          items: { orderBy: { sortOrder: 'asc' } },
        }
      })
    })

    // 記錄活動
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        action: 'UPDATED',
        entityType: 'INVOICE',
        entityId: invoice.id,
        entityName: invoice.invoiceNumber,
      }
    })

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error('PUT /api/invoices/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices/:id - 刪除發票
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

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '找不到此發票' } },
        { status: 404 }
      )
    }

    // 只能刪除草稿或已取消的發票
    if (!['DRAFT', 'CANCELLED'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '只能刪除草稿或已取消的發票' } },
        { status: 403 }
      )
    }

    await prisma.invoice.delete({ where: { id: params.id } })

    // 記錄活動
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        action: 'DELETED',
        entityType: 'INVOICE',
        entityId: params.id,
        entityName: existing.invoiceNumber,
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/invoices/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}
