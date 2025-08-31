'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Zap, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/lib/types'

interface RageTaskListProps {
  tasks: Task[]
  onTaskCompleted: (taskId: string) => void
}

export function RageTaskList({ tasks, onTaskCompleted }: RageTaskListProps) {
  const t = useTranslations('rage')
  const [completedTasks, setCompletedTasks] = useState<string[]>([])

  const handleComplete = async (taskId: string) => {
    await onTaskCompleted(taskId)
    setCompletedTasks(prev => [...prev, taskId])
  }

  const isCompleted = (taskId: string) => completedTasks.includes(taskId)

  const todoTasks = tasks.filter(task => task.status === 'todo')
  const delayedTasks = tasks.filter(task => task.status === 'delayed')

  const TaskCard = ({ task }: { task: Task }) => {
    const completed = isCompleted(task.id)
    
    return (
      <Card 
        className={`p-4 transition-all ${
          completed ? 'bg-green-50 border-green-200' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              task.status === 'delayed' ? 'bg-orange-500' : 'bg-blue-500'
            }`} />
            <div>
              <h4 className={`font-medium ${
                completed ? 'text-green-700 line-through' : 'text-gray-900'
              }`}>
                {task.name}
              </h4>
              <div className="text-sm text-gray-500">
                {task.status === 'delayed' && task.delayCount > 0 && (
                  <span>{t('delayedCountTimes', { count: task.delayCount })}</span>
                )}
                {task.status === 'todo' && (
                  <span>{t('createdOn', { date: new Date(task.createdAt).toLocaleDateString('en-US') })}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={task.status === 'delayed' ? 'destructive' : 'secondary'}
              className={task.status === 'delayed' ? 'bg-orange-100 text-orange-800' : ''}
            >
              {task.status === 'delayed' ? t('delayed') : t('todo')}
            </Badge>
            
            {!completed ? (
              <Button
                size="sm"
                onClick={() => handleComplete(task.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 size={14} className="mr-1" />
                {t('finish')}
              </Button>
            ) : (
              <div className="flex items-center text-green-600">
                <CheckCircle2 size={16} className="mr-1" />
                <span className="text-sm font-medium">{t('completed')}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  const completedCount = completedTasks.length
  const totalCount = tasks.length

  return (
    <div className="space-y-6">
      {/* Progress */}
      {totalCount > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{t('rageProgress')}</h3>
            <span className="text-sm text-gray-600">
              {t('completedCount', { completed: completedCount, total: totalCount })}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </Card>
      )}

      {/* Todo Tasks */}
      {todoTasks.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock size={16} />
            {t('todoTasks')} ({todoTasks.length})
          </h3>
          <div className="space-y-3">
            {todoTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Delayed Tasks */}
      {delayedTasks.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Zap size={16} />
            {t('delayedTasks')} ({delayedTasks.length})
          </h3>
          <div className="space-y-3">
            {delayedTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <Zap size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">{t('rageReady')}</h3>
            <p>{t('noTasksSelected')}</p>
          </div>
        </Card>
      )}

      {completedCount === totalCount && totalCount > 0 && (
        <Card className="p-8 text-center bg-gradient-to-r from-green-50 to-blue-50">
          <div className="text-gray-700">
            <Zap size={48} className="mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold mb-2">{t('rageComplete')}</h3>
            <p className="text-lg">
              {t('congratulationsTasks', { count: completedCount })}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {t('perfectPerformance')}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}