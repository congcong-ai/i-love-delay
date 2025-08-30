import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type TabType = 'tasks' | 'delayed' | 'rage'

interface UIStore {
  currentTab: TabType
  theme: 'light' | 'dark'
  isLoading: boolean
  
  // Actions
  setCurrentTab: (tab: TabType) => void
  toggleTheme: () => void
  setLoading: (loading: boolean) => void
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        currentTab: 'tasks',
        theme: 'light',
        isLoading: false,

        setCurrentTab: (tab) => set({ currentTab: tab }),
        
        toggleTheme: () => set((state) => ({ 
          theme: state.theme === 'light' ? 'dark' : 'light' 
        })),
        
        setLoading: (loading) => set({ isLoading: loading })
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({ 
          theme: state.theme,
          currentTab: state.currentTab
        })
      }
    ),
    {
      name: 'ui-store'
    }
  )
)