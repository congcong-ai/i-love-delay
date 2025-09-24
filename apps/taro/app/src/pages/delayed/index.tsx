import { useState } from 'react'
import { View, Text } from '@tarojs/components'

interface DelayItem {
  id: string
  reason: string
  minutes: number
  createdAt: string
}

export default function DelayedPage() {
  const [items, setItems] = useState<DelayItem[]>([
    { id: 'd1', reason: '刷短视频', minutes: 18, createdAt: '今天 09:20' },
    { id: 'd2', reason: '摸鱼聊天', minutes: 12, createdAt: '今天 11:02' },
    { id: 'd3', reason: '走神放空', minutes: 7, createdAt: '昨天 21:43' }
  ])

  return (
    <View className="p-4 space-y-3">
      <View className="section-title">拖延记录</View>
      {items.map(i => (
        <View key={i.id} className="card flex items-center justify-between">
          <View>
            <View className="text-sm font-medium text-gray-900">{i.reason}</View>
            <View className="muted mt-1">{i.createdAt}</View>
          </View>
          <View className="text-brand-600 text-sm font-semibold">+{i.minutes} 分钟</View>
        </View>
      ))}

      <View className="card">
        <View className="muted mb-2">统计</View>
        <View className="text-2xl font-semibold text-gray-900">本周累计 37 分钟</View>
      </View>
    </View>
  )
}
