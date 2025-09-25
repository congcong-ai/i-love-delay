import { View, Text } from '@tarojs/components'
import { Task } from '@/lib/data'

interface Props {
  tasks: Task[]
  selectedTasks: string[]
  onTaskToggle: (taskId: string) => void
  onSelectAll: () => void
  onClearAll: () => void
}

export default function RageTaskSelector({ tasks, selectedTasks, onTaskToggle, onSelectAll, onClearAll }: Props) {
  const todoTasks = tasks.filter(t => t.status === 'todo')
  const delayedTasks = tasks.filter(t => t.status === 'delayed')
  const isSelected = (id: string) => selectedTasks.includes(id)
  const selectedCount = selectedTasks.length

  const TaskCard = ({ task }: { task: Task }) => (
    <View
      className={`card p-4 cursor-pointer transition-all ${isSelected(task.id) ? 'border-2 border-blue-500 bg-blue-50' : 'hover:shadow'} `}
      onClick={() => onTaskToggle(task.id)}
    >
      <View className="flex items-start gap-3">
        <View className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center ${isSelected(task.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}></View>
        <View className="flex-1">
          <View className="flex items-center justify-between mb-1">
            <Text className="font-medium text-gray-900">{task.name}</Text>
            <View className={`badge ${task.status === 'delayed' ? 'badge-destructive' : 'badge-secondary'}`}>
              {task.status === 'delayed' ? '拖延' : '待办'}
            </View>
          </View>
          <Text className="text-sm text-gray-500">
            {task.status === 'delayed' && task.delayCount > 0 ? `已拖延 ${task.delayCount} 次` : ''}
          </Text>
        </View>
      </View>
    </View>
  )

  return (
    <View className="space-y-6">
      <View className="card p-4">
        <View className="flex items-center justify-between">
          <View>
            <Text className="font-semibold block">选择任务</Text>
            <Text className="text-sm text-gray-600 block">已选择 {selectedCount} 个任务</Text>
          </View>
          <View className="flex gap-2">
            <Text className="btn-outline" onClick={onSelectAll}>全选</Text>
            <Text className="btn-outline" onClick={onClearAll}>清空</Text>
          </View>
        </View>
      </View>

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

      {tasks.length === 0 && (
        <View className="card p-8 text-center text-gray-500">
          <Text>暂无可选择的任务，请先创建任务</Text>
        </View>
      )}
    </View>
  )
}
