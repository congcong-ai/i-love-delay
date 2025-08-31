'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useTaskStore } from '@/lib/stores/task-store'
import { TaskItem } from './task-item'
import { Card } from '@/components/ui/card'
import { Task } from '@/lib/types'

interface TaskListProps {
  status?: 'todo' | 'delayed' | 'completed'
  tasks?: Task[]
}

export function TaskList({ status = 'todo', tasks: customTasks }: TaskListProps) {
  const { loadTasks, getTasksByStatus, isLoading } = useTaskStore()
  const t = useTranslations('tasks')

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const tasks = customTasks || getTasksByStatus(status)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-500">
          <p className="text-lg mb-2">
            {status === 'todo' && t('noTasksToday')}
            {status === 'delayed' && t('noDelayedTasks')}
            {status === 'completed' && t('noCompletedTasks')}
          </p>
          <p className="text-sm">
            {status === 'todo' && t('procrastinationStarts')}
            {status === 'delayed' && t('artOfDelay')}
            {status === 'completed' && t('completionSatisfaction')}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          onUpdate={loadTasks}
        />
      ))}
    </div>
  )
}