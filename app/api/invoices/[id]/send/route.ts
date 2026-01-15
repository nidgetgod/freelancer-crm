import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const sendInvoiceSchema = z.object({
  to: z.string().email('請輸入有效的 Email'),
  cc: z.array(z.string().email()).optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
})

// POST /api/invoices/:id/send - 發送發票
export async function POST(
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
      where: { id: params.id, userId: session.user.id },
      include: {
        client: true,
        items: true,
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '找不到此發票' } },
        { status: 404 }
      )
    }

    // 只能發送草稿發票
    if (invoice.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '此發票已經發送過了' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const result = sendInvoiceSchema.safeParse(body)
    
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

    // TODO: 發送 Email (使用 Resend)
    // const { to, cc, subject, message } = result.data
    // await sendInvoiceEmail({ invoice, to, cc, subject, message })

    // 更新發票狀態
    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      }
    })

    // 記錄活動
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        action: 'SENT',
        entityType: 'INVOICE',
        entityId: invoice.id,
        entityName: invoice.invoiceNumber,
        metadata: { to: result.data.to },
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedInvoice.id,
        status: updatedInvoice.status,
        sentAt: updatedInvoice.sentAt,
      },
      message: '發票已發送成功'
    })
  } catch (error) {
    console.error('POST /api/invoices/[id]/send error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}
