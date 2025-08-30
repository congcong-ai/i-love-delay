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
      delayCount: task.delayCount + 1,
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
      .sort(([,a], [,b]) => b - a)[0]

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
    await db.open()
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
  }
}