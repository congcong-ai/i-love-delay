'use client'

import { useState } from 'react'
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
                  <span>已拖延 {task.delayCount} 次</span>
                )}
                {task.status === 'todo' && (
                  <span>创建于 {new Date(task.createdAt).toLocaleDateString('zh-CN')}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={task.status === 'delayed' ? 'destructive' : 'secondary'}
              className={task.status === 'delayed' ? 'bg-orange-100 text-orange-800' : ''}
            >
              {task.status === 'delayed' ? '拖延' : '待办'}
            </Badge>
            
            {!completed ? (
              <Button
                size="sm"
                onClick={() => handleComplete(task.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 size={14} className="mr-1" />
                完成
              </Button>
            ) : (
              <div className="flex items-center text-green-600">
                <CheckCircle2 size={16} className="mr-1" />
                <span className="text-sm font-medium">已完成</span>
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
            <h3 className="font-semibold">暴走进度</h3>
            <span className="text-sm text-gray-600">
              {completedCount} / {totalCount} 完成
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
            待办任务 ({todoTasks.length})
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
            拖延任务 ({delayedTasks.length})
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
            <h3 className="text-lg font-semibold mb-2">暴走模式已就绪</h3>
            <p>但还没有选择任何任务</p>
          </div>
        </Card>
      )}

      {completedCount === totalCount && totalCount > 0 && (
        <Card className="p-8 text-center bg-gradient-to-r from-green-50 to-blue-50">
          <div className="text-gray-700">
            <Zap size={48} className="mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold mb-2">暴走完成！</h3>
            <p className="text-lg">
              恭喜你完成了 {completedCount} 个任务！
            </p>
            <p className="text-sm text-gray-600 mt-2">
              今天的暴走模式表现完美，可以安心拖延明天的任务了～
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}