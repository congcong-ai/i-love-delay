export type TaskStatus = 'todo' | 'completed' | 'delayed'

export interface Task {
  id: string
  name: string
  status: TaskStatus
  createdAt: Date
  updatedAt: Date
  delayCount: number
  lastDelayedAt?: Date
  completedAt?: Date
  userId?: string
}

export interface Excuse {
  id: string
  taskId: string
  content: string
  createdAt: Date
  wordCount: number
}

export interface Settings {
  id: string
  theme: 'light' | 'dark'
  language: string
  wechatUser?: WechatUser
}

export interface WechatUser {
  openid: string
  nickname: string
  avatar: string
}

export interface TaskStats {
  totalTasks: number
  completedTasks: number
  delayedTasks: number
  mostDelayedTask?: { name: string; count: number }
  longestStreak: number
  totalExcuses: number
  averageExcuseLength: number
}

// 广场相关类型
export interface PublicTask {
  id: string
  taskId: string
  userId: string
  userName: string
  userAvatar: string
  taskName: string
  excuse: string
  delayCount: number
  likesCount: number
  isLiked: boolean
  isFavorited: boolean
  createdAt: Date
  comments: Comment[]
}

export interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createdAt: Date
}

export interface UserInteraction {
  id: string
  userId: string
  publicTaskId: string
  interactionType: 'like' | 'favorite'
  createdAt: Date
}