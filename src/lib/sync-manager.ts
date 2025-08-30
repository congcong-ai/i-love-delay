import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
import { Task, Excuse } from '@/lib/types'

interface SyncStatus {
  lastSyncTime: number
  isOnline: boolean
  pendingChanges: number
}

interface PendingChange {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  data: any
  timestamp: number
}

export class SyncManager {
  private syncStatus: SyncStatus = {
    lastSyncTime: 0,
    isOnline: true,
    pendingChanges: 0
  }

  constructor() {
    this.setupNetworkListener()
    this.setupPeriodicSync()
  }

  private setupNetworkListener() {
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true
      this.syncAll()
    })

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false
    })
  }

  private setupPeriodicSync() {
    // 每5分钟自动同步一次
    setInterval(() => {
      if (this.syncStatus.isOnline) {
        this.syncAll()
      }
    }, 5 * 60 * 1000)
  }

  async syncAll() {
    try {
      console.log('开始同步数据...')
      
      await Promise.all([
        this.syncTasks(),
        this.syncExcuses(),
        this.syncUserData()
      ])

      this.syncStatus.lastSyncTime = Date.now()
      console.log('数据同步完成')
    } catch (error) {
      console.error('同步失败:', error)
    }
  }

  private async syncTasks() {
    try {
      // 获取本地任务
      const localTasks = await db.tasks.toArray()
      
      // 获取云端任务
      const { data: cloudTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('updated_at', new Date(this.syncStatus.lastSyncTime).toISOString())

      if (error) throw error

      // 合并数据（冲突解决：以最新更新时间为准）
      const taskMap = new Map<string, any>()
      
      // 添加本地任务
      localTasks.forEach(task => {
        taskMap.set(task.id, {
          ...task,
          source: 'local'
        })
      })

      // 添加云端任务（如果更新则覆盖）
      cloudTasks?.forEach(task => {
        const localTask = taskMap.get(task.id)
        if (!localTask || new Date(task.updated_at) > new Date(localTask.updatedAt)) {
          taskMap.set(task.id, {
            ...task,
            source: 'cloud'
          })
        }
      })

      // 同步到本地数据库
      const tasksToSync = Array.from(taskMap.values())
      await db.tasks.bulkPut(tasksToSync.map(task => ({
        id: task.id,
        name: task.name,
        status: task.status,
        delayCount: task.delay_count || task.delayCount,
        createdAt: new Date(task.created_at || task.createdAt),
        updatedAt: new Date(task.updated_at || task.updatedAt),
        userId: task.user_id || task.userId
      })))

      // 推送本地变更到云端
      await this.pushLocalChanges('tasks')

    } catch (error) {
      console.error('同步任务失败:', error)
    }
  }

  private async syncExcuses() {
    try {
      const localExcuses = await db.excuses.toArray()
      
      const { data: cloudExcuses, error } = await supabase
        .from('excuses')
        .select('*')
        .gte('created_at', new Date(this.syncStatus.lastSyncTime).toISOString())

      if (error) throw error

      // 同步借口（云端优先）
      const excuseMap = new Map<string, any>()
      
      localExcuses.forEach(excuse => {
        excuseMap.set(excuse.id, excuse)
      })

      cloudExcuses?.forEach(excuse => {
        excuseMap.set(excuse.id, {
          id: excuse.id,
          taskId: excuse.task_id,
          content: excuse.content,
          wordCount: excuse.word_count,
          createdAt: new Date(excuse.created_at)
        })
      })

      await db.excuses.bulkPut(Array.from(excuseMap.values()))

    } catch (error) {
      console.error('同步借口失败:', error)
    }
  }

  private async syncUserData() {
    try {
      // 获取用户信息
      const { data: userData, error } = await supabase.auth.getUser()
      
      if (error) throw error
      
      if (userData.user) {
        // 存储用户信息到本地
        localStorage.setItem('user_id', userData.user.id)
      }

    } catch (error) {
      console.error('同步用户数据失败:', error)
    }
  }

  private async pushLocalChanges(table: string) {
    try {
      // 获取需要推送的变更
      const pendingChanges = await this.getPendingChanges(table)
      
      for (const change of pendingChanges) {
        switch (change.type) {
          case 'create':
            await supabase.from(table).insert(change.data)
            break
          case 'update':
            await supabase.from(table).update(change.data).eq('id', change.id)
            break
          case 'delete':
            await supabase.from(table).delete().eq('id', change.id)
            break
        }
      }

      // 清除已同步的变更
      await this.clearPendingChanges(table)

    } catch (error) {
      console.error(`推送${table}变更失败:`, error)
    }
  }

  private async getPendingChanges(table: string): Promise<PendingChange[]> {
    // 从本地存储获取待同步的变更
    const key = `pending_changes_${table}`
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  }

  private async clearPendingChanges(table: string) {
    const key = `pending_changes_${table}`
    localStorage.removeItem(key)
  }

  async addPendingChange(table: string, change: PendingChange) {
    const changes = await this.getPendingChanges(table)
    changes.push(change)
    localStorage.setItem(`pending_changes_${table}`, JSON.stringify(changes))
    this.syncStatus.pendingChanges = changes.length
  }

  async createTask(task: Omit<Task, 'id'>) {
    const id = crypto.randomUUID()
    const newTask = { ...task, id }
    
    // 保存到本地
    await db.tasks.add(newTask)
    
    // 添加到待同步队列
    await this.addPendingChange('tasks', {
      id,
      type: 'create',
      table: 'tasks',
      data: {
        ...task,
        delay_count: task.delayCount,
        created_at: task.createdAt.toISOString(),
        updated_at: task.updatedAt.toISOString()
      },
      timestamp: Date.now()
    })

    // 如果在线，立即同步
    if (this.syncStatus.isOnline) {
      this.syncAll()
    }

    return newTask
  }

  async updateTask(id: string, updates: Partial<Task>) {
    // 更新本地
    await db.tasks.update(id, updates)
    
    // 添加到待同步队列
    await this.addPendingChange('tasks', {
      id,
      type: 'update',
      table: 'tasks',
      data: updates,
      timestamp: Date.now()
    })

    if (this.syncStatus.isOnline) {
      this.syncAll()
    }
  }

  async deleteTask(id: string) {
    // 删除本地
    await db.tasks.delete(id)
    
    // 添加到待同步队列
    await this.addPendingChange('tasks', {
      id,
      type: 'delete',
      table: 'tasks',
      data: null,
      timestamp: Date.now()
    })

    if (this.syncStatus.isOnline) {
      this.syncAll()
    }
  }

  getStatus() {
    return { ...this.syncStatus }
  }

  async forceSync() {
    if (this.syncStatus.isOnline) {
      await this.syncAll()
    }
  }
}

// 单例实例
export const syncManager = new SyncManager()

// 监听网络状态变化
window.addEventListener('load', () => {
  // 页面加载时同步一次
  if (navigator.onLine) {
    syncManager.syncAll()
  }
})