"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Heart, Bookmark, MessageCircle, Share2 } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Card } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import { LoginButton } from '@/components/auth/login-button'

interface ActivityItem {
  id: string
  type: 'like' | 'favorite' | 'comment' | 'share'
  content?: string
  createdAt: string
  task: {
    id: string
    taskId: string
    userId: string
    userName: string
    userAvatar: string
    taskName: string
    excuse: string
  }
}

export function SquareActivity() {
  const { user, isLoggedIn } = useAuthStore()
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const tNet = useTranslations('network')
  const tTime = useTranslations('time')
  const params = useParams() as { locale?: string }
  const locale = params?.locale || 'zh'
  const [category, setCategory] = useState<'all' | 'likes' | 'favorites' | 'comments' | 'shares'>('all')
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [hasMore, setHasMore] = useState(true)

  const fetchData = async () => {
    if (!user?.openid) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert(tNet('offlineDesc'))
      return
    }
    setLoading(true)
    try {
      const limit = page * pageSize
      if (category === 'all') {
        const [likes, favorites, comments, shares] = await Promise.all([
          fetch(`/api/profile/square/activity?userId=${user.openid}&category=likes&limit=${limit}`).then(r => r.json()),
          fetch(`/api/profile/square/activity?userId=${user.openid}&category=favorites&limit=${limit}`).then(r => r.json()),
          fetch(`/api/profile/square/activity?userId=${user.openid}&category=comments&limit=${limit}`).then(r => r.json()),
          fetch(`/api/profile/square/activity?userId=${user.openid}&category=shares&limit=${limit}`).then(r => r.json()),
        ])
        const merged = [...likes, ...favorites, ...comments, ...shares] as ActivityItem[]
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        const sliced = merged.slice(0, limit)
        setItems(sliced)
        setHasMore(merged.length > sliced.length)
      } else {
        const res = await fetch(`/api/profile/square/activity?userId=${user.openid}&category=${category}&limit=${limit}`)
        const data = await res.json()
        const arr = Array.isArray(data) ? (data as ActivityItem[]) : []
        setItems(arr)
        setHasMore(arr.length >= limit)
      }
    } catch (e) {
      console.error('load activity failed:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, user?.openid])

  useEffect(() => {
    if (page === 1) return
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const el = document.getElementById('activity-sentinel')
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loading) {
        setPage((p) => p + 1)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading])

  const formatTime = (v: string) => {
    const d = new Date(v)
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

  if (!isLoggedIn) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-gray-600 mb-4">{t('loginToViewActivity')}</p>
        <div className="flex justify-center"><LoginButton /></div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        {([
          { key: 'all', label: t('activityAll') },
          { key: 'likes', label: t('activityLikes') },
          { key: 'favorites', label: t('activityFavorites') },
          { key: 'comments', label: t('activityComments') },
          { key: 'shares', label: t('activityShares') },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCategory(key as any)}
            className={`px-3 py-1.5 text-sm rounded-full border ${category === key ? 'bg-green-50 text-green-700 border-green-200' : 'text-gray-600 hover:bg-gray-50 border-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <Card className="divide-y">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">{tCommon('loading')}</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">{t('activityEmpty')}</div>
        ) : (
          items.map((it) => (
            <div key={`${it.type}-${it.id}`} className="p-4 flex items-start gap-3 hover:bg-gray-50">
              <div className="shrink-0 mt-0.5">
                {it.type === 'like' && <Heart className="w-4 h-4 text-red-500" />}
                {it.type === 'favorite' && <Bookmark className="w-4 h-4 text-yellow-500" />}
                {it.type === 'comment' && <MessageCircle className="w-4 h-4 text-blue-500" />}
                {it.type === 'share' && <Share2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <Image src={it.task.userAvatar} alt={it.task.userName} width={32} height={32} className="rounded-full ring-1 ring-gray-100" unoptimized />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-800 truncate">
                  {it.type === 'like' && t('activityYouLiked', { name: it.task.userName, task: it.task.taskName })}
                  {it.type === 'favorite' && t('activityYouFavorited', { name: it.task.userName, task: it.task.taskName })}
                  {it.type === 'comment' && t('activityYouCommented', { name: it.task.userName, task: it.task.taskName })}
                  {it.type === 'share' && t('activityYouShared', { task: it.task.taskName })}
                </div>
                {it.type === 'comment' && (
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{it.content}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">{formatTime(it.createdAt)}</div>
                {/* 预览卡片并跳转到广场锚点 */}
                <Link href={`/${locale}/square#pt-${it.task.id}`} className="block mt-2 group">
                  <div className="border rounded-lg p-3 bg-white/60 group-hover:bg-white transition-colors">
                    <div className="text-sm font-medium text-gray-900 truncate">{it.task.taskName}</div>
                    <div className="text-xs text-gray-600 line-clamp-2 mt-1 whitespace-pre-wrap">{it.task.excuse}</div>
                  </div>
                </Link>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* 无限滚动哨兵 */}
      <div id="activity-sentinel" className="h-8" />
    </div>
  )
}
