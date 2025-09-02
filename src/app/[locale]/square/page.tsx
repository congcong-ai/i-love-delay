'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react'
import { BottomNav } from '@/components/layout/bottom-nav'
import { PublicTask } from '@/lib/types'
import { cn } from '@/lib/utils'
import { config } from '@/lib/config'

// 开发环境模拟数据
const mockPublicTasks: PublicTask[] = [
  {
    id: '1',
    taskId: 'task1',
    userId: 'user1',
    userName: '拖延大师',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    taskName: '学习React',
    excuse: '今天状态不好，明天一定学！状态不好是因为昨晚熬夜追剧，现在脑子都是浆糊。',
    delayCount: 5,
    likesCount: 12,
    isLiked: false,
    isFavorited: false,
    createdAt: new Date('2024-01-15'),
    comments: [
      {
        id: 'c1',
        userId: 'user2',
        userName: '借口专家',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
        content: '这个借口我给9分，还有1分怕你骄傲',
        createdAt: new Date('2024-01-16')
      }
    ]
  },
  {
    id: '2',
    taskId: 'task2',
    userId: 'user2',
    userName: '借口专家',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    taskName: '健身计划',
    excuse: '天气太冷了，等暖和点再去。而且今天健身房肯定很多人，去了也抢不到器械。',
    delayCount: 3,
    likesCount: 8,
    isLiked: true,
    isFavorited: false,
    createdAt: new Date('2024-01-14'),
    comments: []
  }
]

function TaskCard({ task }: { task: PublicTask }) {
  const t = useTranslations('square')
  const [isLiked, setIsLiked] = useState(task.isLiked)
  const [isFavorited, setIsFavorited] = useState(task.isFavorited)
  const [likesCount, setLikesCount] = useState(task.likesCount)
  const [showComments, setShowComments] = useState(false)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)
  }

  const handleFavorite = () => {
    setIsFavorited(!isFavorited)
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
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      {/* 用户信息 */}
      <div className="flex items-center mb-3">
        <Image
          src={task.userAvatar}
          alt={task.userName}
          width={40}
          height={40}
          className="rounded-full mr-3"
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
        <p className="text-sm text-gray-600 leading-relaxed">{task.excuse}</p>
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
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{task.comments.length}</span>
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
      {showComments && task.comments.length > 0 && (
        <div className="mt-4 pt-3 border-t space-y-3">
          {task.comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Image
                src={comment.userAvatar}
                alt={comment.userName}
                width={32}
                height={32}
                className="rounded-full flex-shrink-0"
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
          ))}
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

  useEffect(() => {
    fetchPublicTasks()
  }, [])

  const fetchPublicTasks = async () => {
    try {
      const response = await fetch('/api/square/share')
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      } else {
        // Use mock data in development
        if (config.isDevelopment) {
          setTasks(mockPublicTasks)
        }
      }
    } catch (error) {
      console.error('Failed to fetch square data:', error)
      // Use mock data in development
      if (config.isDevelopment) {
        setTasks(mockPublicTasks)
      }
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
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold">{t('procrastinationSquare')}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {t('seeExcuses')}
            </p>
          </div>
        </div>
        <div className="px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold">{t('procrastinationSquare')}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {t('seeExcuses')}
            {config.isDevelopment && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {t('developmentMode')}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex space-x-1">
          {[
            { key: 'all', label: t('all') },
            { key: 'popular', label: t('popular') },
            { key: 'recent', label: t('recent') }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as "all" | "popular" | "recent")}
              className={cn(
                'px-3 py-1.5 text-sm rounded-full transition-colors',
                filter === key
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">🤔</div>
            <p className="text-gray-500">
              {config.isDevelopment ? t('developmentMode') : t('noSharesYet')}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {config.isDevelopment
                ? t('loadedMockData')
                : t('shareYourDelay')}
            </p>
          </div>
        ) : (
          <div>
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}