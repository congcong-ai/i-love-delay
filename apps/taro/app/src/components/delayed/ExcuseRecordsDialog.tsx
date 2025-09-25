import { useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Modal from '@/components/ui/Modal'
import { getAllExcuses, getAllTasks, formatDateTime } from '@/lib/data'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export default function ExcuseRecordsDialog({ open, onOpenChange }: Props) {
  const excuses = useMemo(() => getAllExcuses().slice(0, 20), [open])
  const taskMap = useMemo(() => new Map(getAllTasks().map(t => [t.id, t.name])), [open])

  return (
    <Modal open={open} onClose={() => onOpenChange(false)} title="借口记录">
      {excuses.length === 0 ? (
        <View className="text-sm text-gray-500">暂无记录</View>
      ) : (
        <View className="space-y-2">
          {excuses.map(e => (
            <View key={e.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <Text className="text-xs text-gray-400 block mb-1">{taskMap.get(e.taskId) || '未知任务'}</Text>
              <Text className="text-sm text-gray-800 block">{e.content}</Text>
              <Text className="text-xs text-gray-400 block mt-1">{formatDateTime(e.createdAt)} • {e.wordCount} 字</Text>
            </View>
          ))}
        </View>
      )}
    </Modal>
  )
}
