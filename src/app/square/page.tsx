'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react'
import { BottomNav } from '@/components/layout/bottom-nav'
import { PublicTask } from '@/lib/types'
import { cn } from '@/lib/utils'

// 模拟数据
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
  },
  {
    id: '3',
    taskId: 'task3',
    userId: 'user3',
    userName: '拖延艺术家',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
    taskName: '读书计划',
    excuse: '这本书太厚了，我需要先做好心理准备。而且今天光线不太好，对眼睛不好。',
    delayCount: 7,
    likesCount: 15,
    isLiked: false,
    isFavorited: true,
    createdAt: new Date('2024-01-13'),
    comments: [
      {
        id: 'c2',
        userId: 'user1',
        userName: '拖延大师',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        content: '这个理由很充分，我收藏了！',
        createdAt: new Date('2024-01-14')
      },
      {
        id: 'c3',
        userId: 'user4',
        userName: '理由收集者',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
        content: '光线不好这个理由太经典了！',
        createdAt: new Date('2024-01-15')
      }
    ]
  }
]

function TaskCard({ task }: { task: PublicTask }) {
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
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
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
            拖延了{task.delayCount}次 · {formatTime(task.createdAt)}
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
  const [tasks] = useState<PublicTask[]>(mockPublicTasks)
  const [filter, setFilter] = useState<'all' | 'popular' | 'recent'>('all')

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <div className="bg-white border-b">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold">拖延广场</h1>
          <p className="text-sm text-gray-600 mt-1">
            看看大家都在用什么借口拖延
          </p>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex space-x-1">
          {[
            { key: 'all', label: '全部' },
            { key: 'popular', label: '热门' },
            { key: 'recent', label: '最新' }
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

      {/* 内容区域 */}
      <div className="px-4 py-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">🤔</div>
            <p className="text-gray-500">还没有人分享拖延任务</p>
            <p className="text-sm text-gray-400 mt-1">
              快去拖延点什么，然后分享给大家吧！
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

      {/* 底部导航 */}
      <BottomNav />
    </div>
  )
}