import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/dashboard/stats - 取得統計數據
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    const thisYearStart = new Date(today.getFullYear(), 0, 1)

    const [
      // 客戶統計
      totalClients,
      activeClients,
      leadClients,
      
      // 專案統計
      totalProjects,
      inProgressProjects,
      completedProjects,
      
      // 任務統計
      pendingTasks,
      dueTodayTasks,
      overdueTasks,
      
      // 發票統計
      draftInvoices,
      sentInvoices,
      overdueInvoices,
      
      // 收入統計
      thisMonthRevenue,
      lastMonthRevenue,
      thisYearRevenue,
      totalOutstanding,
    ] = await Promise.all([
      // 客戶
      prisma.client.count({ where: { userId, archivedAt: null } }),
      prisma.client.count({ where: { userId, archivedAt: null, status: 'ACTIVE' } }),
      prisma.client.count({ where: { userId, archivedAt: null, status: 'LEAD' } }),
      
      // 專案
      prisma.project.count({ where: { userId, archivedAt: null } }),
      prisma.project.count({ where: { userId, archivedAt: null, status: 'IN_PROGRESS' } }),
      prisma.project.count({ where: { userId, archivedAt: null, status: 'COMPLETED' } }),
      
      // 任務
      prisma.task.count({ where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } } }),
      prisma.task.count({ 
        where: { 
          userId, 
          status: { notIn: ['DONE', 'CANCELLED'] },
          dueDate: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
        } 
      }),
      prisma.task.count({ 
        where: { 
          userId, 
          status: { notIn: ['DONE', 'CANCELLED'] },
          dueDate: { lt: today }
        } 
      }),
      
      // 發票
      prisma.invoice.count({ where: { userId, status: 'DRAFT' } }),
      prisma.invoice.count({ where: { userId, status: { in: ['SENT', 'VIEWED'] } } }),
      prisma.invoice.count({ 
        where: { 
          userId, 
          status: { in: ['SENT', 'VIEWED'] },
          dueDate: { lt: today }
        } 
      }),
      
      // 收入
      prisma.invoice.aggregate({
        where: { userId, status: 'PAID', paidAt: { gte: thisMonthStart } },
        _sum: { amountPaid: true }
      }),
      prisma.invoice.aggregate({
        where: { userId, status: 'PAID', paidAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { amountPaid: true }
      }),
      prisma.invoice.aggregate({
        where: { userId, status: 'PAID', paidAt: { gte: thisYearStart } },
        _sum: { amountPaid: true }
      }),
      prisma.invoice.aggregate({
        where: { userId, status: { in: ['SENT', 'VIEWED', 'PARTIAL', 'OVERDUE'] } },
        _sum: { total: true }
      }),
    ])

    // 計算成長率
    const thisMonthAmount = Number(thisMonthRevenue._sum.amountPaid || 0)
    const lastMonthAmount = Number(lastMonthRevenue._sum.amountPaid || 0)
    const growth = lastMonthAmount > 0 
      ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount * 100)
      : (thisMonthAmount > 0 ? 100 : 0)

    return NextResponse.json({
      success: true,
      data: {
        clients: {
          total: totalClients,
          active: activeClients,
          leads: leadClients,
        },
        projects: {
          total: totalProjects,
          inProgress: inProgressProjects,
          completed: completedProjects,
        },
        tasks: {
          pending: pendingTasks,
          dueToday: dueTodayTasks,
          overdue: overdueTasks,
        },
        invoices: {
          draft: draftInvoices,
          sent: sentInvoices,
          overdue: overdueInvoices,
          totalOutstanding: Number(totalOutstanding._sum.total || 0),
        },
        revenue: {
          thisMonth: thisMonthAmount,
          lastMonth: lastMonthAmount,
          thisYear: Number(thisYearRevenue._sum.amountPaid || 0),
          growth: Math.round(growth * 10) / 10,
        },
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard/stats error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } },
      { status: 500 }
    )
  }
}
