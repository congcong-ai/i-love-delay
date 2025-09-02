'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Clock, MessageSquare, TrendingUp, Award } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useTaskStore } from '@/lib/stores/task-store'
import { useExcuseStore } from '@/lib/stores/excuse-store'
import { ExcuseRecordsDialog } from './excuse-records-dialog'

export function StatsCard() {
  const { getDelayedTasks } = useTaskStore()
  const { getExcuseStats, excuses } = useExcuseStore()
  const [isClient, setIsClient] = useState(false)
  const [showExcuseDialog, setShowExcuseDialog] = useState(false)

  const [stats, setStats] = useState({
    totalDelayed: 0,
    totalExcuses: 0,
    averageExcuseLength: 0,
    longestStreak: 0
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const loadStats = async () => {
      const delayedTasks = getDelayedTasks()
      const excuseStats = await getExcuseStats()

      const taskDelayCounts = delayedTasks.reduce((acc, task) => {
        acc[task.name] = (acc[task.name] || 0) + task.delayCount
        return acc
      }, {} as Record<string, number>)

      const longestStreak = Math.max(...Object.values(taskDelayCounts), 0)

      setStats({
        totalDelayed: delayedTasks.length,
        totalExcuses: excuseStats.totalExcuses,
        averageExcuseLength: excuseStats.averageLength,
        longestStreak
      })
    }

    loadStats()
  }, [isClient, getDelayedTasks, getExcuseStats, excuses])

  const t = useTranslations('delayed')

  const statItems = [
    {
      icon: Clock,
      label: t('totalDelayedTasks'),
      value: stats.totalDelayed,
      color: 'text-orange-600',
      clickable: false
    },
    {
      icon: MessageSquare,
      label: t('totalExcuses'),
      value: stats.totalExcuses,
      color: 'text-blue-600',
      clickable: true,
      onClick: () => setShowExcuseDialog(true)
    },
    {
      icon: TrendingUp,
      label: t('averageExcuseLength'),
      value: `${stats.averageExcuseLength}${t('characters')}`,
      color: 'text-purple-600',
      clickable: false
    },
    {
      icon: Award,
      label: t('longestDelay'),
      value: `${stats.longestStreak}${t('times')}`,
      color: 'text-red-600',
      clickable: false
    }
  ]

  return (
    <>
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('procrastinationStats')}</h2>
        <div className="grid grid-cols-2 gap-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className={`text-center ${item.clickable
                  ? 'cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors'
                  : ''
                }`}
              onClick={item.clickable ? item.onClick : undefined}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 ${item.color} mb-2`}>
                <item.icon size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{item.value}</div>
              <div className={`text-sm text-gray-600 ${item.clickable ? 'hover:text-blue-600 transition-colors' : ''
                }`}>
                {item.label}
              </div>
              {item.clickable && stats.totalExcuses > 0 && (
                <div className="text-xs text-blue-500 mt-1">
                  {t('clickToView')}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <ExcuseRecordsDialog
        open={showExcuseDialog}
        onOpenChange={setShowExcuseDialog}
      />
    </>
  )
}