import { useEffect, useMemo, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Task, getAllTasks, addTask as addTaskData, updateTaskStatus, addExcuse } from '@/lib/data'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(() => getAllTasks())
  const [input, setInput] = useState('')
  const [expandDone, setExpandDone] = useState(false)

  const todos = useMemo(() => tasks.filter(t => t.status === 'todo' || t.status === 'delayed'), [tasks])
  const dones = useMemo(() => tasks.filter(t => t.status === 'completed'), [tasks])

  async function toggle(id: string) {
    const current = tasks.find(t => t.id === id)
    if (!current) return
    const nextStatus = current.status === 'completed' ? 'todo' : 'completed'
    await updateTaskStatus(id, nextStatus)
    setTasks(getAllTasks())
  }

  function addTask() {
    const name = input.trim()
    if (!name) return
    addTaskData(name)
    setTasks(getAllTasks())
    setInput('')
  }

  async function removeTask(id: string) {
    const res = await Taro.showModal({ title: '确认删除', content: '删除后不可恢复，是否继续？' })
    if (res.confirm) {
      // 简化：直接标记为完成并过滤展示（Taro 侧未实现物理删除 API）
      await updateTaskStatus(id, 'completed')
      setTasks(getAllTasks())
    }
  }

  function fmt(ts?: number) {
    if (!ts) return ''
    const d = new Date(ts)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${mm}/${dd}`
  }

  async function delayTask(task: Task) {
    try {
      const action = await Taro.showActionSheet({
        itemList: ['5 分钟', '10 分钟', '15 分钟', '30 分钟'],
      })
      const minutesList = [5, 10, 15, 30]
      const minutes = minutesList[action.tapIndex]
      // 记录为借口，并自动将任务置为拖延状态（数据层会累加 delayCount）
      addExcuse(task.id, `+${minutes} 分钟`)
      setTasks(getAllTasks())
      Taro.showToast({ title: `已记录 +${minutes} 分钟`, icon: 'success', duration: 1200 })
      // 跳转到拖延页查看
      Taro.switchTab({ url: '/pages/delayed/index' })
    } catch (e) {
      // 用户取消
    }
  }

  // 初始化：读取本地存储的 UI 状态
  useEffect(() => {
    try {
      const expand = Taro.getStorageSync('expandDone') as boolean | undefined
      if (typeof expand === 'boolean') setExpandDone(expand)
    } catch (_) {}
  }, [])

  // 数据变化：刷新内存列表（界面内操作已主动刷新，这里兜底）
  useEffect(() => {
    setTasks(getAllTasks())
  }, [])

  useEffect(() => {
    try {
      Taro.setStorageSync('expandDone', expandDone)
    } catch (_) {}
  }, [expandDone])

  return (
    <View className="mx-auto max-w-2xl p-4 space-y-4 pb-20">
      {/* 顶部标题与副标题 */}
      <View>
        <View className="section-header">任务</View>
        <View className="section-subtitle">创建任务，尽情拖延吧！</View>
      </View>

      {/* 添加任务 */}
      <View className="card space-y-3">
        <View className="text-base font-semibold text-gray-900">添加任务</View>
        <View className="flex items-center gap-3">
          <Input
            className="input-base flex-1"
            type="text"
            confirmType="done"
            value={input}
            placeholder="今天想拖延什么任务？"
            onInput={(e) => setInput((e as any).detail?.value || '')}
            onConfirm={addTask}
          />
          <View className="btn w-10 h-10 rounded-xl" onClick={addTask}>
            <Text className="text-lg leading-none">+</Text>
          </View>
        </View>
      </View>

      {/* 待办 */}
      <View className="flex items-baseline justify-between px-1">
        <Text className="section-title m-0">待办 ({todos.length})</Text>
      </View>
      {todos.length > 0 && (
        <View className="px-1 -mt-2 mb-2 text-[13px] text-gray-600">您有 {todos.length} 个任务等待被拖延，继续加油！</View>
      )}
      {todos.length === 0 ? (
        <>
          <View className="card">
            <View className="text-gray-900 font-medium">今天还没有任务，快来创建一个吧！</View>
            <View className="muted mt-1">拖延从创建任务开始～</View>
          </View>
          <View className="card bg-brand/5 border border-brand/10">
            <View className="text-base font-semibold text-gray-900 mb-1">今天感觉很轻松？</View>
            <View className="muted">创建一些任务，开始您的拖延之旅！</View>
            <View className="muted mt-1">记住：拖延不是懒惰，而是高级时间管理 😎</View>
          </View>
        </>
      ) : (
        todos.map(t => (
          <View key={t.id} className="card">
            <View className="flex items-start gap-3">
              <View className="flex-1">
                <View className="text-sm font-medium text-gray-900">{t.name}</View>
                <View className="muted mt-1">创建于 {fmt(t.createdAt)}</View>
              </View>
              <Text className="muted" onClick={() => removeTask(t.id)}>删除</Text>
            </View>
            <View className="mt-3 flex items-center gap-2">
              <Text className="btn-warn" onClick={() => delayTask(t)}>拖延</Text>
              <Text className="btn-success" onClick={() => toggle(t.id)}>完成</Text>
            </View>
          </View>
        ))
      )}

      {/* 已完成（可展开 / 收起） */}
      <View className="flex items-baseline justify-between px-1">
        <Text className="section-title m-0">已完成 ({dones.length})</Text>
        <Text className="muted" onClick={() => setExpandDone(v => !v)}>{expandDone ? '收起' : '展开'}</Text>
      </View>
      {expandDone && dones.map(t => (
        <View key={t.id} className="card">
          <View className="flex items-start gap-3">
            <View className="flex-1">
              <View className="text-sm font-medium text-gray-900">{t.name}</View>
              <View className="muted mt-1">完成于 {fmt(t.completedAt)}</View>
            </View>
            <View className="chip chip-success">已完成</View>
          </View>
        </View>
      ))}

      <View className="muted mt-2">点击“完成/重做”可切换状态。</View>
    </View>
  )
}
