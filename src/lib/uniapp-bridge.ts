export interface UniappUserInfo {
  openid: string
  nickname: string
  avatar: string
  unionid?: string
}

export class UniappBridge {
  private isInUniapp = false
  private listeners: Map<string, Function[]> = new Map()

  constructor() {
    this.isInUniapp = !!(window as any).uni && !!(window as any).uni.postMessage
    this.setupMessageListener()
  }

  private setupMessageListener() {
    window.addEventListener('message', (event) => {
      const { type, data } = event.data
      
      if (this.listeners.has(type)) {
        this.listeners.get(type)!.forEach(callback => callback(data))
      }
    })
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event: string, data?: any) {
    if (this.isInUniapp) {
      ;(window as any).uni.postMessage({
        type: event,
        data
      })
    } else {
      // 开发环境调试
      console.log(`[UniappBridge] ${event}:`, data)
    }
  }

  requestWechatLogin() {
    this.emit('WECHAT_LOGIN')
  }

  get isInUniappApp() {
    return this.isInUniapp
  }
}

// 单例实例
export const uniappBridge = new UniappBridge()