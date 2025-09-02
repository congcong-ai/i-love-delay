'use client'

import { useEffect, useState } from 'react'
import { initDatabase } from '@/lib/db'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    initDatabase()
  }, [])

  // 防止hydration错误，在客户端挂载前不渲染
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}