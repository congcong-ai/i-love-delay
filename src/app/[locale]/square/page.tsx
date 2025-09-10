'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react'
import { BottomNav } from '@/components/layout/bottom-nav'
import { PublicTask } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useTranslations as useT } from 'next-intl'

// 已移除开发模式下的本地 mock 数据，所有数据均需在线获取

function TaskCard({ task }: { task: PublicTask }) {
  const t = useTranslations('square')
  const tNet = useTranslations('network')
  const tAuth = useT('auth')
  const [isLiked, setIsLiked] = useState(task.isLiked)
  const [isFavorited, setIsFavorited] = useState(task.isFavorited)
  const [likesCount, setLikesCount] = useState(task.likesCount)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState(task.comments || [])
  const [commentsCount, setCommentsCount] = useState<number>(
    typeof task.commentsCount === 'number' ? task.commentsCount : (task.comments?.length || 0)
  )
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const { user, isLoggedIn, login } = useAuthStore()
  const commentInputRef = useRef<HTMLInputElement>(null)

  const handleLike = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert(tNet('offlineDesc'))
      return
    }
    if (!isLoggedIn) {
      const ok = window.confirm(t('interactLogin'))
      if (!ok) return
      try {
        await login()
        await waitLogin()
      } catch (e) {
        alert(t('loginFailed'))
        return
      }
    }
    try {
      const state = useAuthStore.getState()
      const resp = await fetch('/api/square/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicTaskId: task.id, type: 'like', userId: state.user?.openid })
      })
      const result = await resp.json()
      if (resp.ok && result?.success) {
        setIsLiked(Boolean(result.data?.active))
        if (typeof result.data?.likesCount === 'number') {
          setLikesCount(result.data.likesCount)
        }
      } else {
        alert(result?.error || result?.message || t('interactionFailed'))
      }
    } catch (e) {
      console.error('like failed', e)
      alert(t('interactionFailed'))
    }
  }

  const handleFavorite = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert(tNet('offlineDesc'))
      return
    }
    if (!isLoggedIn) {
      const ok = window.confirm(t('interactLogin'))
      if (!ok) return
      try {
        await login()
        await waitLogin()
      } catch (e) {
        alert(t('loginFailed'))
        return
      }
    }
    try {
      const state = useAuthStore.getState()
      const resp = await fetch('/api/square/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicTaskId: task.id, type: 'favorite', userId: state.user?.openid })
      })
      const result = await resp.json()
      if (resp.ok && result?.success) {
        setIsFavorited(Boolean(result.data?.active))
      } else {
        alert(result?.error || result?.message || t('interactionFailed'))
      }
    } catch (e) {
      console.error('favorite failed', e)
      alert(t('interactionFailed'))
    }
  }

  const fetchComments = async () => {
    try {
      setLoadingComments(true)
      const resp = await fetch(`/api/square/comments?publicTaskId=${task.id}`)
      if (resp.ok) {
        const data = await resp.json()
        const normalized = Array.isArray(data)
          ? data.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) }))
          : []
        setComments(normalized)
        setCommentsCount(normalized.length)
      }
    } catch (e) {
      console.error('加载评论失败:', e)
    } finally {
      setLoadingComments(false)
    }
  }

  const waitLogin = () => new Promise<void>((resolve, reject) => {
    const maxAttempts = 20
    let attempts = 0
    const check = () => {
      attempts++
      if (useAuthStore.getState().isLoggedIn) return resolve()
      if (attempts >= maxAttempts) return reject(new Error(tAuth('loginTimeout')))
      setTimeout(check, 500)
    }
    check()
  })

  const handleSubmitComment = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert(tNet('offlineDesc'))
      return
    }
    if (!commentText.trim()) {
      alert(t('enterComment'))
      return
    }
    if (!isLoggedIn) {
      const confirmLogin = window.confirm(t('loginToComment'))
      if (!confirmLogin) return
      try {
        await login()
        await waitLogin()
      } catch (e) {
        console.error('login failed:', e)
        alert(t('loginFailed'))
        return
      }
    }

    setPosting(true)
    try {
      const state = useAuthStore.getState()
      const resp = await fetch('/api/square/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicTaskId: task.id,
          content: commentText.trim(),
          userId: state.user?.openid,
          userName: state.user?.nickname,
          userAvatar: state.user?.avatar,
        })
      })
      const result = await resp.json()
      if (resp.ok && result?.success) {
        const mapped = { ...result.data, createdAt: new Date(result.data.createdAt) }
        setComments(prev => [...prev, mapped])
        setCommentsCount(c => c + 1)
        setCommentText('')
      } else {
        console.error('post comment failed:', result)
        alert(result?.error || result?.message || t('postFailed'))
      }
    } catch (e) {
      console.error('post comment error:', e)
      alert(t('postError'))
    } finally {
      setPosting(false)
    }
  }

  const formatTime = (date: Date) => {
    // 确保在客户端和服务器端使用相同的格式
    if (typeof window === 'undefined') {
      // 服务器端使用简化格式
      return new Date(date).toLocaleDateString('zh-CN')
    }

    // 客户端使用相对时间格式
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return t('today')
    if (days === 1) return t('yesterday')
    if (days < 7) return t('daysAgo', { days })
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 mb-4 hover:shadow-md transition-shadow">
      {/* 用户信息 */}
      <div className="flex items-center mb-3">
        <Image
          src={task.userAvatar}
          alt={task.userName}
          width={40}
          height={40}
          className="rounded-full mr-3 ring-1 ring-gray-100"
          unoptimized
        />
        <div>
          <div className="font-medium text-sm">{task.userName}</div>
          <div className="text-xs text-gray-500">
            {t('delayedCount', { count: task.delayCount })} · {formatTime(task.createdAt)}
          </div>
        </div>
      </div>

      {/* 任务内容 */}
      <div className="mb-3">
        <h3 className="font-medium text-gray-900 mb-2">{task.taskName}</h3>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{task.excuse}</p>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={cn(
              'flex items-center space-x-1 text-sm transition-colors',
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            )}
          >
            <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={async () => {
              const next = !showComments
              setShowComments(next)
              if (next && comments.length === 0) {
                await fetchComments()
              }
              if (next) {
                setTimeout(() => commentInputRef.current?.focus(), 0)
              }
            }}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{commentsCount}</span>
          </button>

          <button
            onClick={handleFavorite}
            className={cn(
              'flex items-center space-x-1 text-sm transition-colors',
              isFavorited ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'
            )}
          >
            <Bookmark className={cn('w-4 h-4', isFavorited && 'fill-current')} />
          </button>
        </div>

        <button className="text-gray-500 hover:text-gray-700">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* 评论区 */}
      {showComments && (
        <div className="mt-4 pt-3 border-t space-y-3">
          {loadingComments ? (
            <div className="text-xs text-gray-400">{t('loading')}</div>
          ) : comments.length === 0 ? (
            <div className="text-xs text-gray-400">{t('noComments')}</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Image
                  src={comment.userAvatar}
                  alt={comment.userName}
                  width={32}
                  height={32}
                  className="rounded-full flex-shrink-0 ring-1 ring-gray-100"
                  unoptimized
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{comment.userName}</span>
                    <span className="text-xs text-gray-500">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                </div>
              </div>
            ))
          )}

          <div className="flex items-center gap-2">
            <Input
              ref={commentInputRef}
              placeholder={t('commentPlaceholder')}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={posting}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentText.trim() && !posting) {
                  e.preventDefault()
                  handleSubmitComment()
                }
              }}
            />
            <Button size="sm" onClick={handleSubmitComment} disabled={posting || !commentText.trim()}>
              {posting ? t('sending') : t('send')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SquarePage() {
  const t = useTranslations('square')
  const [tasks, setTasks] = useState<PublicTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'popular' | 'recent'>('all')
  const { user } = useAuthStore()

  useEffect(() => {
    fetchPublicTasks()
  }, [])

  const fetchPublicTasks = async () => {
    try {
      const userIdParam = user?.openid ? `?userId=${encodeURIComponent(user.openid)}` : ''
      const response = await fetch(`/api/square/share${userIdParam}`)
      if (response.ok) {
        const data = await response.json()
        const normalized: PublicTask[] = Array.isArray(data)
          ? data.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt),
              comments: Array.isArray(item.comments) ? item.comments.map((c: any) => ({
                ...c,
                createdAt: new Date(c.createdAt)
              })) : []
            }))
          : []
        setTasks(normalized)
      } else {
        setTasks([])
      }
    } catch (error) {
      console.error('Failed to fetch square data:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'popular':
        return task.likesCount > 10
      case 'recent':
        return new Date().getTime() - task.createdAt.getTime() < 24 * 60 * 60 * 1000
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 py-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('procrastinationSquare')}</h1>
            <p className="text-sm text-gray-600 mt-2">
              {t('seeExcuses')}
            </p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('procrastinationSquare')}</h1>
          <p className="text-sm text-gray-600 mt-2">
            {t('seeExcuses')}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-center gap-2">
          {[
            { key: 'all', label: t('all') },
            { key: 'popular', label: t('popular') },
            { key: 'recent', label: t('recent') }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as "all" | "popular" | "recent")}
              className={cn(
                'px-3 py-1.5 text-sm rounded-full transition-colors border',
                filter === key
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'text-gray-600 hover:bg-gray-50 border-gray-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">🤔</div>
            <p className="text-gray-500">
              {t('noSharesYet')}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {t('shareYourDelay')}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
              filteredTasks.length === 1 && 'md:grid-cols-1 lg:grid-cols-1'
            )}
          >
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  filteredTasks.length === 1 ? 'md:max-w-2xl md:mx-auto' : ''
                )}
              >
                <TaskCard task={task} />
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}