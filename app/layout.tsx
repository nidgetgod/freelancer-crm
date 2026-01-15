import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'FreelancerCRM - 自由工作者的客戶管理系統',
    template: '%s | FreelancerCRM',
  },
  description: '專為自由工作者打造的輕量級客戶關係管理系統，整合客戶管理、專案追蹤、發票開立於一體。',
  keywords: ['CRM', '自由工作者', '客戶管理', '發票', '專案管理'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
