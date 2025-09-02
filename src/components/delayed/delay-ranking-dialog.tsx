'use client'

import { useEffect, useState, useMemo } from 'react'

import { useTranslations } from 'next-intl'
import { Trophy, Medal, Award } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { useTaskStore } from '@/lib/stores/task-store'

interface DelayRankingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface TaskDelayRanking {
    taskName: string
    delayCount: number
}

export function DelayRankingDialog({ open, onOpenChange }: DelayRankingDialogProps) {
    const { tasks } = useTaskStore()
    const [rankings, setRankings] = useState<TaskDelayRanking[]>([])
    const [selectedTaskName, setSelectedTaskName] = useState<string | null>(null)
    const t = useTranslations('delayed')

    useEffect(() => {
        if (!open) return

        // 计算任务拖延排行榜
        const taskDelayCounts = tasks.reduce((acc, task) => {
            if (task.delayCount > 0) {
                acc[task.name] = (acc[task.name] || 0) + task.delayCount
            }
            return acc
        }, {} as Record<string, number>)

        // 转换为排行榜格式并排序
        const rankingList = Object.entries(taskDelayCounts)
            .map(([taskName, delayCount]) => ({
                taskName,
                delayCount
            }))
            .sort((a, b) => b.delayCount - a.delayCount)

        setRankings(rankingList)
    }, [open, tasks])

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy size={20} className="text-yellow-500" />
            case 2:
                return <Medal size={20} className="text-gray-400" />
            case 3:
                return <Award size={20} className="text-orange-500" />
            default:
                return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">{rank}</span>
        }
    }

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return 'border-l-yellow-500 bg-yellow-50'
            case 2:
                return 'border-l-gray-400 bg-gray-50'
            case 3:
                return 'border-l-orange-500 bg-orange-50'
            default:
                return 'border-l-blue-500 bg-blue-50'
        }
    }

    // 选中任务名称下，所有“被拖延过”的任务实例（delayCount > 0）
    const selectedDelayedInstances = useMemo(() => {
        if (!selectedTaskName) return []
        return tasks
            .filter(t => t.name === selectedTaskName && (t.delayCount || 0) > 0)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }, [tasks, selectedTaskName])

    // 选中任务名称下，所有创建过的任务实例（包含未拖延的）
    const selectedAllInstances = useMemo(() => {
        if (!selectedTaskName) return []
        return tasks.filter(t => t.name === selectedTaskName)
    }, [tasks, selectedTaskName])

    const completedAmongDelayed = useMemo(() => {
        return selectedDelayedInstances.filter(i => !!i.completedAt).length
    }, [selectedDelayedInstances])

    const formatDateTime = (date: Date) => {
        const d = new Date(date)
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        return `${m}月${day}日 ${hh}:${mm}`
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy size={20} className="text-yellow-500" />
                            {selectedTaskName
                                ? t('delayDetailsTitle', { taskName: selectedTaskName })
                                : t('delayRanking')}
                        </div>
                        {selectedTaskName && (
                            <button
                                className="text-xs text-blue-600 hover:underline"
                                onClick={() => setSelectedTaskName(null)}
                            >
                                {t('backToRanking')}
                            </button>
                        )}
                    </DialogTitle>
                    {!selectedTaskName && (
                        <p className="text-sm text-gray-600">
                            {t('delayRankingDesc')}
                        </p>
                    )}
                </DialogHeader>

                {!selectedTaskName ? (
                    <>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {rankings.length === 0 ? (
                                <Card className="p-6 text-center">
                                    <div className="text-gray-500">
                                        <Trophy size={32} className="mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm mb-1">{t('noDelayRanking')}</p>
                                        <p className="text-xs text-gray-400">
                                            {t('createTasksForRanking')}
                                        </p>
                                    </div>
                                </Card>
                            ) : (
                                rankings.map((item, index) => {
                                    const rank = index + 1
                                    return (
                                        <Card
                                            key={item.taskName}
                                            className={`p-3 border-l-4 ${getRankColor(rank)}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {getRankIcon(rank)}
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">
                                                            {item.taskName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {t('rankNumber', { rank })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTaskName(item.taskName)}
                                                    className="text-right px-2 py-1 rounded hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                    aria-label="view delay details"
                                                >
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {item.delayCount}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {t('times')}
                                                    </p>
                                                </button>
                                            </div>
                                        </Card>
                                    )
                                })
                            )}
                        </div>

                        {rankings.length > 0 && (
                            <div className="text-center text-xs text-gray-500 pt-2 border-t">
                                {t('rankingParticipants', { count: rankings.length })}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        <p className="text-xs text-gray-500">
                            {t('delayedInstancesCount', { count: selectedDelayedInstances.length })}
                        </p>
                        <p className="text-xs text-gray-600">
                            {t('summaryCounts', {
                                total: selectedAllInstances.length,
                                delayed: selectedDelayedInstances.length,
                                completed: completedAmongDelayed
                            })}
                        </p>

                        {selectedDelayedInstances.length === 0 ? (
                            <Card className="p-3 text-center text-xs text-gray-500">{t('noDelayedInstances')}</Card>
                        ) : (
                            <div className="space-y-2">
                                {selectedDelayedInstances.map((ins) => (
                                    <Card key={ins.id} className="p-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{ins.name}</p>
                                                <p className="text-xs text-gray-500">{t('createdAtLabel', { date: formatDateTime(ins.createdAt) })}</p>
                                                {ins.completedAt ? (
                                                    <p className="text-xs text-green-600">{t('completedAtLabel', { date: formatDateTime(ins.completedAt) })}</p>
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
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}