'use client'


import { Zap, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/lib/types'

interface RageTaskSelectorProps {
  tasks: Task[]
  selectedTasks: string[]
  onTaskToggle: (taskId: string) => void
  onSelectAll: () => void
  onClearAll: () => void
}

export function RageTaskSelector({ 
  tasks, 
  selectedTasks, 
  onTaskToggle, 
  onSelectAll, 
  onClearAll 
}: RageTaskSelectorProps) {
  const todoTasks = tasks.filter(task => task.status === 'todo')
  const delayedTasks = tasks.filter(task => task.status === 'delayed')

  const isSelected = (taskId: string) => selectedTasks.includes(taskId)
  const selectedCount = selectedTasks.length

  const TaskCard = ({ task }: { task: Task }) => (
    <Card 
      className={`p-4 cursor-pointer transition-all ${
        isSelected(task.id) 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : 'hover:shadow-md'
      }`}
      onClick={() => onTaskToggle(task.id)}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected(task.id)}
          onCheckedChange={() => onTaskToggle(task.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-gray-900">{task.name}</h4>
            <Badge 
              variant={task.status === 'delayed' ? 'destructive' : 'secondary'}
              className={task.status === 'delayed' ? 'bg-orange-100 text-orange-800' : ''}
            >
              {task.status === 'delayed' ? '拖延' : '待办'}
            </Badge>
          </div>
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
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">选择任务</h3>
            <p className="text-sm text-gray-600">
              已选择 {selectedCount} 个任务
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onSelectAll}
              disabled={tasks.length === 0}
            >
              全选
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClearAll}
              disabled={selectedCount === 0}
            >
              清空
            </Button>
          </div>
        </div>
      </Card>

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
            <h3 className="text-lg font-semibold mb-2">没有可选择的任务</h3>
            <p>先去创建一些任务，然后再来暴走模式吧！</p>
          </div>
        </Card>
      )}
    </div>
  )
}