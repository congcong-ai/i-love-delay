import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Task, TaskStatus } from '@/lib/types'
import { db } from '@/lib/db'

interface TaskStore {
  tasks: Task[]
  isLoading: boolean
  
  // Actions
  loadTasks: () => Promise<void>
  addTask: (name: string) => Promise<void>
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  getTasksByStatus: (status: TaskStatus) => Task[]
  getTodayTasks: () => Task[]
  getDelayedTasks: () => Task[]
  getTaskHistory: () => Promise<string[]>
  updateOverdueTasks: () => Promise<number>
}

export const useTaskStore = create<TaskStore>()(
  devtools(
    persist(
      (set, get) => ({
        tasks: [],
        isLoading: false,

        loadTasks: async () => {
          set({ isLoading: true })
          try {
            const tasks = await db.getAllTasks()
            set({ tasks })
          } catch (error) {
            console.error('Failed to load tasks:', error)
          } finally {
            set({ isLoading: false })
          }
        },

        addTask: async (name: string) => {
      if (!name.trim()) return
      
      try {
        await db.addTask(name)
        await get().loadTasks()
      } catch (error) {
        console.error('Failed to add task:', error)
      }
    },

        updateTaskStatus: async (id: string, status: TaskStatus) => {
          try {
            await db.updateTaskStatus(id, status)
            await get().loadTasks()
          } catch (error) {
            console.error('Failed to update task status:', error)
          }
        },

        deleteTask: async (id: string) => {
          try {
            await db.tasks.delete(id)
            await get().loadTasks()
          } catch (error) {
            console.error('Failed to delete task:', error)
          }
        },

        getTasksByStatus: (status: TaskStatus) => {
          return get().tasks.filter(task => task.status === status)
        },

        getTodayTasks: () => {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          return get().tasks.filter(task => 
            task.createdAt >= today && task.status === 'todo'
          )
        },

        getDelayedTasks: () => {
          return get().tasks.filter(task => task.status === 'delayed')
        },

        getTaskHistory: async () => {
          return db.getTaskHistory()
        },

        updateOverdueTasks: async () => {
          try {
            const updatedCount = await db.updateOverdueTasks()
            if (updatedCount > 0) {
              await get().loadTasks()
            }
            return updatedCount
          } catch (error) {
            console.error('Failed to update overdue tasks:', error)
            return 0
          }
        }
      }),
      {
        name: 'task-store',
        partialize: () => ({ 
          // Only persist UI state, not data
        })
      }
    ),
    {
      name: 'task-store'
    }
  )
)