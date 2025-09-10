'use client'

import { useState } from 'react'
import { Trash2, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTaskStore } from '@/lib/stores/task-store'
import { Task } from '@/lib/types'
import { useTranslations } from 'next-intl'

interface TaskItemProps {
  task: Task
  onUpdate?: () => void
}

export function TaskItem({ task, onUpdate }: TaskItemProps) {
  const { updateTaskStatus, markTaskDelayed, deleteTask } = useTaskStore()
  const [isDeleting, setIsDeleting] = useState(false)
  const t = useTranslations('tasks')
  const tNet = useTranslations('network')

  const handleMarkDelayed = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert(tNet('offlineDesc'))
      return
    }
    await markTaskDelayed(task.id)
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

  const handleDelete = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert(tNet('offlineDesc'))
      return
    }
    setIsDeleting(true)
    await deleteTask(task.id)
  }

  const formatDate = (date: Date) => {
    // 确保在客户端和服务器端使用相同的格式
    if (typeof window === 'undefined') {
      // 服务器端使用 ISO 格式
      return new Date(date).toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit'
      })
    }

    // 客户端使用本地化格式（固定格式避免水合差异）
    const d = new Date(date)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${month}/${day}`
  }

  return (
    <Card className="p-4 mb-3 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className={`font-medium mb-1 ${task.status === 'completed'
            ? 'text-green-700 line-through'
            : 'text-gray-900'
            }`}>
            {task.name}
          </h3>
          <p className="text-sm text-gray-500">
            {task.status === 'completed' && task.completedAt
              ? t('completedAtOn', { date: formatDate(task.completedAt) })
              : t('createdAtOn', { date: formatDate(task.createdAt) })
            }
          </p>

        </div>

        {task.status !== 'completed' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-400 hover:text-red-600"
          >
            <Trash2 size={16} />
          </Button>
        )}

        {task.status === 'completed' && (
          <div className="flex items-center text-green-600">
            <CheckCircle2 size={16} className="mr-1" />
            <span className="text-sm font-medium">{t('completed')}</span>
          </div>
        )}

      </div>

      {task.status === 'todo' && (
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkDelayed}
            className="flex items-center gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <Clock size={14} />
            {t('delayed')}
          </Button>

          <Button
            size="sm"
            onClick={handleMarkCompleted}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 size={14} />
            {t('finish')}
          </Button>

        </div>
      )}
    </Card>
  )
}