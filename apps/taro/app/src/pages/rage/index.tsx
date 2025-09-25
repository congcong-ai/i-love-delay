import { useEffect, useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { getAllTasks, updateTaskStatus } from '@/lib/data'
import RageTaskSelector from '@/components/rage/RageTaskSelector'
import RageTaskList from '@/components/rage/RageTaskList'

export default function RagePage() {
  const [tasks, setTasks] = useState(() => getAllTasks())
  const [selected, setSelected] = useState<string[]>([])
  const [isRaging, setIsRaging] = useState(false)

  useEffect(() => {
    setTasks(getAllTasks())
  }, [])

  const availableTasks = useMemo(
    () => tasks.filter(t => t.status === 'todo' || t.status === 'delayed'),
    [tasks]
  )
  const selectedTaskObjects = useMemo(
    () => tasks.filter(t => selected.includes(t.id)),
    [tasks, selected]
  )

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function selectAll() { setSelected(availableTasks.map(t => t.id)) }
  function clearAll() { setSelected([]) }

  function startRage() { if (selected.length > 0) setIsRaging(true) }

  async function completeAll() {
    for (const id of selected) {
      await updateTaskStatus(id, 'completed')
    }
    setTasks(getAllTasks())
    setSelected([])
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      <View className="mx-auto max-w-2xl px-4 py-6">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 block mb-2">暴走</Text>
          <Text className="text-gray-600 block">{isRaging ? '专注并一次性完成所有任务！' : '从待办和拖延任务中选择今天要完成的任务'}</Text>
        </View>

        {!isRaging ? (
          <>
            <View className="card p-6 mb-6">
              <View className="flex items-center gap-3 mb-4">
                <Text className="text-orange-600 text-xl">⚡</Text>
                <View>
                  <Text className="text-base font-semibold block">选择今天要完成的任务</Text>
                  <Text className="text-sm text-gray-600 block">从待办和拖延任务中选择今天要完成的任务</Text>
                </View>
              </View>

              <RageTaskSelector
                tasks={availableTasks}
                selectedTasks={selected}
                onTaskToggle={toggle}
                onSelectAll={selectAll}
                onClearAll={clearAll}
              />

              {selected.length > 0 && (
                <View className="mt-6 pt-4 border-t">
                  <Text className="btn-primary w-full block text-center" onClick={startRage}>开始暴走（{selected.length} tasks）</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            <View className="card p-6 mb-6 bg-gradient-to-r from-orange-50 to-red-50">
              <View className="flex items-center justify-between">
                <View>
                  <Text className="text-base font-semibold text-orange-800 block">暴走进行中！</Text>
                  <Text className="text-sm text-orange-600 block">集中精力完成 {selected.length} 个任务</Text>
                </View>
                <Text className="btn-outline" onClick={() => setIsRaging(false)}>重新选择</Text>
              </View>
            </View>

            <RageTaskList
              tasks={selectedTaskObjects}
              onTaskCompleted={() => setTasks(getAllTasks())}
            />

            {selectedTaskObjects.length > 1 && (
              <View className="mt-6">
                <Text className="btn-success w-full block text-center" onClick={completeAll}>全部完成</Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  )
}
