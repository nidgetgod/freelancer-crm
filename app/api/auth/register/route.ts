import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const registerSchema = z.object({
  name: z.string().min(1, '請輸入姓名'),
  email: z.string().email('請輸入有效的 Email'),
  password: z.string().min(8, '密碼至少需要 8 個字元'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '請求資料驗證失敗',
            details: result.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        },
        { status: 400 }
      )
    }

    const { name, email, password } = result.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: '此 Email 已被註冊',
          },
        },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    // Create default settings
    await prisma.setting.create({
      data: {
        userId: user.id,
      },
    })

    // Create free subscription
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'FREE',
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/auth/register error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '伺服器錯誤',
        },
      },
      { status: 500 }
    )
  }
}
