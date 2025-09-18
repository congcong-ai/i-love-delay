'use client'

import { useEffect, useState } from 'react'
import { initDatabase } from '@/lib/db'
import { useAuthStore } from '@/lib/stores/auth-store'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const setToken = useAuthStore(s => s.setToken)

  useEffect(() => {
    setMounted(true)
    initDatabase()
    // 壳通过 URL 注入 token: https://host/path?app_token=xxx
    try {
      const url = new URL(window.location.href)
      const t = url.searchParams.get('app_token')
      if (t) {
        // 立即消费一次，避免重复处理
        url.searchParams.delete('app_token')
        // 不刷新页面，直接设置 token
        setToken(t)
        // 同时更新地址栏（去除 token），避免泄露
        const clean = url.pathname + (url.search ? '?' + url.searchParams.toString() : '') + url.hash
        window.history.replaceState(null, '', clean)
      }
    } catch {}
  }, [])

  // 防止hydration错误，在客户端挂载前不渲染
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}