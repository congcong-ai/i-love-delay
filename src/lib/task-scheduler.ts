import { db } from './db'

class TaskScheduler {
  private intervalId: NodeJS.Timeout | null = null

  async initialize() {
    // 立即检查一次过期任务
    await this.checkAndUpdateOverdueTasks()
    
    // 设置定时检查
    this.scheduleNextCheck()
    
    // 监听页面可见性变化
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }
  }

  private scheduleNextCheck() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    // 每30分钟检查一次
    this.intervalId = setInterval(async () => {
      await this.checkAndUpdateOverdueTasks()
    }, 30 * 60 * 1000)
  }

  private handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      // 页面变为可见时立即检查
      await this.checkAndUpdateOverdueTasks()
    }
  }

  private async checkAndUpdateOverdueTasks() {
    try {
      const updatedCount = await db.updateOverdueTasks()
      if (updatedCount > 0) {
        console.log(`Updated ${updatedCount} overdue tasks`)
        
        // 触发自定义事件通知组件更新
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tasksUpdated'))
        }
      }
    } catch (error) {
      console.error('Failed to update overdue tasks:', error)
    }
  }

  // 手动触发检查
  async forceCheck() {
    return await this.checkAndUpdateOverdueTasks()
  }

  // 清理定时器
  cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    }
  }
}

export const taskScheduler = new TaskScheduler()

// 初始化调度器
export const initializeTaskScheduler = async () => {
  if (typeof window !== 'undefined') {
    await taskScheduler.initialize()
  }
}