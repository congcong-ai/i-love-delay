export interface UniappUserInfo {
  openid: string
  nickname: string
  avatar: string
  unionid?: string
}

export class UniappBridge {
  private isInUniapp = false
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map()

  constructor() {
    if (typeof window !== 'undefined') {
      this.isInUniapp = !!(window as { uni?: { postMessage: (data: unknown) => void } }).uni && !!(window as { uni?: { postMessage: (data: unknown) => void } }).uni?.postMessage
      this.setupMessageListener()
    } else {
      this.isInUniapp = false
    }
  }

  private setupMessageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event: MessageEvent<{ type: string; data: unknown }>) => {
        const { type, data } = event.data
        
        if (this.listeners.has(type)) {
          this.listeners.get(type)!.forEach(callback => callback(data))
        }
      })
    }
  }

  on(event: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: (data: unknown) => void) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event: string, data?: unknown): boolean {
    // 动态探测：有些平台在页面加载后才注入 window.uni
    const canPost = typeof window !== 'undefined' && !!(window as any).uni && typeof (window as any).uni.postMessage === 'function'
    if (canPost) {
      this.isInUniapp = true
      // 注意：uni.postMessage 规范参数为 { data: any }，APP 侧 web-view 在 e.detail.data[0] 接收。
      ;(window as { uni?: { postMessage: (msg: { data: any }) => void } }).uni?.postMessage({
        data: { type: event, data }
      })
      return true
    }

    // Fallback 通道：仅当存在父容器（iframe/webview）时，尝试用 window.parent.postMessage
    try {
      const target: Window | undefined = (typeof window !== 'undefined' && window.parent && window.parent !== window)
        ? window.parent
        : undefined
      if (target && typeof target.postMessage === 'function') {
        target.postMessage({ type: event, data }, '*')
        return true
      }
    } catch {}

    // 开发环境调试
    console.log(`[UniappBridge] (no-bridge) ${event}:`, data)
    return false
  }

  requestWechatLogin(): boolean {
    return this.emit('WECHAT_LOGIN')
  }

  requestHuaweiLogin(): boolean {
    return this.emit('HUAWEI_LOGIN')
  }

  get isInUniappApp() {
    const hasUni = typeof window !== 'undefined' && !!(window as any).uni && typeof (window as any).uni.postMessage === 'function'
    const hasParentBridge = typeof window !== 'undefined' && !!(window as any).parent && (window as any).parent !== window && typeof (window as any).parent.postMessage === 'function'
    if ((hasUni || hasParentBridge) && !this.isInUniapp) this.isInUniapp = true
    return hasUni || hasParentBridge || this.isInUniapp
  }
}

// 单例实例
export const uniappBridge = new UniappBridge()