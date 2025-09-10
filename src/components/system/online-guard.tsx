"use client"

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

export function OnlineGuard() {
  const t = useTranslations('network')
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (online) return null

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
