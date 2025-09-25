import { useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Task, updateTaskStatus } from '@/lib/data'

interface Props {
  tasks: Task[]
  onTaskCompleted?: (taskId: string) => void
}

export default function RageTaskList({ tasks, onTaskCompleted }: Props) {
  const [completed, setCompleted] = useState<string[]>([])

  const todoTasks = useMemo(() => tasks.filter(t => t.status === 'todo'), [tasks])
  const delayedTasks = useMemo(() => tasks.filter(t => t.status === 'delayed'), [tasks])

  const completedCount = completed.length
  const totalCount = tasks.length || 1

  async function handleComplete(id: string) {
    await updateTaskStatus(id, 'completed')
    setCompleted(prev => [...prev, id])
    onTaskCompleted?.(id)
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const isDone = completed.includes(task.id)
    return (
      <View className={`card p-4 transition-all ${isDone ? 'bg-green-50 border-green-200' : ''}`}>
        <View className="flex items-center justify-between">
          <View className="flex items-center gap-3">
            <View className={`w-2 h-2 rounded-full ${task.status === 'delayed' ? 'bg-orange-500' : 'bg-blue-500'}`} />
            <View>
              <Text className={`font-medium block ${isDone ? 'text-green-700 line-through' : 'text-gray-900'}`}>{task.name}</Text>
              <Text className="text-sm text-gray-500 block">
                {task.status === 'delayed' && task.delayCount > 0 ? `已拖延 ${task.delayCount} 次` : ''}
              </Text>
            </View>
          </View>
          <View className="flex items-center gap-2">
            <View className={`badge ${task.status === 'delayed' ? 'badge-destructive' : 'badge-secondary'}`}>
              {task.status === 'delayed' ? '拖延' : '待办'}
            </View>
            {!isDone ? (
              <Text className="btn-success" onClick={() => handleComplete(task.id)}>完成</Text>
            ) : (
              <View className="text-green-600 text-sm font-medium">已完成</View>
            )}
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="space-y-6">
      {/* 进度 */}
      {tasks.length > 0 && (
        <View className="card p-4">
          <View className="flex items-center justify-between mb-2">
            <Text className="font-semibold">暴走进度</Text>
            <Text className="text-sm text-gray-600">{completedCount} / {totalCount} 完成</Text>
          </View>
          <View className="w-full bg-gray-200 rounded-full h-2">
            <View className="bg-emerald-600 h-2 rounded-full" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
          </View>
        </View>
      )}

      {todoTasks.length > 0 && (
        <View>
          <Text className="font-semibold mb-3 block">待办任务（{todoTasks.length}）</Text>
          <View className="space-y-3">
            {todoTasks.map(t => <TaskCard key={t.id} task={t} />)}
          </View>
        </View>
      )}

      {delayedTasks.length > 0 && (
        <View>
          <Text className="font-semibold mb-3 block">拖延任务（{delayedTasks.length}）</Text>
          <View className="space-y-3">
            {delayedTasks.map(t => <TaskCard key={t.id} task={t} />)}
          </View>
        </View>
      )}

      {completedCount === totalCount && totalCount > 0 && (
        <View className="card p-8 text-center bg-gradient-to-r from-green-50 to-blue-50">
          <View className="text-gray-700">
            <Text className="text-xl font-semibold block mb-2">全部完成</Text>
            <Text className="block">恭喜！你完成了所有暴走任务！</Text>
          </View>
        </View>
      )}
    </View>
  )
}
