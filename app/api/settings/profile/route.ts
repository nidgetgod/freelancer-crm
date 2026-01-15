import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  businessName: z.string().max(100).optional(),
  businessEmail: z.string().email().optional().or(z.literal('')),
  businessPhone: z.string().max(20).optional(),
  businessAddress: z.string().max(200).optional(),
  taxId: z.string().max(20).optional(),
  timezone: z.string().max(50).optional(),
  currency: z.string().length(3).optional(),
  locale: z.string().max(10).optional(),
})

// GET /api/settings/profile - 取得個人資料
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
        businessAddress: true,
        taxId: true,
        timezone: true,
        currency: true,
        locale: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '找不到用戶' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('GET /api/settings/profile error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}

// PUT /api/settings/profile - 更新個人資料
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
    const result = updateProfileSchema.safeParse(body)
    
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

    // 處理空字串轉為 null
    const data = Object.fromEntries(
      Object.entries(result.data).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    )

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
        businessAddress: true,
        taxId: true,
        timezone: true,
        currency: true,
        locale: true,
      }
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('PUT /api/settings/profile error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}
