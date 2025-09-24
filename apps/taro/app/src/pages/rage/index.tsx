import { useState } from 'react'
import { View, Text } from '@tarojs/components'

interface RageItem {
  id: string
  title: string
  energy: number // 0-100
  time: string
}

export default function RagePage() {
  const [items] = useState<RageItem[]>([
    { id: 'r1', title: '番茄冲刺 25 分钟', energy: 80, time: '今天 10:30' },
    { id: 'r2', title: '深呼吸与冥想 10 分钟', energy: 60, time: '今天 14:10' },
  ])

  return (
    <View className="p-4 space-y-3">
      <View className="section-title">能量暴走</View>
      {items.map(i => (
        <View key={i.id} className="card space-y-2">
          <View className="flex items-center justify-between">
            <Text className="text-sm font-medium text-gray-900">{i.title}</Text>
            <Text className="muted">{i.time}</Text>
          </View>
          <View className="w-full bg-gray-100 rounded-full h-2">
            <View className="bg-brand h-2 rounded-full" style={{ width: `${i.energy}%` }} />
          </View>
          <View className="text-right text-sm text-brand-700">能量值 {i.energy}</View>
        </View>
      ))}

      <View className="muted">保持节奏，张弛有度。</View>
    </View>
  )
}
