'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { initDatabase } from '@/lib/db'
import { useTaskStore } from '@/lib/stores/task-store'
import { useExcuseStore } from '@/lib/stores/excuse-store'
import { useUIStore } from '@/lib/stores/ui-store'
import { DelayedTaskItem } from '@/components/delayed/delayed-task-item'
import { StatsCard } from '@/components/delayed/stats-card'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Card } from '@/components/ui/card'

export default function DelayedPage() {
  const { getDelayedTasks, loadTasks, updateOverdueTasks } = useTaskStore()
  const { loadExcuses } = useExcuseStore()
  const { setCurrentTab } = useUIStore()
  const t = useTranslations('delayed')

  const delayedTasks = getDelayedTasks()

  useEffect(() => {
    const initializePage = async () => {
      await initDatabase()
      await updateOverdueTasks()
      await Promise.all([
        loadTasks(),
        loadExcuses()
      ])
      setCurrentTab('delayed')
    }

    initializePage()
  }, [loadTasks, loadExcuses, updateOverdueTasks, setCurrentTab])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600">
            {t('perfectExcuse')}
          </p>
        </header>

        <StatsCard />

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {t('delayedTasks')} ({delayedTasks.length})
            </h2>
          </div>
          
          {delayedTasks.length > 0 && (
            <p className="text-sm text-gray-600 mb-4">
              {t('enjoyingDelay', { count: delayedTasks.length })}
            </p>
          )}
          
          {delayedTasks.length === 0 ? (
            <Card className="p-8 text-center bg-gradient-to-r from-orange-50 to-red-50">
              <div className="text-gray-700">
                <h3 className="text-xl font-semibold mb-2">{t('greatJob')}</h3>
                <p className="mb-4">{t('noDelayedYet')}</p>
                <p className="text-sm text-gray-500">
                  {t('artOfDelay')}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {delayedTasks.map((task) => (
                <DelayedTaskItem 
                  key={task.id} 
                  task={task} 
                  onUpdate={() => {
                    loadTasks()
                    loadExcuses()
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}