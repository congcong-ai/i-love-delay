'use client'

import { useEffect } from 'react'
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
            {status === 'todo' && '今天还没有任务，快来创建一个吧！'}
            {status === 'delayed' && '还没有拖延的任务，继续保持！'}
            {status === 'completed' && '还没有完成的任务，加油！'}
          </p>
          <p className="text-sm">
            {status === 'todo' && '拖延从创建任务开始～'}
            {status === 'delayed' && '拖延是门艺术，需要慢慢培养～'}
            {status === 'completed' && '完成任务的成就感最棒了！'}
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