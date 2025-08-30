'use client'

import { useState, useEffect } from 'react'
import { initDatabase } from '@/lib/db'
import { useTaskStore } from '@/lib/stores/task-store'
import { useUIStore } from '@/lib/stores/ui-store'
import { RageTaskSelector } from '@/components/rage/rage-task-selector'
import { RageTaskList } from '@/components/rage/rage-task-list'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, CheckCircle2 } from 'lucide-react'

export default function RagePage() {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [isRaging, setIsRaging] = useState(false)
  
  const { tasks, loadTasks, updateTaskStatus, updateOverdueTasks } = useTaskStore()
  const { setCurrentTab } = useUIStore()

  const availableTasks = tasks.filter(
    task => task.status === 'todo' || task.status === 'delayed'
  )
  const selectedTaskObjects = tasks.filter(task => selectedTasks.includes(task.id))

  useEffect(() => {
    const initializePage = async () => {
      await initDatabase()
      await updateOverdueTasks()
      await loadTasks()
      setCurrentTab('rage')
    }

    initializePage()
  }, [loadTasks, updateOverdueTasks, setCurrentTab])

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleSelectAll = () => {
    setSelectedTasks(availableTasks.map(task => task.id))
  }

  const handleClearAll = () => {
    setSelectedTasks([])
  }

  const handleStartRage = () => {
    if (selectedTasks.length > 0) {
      setIsRaging(true)
    }
  }

  const handleTaskCompleted = async (taskId: string) => {
    await updateTaskStatus(taskId, 'completed')
    await loadTasks()
  }

  const handleCompleteAll = async () => {
    for (const taskId of selectedTasks) {
      await updateTaskStatus(taskId, 'completed')
    }
    await loadTasks()
    setSelectedTasks([])
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            暴走模式
          </h1>
          <p className="text-gray-600">
            {isRaging 
              ? '集中精力，一口气完成所有任务！' 
              : '选择今天要突击完成的任务'}
          </p>
        </header>

        {!isRaging ? (
          <>
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="text-orange-600" size={24} />
                <div>
                  <h2 className="text-lg font-semibold">选择暴走任务</h2>
                  <p className="text-sm text-gray-600">
                    从待办和拖延任务中选择今天要突击完成的
                  </p>
                </div>
              </div>

              <RageTaskSelector
                tasks={availableTasks}
                selectedTasks={selectedTasks}
                onTaskToggle={handleTaskToggle}
                onSelectAll={handleSelectAll}
                onClearAll={handleClearAll}
              />

              {selectedTasks.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <Button
                    size="lg"
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={handleStartRage}
                  >
                    <Zap size={20} className="mr-2" />
                    开始暴走 ({selectedTasks.length} 个任务)
                  </Button>
                </div>
              )}
            </Card>
          </>
        ) : (
          <>
            <Card className="p-6 mb-6 bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-orange-800">
                    暴走进行中！
                  </h2>
                  <p className="text-sm text-orange-600">
                    集中精力完成 {selectedTasks.length} 个任务
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsRaging(false)}
                >
                  重新选择
                </Button>
              </div>
            </Card>

            <RageTaskList
              tasks={selectedTaskObjects}
              onTaskCompleted={handleTaskCompleted}
            />

            {selectedTaskObjects.length > 1 && (
              <div className="mt-6">
                <Button
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleCompleteAll}
                  disabled={selectedTaskObjects.every(task => 
                    selectedTaskObjects.filter(t => t.id === task.id).length === 0
                  )}
                >
                  <CheckCircle2 size={20} className="mr-2" />
                  全部完成
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      <BottomNav />
    </div>
  )
}