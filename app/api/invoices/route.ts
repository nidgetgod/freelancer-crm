import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createInvoiceSchema } from '@/lib/validations/invoice'

// GET /api/invoices - 取得發票列表
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')
    const overdue = searchParams.get('overdue') === 'true'

    const where: any = {
      userId: session.user.id,
      ...(status && { status }),
      ...(clientId && { clientId }),
      ...(projectId && { projectId }),
    }

    if (overdue) {
      where.status = { in: ['SENT', 'VIEWED'] }
      where.dueDate = { lt: new Date() }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, company: true, email: true }
          },
          project: {
            select: { id: true, name: true }
          },
          _count: {
            select: { items: true, payments: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    // 計算額外資訊
    const data = invoices.map(invoice => {
      const now = new Date()
      const dueDate = new Date(invoice.dueDate)
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isOverdue = daysUntilDue < 0 && ['SENT', 'VIEWED'].includes(invoice.status)
      
      return {
        ...invoice,
        isOverdue,
        daysUntilDue,
      }
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
    console.error('GET /api/invoices error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// POST /api/invoices - 建立發票
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
    const result = createInvoiceSchema.safeParse(body)
    
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

    // 取得用戶設定以產生發票編號
    const settings = await prisma.setting.findUnique({
      where: { userId: session.user.id }
    })

    const invoiceNumber = `${settings?.invoicePrefix || 'INV'}-${String(settings?.invoiceNextNumber || 1).padStart(4, '0')}`

    // 計算金額
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = subtotal * (data.taxRate / 100)
    const total = subtotal + taxAmount - (data.discount || 0)

    // 建立發票
    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        clientId: data.clientId,
        projectId: data.projectId,
        invoiceNumber,
        status: 'DRAFT',
        issueDate: new Date(),
        dueDate: new Date(data.dueDate),
        subtotal,
        taxRate: data.taxRate,
        taxAmount,
        discount: data.discount || 0,
        total,
        currency: data.currency || 'TWD',
        notes: data.notes,
        terms: data.terms,
        footer: data.footer,
        items: {
          create: items.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            sortOrder: index,
          }))
        }
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
        items: true,
      }
    })

    // 更新發票編號
    if (settings) {
      await prisma.setting.update({
        where: { userId: session.user.id },
        data: { invoiceNextNumber: (settings.invoiceNextNumber || 1) + 1 }
      })
    }

    // 記錄活動
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        action: 'CREATED',
        entityType: 'INVOICE',
        entityId: invoice.id,
        entityName: invoice.invoiceNumber,
      }
    })

    return NextResponse.json({ success: true, data: invoice }, { status: 201 })
  } catch (error) {
    console.error('POST /api/invoices error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}
