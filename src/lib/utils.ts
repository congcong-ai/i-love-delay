import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 安全的日期格式化函数，避免水合错误
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  // 使用 ISO 字符串格式确保服务器端和客户端一致
  return d.toISOString().split('T')[0]
}

// 格式化为可读的日期字符串
export function formatDateLocale(date: Date | string, locale = 'zh-CN'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  // 避免直接使用 toLocaleDateString，使用固定格式
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  if (locale === 'zh-CN') {
    return `${year}年${month}月${day}日`
  }
  return `${year}-${month}-${day}`
}
