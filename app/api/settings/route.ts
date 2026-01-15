import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  invoicePrefix: z.string().min(1).max(10).optional(),
  defaultPaymentTerms: z.number().min(0).max(365).optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  invoiceNotes: z.string().max(2000).optional(),
  invoiceTerms: z.string().max(2000).optional(),
  invoiceFooter: z.string().max(1000).optional(),
  emailNotifications: z.boolean().optional(),
  reminderDaysBefore: z.number().min(0).max(30).optional(),
})

// GET /api/settings - 取得用戶設定
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    let settings = await prisma.setting.findUnique({
      where: { userId: session.user.id }
    })

    // 如果沒有設定，建立預設設定
    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          userId: session.user.id,
          invoicePrefix: 'INV',
          invoiceNextNumber: 1,
          defaultPaymentTerms: 30,
          defaultTaxRate: 0,
        }
      })
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// PUT /api/settings - 更新用戶設定
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = updateSettingsSchema.safeParse(body)
    
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

    const settings = await prisma.setting.upsert({
      where: { userId: session.user.id },
      update: result.data,
      create: {
        userId: session.user.id,
        ...result.data,
      }
    })

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}
