import { useMemo, useState } from 'react'
import { View, Text, Textarea } from '@tarojs/components'
import { addExcuse, getExcusesByTask, updateTaskStatus, formatDateTime, Task } from '@/lib/data'

interface Props {
  task: Task
  onUpdate?: () => void
}

export default function DelayedTaskItem({ task, onUpdate }: Props) {
  const [value, setValue] = useState('')
  const [expandHistory, setExpandHistory] = useState(false)
  const excuses = useMemo(() => getExcusesByTask(task.id), [task.id])
  const latest = excuses[0]
  const history = excuses.slice(1)

  async function handleAdd() {
    const v = value.trim()
    if (!v) return
    addExcuse(task.id, v)
    setValue('')
    onUpdate?.()
  }

  async function markCompleted() {
    updateTaskStatus(task.id, 'completed')
    onUpdate?.()
  }

  async function shareToSquare() {
    // 尽量与原版一致：若离线则提示
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        alert('当前离线，稍后再试')
        return
      }
      const content = latest?.content || value.trim()
      if (!content) {
        alert('请先添加一个借口再分享')
        return
      }
      const body = {
        taskId: task.id,
        taskName: task.name,
        excuse: content,
        delayCount: task.delayCount,
      }
      await fetch('/api/square/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      alert('已提交分享请求')
    } catch (e) {
      console.error(e)
      alert('分享失败，请稍后再试')
    }
  }

  return (
    <View className="card p-4 mb-4">
      <View className="flex items-start justify-between mb-3">
        <View>
          <Text className="font-medium text-gray-900 block mb-1">{task.name}</Text>
          <View className="flex items-center gap-2 text-xs text-gray-500">
            <Text className="underline decoration-dotted">已拖延 {task.delayCount} 次</Text>
            {task.lastDelayedAt ? (
              <>
                <Text>•</Text>
                <Text>上次 {formatDateTime(task.lastDelayedAt)}</Text>
              </>
            ) : null}
          </View>
        </View>

        <View className="badge badge-destructive">拖延中</View>
      </View>

      {latest && (
        <View className="mb-4 p-3 bg-gray-50 rounded-lg">
          <View className="text-sm text-gray-700">{latest.content}</View>
          <View className="text-xs text-gray-500 mt-1">{formatDateTime(latest.createdAt)} • {latest.wordCount} 字</View>
        </View>
      )}

      <View className="space-y-3">
        <View>
          <Textarea
            placeholder="为你的拖延找个借口吧..."
            value={value}
            onInput={(e) => setValue((e as any).detail?.value || '')}
            className="min-h-[60px] text-sm input-base"
            maxlength={500}
          />
          <Text className="text-right text-xs text-gray-500 block mt-1">{value.length}/500</Text>
        </View>

        <View className="flex flex-col gap-2">
          <View className="flex gap-2">
            <Text className="btn flex-1 h-10" onClick={handleAdd}>添加借口</Text>
            <Text className="btn-primary flex-1 h-10" onClick={shareToSquare}>分享到广场</Text>
          </View>
          <Text className="btn-success w-full" onClick={markCompleted}>完成</Text>
        </View>
      </View>

      {history.length > 0 && (
        <View className="mt-4 pt-3 border-t border-gray-100">
          <View onClick={() => setExpandHistory(v => !v)} className="flex items-center justify-between text-xs text-gray-500">
            <Text>历史借口（{history.length}）</Text>
            <Text>{expandHistory ? '收起' : '展开'}</Text>
          </View>
          {expandHistory && (
            <View className="mt-3 space-y-2">
              {history.map(e => (
                <View key={e.id} className="p-2 bg-gray-50 rounded-md border border-gray-100">
                  <Text className="text-xs text-gray-700 block">{e.content}</Text>
                  <Text className="text-xs text-gray-400 block mt-1">{formatDateTime(e.createdAt)} • {e.wordCount} 字</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}
