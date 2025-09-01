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

interface DelayedTaskItemProps {
  task: Task
  onUpdate?: () => void
}

export function DelayedTaskItem({ task, onUpdate }: DelayedTaskItemProps) {
  const [excuse, setExcuse] = useState('')
  const [isAddingExcuse, setIsAddingExcuse] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [showHistoryExcuses, setShowHistoryExcuses] = useState(false)
  const { updateTaskStatus } = useTaskStore()
  const { addExcuse, getExcusesByTask } = useExcuseStore()
  const { user, isLoggedIn, login } = useAuthStore()

  const excuses = getExcusesByTask(task.id)
  const latestExcuse = excuses[0]
  const historyExcuses = excuses.slice(1) // 除了最新的借口之外的历史借口

  const handleAddExcuse = async () => {
    if (!excuse.trim()) return

    setIsAddingExcuse(true)
    await addExcuse(task.id, excuse)
    setExcuse('')
    setIsAddingExcuse(false)
    onUpdate?.()
  }

  const handleMarkCompleted = async () => {
    await updateTaskStatus(task.id, 'completed')
    onUpdate?.()
  }

  const handleShareToSquare = async () => {
    if (!isLoggedIn) {
      try {
        await login()
        // 等待登录状态更新
        const checkLogin = () => new Promise<void>((resolve, reject) => {
          const maxAttempts = 20
          let attempts = 0

          const check = () => {
            attempts++
            if (useAuthStore.getState().isLoggedIn) {
              resolve()
            } else if (attempts >= maxAttempts) {
              reject(new Error('登录超时'))
            } else {
              setTimeout(check, 500)
            }
          }

          check()
        })

        await checkLogin()
      } catch (error) {
        console.error('登录失败:', error)
        alert('登录失败，无法分享')
        return
      }
    }

    if (!latestExcuse) {
      alert('请先添加一个借口再分享！')
      return
    }

    setIsSharing(true)
    try {
      const response = await fetch('/api/square/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          taskName: task.name,
          excuse: latestExcuse.content,
          delayCount: task.delayCount,
          userId: user?.openid,
          userName: user?.nickname,
          userAvatar: user?.avatar,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert('分享成功！你的拖延故事已发布到广场')
      } else {
        console.error('分享失败详情:', result)
        throw new Error(result.error || result.message || '分享失败')
      }
    } catch (error) {
      console.error('分享失败:', error)
      alert(error instanceof Error ? error.message : '分享失败，请稍后重试')
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
            <span>拖延 {task.delayCount} 次</span>
            {task.lastDelayedAt && (
              <>
                <span>•</span>
                <span>上次 {formatDate(task.lastDelayedAt)}</span>
              </>
            )}
          </div>
        </div>

        <Badge variant="destructive" className="bg-orange-100 text-orange-800">
          拖延中
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
            placeholder="为你的拖延找个借口吧..."
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
              添加借口
            </Button>

            <Button
              size="default"
              onClick={handleShareToSquare}
              disabled={isSharing || !latestExcuse}
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-700"
            >
              <Share2 size={16} className="mr-2" />
              {isSharing ? '分享中...' : '分享到广场'}
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleMarkCompleted}
            className="w-full bg-green-600 hover:bg-green-700 text-sm"
          >
            糟糕，完成了！
          </Button>
        </div>
      </div>

      {historyExcuses.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => setShowHistoryExcuses(!showHistoryExcuses)}
            className="flex items-center justify-between w-full text-left text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span>历史借口 ({historyExcuses.length} 条)</span>
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
                        {formatDate(excuse.createdAt)} • {excuse.wordCount} 字
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}