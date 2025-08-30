'use client'

import { useState } from 'react'
import { MessageSquare, Calendar, Share2 } from 'lucide-react'
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
  const { updateTaskStatus } = useTaskStore()
  const { addExcuse, getExcusesByTask } = useExcuseStore()
  const { user, isLoggedIn, login } = useAuthStore()

  const excuses = getExcusesByTask(task.id)
  const latestExcuse = excuses[0]

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
        // 登录成功后继续分享流程
        if (!useAuthStore.getState().isLoggedIn) {
          return
        }
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
        throw new Error(result.error || '分享失败')
      }
    } catch (error) {
      console.error('分享失败:', error)
      alert(error instanceof Error ? error.message : '分享失败，请稍后重试')
    } finally {
      setIsSharing(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAddExcuse}
            disabled={!excuse.trim() || isAddingExcuse}
            className="flex-1"
          >
            <MessageSquare size={14} className="mr-1" />
            添加借口
          </Button>
          
          <Button
            size="sm"
            onClick={handleShareToSquare}
            disabled={isSharing || !latestExcuse}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Share2 size={14} className="mr-1" />
            {isSharing ? '分享中...' : '分享到广场'}
          </Button>
          
          <Button
            size="sm"
            onClick={handleMarkCompleted}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            终于完成了
          </Button>
        </div>
      </div>

      {excuses.length > 1 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            历史借口 ({excuses.length - 1} 条)
          </p>
        </div>
      )}
    </Card>
  )
}