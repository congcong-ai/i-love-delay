'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { initDatabase } from '@/lib/db'
import { useTaskStore } from '@/lib/stores/task-store'
import { useUIStore } from '@/lib/stores/ui-store'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskList } from '@/components/tasks/task-list'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Card } from '@/components/ui/card'

export default function HomePage() {
  const { loadTasks, updateOverdueTasks, getTasksByStatus } = useTaskStore()
  const { setCurrentTab } = useUIStore()
  const t = useTranslations('tasks')
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false)

  useEffect(() => {
    const initializeApp = async () => {
      await initDatabase()
      await updateOverdueTasks()
      await loadTasks()
      setCurrentTab('tasks')
    }

    initializeApp()

    // 设置定时检查（每30分钟检查一次）
    const interval = setInterval(() => {
      updateOverdueTasks()
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [loadTasks, updateOverdueTasks, setCurrentTab])

  const todoTasks = getTasksByStatus('todo')
  const completedTasks = getTasksByStatus('completed')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600">
            {t('createAndProcrastinate')}
          </p>
        </header>

        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('addTask')}</h2>
          <TaskForm />
        </Card>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {t('pending')} ({todoTasks.length})
            </h2>
          </div>

          {todoTasks.length > 0 && (
            <p className="text-sm text-gray-600 mb-4">
              {t('tasksWaitingMessage', { count: todoTasks.length })}
            </p>
          )}

          <TaskList status="todo" />
        </div>

        {todoTasks.length === 0 && (
          <Card className="p-8 text-center bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="text-gray-700">
              <h3 className="text-xl font-semibold mb-2">{t('feelingFreeToday')}</h3>
              <p className="mb-4">{t('createToStartProcrastination')}</p>
              <p className="text-sm text-gray-500">
                {t('procrastinationQuote')}
              </p>
            </div>
          </Card>
        )}

        {/* 已完成任务列表 */}
        {completedTasks.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {t('completed')} ({completedTasks.length})
              </h2>
              <button
                onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span>{isCompletedExpanded ? t('collapse') : t('expand')}</span>
                {isCompletedExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            </div>

            {isCompletedExpanded && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  {t('completionSatisfaction')}
                </p>

                <TaskList status="completed" />
              </>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}