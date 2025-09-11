# 技术文档 - i love delay

## 技术栈选择

### 前端技术栈
- **Next.js 15** - React框架，支持App Router
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
├── src/
│  ├── app/                        # Next.js App Router（本地化路由）
│  │  ├── [locale]/
│  │  │  ├── api/                  # API 路由（服务器端）
│  │  │  ├── delayed/
│  │  │  ├── rage/
│  │  │  ├── square/
│  │  │  └── profile/
│  │  ├── favicon.ico
│  │  └── globals.css
│  ├── components/                 # 组件（ui/auth/delayed/layout/...）
│  ├── i18n/
│  │  └── request.ts               # next-intl 请求配置
│  ├── lib/
│  │  ├── server/                  # 服务器端工具（PostgreSQL 连接等）
│  │  ├── stores/                  # Zustand stores
│  │  └── i18n/                    # i18n 配置
│  └── index.ts                    # 入口/类型等（如有）
├── db/
│  └── migrations/
│     └── 0001_init.sql            # 服务器端数据库结构与示例数据
├── deploy/
│  ├── nginx.site.template.conf    # Nginx 站点模板
│  └── supervisor.program.template.conf # Supervisor 程序模板
├── messages/                      # 文案字典（zh/en）
├── public/                        # 静态资源
├── scripts/
│  └── kill-port-3000.js           # 跨平台清理 3000 端口
└── next.config.ts                 # Next 配置（output: 'standalone'）
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

### 服务器端数据库（PostgreSQL + pg）

- 迁移脚本：`db/migrations/0001_init.sql`
- 连接池与查询：`src/lib/server/db.ts`（基于 `pg`，在服务器端使用）
- API 路由：`src/app/[locale]/api/**`
  - 例如：`/api/square/share`、`/api/square/comments`、`/api/square/interaction`、`/api/profile/square/activity`
  - 前端通过相对路径请求这些 API；离线时可回退到 IndexedDB 本地数据

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

### 自建部署（standalone + Supervisor + Nginx）

- 构建：`next.config.ts` 设置 `output: 'standalone'`
- 运行：Supervisor 以 `node .next/standalone/server.js` 启动
- Nginx：将 `/_next/static` 直接 alias 到服务器本地目录，避免经 Node 回源导致 404

```nginx
location /_next/static/ {
    alias /var/www/delay.bebackpacker.com/.next/static/;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    access_log off;
}
```

- 详细步骤见：`docs/deployment-self-hosted.md`

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