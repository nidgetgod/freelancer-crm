import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 開始建立種子資料...')

  // 清除現有資料
  console.log('清除現有資料...')
  await prisma.activity.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.communication.deleteMany()
  await prisma.task.deleteMany()
  await prisma.tagsOnProjects.deleteMany()
  await prisma.tagsOnClients.deleteMany()
  await prisma.project.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.client.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // 建立測試用戶
  console.log('建立測試用戶...')
  const hashedPassword = await hash('password123', 12)
  
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      password: hashedPassword,
      name: '王小明',
      phone: '0912-345-678',
      businessName: '小明設計工作室',
      businessEmail: 'contact@xiaoming-design.com',
      businessAddress: '台北市信義區信義路五段7號',
      taxId: '12345678',
    },
  })

  // 建立設定
  console.log('建立用戶設定...')
  await prisma.setting.create({
    data: {
      userId: user.id,
      invoicePrefix: 'INV',
      invoiceNextNumber: 1005,
      defaultPaymentTerms: 30,
      defaultTaxRate: 5,
      invoiceNotes: '感謝您的惠顧！',
      invoiceTerms: '請於期限內完成付款，逾期將加收滯納金。',
    },
  })

  // 建立訂閱
  await prisma.subscription.create({
    data: {
      userId: user.id,
      plan: 'SOLO',
      status: 'ACTIVE',
    },
  })

  // 建立標籤
  console.log('建立標籤...')
  const tags = await Promise.all([
    prisma.tag.create({ data: { userId: user.id, name: 'VIP', color: '#f59e0b' } }),
    prisma.tag.create({ data: { userId: user.id, name: '長期合作', color: '#10b981' } }),
    prisma.tag.create({ data: { userId: user.id, name: '新客戶', color: '#6366f1' } }),
    prisma.tag.create({ data: { userId: user.id, name: '急件', color: '#ef4444' } }),
    prisma.tag.create({ data: { userId: user.id, name: '設計', color: '#8b5cf6' } }),
    prisma.tag.create({ data: { userId: user.id, name: '開發', color: '#06b6d4' } }),
  ])

  // 建立客戶
  console.log('建立客戶...')
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        userId: user.id,
        name: '張小華',
        email: 'xiaohua@abctech.com',
        phone: '0922-111-222',
        company: 'ABC 科技有限公司',
        website: 'https://abctech.com',
        status: 'ACTIVE',
        source: '朋友推薦',
        notes: '主要聯絡人，決策速度快。喜歡簡潔的設計風格。',
        address: '台北市內湖區瑞光路100號',
        city: '台北市',
        postalCode: '114',
        paymentTerms: 30,
        tags: {
          create: [
            { tagId: tags[0].id },
            { tagId: tags[1].id },
          ],
        },
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        name: '李大明',
        email: 'daming@xyzmarketing.com',
        phone: '0933-222-333',
        company: 'XYZ 行銷公司',
        status: 'ACTIVE',
        source: 'LinkedIn',
        notes: '對社群行銷很有想法，希望能長期合作。',
        address: '台北市大安區敦化南路200號',
        city: '台北市',
        tags: {
          create: [
            { tagId: tags[2].id },
          ],
        },
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        name: '陳美麗',
        email: 'meili@startup.io',
        phone: '0944-333-444',
        company: '新創科技',
        status: 'LEAD',
        source: '網站詢問',
        notes: '創業初期，預算有限但潛力大。',
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        name: '林志偉',
        email: 'chihwei@consulting.com',
        phone: '0955-444-555',
        company: '志偉顧問',
        status: 'PROSPECT',
        source: '展覽活動',
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        name: '黃雅婷',
        email: 'yating@fashionbrand.com',
        phone: '0966-555-666',
        company: '雅婷時尚',
        status: 'COMPLETED',
        source: 'Instagram',
        tags: {
          create: [
            { tagId: tags[1].id },
          ],
        },
      },
    }),
  ])

  // 建立專案
  console.log('建立專案...')
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        userId: user.id,
        clientId: clients[0].id,
        name: '企業官網改版',
        description: '重新設計公司官網，包含 RWD 響應式設計、SEO 優化、以及後台管理系統。',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-02-28'),
        budget: 150000,
        estimatedHours: 80,
        trackedHours: 32,
        tags: {
          create: [
            { tagId: tags[3].id },
            { tagId: tags[5].id },
          ],
        },
      },
    }),
    prisma.project.create({
      data: {
        userId: user.id,
        clientId: clients[0].id,
        name: '品牌 Logo 設計',
        description: '設計全新品牌識別系統，包含 Logo、色彩規範、以及基礎應用設計。',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        startDate: new Date('2025-11-01'),
        dueDate: new Date('2025-12-15'),
        completedAt: new Date('2025-12-10'),
        budget: 50000,
        estimatedHours: 20,
        trackedHours: 18,
        tags: {
          create: [
            { tagId: tags[4].id },
          ],
        },
      },
    }),
    prisma.project.create({
      data: {
        userId: user.id,
        clientId: clients[1].id,
        name: '社群行銷素材',
        description: '製作 Instagram 和 Facebook 行銷圖片，共 20 張，包含節慶活動和產品推廣。',
        status: 'PLANNING',
        priority: 'LOW',
        budget: 30000,
        estimatedHours: 15,
        tags: {
          create: [
            { tagId: tags[4].id },
          ],
        },
      },
    }),
    prisma.project.create({
      data: {
        userId: user.id,
        clientId: clients[4].id,
        name: '電商網站開發',
        description: '建立完整電商平台，包含商品管理、購物車、金流串接。',
        status: 'COMPLETED',
        priority: 'HIGH',
        startDate: new Date('2025-08-01'),
        dueDate: new Date('2025-10-31'),
        completedAt: new Date('2025-10-28'),
        budget: 280000,
        estimatedHours: 150,
        trackedHours: 145,
        tags: {
          create: [
            { tagId: tags[5].id },
          ],
        },
      },
    }),
  ])

  // 建立任務
  console.log('建立任務...')
  await Promise.all([
    prisma.task.create({
      data: {
        userId: user.id,
        projectId: projects[0].id,
        clientId: clients[0].id,
        title: '首頁設計稿',
        description: '完成首頁 UI 設計，包含 Hero 區塊、特色介紹、客戶案例展示',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: new Date('2026-01-15'),
        completedAt: new Date('2026-01-14'),
        estimatedMinutes: 480,
        trackedMinutes: 420,
        sortOrder: 0,
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        projectId: projects[0].id,
        clientId: clients[0].id,
        title: '關於我們頁面',
        description: '設計公司介紹頁面，包含團隊介紹、公司歷史、聯絡資訊',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date('2026-01-20'),
        estimatedMinutes: 240,
        trackedMinutes: 90,
        sortOrder: 1,
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        projectId: projects[0].id,
        clientId: clients[0].id,
        title: '聯絡表單開發',
        description: '開發聯絡表單功能，包含前端驗證、後端 API、Email 通知',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2026-01-25'),
        estimatedMinutes: 180,
        sortOrder: 2,
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        projectId: projects[0].id,
        clientId: clients[0].id,
        title: '響應式設計調整',
        description: '確保所有頁面在手機、平板上的顯示效果',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date('2026-02-10'),
        estimatedMinutes: 360,
        sortOrder: 3,
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        title: '準備報價單',
        description: '給陳美麗的網站開發報價，需要詳細列出功能規格',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date('2026-01-16'),
        clientId: clients[2].id,
        sortOrder: 0,
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        title: '整理作品集',
        description: '更新作品集頁面，加入最近完成的專案',
        status: 'TODO',
        priority: 'LOW',
        dueDate: new Date('2026-01-31'),
        sortOrder: 1,
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        projectId: projects[2].id,
        clientId: clients[1].id,
        title: '收集品牌素材',
        description: '向客戶收集品牌 Logo、色彩規範、產品圖片等素材',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date('2026-01-18'),
        sortOrder: 0,
      },
    }),
  ])

  // 建立發票
  console.log('建立發票...')
  const invoice1 = await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: clients[0].id,
      projectId: projects[1].id,
      invoiceNumber: 'INV-1001',
      status: 'PAID',
      issueDate: new Date('2025-12-15'),
      dueDate: new Date('2026-01-14'),
      paidAt: new Date('2025-12-20'),
      subtotal: 50000,
      taxRate: 5,
      taxAmount: 2500,
      total: 52500,
      amountPaid: 52500,
      notes: 'Logo 設計專案尾款',
      items: {
        create: [
          {
            description: 'Logo 主視覺設計',
            quantity: 1,
            unitPrice: 35000,
            amount: 35000,
            sortOrder: 0,
          },
          {
            description: 'Logo 延伸應用設計（名片、信紙）',
            quantity: 1,
            unitPrice: 15000,
            amount: 15000,
            sortOrder: 1,
          },
        ],
      },
    },
  })

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: 52500,
      method: 'BANK_TRANSFER',
      reference: '12345',
      paidAt: new Date('2025-12-20'),
    },
  })

  const invoice2 = await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: clients[0].id,
      projectId: projects[0].id,
      invoiceNumber: 'INV-1002',
      status: 'SENT',
      issueDate: new Date('2026-01-10'),
      dueDate: new Date('2026-02-09'),
      sentAt: new Date('2026-01-10'),
      subtotal: 75000,
      taxRate: 5,
      taxAmount: 3750,
      total: 78750,
      notes: '官網改版第一期款項（50%）',
      items: {
        create: [
          {
            description: '網站規劃與設計（第一期）',
            quantity: 1,
            unitPrice: 75000,
            amount: 75000,
            sortOrder: 0,
          },
        ],
      },
    },
  })

  const invoice3 = await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: clients[4].id,
      projectId: projects[3].id,
      invoiceNumber: 'INV-1003',
      status: 'PAID',
      issueDate: new Date('2025-10-30'),
      dueDate: new Date('2025-11-29'),
      paidAt: new Date('2025-11-15'),
      subtotal: 280000,
      taxRate: 5,
      taxAmount: 14000,
      total: 294000,
      amountPaid: 294000,
      notes: '電商網站開發完工款',
      items: {
        create: [
          {
            description: '電商網站開發（含商品管理、購物車、金流串接）',
            quantity: 1,
            unitPrice: 250000,
            amount: 250000,
            sortOrder: 0,
          },
          {
            description: '後續維護設定',
            quantity: 1,
            unitPrice: 30000,
            amount: 30000,
            sortOrder: 1,
          },
        ],
      },
    },
  })

  await prisma.payment.create({
    data: {
      invoiceId: invoice3.id,
      amount: 294000,
      method: 'BANK_TRANSFER',
      reference: '67890',
      paidAt: new Date('2025-11-15'),
    },
  })

  await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: clients[1].id,
      projectId: projects[2].id,
      invoiceNumber: 'INV-1004',
      status: 'DRAFT',
      issueDate: new Date('2026-01-14'),
      dueDate: new Date('2026-02-13'),
      subtotal: 30000,
      taxRate: 5,
      taxAmount: 1500,
      total: 31500,
      notes: '社群行銷素材設計',
      items: {
        create: [
          {
            description: '社群貼文圖片設計（20張）',
            quantity: 20,
            unitPrice: 1500,
            amount: 30000,
            sortOrder: 0,
          },
        ],
      },
    },
  })

  // 建立溝通記錄
  console.log('建立溝通記錄...')
  await Promise.all([
    prisma.communication.create({
      data: {
        userId: user.id,
        clientId: clients[0].id,
        type: 'PHONE_CALL',
        subject: '專案進度確認',
        content: '與客戶確認官網改版進度，客戶對目前方向滿意。討論了首頁 Hero 區塊的動畫效果，客戶希望能更簡潔一些。',
        occurredAt: new Date('2026-01-12T14:00:00'),
      },
    }),
    prisma.communication.create({
      data: {
        userId: user.id,
        clientId: clients[0].id,
        type: 'EMAIL',
        subject: '設計稿確認',
        content: '寄出首頁設計稿供客戶確認，包含桌面版和行動版的截圖。',
        occurredAt: new Date('2026-01-14T10:30:00'),
      },
    }),
    prisma.communication.create({
      data: {
        userId: user.id,
        clientId: clients[2].id,
        type: 'EMAIL',
        subject: '初步詢問回覆',
        content: '回覆客戶關於網站開發的詢問，約定下週電話討論需求細節。客戶對響應式設計和 SEO 優化很感興趣。',
        occurredAt: new Date('2026-01-11T16:00:00'),
      },
    }),
    prisma.communication.create({
      data: {
        userId: user.id,
        clientId: clients[1].id,
        type: 'VIDEO_CALL',
        subject: '社群行銷需求討論',
        content: '透過 Google Meet 討論社群行銷素材的設計方向，客戶希望風格更年輕活潑，使用較鮮豔的配色。',
        occurredAt: new Date('2026-01-08T11:00:00'),
      },
    }),
    prisma.communication.create({
      data: {
        userId: user.id,
        clientId: clients[3].id,
        type: 'IN_PERSON',
        subject: '展覽認識',
        content: '在數位行銷展覽認識，對方是顧問公司負責人，對網站服務有興趣，交換了名片。',
        occurredAt: new Date('2026-01-05T15:30:00'),
      },
    }),
  ])

  // 建立活動日誌
  console.log('建立活動日誌...')
  await Promise.all([
    prisma.activity.create({
      data: {
        userId: user.id,
        action: 'CREATED',
        entityType: 'CLIENT',
        entityId: clients[0].id,
        entityName: clients[0].name,
        createdAt: new Date('2025-10-01'),
      },
    }),
    prisma.activity.create({
      data: {
        userId: user.id,
        action: 'CREATED',
        entityType: 'PROJECT',
        entityId: projects[0].id,
        entityName: projects[0].name,
        createdAt: new Date('2025-12-20'),
      },
    }),
    prisma.activity.create({
      data: {
        userId: user.id,
        action: 'PAID',
        entityType: 'INVOICE',
        entityId: invoice1.id,
        entityName: invoice1.invoiceNumber,
        metadata: { amount: 52500 },
        createdAt: new Date('2025-12-20'),
      },
    }),
    prisma.activity.create({
      data: {
        userId: user.id,
        action: 'SENT',
        entityType: 'INVOICE',
        entityId: invoice2.id,
        entityName: invoice2.invoiceNumber,
        createdAt: new Date('2026-01-10'),
      },
    }),
    prisma.activity.create({
      data: {
        userId: user.id,
        action: 'PAID',
        entityType: 'INVOICE',
        entityId: invoice3.id,
        entityName: invoice3.invoiceNumber,
        metadata: { amount: 294000 },
        createdAt: new Date('2025-11-15'),
      },
    }),
  ])

  console.log('✅ 種子資料建立完成！')
  console.log('')
  console.log('📧 測試帳號：')
  console.log('   Email: demo@example.com')
  console.log('   密碼:  password123')
  console.log('')
  console.log('📊 已建立：')
  console.log(`   - ${tags.length} 個標籤`)
  console.log(`   - ${clients.length} 位客戶`)
  console.log(`   - ${projects.length} 個專案`)
  console.log('   - 7 個任務')
  console.log('   - 4 張發票')
  console.log('   - 5 筆溝通記錄')
}

main()
  .catch((e) => {
    console.error('❌ 種子資料建立失敗:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
