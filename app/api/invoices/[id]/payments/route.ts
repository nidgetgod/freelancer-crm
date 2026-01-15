import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const recordPaymentSchema = z.object({
  amount: z.number().positive('金額必須大於 0'),
  method: z.enum(['BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'CHECK', 'PAYPAL', 'STRIPE', 'OTHER']),
  reference: z.string().max(100).optional(),
  paidAt: z.string().optional(),
  notes: z.string().max(500).optional(),
})

// POST /api/invoices/:id/payments - 記錄付款
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
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '找不到此發票' } },
        { status: 404 }
      )
    }

    // 檢查發票狀態
    if (['DRAFT', 'CANCELLED', 'REFUNDED'].includes(invoice.status)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '此發票狀態無法記錄付款' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const result = recordPaymentSchema.safeParse(body)
    
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

    const { amount, method, reference, paidAt, notes } = result.data
    const balance = Number(invoice.total) - Number(invoice.amountPaid)

    // 檢查付款金額
    if (amount > balance) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `付款金額不能超過餘額 ${balance}` } },
        { status: 400 }
      )
    }

    // 建立付款記錄並更新發票
    const [payment, updatedInvoice] = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: params.id,
          amount,
          currency: invoice.currency,
          method,
          reference,
          notes,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        }
      })

      const newAmountPaid = Number(invoice.amountPaid) + amount
      const isPaidInFull = newAmountPaid >= Number(invoice.total)
      
      const updatedInvoice = await tx.invoice.update({
        where: { id: params.id },
        data: {
          amountPaid: newAmountPaid,
          status: isPaidInFull ? 'PAID' : 'PARTIAL',
          ...(isPaidInFull && { paidAt: new Date() }),
        },
        include: {
          payments: { orderBy: { paidAt: 'desc' } },
        }
      })

      return [payment, updatedInvoice]
    })

    // 記錄活動
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        action: 'PAID',
        entityType: 'INVOICE',
        entityId: invoice.id,
        entityName: invoice.invoiceNumber,
        metadata: { amount, method },
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        payment,
        invoice: {
          id: updatedInvoice.id,
          status: updatedInvoice.status,
          amountPaid: updatedInvoice.amountPaid,
          paidAt: updatedInvoice.paidAt,
          payments: updatedInvoice.payments,
        }
      }
    })
  } catch (error) {
    console.error('POST /api/invoices/[id]/payments error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// GET /api/invoices/:id/payments - 取得付款記錄
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
      where: { id: params.id, userId: session.user.id },
      select: { id: true }
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '找不到此發票' } },
        { status: 404 }
      )
    }

    const payments = await prisma.payment.findMany({
      where: { invoiceId: params.id },
      orderBy: { paidAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: payments })
  } catch (error) {
    console.error('GET /api/invoices/[id]/payments error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}
