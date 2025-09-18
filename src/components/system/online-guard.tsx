"use client"

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

export function OnlineGuard() {
  const t = useTranslations('network')
  // 注意：服务端渲染阶段没有 navigator；为避免 SSR/CSR 初渲染不一致，这里先用 null 占位，
  // 等客户端挂载后再读取 navigator.onLine 并注册事件。
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  // online 为 null（尚未挂载）或 true（在线）时不渲染覆盖层，仅在明确离线(false)时渲染
  if (online !== false) return null

  return (
    <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
        <div className="text-2xl font-bold mb-2">{t('offlineTitle')}</div>
        <div className="text-sm text-gray-600 mb-4">{t('offlineDesc')}</div>
        <div className="flex items-center justify-center gap-2">
          <button
            className="px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700"
            onClick={() => location.reload()}
          >
            {t('retry')}
          </button>
        </div>
      </div>
    </div>
  )
}
