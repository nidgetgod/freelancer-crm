import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: string = 'TWD',
  locale: string = 'zh-TW'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  return new Date(date).toLocaleDateString('zh-TW', options)
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInMs = now.getTime() - targetDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return '今天'
  if (diffInDays === 1) return '昨天'
  if (diffInDays < 7) return `${diffInDays} 天前`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} 週前`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} 個月前`
  return `${Math.floor(diffInDays / 365)} 年前`
}

export function generateInvoiceNumber(prefix: string, number: number): string {
  return `${prefix}-${number.toString().padStart(4, '0')}`
}

export function calculateDaysUntilDue(dueDate: Date | string): number {
  const now = new Date()
  const due = new Date(dueDate)
  const diffInMs = due.getTime() - now.getTime()
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24))
}

export function isOverdue(dueDate: Date | string): boolean {
  return calculateDaysUntilDue(dueDate) < 0
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
