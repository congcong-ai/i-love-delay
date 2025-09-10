"use client"

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Heart, Bookmark, MessageCircle } from 'lucide-react'
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
  const { user, isLoggedIn, login } = useAuthStore()
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const tNet = useTranslations('network')
  const [category, setCategory] = useState<'all' | 'likes' | 'favorites' | 'comments'>('all')
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    if (!user?.openid) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert(tNet('offlineDesc'))
      return
    }
    setLoading(true)
    try {
      if (category === 'all') {
        const [likes, favorites, comments] = await Promise.all([
          fetch(`/api/profile/square/activity?userId=${user.openid}&category=likes`).then(r => r.json()),
          fetch(`/api/profile/square/activity?userId=${user.openid}&category=favorites`).then(r => r.json()),
          fetch(`/api/profile/square/activity?userId=${user.openid}&category=comments`).then(r => r.json()),
        ])
        const merged = [...likes, ...favorites, ...comments] as ActivityItem[]
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setItems(merged)
      } else {
        const res = await fetch(`/api/profile/square/activity?userId=${user.openid}&category=${category}`)
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('load activity failed:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, user?.openid])

  const formatTime = (v: string) => {
    const d = new Date(v)
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${m}/${day} ${hh}:${mm}`
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
              </div>
              <Image src={it.task.userAvatar} alt={it.task.userName} width={32} height={32} className="rounded-full ring-1 ring-gray-100" unoptimized />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-800 truncate">
                  {it.type === 'like' && t('activityYouLiked', { name: it.task.userName, task: it.task.taskName })}
                  {it.type === 'favorite' && t('activityYouFavorited', { name: it.task.userName, task: it.task.taskName })}
                  {it.type === 'comment' && t('activityYouCommented', { name: it.task.userName, task: it.task.taskName })}
                </div>
                {it.type === 'comment' && (
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{it.content}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">{formatTime(it.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
