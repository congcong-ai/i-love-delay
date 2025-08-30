import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WechatUser } from '@/lib/types'
import { uniappBridge } from '@/lib/uniapp-bridge'

interface AuthState {
  user: WechatUser | null
  isLoggedIn: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => void
  setUser: (user: WechatUser) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      isLoading: false,

      login: async () => {
        set({ isLoading: true })
        
        try {
          if (uniappBridge.isInUniappApp) {
            // 在uniapp环境中，通过JSBridge请求登录
            uniappBridge.requestWechatLogin()
          } else {
            // 开发环境模拟登录
            const mockUser: WechatUser = {
              openid: 'dev_mock_openid_' + Math.random().toString(36).substr(2, 9),
              nickname: '开发用户',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev'
            }
            get().setUser(mockUser)
          }
        } catch (error) {
          console.error('登录失败:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        set({ user: null, isLoggedIn: false })
      },

      setUser: (user: WechatUser) => {
        set({ user, isLoggedIn: true })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isLoggedIn: state.isLoggedIn 
      })
    }
  )
)

// 监听uniapp登录回调
uniappBridge.on('WECHAT_LOGIN_SUCCESS', (userInfo: WechatUser) => {
  useAuthStore.getState().setUser(userInfo)
})

uniappBridge.on('WECHAT_LOGIN_FAIL', (error: any) => {
  console.error('微信登录失败:', error)
  useAuthStore.setState({ isLoading: false })
})