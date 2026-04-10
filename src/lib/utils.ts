import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getMonthName(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

export function getLast6Months(): string[] {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push(d.toISOString().slice(0, 7))
  }
  return months
}

export const CATEGORY_ICONS: Record<string, string> = {
  briefcase: '💼',
  laptop: '💻',
  'trending-up': '📈',
  'plus-circle': '➕',
  utensils: '🍽️',
  car: '🚗',
  'shopping-bag': '🛍️',
  film: '🎬',
  heart: '❤️',
  home: '🏠',
  book: '📚',
  zap: '⚡',
  circle: '⭕',
  wallet: '👛',
  coffee: '☕',
  plane: '✈️',
  gift: '🎁',
  music: '🎵',
  gamepad: '🎮',
  phone: '📱',
}
