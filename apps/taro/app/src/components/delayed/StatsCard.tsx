import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { getDelayedTasks, getExcuseStats, getAllTasks } from '@/lib/data'
import ExcuseRecordsDialog from '@/components/delayed/ExcuseRecordsDialog'
import Modal from '@/components/ui/Modal'

export function StatsCard() {
  const [stats, setStats] = useState({
    totalDelayed: 0,
    totalExcuses: 0,
    averageExcuseLength: 0,
    longestStreak: 0,
  })

  useEffect(() => {
    // 简单每次挂载读取一次
    const delayed = getDelayedTasks()
    const excuseStats = getExcuseStats()
    const tasks = getAllTasks()
    const longestStreak = Math.max(0, ...tasks.map(t => t.delayCount || 0))
    setStats({
      totalDelayed: delayed.length,
      totalExcuses: excuseStats.totalExcuses,
      averageExcuseLength: excuseStats.averageLength,
      longestStreak,
    })
  }, [])

  const [showExcuse, setShowExcuse] = useState(false)
  const [showRank, setShowRank] = useState(false)
  const items = [
    { icon: '⏰', label: '拖延任务', value: String(stats.totalDelayed), color: 'text-orange-600', clickable: false },
    { icon: '💬', label: '总借口数', value: String(stats.totalExcuses), color: 'text-blue-600', clickable: true, onClick: () => setShowExcuse(true) },
    { icon: '📈', label: '平均借口长度', value: `${stats.averageExcuseLength}字`, color: 'text-purple-600', clickable: false },
    { icon: '🏆', label: '拖延排行榜', value: `${stats.longestStreak}次`, color: 'text-red-600', clickable: true, onClick: () => setShowRank(true) },
  ]
  return (
    <>
    <View className="card p-6 mb-6">
      <Text className="text-base font-semibold mb-4">拖延统计</Text>
      <View className="grid grid-cols-2 gap-4">
        {items.map(item => (
          <View key={item.label} className={`text-center ${item.clickable ? 'cursor-pointer' : ''}`} onClick={item.clickable ? item.onClick : undefined}>
            <View className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 ${item.color} mb-2`}>
              <Text className="text-lg leading-none">{item.icon}</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 block">{item.value}</Text>
            <Text className="text-sm text-gray-600 block">{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
    <ExcuseRecordsDialog open={showExcuse} onOpenChange={setShowExcuse} />
    <Modal open={showRank} onClose={() => setShowRank(false)} title="拖延排行榜">
      <View className="space-y-2">
        <Text className="text-sm text-gray-500">功能占位：后续可展示按任务聚合的拖延次数排名。</Text>
      </View>
    </Modal>
    </>
  )
}
