'use client'

import { useState } from 'react'
import { Trash2, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTaskStore } from '@/lib/stores/task-store'
import { Task } from '@/lib/types'

interface TaskItemProps {
  task: Task
  onUpdate?: () => void
}

export function TaskItem({ task, onUpdate }: TaskItemProps) {
  const { updateTaskStatus, deleteTask } = useTaskStore()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleMarkDelayed = async () => {
    await updateTaskStatus(task.id, 'delayed')
    onUpdate?.()
  }

  const handleMarkCompleted = async () => {
    await updateTaskStatus(task.id, 'completed')
    onUpdate?.()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await deleteTask(task.id)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className="p-4 mb-3 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{task.name}</h3>
          <p className="text-sm text-gray-500">
            创建于 {formatDate(task.createdAt)}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-gray-400 hover:text-red-600"
        >
          <Trash2 size={16} />
        </Button>
      </div>
      
      <div className="flex gap-2 mt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={handleMarkDelayed}
          className="flex items-center gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
        >
          <Clock size={14} />
          拖延
        </Button>
        
        <Button
          size="sm"
          onClick={handleMarkCompleted}
          className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 size={14} />
          完成
        </Button>
      </div>
    </Card>
  )
}