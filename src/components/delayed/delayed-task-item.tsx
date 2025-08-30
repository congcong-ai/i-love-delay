'use client'

import { useState } from 'react'
import { MessageSquare, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useTaskStore } from '@/lib/stores/task-store'
import { useExcuseStore } from '@/lib/stores/excuse-store'
import { Task } from '@/lib/types'

interface DelayedTaskItemProps {
  task: Task
  onUpdate?: () => void
}

export function DelayedTaskItem({ task, onUpdate }: DelayedTaskItemProps) {
  const [excuse, setExcuse] = useState('')
  const [isAddingExcuse, setIsAddingExcuse] = useState(false)
  const { updateTaskStatus } = useTaskStore()
  const { addExcuse, getExcusesByTask } = useExcuseStore()

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