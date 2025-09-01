import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Excuse } from '@/lib/types'
import { db } from '@/lib/db'

interface ExcuseStore {
  excuses: Excuse[]
  isLoading: boolean

  // Actions
  loadExcuses: () => Promise<void>
  addExcuse: (taskId: string, content: string) => Promise<void>
  getExcusesByTask: (taskId: string) => Excuse[]
  getExcuseStats: () => Promise<{
    totalExcuses: number
    averageLength: number
    longestExcuse: Excuse | null
    recentExcuses: Excuse[]
  }>
}

export const useExcuseStore = create<ExcuseStore>()(
  devtools(
    (set, get) => ({
      excuses: [],
      isLoading: false,

      loadExcuses: async () => {
        set({ isLoading: true })
        try {
          const excuses = await db.excuses.orderBy('createdAt').reverse().toArray()
          set({ excuses })
        } catch (error) {
          console.error('Failed to load excuses:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      addExcuse: async (taskId: string, content: string) => {
        if (!content.trim()) return

        try {
          await db.addExcuse(taskId, content)
          await get().loadExcuses()
        } catch (error) {
          console.error('Failed to add excuse:', error)
        }
      },

      getExcusesByTask: (taskId: string) => {
        return get().excuses.filter(excuse => excuse.taskId === taskId)
      },

      getExcuseStats: async () => {
        // 先尝试使用 store 中的数据，如果为空则直接从数据库查询
        let excuses = get().excuses
        if (excuses.length === 0) {
          excuses = await db.excuses.toArray()
        }

        if (excuses.length === 0) {
          return {
            totalExcuses: 0,
            averageLength: 0,
            longestExcuse: null,
            recentExcuses: []
          }
        }

        const totalLength = excuses.reduce((sum, excuse) => sum + excuse.wordCount, 0)
        const longestExcuse = excuses.reduce((longest, excuse) =>
          excuse.wordCount > (longest?.wordCount || 0) ? excuse : longest
          , null as Excuse | null)

        const recentExcuses = excuses
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5)

        return {
          totalExcuses: excuses.length,
          averageLength: Math.round(totalLength / excuses.length),
          longestExcuse,
          recentExcuses
        }
      }
    }),
    {
      name: 'excuse-store'
    }
  )
)