import Dexie, { Table } from 'dexie'
import { Task, Excuse, Settings } from './types'

export class ILoveDelayDatabase extends Dexie {
  tasks!: Table<Task>
  excuses!: Table<Excuse>
  settings!: Table<Settings>

  constructor() {
    super('ILoveDelayDB')

    this.version(1).stores({
      tasks: '++id, name, status, createdAt, updatedAt, delayCount',
      excuses: '++id, taskId, content, createdAt, wordCount',
      settings: '++id, theme, language'
    })

    // v2: switch primary keys to string-based 'id' for all tables to align with types and code usage
    this.version(2).stores({
      tasks: 'id, name, status, createdAt, updatedAt, delayCount',
      excuses: 'id, taskId, content, createdAt, wordCount',
      settings: 'id, theme, language'
    }).upgrade(async (tx) => {
      // Migrate tasks: coerce numeric auto-increment IDs to string IDs
      const oldTasks = await tx.table('tasks').toArray()
      await tx.table('tasks').clear()
      for (const t of oldTasks) {
        const anyT = t as any
        const newId = typeof anyT.id === 'string' ? anyT.id : String(anyT.id)
        await tx.table('tasks').add({ ...anyT, id: newId })
      }

      // Migrate excuses: coerce id and taskId to strings
      const oldExcuses = await tx.table('excuses').toArray()
      await tx.table('excuses').clear()
      for (const e of oldExcuses) {
        const anyE = e as any
        const newId = typeof anyE.id === 'string' ? anyE.id : String(anyE.id)
        const newTaskId = typeof anyE.taskId === 'string' ? anyE.taskId : String(anyE.taskId)
        await tx.table('excuses').add({ ...anyE, id: newId, taskId: newTaskId })
      }

      // Migrate settings: coerce id to string
      const oldSettings = await tx.table('settings').toArray()
      await tx.table('settings').clear()
      for (const s of oldSettings) {
        const anyS = s as any
        const newId = typeof anyS.id === 'string' ? anyS.id : String(anyS.id)
        await tx.table('settings').add({ ...anyS, id: newId })
      }
    })
  }

  async addTask(name: string): Promise<string> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const now = new Date()

    await this.tasks.add({
      id,
      name: name.trim(),
      status: 'todo',
      createdAt: now,
      updatedAt: now,
      delayCount: 0
    })

    return id
  }

  async updateTaskStatus(id: string, status: Task['status']): Promise<void> {
    const now = new Date()
    const updateData: Partial<Task> = {
      status,
      updatedAt: now
    }

    if (status === 'completed') {
      updateData.completedAt = now
    }

    await this.tasks.update(id, updateData)
  }

  async markTaskDelayed(id: string): Promise<void> {
    const task = await this.tasks.get(id)
    if (!task) return

    await this.tasks.update(id, {
      status: 'delayed',
      delayCount: (task.delayCount || 0) + 1,
      lastDelayedAt: new Date(),
      updatedAt: new Date()
    })
  }

  async addExcuse(taskId: string, content: string): Promise<string> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    await this.excuses.add({
      id,
      taskId,
      content: content.trim(),
      createdAt: new Date(),
      wordCount: content.trim().length
    })

    // 在添加借口的同时，增加对应任务的拖延次数，并更新相关时间字段
    const task = await this.tasks.get(taskId as any)
    if (task) {
      await this.tasks.update(task.id as any, {
        status: 'delayed',
        delayCount: (task.delayCount || 0) + 1,
        lastDelayedAt: new Date(),
        updatedAt: new Date()
      })
    }

    return id
  }

  async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    return this.tasks.where('status').equals(status).toArray()
  }

  async getTodayTasks(): Promise<Task[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return this.tasks
      .where('createdAt')
      .aboveOrEqual(today)
      .toArray()
  }

  async getDelayedTasks(): Promise<Task[]> {
    return this.tasks.where('status').equals('delayed').toArray()
  }

  async getAllTasks(): Promise<Task[]> {
    return this.tasks.orderBy('createdAt').reverse().toArray()
  }

  async getTaskHistory(): Promise<string[]> {
    const tasks = await this.tasks.orderBy('name').toArray()
    return [...new Set(tasks.map(task => task.name))]
  }

  async getExcusesByTask(taskId: string): Promise<Excuse[]> {
    return this.excuses
      .where('taskId')
      .equals(taskId)
      .toArray()
      .then(excuses => excuses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
  }

  async updateOverdueTasks(): Promise<number> {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(23, 59, 59, 999)

    const overdueTasks = await this.tasks
      .where('status')
      .equals('todo')
      .and(task => task.createdAt < yesterday)
      .toArray()

    let updatedCount = 0

    for (const task of overdueTasks) {
      await this.markTaskDelayed(task.id)
      updatedCount++
    }

    return updatedCount
  }

  // 同步任务的拖延次数为对应借口数量的上限（用于历史数据回填）
  async syncDelayCountsWithExcuses(): Promise<number> {
    const [tasks, excuses] = await Promise.all([
      this.tasks.toArray(),
      this.excuses.toArray()
    ])

    const counts = excuses.reduce((acc, e) => {
      const key = String(e.taskId)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    let updated = 0
    for (const task of tasks) {
      const current = typeof task.delayCount === 'number' ? task.delayCount : 0
      const byExcuses = counts[String(task.id)] || 0
      if (byExcuses > current) {
        await this.tasks.update(task.id as any, { delayCount: byExcuses })
        updated++
      }
    }
    return updated
  }

  async getTaskStats() {
    const [tasks, excuses] = await Promise.all([
      this.tasks.toArray(),
      this.excuses.toArray()
    ])

    const delayedTasks = tasks.filter(t => t.status === 'delayed')
    const completedTasks = tasks.filter(t => t.status === 'completed')

    const taskDelayCounts = tasks.reduce((acc, task) => {
      if (task.delayCount > 0) {
        acc[task.name] = (acc[task.name] || 0) + task.delayCount
      }
      return acc
    }, {} as Record<string, number>)

    const mostDelayedTask = Object.entries(taskDelayCounts)
      .sort(([, a], [, b]) => b - a)[0]

    const totalExcuseWords = excuses.reduce((sum, excuse) => sum + excuse.wordCount, 0)

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      delayedTasks: delayedTasks.length,
      mostDelayedTask: mostDelayedTask ? { name: mostDelayedTask[0], count: mostDelayedTask[1] } : undefined,
      longestStreak: Math.max(...Object.values(taskDelayCounts), 0),
      totalExcuses: excuses.length,
      averageExcuseLength: excuses.length > 0 ? Math.round(totalExcuseWords / excuses.length) : 0
    }
  }
}

export const db = new ILoveDelayDatabase()

export const initDatabase = async () => {
  try {
    // 只在客户端初始化数据库
    if (typeof window === 'undefined') {
      console.log('Database initialization skipped on server')
      return
    }

    await db.open()
    console.log('Database initialized successfully')
  } catch (error) {
    // 处理 Dexie 升级时主键变更的限制：当从 v1(自增 id) 升级到 v2(字符串 id) 时，
    // Dexie 不支持直接变更主键，可能抛出 UpgradeError: "Not yet support for changing primary key"。
    // 在开发阶段，允许自动重置本地库（删除并重建）以应用新 schema。
    const isBrowser = typeof window !== 'undefined'
    const errMsg = error instanceof Error ? error.message : String(error)
    const errName = (error as any)?.name
    const pkChangeError = /Not yet support for changing primary key/i.test(errMsg)

    if (isBrowser) {
      // 情况1：主键变更导致的升级错误（或错误信息包含对应提示）→ 删除并重建
      if (errName === 'UpgradeError' || pkChangeError) {
        console.warn('[Dexie] Detected primary key change upgrade error. Resetting local DB...')
        try {
          db.close()
          await Dexie.delete('ILoveDelayDB')
          await db.open()
          console.info('[Dexie] Local DB has been reset and reopened with v2 schema.')
          return
        } catch (e) {
          console.error('[Dexie] Failed to reset local DB:', e)
        }
      }

      // 情况2：DatabaseClosedError（可能是前一个错误导致的连锁反应）→ 尝试重新打开
      if (errName === 'DatabaseClosedError') {
        try {
          await db.open()
          console.info('[Dexie] DatabaseClosedError recovered by reopening DB.')
          return
        } catch (e) {
          console.error('[Dexie] Failed to reopen DB after DatabaseClosedError:', e)
        }
      }
    }

    console.error('Failed to initialize database:', error)
  }
}

// 手动强制重置本地 DB（用于调试或解决 schema 不兼容问题）
export const hardResetLocalDB = async () => {
  if (typeof window === 'undefined') return
  db.close()
  await Dexie.delete('ILoveDelayDB')
  await db.open()
}