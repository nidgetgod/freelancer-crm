'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  CheckSquare,
  Settings,
  CreditCard,
} from 'lucide-react'

const navigation = [
  { name: '總覽', href: '/', icon: LayoutDashboard },
  { name: '客戶', href: '/clients', icon: Users },
  { name: '專案', href: '/projects', icon: FolderKanban },
  { name: '發票', href: '/invoices', icon: FileText },
  { name: '任務', href: '/tasks', icon: CheckSquare },
]

const bottomNavigation = [
  { name: '設定', href: '/settings', icon: Settings },
  { name: '方案', href: '/settings/billing', icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-lg font-bold text-primary-foreground">F</span>
        </div>
        <span className="text-lg font-semibold">FreelancerCRM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t p-4">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
