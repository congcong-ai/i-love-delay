'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { useTaskStore } from '@/lib/stores/task-store'

interface DelayDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskName: string
}

export function DelayDetailsDialog({ open, onOpenChange, taskName }: DelayDetailsDialogProps) {
  const { tasks } = useTaskStore()
  const t = useTranslations('delayed')
  const tTime = useTranslations('time')

  const allInstances = useMemo(() => tasks.filter(t => t.name === taskName), [tasks, taskName])
  const delayedInstances = useMemo(() => allInstances.filter(t => (t.delayCount || 0) > 0), [allInstances])
  const completedAmongDelayed = useMemo(() => delayedInstances.filter(t => !!t.completedAt).length, [delayedInstances])

  const formatRelative = (date: Date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const minutes = Math.floor(diffMs / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    if (minutes < 1) return tTime('justNow')
    if (minutes < 60) return tTime('minutesAgo', { minutes })
    if (hours < 24) return tTime('hoursAgo', { hours })
    if (days === 1) return tTime('yesterday')
    return tTime('daysAgo', { days })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {t('delayDetailsTitle', { taskName })}
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-gray-600 mb-2">
          {t('summaryCounts', { total: allInstances.length, delayed: delayedInstances.length, completed: completedAmongDelayed })}
        </div>
        <div className="text-xs text-gray-500 mb-3">
          {t('delayedInstancesCount', { count: delayedInstances.length })}
        </div>

        {delayedInstances.length === 0 ? (
          <Card className="p-4 text-center text-sm text-gray-500">{t('noDelayedInstances')}</Card>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {delayedInstances.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((ins) => (
              <Card key={ins.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ins.name}</p>
                    <p className="text-xs text-gray-500">{t('createdAtLabel', { date: formatRelative(ins.createdAt) })}</p>
                    {ins.completedAt ? (
                      <p className="text-xs text-green-600">{t('completedAtLabel', { date: formatRelative(ins.completedAt) })}</p>
                    ) : (
                      <p className="text-xs text-orange-600">{t('notCompletedYet')}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900">{ins.delayCount}</p>
                    <p className="text-xs text-gray-500">{t('times')}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
