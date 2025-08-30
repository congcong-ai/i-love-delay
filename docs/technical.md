# 技术文档 - i love delay

## 技术栈选择

### 前端技术栈
- **Next.js 14** - React框架，支持App Router
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化CSS框架
- **Shadcn/ui** - 现代UI组件库
- **Lucide React** - 图标库
- **Framer Motion** - 动画库
- **React Spring Bottom Sheet** - 底部弹窗组件

### 状态管理
- **Zustand** - 轻量级状态管理
- **TanStack Query (React Query)** - 数据获取和缓存
- **Zod** - 数据验证

### 数据存储
- **IndexedDB** - 浏览器本地数据库
- **Dexie.js** - IndexedDB的Promise封装库
- **localStorage** - 简单键值存储

### 开发工具
- **ESLint** - 代码规范
- **Prettier** - 代码格式化
- **Husky** - Git hooks
- **lint-staged** - 提交前代码检查

## 项目结构

```
i-love-delay/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 任务页（首页）
│   ├── delayed/           # 拖延页
│   │   └── page.tsx
│   ├── rage/              # 暴走页
│   │   └── page.tsx
│   └── globals.css        # 全局样式
├── components/            # 组件
│   ├── ui/               # Shadcn/ui组件
│   ├── tasks/            # 任务相关组件
│   ├── delayed/          # 拖延页组件
│   ├── rage/             # 暴走页组件
│   └── layout/           # 布局组件
├── lib/                  # 工具库
│   ├── db/              # 数据库操作
│   ├── stores/          # 状态管理
│   ├── utils/           # 工具函数
│   └── types/           # 类型定义
├── hooks/               # 自定义hooks
├── constants/           # 常量定义
└── public/              # 静态资源
```

## 数据架构

### 数据库设计（IndexedDB）

#### 任务表 (tasks)
```typescript
interface Task {
  id: string                    // 主键
  name: string                  // 任务名称
  status: TaskStatus           // 任务状态
  createdAt: Date              // 创建时间
  updatedAt: Date              // 更新时间
  delayCount: number           // 拖延次数
  lastDelayedAt?: Date         // 最后拖延时间
  completedAt?: Date           // 完成时间
}

type TaskStatus = 'todo' | 'completed' | 'delayed'
```

#### 借口表 (excuses)
```typescript
interface Excuse {
  id: string                    // 主键
  taskId: string               // 关联任务ID
  content: string              // 借口内容
  createdAt: Date              // 创建时间
  wordCount: number            // 字数统计
}
```

#### 用户设置表 (settings)
```typescript
interface Settings {
  id: string                    // 主键
  theme: 'light' | 'dark'      // 主题
  language: string             // 语言
  wechatUser?: WechatUser      // 微信用户信息
}

interface WechatUser {
  openid: string
  nickname: string
  avatar: string
}
```

### 状态管理设计

#### 任务状态 (useTaskStore)
```typescript
interface TaskStore {
  tasks: Task[]
  addTask: (name: string) => void
  updateTaskStatus: (id: string, status: TaskStatus) => void
  getTasksByStatus: (status: TaskStatus) => Task[]
  getDelayedTasks: () => Task[]
  getTodayTasks: () => Task[]
}
```

#### 借口状态 (useExcuseStore)
```typescript
interface ExcuseStore {
  excuses: Excuse[]
  addExcuse: (taskId: string, content: string) => void
  getExcusesByTask: (taskId: string) => Excuse[]
  getExcuseStats: () => ExcuseStats
}
```

#### UI状态 (useUIStore)
```typescript
interface UIStore {
  currentTab: 'tasks' | 'delayed' | 'rage'
  isLoading: boolean
  theme: 'light' | 'dark'
  setCurrentTab: (tab: string) => void
  toggleTheme: () => void
}
```

## 核心功能实现

### 任务状态自动转换

#### 定时任务机制
```typescript
// 每天凌晨2点执行状态转换
const scheduleTaskStatusUpdate = () => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(2, 0, 0, 0)
  
  const delay = tomorrow.getTime() - now.getTime()
  
  setTimeout(() => {
    updateOverdueTasks()
    scheduleTaskStatusUpdate() // 重新调度
  }, delay)
}

const updateOverdueTasks = async () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  const overdueTasks = await db.tasks
    .where('status')
    .equals('todo')
    .and(task => task.createdAt < yesterday)
    .toArray()
    
  for (const task of overdueTasks) {
    await db.tasks.update(task.id, {
      status: 'delayed',
      delayCount: task.delayCount + 1,
      lastDelayedAt: new Date(),
      updatedAt: new Date()
    })
  }
}
```

### 微信登录集成

#### Webview通信机制
```typescript
// 微信登录流程
const wechatLogin = async () => {
  if (isInUniappWebview()) {
    // 通过JSBridge调用原生微信登录
    window.uni.postMessage({
      type: 'WECHAT_LOGIN',
      data: {}
    })
    
    // 监听登录结果
    window.addEventListener('message', (event) => {
      if (event.data.type === 'WECHAT_LOGIN_SUCCESS') {
        saveWechatUser(event.data.user)
      }
    })
  } else {
    // 网页版微信登录（开发环境）
    const code = await getWechatAuthCode()
    const user = await exchangeCodeForUserInfo(code)
    saveWechatUser(user)
  }
}

// 检测是否在uniapp webview中
const isInUniappWebview = () => {
  return window.uni && window.uni.postMessage
}
```

### 离线存储策略

#### 数据同步机制
```typescript
// 本地数据操作
class LocalDatabase {
  private db: Dexie
  
  constructor() {
    this.db = new Dexie('ILoveDelayDB')
    this.db.version(1).stores({
      tasks: '++id, name, status, createdAt, updatedAt, delayCount',
      excuses: '++id, taskId, content, createdAt, wordCount',
      settings: '++id, theme, language'
    })
  }
  
  async syncWithCloud() {
    if (navigator.onLine) {
      const localTasks = await this.db.tasks.toArray()
      const cloudTasks = await fetchCloudTasks()
      
      // 合并本地和云端数据
      const mergedTasks = mergeTasks(localTasks, cloudTasks)
      await this.db.tasks.bulkPut(mergedTasks)
    }
  }
}

// 监听网络状态
window.addEventListener('online', () => {
  localDatabase.syncWithCloud()
})
```

## 性能优化

### 代码分割
```typescript
// 路由级别的代码分割
const DelayedPage = dynamic(() => import('./delayed/page'), {
  loading: () => <LoadingSpinner />
})

const RagePage = dynamic(() => import('./rage/page'), {
  loading: () => <LoadingSpinner />
})
```

### 图片优化
- 使用Next.js Image组件
- 支持WebP格式
- 响应式图片
- 懒加载

### 缓存策略
- 静态资源缓存1年
- API响应缓存5分钟
- 图片缓存30天

## 安全考虑

### 数据安全
- 本地数据加密存储
- 敏感信息不存储在本地
- 微信登录信息定期刷新

### 隐私保护
- 用户数据本地优先
- 云端数据匿名化处理
- 提供数据导出功能

## 部署方案

### 静态部署
- **Vercel** - 推荐，与Next.js完美集成
- **Netlify** - 备选方案
- **GitHub Pages** - 免费方案

### CDN配置
- 全球CDN加速
- 自动HTTPS
- 自定义域名支持

### 监控方案
- **Vercel Analytics** - 性能监控
- **Sentry** - 错误追踪
- **Google Analytics** - 用户行为分析