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
  token: string | null
  setToken: (token: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      isLoading: false,
      token: null,

      login: async () => {
        set({ isLoading: true })
        
        try {
          // 统一尝试通过桥发送消息到壳；若失败再决定是否 mock 或提示
          const provider = (process.env.NEXT_PUBLIC_MOBILE_AUTH_PROVIDER || 'huawei').toLowerCase()
          let sent = false
          if (provider === 'wechat') {
            sent = uniappBridge.requestWechatLogin()
          } else {
            sent = uniappBridge.requestHuaweiLogin()
          }

          if (!sent) {
            // 非壳或桥不可用：仅在允许 mock 时才模拟
            const enableMock = (process.env.NEXT_PUBLIC_ENABLE_MOCK_LOGIN === 'true') || (process.env.NEXT_PUBLIC_ENV !== 'production')
            if (enableMock) {
              console.info('[auth] bridge unavailable, using mock login (dev)')
              const mockUser: WechatUser = {
                openid: 'dev_mock_openid_' + Math.random().toString(36).substr(2, 9),
                nickname: '开发用户',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev'
              }
              get().setUser(mockUser)
            } else {
              // 生产环境且禁止 mock：给出明确提示
              if (typeof window !== 'undefined') {
                alert('请在鸿蒙 App 内使用华为登录')
              }
            }
          }
        } catch (error) {
          console.error('Login failed:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        set({ user: null, isLoggedIn: false, token: null })
      },

      setUser: (user: WechatUser) => {
        set({ user, isLoggedIn: true })
      },

      setToken: async (token: string) => {
        try {
          set({ isLoading: true })
          // 保存 token
          if (typeof window !== 'undefined') {
            localStorage.setItem('app_token', token)
          }
          // 使用 token 获取当前用户信息
          const resp = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
          const json = await resp.json()
          if (resp.ok && json?.success) {
            // 兼容后端可能返回 id 或 userId 字段
            const profile = json.data as { id?: string; userId?: string; displayName?: string; avatarUrl?: string }
            const uid = profile.userId || profile.id || ''
            const user: WechatUser = {
              openid: uid, // 将系统内部 userId/id 写入 openid，保持现有 UI 兼容
              nickname: profile.displayName || '用户',
              avatar: profile.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=app'
            }
            set({ token, user, isLoggedIn: true })
          } else {
            console.error('fetch /api/auth/me failed', json)
          }
        } finally {
          set({ isLoading: false })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isLoggedIn: state.isLoggedIn,
        token: state.token
      })
    }
  )
)

// 监听uniapp登录回调
// 生产推荐：原生仅回传 code，由 Web 端调用后端换取 openid/unionid
uniappBridge.on('WECHAT_LOGIN_CODE', async (data: unknown) => {
  try {
    const payload = (data || {}) as { code?: string }
    if (!payload.code) return
    // 标记加载，仅在当前未登录或正在发起登录时有意义
    useAuthStore.setState({ isLoading: true })

    const resp = await fetch('/api/auth/wechat/mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: payload.code })
    })
    const json = await resp.json()
    if (resp.ok && json?.success) {
      const userInfo: WechatUser = {
        openid: json.data.openid,
        nickname: json.data?.nickname || '微信用户',
        avatar: json.data?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat'
      }
      useAuthStore.getState().setUser(userInfo)
      useAuthStore.setState({ isLoading: false })
    } else {
      useAuthStore.setState({ isLoading: false, user: null, isLoggedIn: false })
      console.error('Wechat mobile login failed', json)
    }
  } catch (e) {
    useAuthStore.setState({ isLoading: false, user: null, isLoggedIn: false })
    console.error('Wechat mobile login error', e)
  }
})

// 接收 uniapp x 注入的系统 token（JWT）
uniappBridge.on('APP_AUTH_TOKEN', async (payload: unknown) => {
  const { token } = (payload || {}) as { token?: string }
  if (!token) return
  await useAuthStore.getState().setToken(token)
})

uniappBridge.on('WECHAT_LOGIN_SUCCESS', (data: unknown) => {
  const userInfo = data as WechatUser
  useAuthStore.getState().setUser(userInfo)
})

uniappBridge.on('WECHAT_LOGIN_FAIL', (data: unknown) => {
  const error = data as { message?: string }
  useAuthStore.setState({ isLoading: false, user: null, isLoggedIn: false })
  console.error('Login failed:', error.message || 'Login failed')
})