'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { syncManager } from '@/lib/sync-manager'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [pendingChanges, setPendingChanges] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 初始状态
    setIsOnline(navigator.onLine)

    // 定期更新同步状态
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
    if (!date) return '从未同步'
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
    return `${Math.floor(minutes / 1440)}天前`
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {/* 网络状态 */}
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
          {isOnline ? '在线' : '离线'}
        </span>
      </div>

      {/* 同步状态 */}
      {isOnline && (
        <>
          <span className="text-xs text-gray-500">
            上次同步: {formatLastSync(lastSyncTime)}
          </span>
          
          {pendingChanges > 0 && (
            <span className="text-xs text-orange-500">
              {pendingChanges}项待同步
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
            {isSyncing ? '同步中...' : '立即同步'}
          </Button>
        </>
      )}
    </div>
  )
}