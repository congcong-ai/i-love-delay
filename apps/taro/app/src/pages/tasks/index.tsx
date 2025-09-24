import { useState } from 'react'
import { View, Text } from '@tarojs/components'

interface Task {
  id: string
  title: string
  desc?: string
  done: boolean
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 't1', title: '写日报', desc: '总结今天产出', done: false },
    { id: 't2', title: '阅读 30 分钟', desc: '保持输入', done: true },
    { id: 't3', title: '健身 20 分钟', desc: '拉伸+核心', done: false },
  ])

  function toggle(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  return (
    <View className="p-4 space-y-3">
      <View className="section-title">今日任务</View>
      {tasks.map(t => (
        <View key={t.id} className="card flex items-start gap-3">
          <View
            className={`w-5 h-5 rounded-full border flex items-center justify-center ${t.done ? 'bg-brand border-brand' : 'border-gray-300'}`}
            onClick={() => toggle(t.id)}
          >
            <Text className="text-white text-xs">{t.done ? '✓' : ''}</Text>
          </View>
          <View className="flex-1">
            <View className="text-sm font-medium text-gray-900">{t.title}</View>
            {t.desc ? <View className="muted mt-1">{t.desc}</View> : null}
          </View>
          <View>
            <Text className="btn-outline" onClick={() => toggle(t.id)}>{t.done ? '重做' : '完成'}</Text>
          </View>
        </View>
      ))}

      <View className="muted mt-2">点击勾选或“完成/重做”可切换状态。</View>
    </View>
  )
}
