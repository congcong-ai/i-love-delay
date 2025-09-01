'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { syncManager } from '@/lib/sync-manager'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SyncStatus() {
  // 设置安全的默认值，避免水合错误
  const [isOnline, setIsOnline] = useState(true) // 默认假设在线
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [pendingChanges, setPendingChanges] = useState(0)
  const [isClient, setIsClient] = useState(false) // 跟踪是否在客户端
  const t = useTranslations('profile')

  useEffect(() => {
    // 标记为客户端环境
    setIsClient(true)

    if (typeof window === 'undefined') return

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 只在客户端设置实际的网络状态
    setIsOnline(navigator.onLine)

    const interval = setInterval(() => {
      const status = syncManager.getStatus()
      setLastSyncTime(status.lastSyncTime ? new Date(status.lastSyncTime) : null)
      setPendingChanges(status.pendingChanges)
    }, 1000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const handleForceSync = async () => {
    if (!isOnline) return

    setIsSyncing(true)
    try {
      await syncManager.forceSync()
    } finally {
      setIsSyncing(false)
    }
  }

  const formatLastSync = (date: Date | null) => {
    if (!date) return t('neverSynced')

    // 使用固定的时间戳计算，避免水合错误
    if (!isClient) {
      // 服务器端渲染时显示默认状态
      return t('neverSynced')
    }

    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return t('justNow')
    if (minutes < 60) return t('minutesAgo', { minutes })
    if (minutes < 1440) return t('hoursAgo', { hours: Math.floor(minutes / 60) })
    return t('daysAgo', { days: Math.floor(minutes / 1440) })
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {/* Network status */}
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
        <span className={cn(
          'text-xs',
          isOnline ? 'text-green-600' : 'text-red-600'
        )}>
          {isOnline ? t('online') : t('offline')}
        </span>
      </div>

      {/* Sync status */}
      {isOnline && (
        <>
          <span className="text-xs text-gray-500">
            {t('lastSync')}: {formatLastSync(lastSyncTime)}
          </span>

          {pendingChanges > 0 && (
            <span className="text-xs text-orange-500">
              {t('pendingChanges', { count: pendingChanges })}
            </span>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleForceSync}
            disabled={isSyncing || !isOnline}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className={cn(
              'w-3 h-3 mr-1',
              isSyncing && 'animate-spin'
            )} />
            {isSyncing ? t('syncing') : t('forceSync')}
          </Button>
        </>
      )}
    </div>
  )
}