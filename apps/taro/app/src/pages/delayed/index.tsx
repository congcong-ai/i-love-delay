import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { getAllTasks, getDelayedTasks, initAndSyncFromLegacy } from '@/lib/data'
import { StatsCard } from '@/components/delayed/StatsCard'
import DelayedTaskItem from '@/components/delayed/DelayedTaskItem'

export default function DelayedPage() {
  const [delayed, setDelayed] = useState(() => getDelayedTasks())

  useEffect(() => {
    // 初始化并做一次旧数据迁移
    initAndSyncFromLegacy()
    // 首次加载
    setDelayed(getDelayedTasks())
  }, [])

  const reload = () => {
    // 触发组件内部更新后，刷新列表
    getAllTasks() // 读取一次，保证写入顺序
    setDelayed(getDelayedTasks())
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      <View className="mx-auto max-w-2xl px-4 py-6">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 block mb-2">拖延</Text>
          <Text className="text-gray-600 block">为你的拖延找个完美的借口吧！</Text>
        </View>

        <StatsCard />

        <View className="mb-6">
          <View className="flex items-center justify-between mb-4">
            <Text className="text-lg font-semibold">拖延中的任务（{delayed.length}）</Text>
          </View>

          {delayed.length > 0 && (
            <Text className="text-sm text-gray-600 block mb-4">您有 {delayed.length} 个任务正在享受拖延的时光</Text>
          )}

          {delayed.length === 0 ? (
            <View className="card p-8 text-center bg-gradient-to-r from-orange-50 to-red-50">
              <View className="text-gray-700">
                <Text className="text-xl font-semibold block mb-2">太棒了！</Text>
                <Text className="block mb-2">您还没有正在拖延的任务</Text>
                <Text className="text-sm text-gray-500 block">拖延的艺术在于掌握节奏，而非停滞不前</Text>
              </View>
            </View>
          ) : (
            <View className="space-y-4">
              {delayed.map(task => (
                <DelayedTaskItem key={task.id} task={task} onUpdate={reload} />
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
