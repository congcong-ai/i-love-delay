import Taro from '@tarojs/taro'

export type TaskStatus = 'todo' | 'completed' | 'delayed'

export interface Task {
  id: string
  name: string
  status: TaskStatus
  createdAt: number
  updatedAt: number
  delayCount: number
  lastDelayedAt?: number
  completedAt?: number
}

export interface Excuse {
  id: string
  taskId: string
  content: string
  createdAt: number
  wordCount: number
}

const KEY_TASKS = 'unified_tasks'
const KEY_EXCUSES = 'unified_excuses'
const LEGACY_TASKS = 'tasks' // 来自旧版任务页
const LEGACY_DELAYED = 'delayed' // 来自旧版“拖延记录”

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const v = Taro.getStorageSync(key)
    if (v && typeof v === 'object') return v as T
    if (typeof v === 'string') return JSON.parse(v) as T
    return v || fallback
  } catch {
    return fallback
  }
}

function safeSet<T>(key: string, value: T) {
  try {
    Taro.setStorageSync(key, value)
  } catch {}
}

export function getAllTasks(): Task[] {
  const tasks = safeGet<Task[]>(KEY_TASKS, [])
  return tasks.sort((a, b) => b.createdAt - a.createdAt)
}

export function getAllExcuses(): Excuse[] {
  const excuses = safeGet<Excuse[]>(KEY_EXCUSES, [])
  return excuses.sort((a, b) => b.createdAt - a.createdAt)
}

export function saveAll(tasks: Task[], excuses: Excuse[]) {
  safeSet(KEY_TASKS, tasks)
  safeSet(KEY_EXCUSES, excuses)
}

export function getDelayedTasks(): Task[] {
  return getAllTasks().filter(t => t.status === 'delayed')
}

export function getExcusesByTask(taskId: string): Excuse[] {
  return getAllExcuses().filter(e => e.taskId === taskId).sort((a, b) => b.createdAt - a.createdAt)
}

export function addTask(name: string): Task {
  const now = Date.now()
  const tasks = getAllTasks()
  const t: Task = {
    id: genId('t'),
    name: name.trim(),
    status: 'todo',
    createdAt: now,
    updatedAt: now,
    delayCount: 0,
  }
  const excuses = getAllExcuses()
  saveAll([t, ...tasks], excuses)
  return t
}

export function updateTaskStatus(id: string, status: TaskStatus) {
  const tasks = getAllTasks()
  const excuses = getAllExcuses()
  const now = Date.now()
  const idx = tasks.findIndex(t => t.id === id)
  if (idx >= 0) {
    const t = tasks[idx]
    tasks[idx] = {
      ...t,
      status,
      updatedAt: now,
      completedAt: status === 'completed' ? now : t.completedAt
    }
    saveAll(tasks, excuses)
  }
}

export function addExcuse(taskId: string, content: string) {
  const tasks = getAllTasks()
  const excuses = getAllExcuses()
  const now = Date.now()
  const e: Excuse = {
    id: genId('e'),
    taskId,
    content: content.trim(),
    createdAt: now,
    wordCount: content.trim().length,
  }
  const idx = tasks.findIndex(t => t.id === taskId)
  if (idx >= 0) {
    const t = tasks[idx]
    tasks[idx] = {
      ...t,
      status: 'delayed',
      delayCount: (t.delayCount || 0) + 1,
      lastDelayedAt: now,
      updatedAt: now,
    }
  }
  saveAll(tasks, [e, ...excuses])
}

export function getExcuseStats() {
  const excuses = getAllExcuses()
  const totalExcuses = excuses.length
  const averageLength = totalExcuses === 0 ? 0 : Math.round(excuses.reduce((s, e) => s + e.wordCount, 0) / totalExcuses)
  const tasks = getAllTasks()
  const longestStreak = Math.max(0, ...tasks.map(t => t.delayCount || 0))
  return { totalExcuses, averageLength, longestStreak }
}

export function initAndSyncFromLegacy() {
  // 若已存在统一数据，直接返回
  const existing = safeGet<Task[]>(KEY_TASKS, [])
  if (existing.length > 0) return

  // 迁移旧版任务（tasks 页面）
  const oldTasks = safeGet<any[]>(LEGACY_TASKS, [])
  const legacyDelayed = safeGet<any[]>(LEGACY_DELAYED, [])

  const now = Date.now()
  const nameMap = new Map<string, Task>()
  const tasks: Task[] = []
  const excuses: Excuse[] = []

  // 1) 从旧任务迁移
  for (const ot of oldTasks) {
    const id = String(ot.id || genId('t'))
    const name = String(ot.title || ot.name || '未命名任务')
    const createdAt = Number(ot.createdAt || now)
    const status: TaskStatus = ot.done ? 'completed' : 'todo'
    const t: Task = {
      id,
      name,
      status,
      createdAt,
      updatedAt: createdAt,
      delayCount: 0,
      completedAt: ot.done ? createdAt : undefined,
    }
    tasks.push(t)
    nameMap.set(name, t)
  }

  // 2) 将旧“拖延记录”整合为借口与拖延次数
  for (const r of legacyDelayed) {
    const name = String(r.reason || '未命名任务')
    let task = nameMap.get(name)
    if (!task) {
      task = {
        id: genId('t'),
        name,
        status: 'delayed',
        createdAt: Number(r.createdAt || now),
        updatedAt: Number(r.createdAt || now),
        delayCount: 0,
        lastDelayedAt: Number(r.createdAt || now),
      }
      tasks.push(task)
      nameMap.set(name, task)
    }
    task.status = 'delayed'
    task.delayCount = (task.delayCount || 0) + 1
    task.lastDelayedAt = Number(r.createdAt || now)
    task.updatedAt = Number(r.createdAt || now)

    const e: Excuse = {
      id: genId('e'),
      taskId: task.id,
      content: `系统记录 +${r.minutes || 0} 分钟`,
      createdAt: Number(r.createdAt || now),
      wordCount: String(`+${r.minutes || 0} 分钟`).length,
    }
    excuses.push(e)
  }

  saveAll(tasks, excuses)
}

export function formatDateTime(ts?: number) {
  if (!ts) return ''
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}月${dd}日 ${hh}:${mi}`
}
