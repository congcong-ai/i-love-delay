const { v4: uuidv4 } = require('./uuid')

const TASKS_KEY = 'iLoveDelay_tasks'
const EXCUSES_KEY = 'iLoveDelay_excuses'

function now() { return Date.now() }

function read(key, fallback) {
  try {
    const raw = wx.getStorageSync(key)
    if (!raw) return fallback
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(data) || typeof data === 'object' ? data : fallback
  } catch { return fallback }
}

function write(key, val) {
  try { wx.setStorageSync(key, val) } catch {}
}

function getAllTasks() { return read(TASKS_KEY, []) }
function saveAllTasks(list) { write(TASKS_KEY, list) }

function getAllExcuses() { return read(EXCUSES_KEY, []) }
function saveAllExcuses(list) { write(EXCUSES_KEY, list) }

function addTask(name) {
  const tasks = getAllTasks()
  const id = uuidv4()
  const ts = now()
  tasks.unshift({
    id,
    name: String(name || '').trim(),
    status: 'todo', // 'todo' | 'delayed' | 'completed'
    createdAt: ts,
    updatedAt: ts,
    delayCount: 0
  })
  saveAllTasks(tasks)
  return id
}

function updateTaskStatus(id, status) {
  const tasks = getAllTasks()
  const idx = tasks.findIndex(t => t.id === id)
  if (idx < 0) return
  const ts = now()
  const patch = { status, updatedAt: ts }
  if (status === 'completed') patch.completedAt = ts
  tasks[idx] = { ...tasks[idx], ...patch }
  saveAllTasks(tasks)
}

function markTaskDelayed(id) {
  const tasks = getAllTasks()
  const idx = tasks.findIndex(t => t.id === id)
  if (idx < 0) return
  const ts = now()
  const cur = tasks[idx]
  tasks[idx] = {
    ...cur,
    status: 'delayed',
    delayCount: (cur.delayCount || 0) + 1,
    lastDelayedAt: ts,
    updatedAt: ts
  }
  saveAllTasks(tasks)
}

function deleteTask(id) {
  const tasks = getAllTasks().filter(t => t.id !== id)
  saveAllTasks(tasks)
}

function getTasksByStatus(status) {
  return getAllTasks().filter(t => t.status === status)
}

function getTodayTasks() {
  const d = new Date(); d.setHours(0,0,0,0)
  const start = d.getTime()
  return getAllTasks().filter(t => t.createdAt >= start && t.status === 'todo')
}

function addExcuse(taskId, content) {
  const excuses = getAllExcuses()
  const id = uuidv4()
  const ts = now()
  const text = String(content || '').trim()
  if (!text) return null
  excuses.push({ id, taskId, content: text, createdAt: ts, wordCount: text.length })
  saveAllExcuses(excuses)

  // 同步对应任务的拖延状态
  markTaskDelayed(taskId)
  return id
}

function getExcusesByTask(taskId) {
  return getAllExcuses()
    .filter(e => e.taskId === taskId)
    .sort((a,b) => b.createdAt - a.createdAt)
}

function getTaskStats() {
  const tasks = getAllTasks()
  const excuses = getAllExcuses()
  const delayedTasks = tasks.filter(t => t.status === 'delayed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  const delayCounts = {}
  for (const t of tasks) {
    if (t.delayCount > 0) delayCounts[t.name] = (delayCounts[t.name] || 0) + t.delayCount
  }
  const most = Object.entries(delayCounts).sort((a,b) => b[1]-a[1])[0]
  const totalExcuseWords = excuses.reduce((s, e) => s + (e.wordCount || 0), 0)

  return {
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    delayedTasks: delayedTasks.length,
    mostDelayedTask: most ? { name: most[0], count: most[1] } : undefined,
    longestStreak: Math.max(0, ...Object.values(delayCounts)),
    totalExcuses: excuses.length,
    averageExcuseLength: excuses.length > 0 ? Math.round(totalExcuseWords / excuses.length) : 0,
  }
}

function updateOverdueTasks() {
  const tasks = getAllTasks()
  const d = new Date(); d.setDate(d.getDate()-1); d.setHours(23,59,59,999)
  const end = d.getTime()
  let updated = 0
  for (let i=0;i<tasks.length;i++) {
    const t = tasks[i]
    if (t.status === 'todo' && t.createdAt < end) {
      tasks[i] = { ...t, status: 'delayed', delayCount: (t.delayCount||0)+1, lastDelayedAt: now(), updatedAt: now() }
      updated++
    }
  }
  if (updated) saveAllTasks(tasks)
  return updated
}

module.exports = {
  getAllTasks,
  saveAllTasks,
  addTask,
  updateTaskStatus,
  markTaskDelayed,
  deleteTask,
  getTasksByStatus,
  getTodayTasks,
  addExcuse,
  getExcusesByTask,
  getTaskStats,
  updateOverdueTasks,
}
