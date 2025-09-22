'use client'

import { useState } from 'react'
import { MessageSquare, Calendar, Share2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useTaskStore } from '@/lib/stores/task-store'
import { useExcuseStore } from '@/lib/stores/excuse-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Task } from '@/lib/types'
import { DelayDetailsDialog } from './delay-details-dialog'
import { useTranslations } from 'next-intl'

interface DelayedTaskItemProps {
  task: Task
  onUpdate?: () => void
}

export function DelayedTaskItem({ task, onUpdate }: DelayedTaskItemProps) {
  const t = useTranslations('delayed')
  const tNet = useTranslations('network')
  const tAuth = useTranslations('auth')
  const [excuse, setExcuse] = useState('')
  const [isAddingExcuse, setIsAddingExcuse] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [showHistoryExcuses, setShowHistoryExcuses] = useState(false)
  const [showDelayDetails, setShowDelayDetails] = useState(false)
  const { updateTaskStatus } = useTaskStore()
  const { addExcuse, getExcusesByTask } = useExcuseStore()
  const { user, isLoggedIn, login } = useAuthStore()

  const excuses = getExcusesByTask(task.id)
  const latestExcuse = excuses[0]
  const historyExcuses = excuses.slice(1) // 除了最新的借口之外的历史借口

  const handleAddExcuse = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert(tNet('offlineDesc'))
      return
    }
    if (!excuse.trim()) return

    setIsAddingExcuse(true)
    await addExcuse(task.id, excuse)
    setExcuse('')
    setIsAddingExcuse(false)
    onUpdate?.()
  }

  const handleMarkCompleted = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert(tNet('offlineDesc'))
      return
    }
    await updateTaskStatus(task.id, 'completed')
    onUpdate?.()
  }

  const handleShareToSquare = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert(tNet('offlineDesc'))
      return
    }
    // 使用实时的鉴权状态，避免闭包中的过期值
    let state = useAuthStore.getState()
    let loggedIn = state.isLoggedIn
    let currentUser = state.user
    let token = state.token

    if (!loggedIn) {
      const confirmLogin = window.confirm(t('shareConfirmLogin'))
      if (!confirmLogin) {
        alert(t('shareCancelled'))
        return
      }
      try {
        await login()
        // 等待登录状态更新
        const checkLogin = () => new Promise<void>((resolve, reject) => {
          const maxAttempts = 20
          let attempts = 0

          const check = () => {
            attempts++
            const s = useAuthStore.getState()
            if (s.isLoggedIn) {
              resolve()
            } else if (attempts >= maxAttempts) {
              reject(new Error(tAuth('loginTimeout')))
            } else {
              setTimeout(check, 500)
            }
          }

          check()
        })

        await checkLogin()
        // 登录成功后刷新一次本地 state 快照
        state = useAuthStore.getState()
        loggedIn = state.isLoggedIn
        currentUser = state.user
        token = state.token
      } catch (error) {
        console.error('login failed:', error)
        alert(t('shareLoginFailed'))
        return
      }
    }

    // 确保有可分享的借口：优先使用最新借口；如没有但输入框有内容，则先添加再分享
    let shareContent = latestExcuse?.content
    if (!shareContent) {
      if (excuse.trim()) {
        const confirmUseInput = window.confirm(t('shareUseInputConfirm'))
        if (!confirmUseInput) {
          alert(t('shareCancelled'))
          return
        }
        try {
          setIsAddingExcuse(true)
          await addExcuse(task.id, excuse.trim())
          shareContent = excuse.trim()
          setExcuse('')
        } finally {
          setIsAddingExcuse(false)
        }
      } else {
        alert(t('shareNeedExcuse'))
        return
      }
    }

    // 再次以最新快照校验用户信息，避免闭包旧值导致“请登录”
    if (!currentUser?.openid || !currentUser?.nickname) {
      alert(t('shareNeedLogin'))
      return
    }

    setIsSharing(true)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch('/api/square/share', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          taskId: task.id,
          taskName: task.name,
          excuse: shareContent,
          delayCount: task.delayCount,
          userId: currentUser.openid,
          userName: currentUser.nickname,
          userAvatar: currentUser.avatar,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert(t('shareSuccess'))
      } else {
        console.error('share failed details:', result)
        throw new Error(result.error || result.message || t('shareFailed'))
      }
    } catch (error) {
      console.error('share failed:', error)
      alert(error instanceof Error ? error.message : t('shareFailedRetry'))
    } finally {
      setIsSharing(false)
    }
  }

  const formatDate = (date: Date) => {
    // 使用固定格式避免水合错误
    const d = new Date(date)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const minute = String(d.getMinutes()).padStart(2, '0')
    return `${month}月${day}日 ${hour}:${minute}`
  }

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900 mb-1">{task.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={14} />
            <button
              type="button"
              onClick={() => setShowDelayDetails(true)}
              className="underline decoration-dotted hover:text-blue-600 focus:outline-none"
              aria-label="view delay details"
            >
              {t('delayCountShort', { count: task.delayCount })}
            </button>
            {task.lastDelayedAt && (
              <>
                <span>•</span>
                <span>{t('lastLabel', { time: formatDate(task.lastDelayedAt) })}</span>
              </>
            )}
          </div>
        </div>

        <Badge variant="destructive" className="bg-orange-100 text-orange-800">
          {t('delayingBadge')}
        </Badge>
      </div>

      {latestExcuse && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-2">
            <MessageSquare size={16} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">{latestExcuse.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(latestExcuse.createdAt)} • {latestExcuse.wordCount} 字
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Textarea
            placeholder={t('placeholderAddExcuse')}
            value={excuse}
            onChange={(e) => setExcuse(e.target.value)}
            className="min-h-[60px] text-sm"
            maxLength={500}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {excuse.length}/500
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              size="default"
              onClick={handleAddExcuse}
              disabled={!excuse.trim() || isAddingExcuse}
              className="flex-1 h-10"
            >
              <MessageSquare size={16} className="mr-2" />
              {t('addExcuseButton')}
            </Button>

            <Button
              size="default"
              onClick={handleShareToSquare}
              disabled={isSharing}
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-700"
            >
              <Share2 size={16} className="mr-2" />
              {isSharing ? t('sharing') : t('shareToSquareButton')}
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleMarkCompleted}
            className="w-full bg-green-600 hover:bg-green-700 text-sm"
          >
            {t('completeButton')}
          </Button>
        </div>
      </div>

      {historyExcuses.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => setShowHistoryExcuses(!showHistoryExcuses)}
            className="flex items-center justify-between w-full text-left text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span>{t('historyExcuses', { count: historyExcuses.length })}</span>
            {showHistoryExcuses ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>

          {showHistoryExcuses && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {historyExcuses.map((excuse) => (
                <div key={excuse.id} className="p-2 bg-gray-50 rounded-md border border-gray-100">
                  <div className="flex items-start gap-2">
                    <MessageSquare size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 break-words">{excuse.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(excuse.createdAt)} • {excuse.wordCount} {t('wordsUnit')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <DelayDetailsDialog
        open={showDelayDetails}
        onOpenChange={setShowDelayDetails}
        taskName={task.name}
      />
    </Card>
  )
}