'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { MessageSquare, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useExcuseStore } from '@/lib/stores/excuse-store'
import { Excuse } from '@/lib/types'

// 详细的日期格式化函数，显示时间信息
const formatDateTime = (date: Date) => {
    // 确保在客户端和服务器端使用相同的格式
    if (typeof window === 'undefined') {
        // 服务器端使用 ISO 格式
        return new Date(date).toLocaleDateString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // 客户端使用本地化格式
    const d = new Date(date)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const minute = String(d.getMinutes()).padStart(2, '0')
    return `${month}月${day}日 ${hour}:${minute}`
}

interface ExcuseRecordsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ExcuseRecordsDialog({ open, onOpenChange }: ExcuseRecordsDialogProps) {
    const { getAllExcusesWithTask } = useExcuseStore()
    const [excuses, setExcuses] = useState<Array<Excuse & { taskName?: string }>>([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const t = useTranslations('delayed')
    const tCommon = useTranslations('common')

    const excusesPerPage = 10
    const totalPages = Math.ceil(excuses.length / excusesPerPage)
    const startIndex = (currentPage - 1) * excusesPerPage
    const endIndex = startIndex + excusesPerPage
    const currentExcuses = excuses.slice(startIndex, endIndex)

    useEffect(() => {
        if (open) {
            loadExcuses()
        }
    }, [open])

    const loadExcuses = async () => {
        setLoading(true)
        try {
            const excusesWithTask = await getAllExcusesWithTask()
            setExcuses(excusesWithTask)
            setCurrentPage(1)
        } catch (error) {
            console.error('Failed to load excuses:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1))
    }

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare size={20} className="text-blue-600" />
                        {t('allExcuseRecords')}
                        <Badge variant="secondary" className="ml-2">
                            {t('totalCount', { count: excuses.length })}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="text-gray-500">{tCommon('loading')}</div>
                        </div>
                    ) : excuses.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {t('noExcuseRecords')}
                            </h3>
                            <p className="text-gray-500">
                                {t('startCreatingExcuses')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {currentExcuses.map((excuse) => (
                                <Card key={excuse.id} className="p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {excuse.taskName}
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                    {excuse.wordCount} 字
                                                </span>
                                            </div>
                                            <p className="text-gray-800 text-sm leading-relaxed mb-2">
                                                {excuse.content}
                                            </p>
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Calendar size={12} className="mr-1" />
                                                {formatDateTime(excuse.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* 分页控制 */}
                {excuses.length > excusesPerPage && (
                    <div className="flex-shrink-0 border-t pt-4 mt-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                {t('showingRange', {
                                    start: startIndex + 1,
                                    end: Math.min(endIndex, excuses.length),
                                    total: excuses.length
                                })}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16} />
                                    {tCommon('previous')}
                                </Button>
                                <span className="text-sm font-medium px-2">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                >
                                    {tCommon('next')}
                                    <ChevronRight size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}