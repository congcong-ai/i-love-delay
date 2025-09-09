# iFlow CLI - i love delay 项目配置

## 🎯 项目概述

**i love delay** 是一个反向任务管理应用，专为拖延症患者设计。与传统任务管理不同，我们鼓励拖延并为每个拖延任务提供创意借口。

### 核心特色
- 🎭 **鼓励拖延**：不完成任务反而获得奖励
- 📝 **创意借口**：为每个拖延任务写有趣借口
- 📊 **拖延统计**：分析你的拖延模式和习惯
- ⚡ **暴走模式**：突击完成堆积的任务
- 📱 **移动优先**：完美适配手机使用场景
- 🔄 **云端同步**：支持Supabase云端数据同步
- 📱 **UniApp-X集成**：支持小程序和App多端部署
- 🏛️ **广场分享**：在广场分享你的拖延故事和借口
- 🌐 **国际化支持**：支持中英文双语切换

## 🚀 快速开始

### 环境要求
- Node.js 18.x 或更高版本
- npm 或 yarn

### 安装与启动
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行代码检查
npm run lint
```

### 访问应用
- 开发环境：http://localhost:3000
- 生产环境：自动部署到 Vercel

## 🏗️ 技术栈

### 核心技术
- **Next.js 15.5.2** - React框架，支持App Router
- **TypeScript 5.9.2** - 类型安全
- **Tailwind CSS 4.1.12** - 原子化CSS框架
- **React 19.1.0** - 最新React版本
- **next-intl 4.3.5** - 国际化支持

### UI与组件
- **Shadcn/ui** - 现代UI组件库
- **Radix UI** - 无障碍组件基础
- **Lucide React 0.542.0** - 图标库
- **Tailwind Merge** - 样式合并工具
- **tw-animate-css** - 动画样式库

### 状态管理
- **Zustand 5.0.8** - 轻量级状态管理
- **TanStack Query 5.85.5** - 数据获取和缓存

### 数据存储
- **Dexie 4.2.0** - IndexedDB封装库
- **IndexedDB** - 浏览器本地数据库
- **localStorage** - 简单键值存储
- **Supabase 2.56.1** - PostgreSQL云端数据库

### 工具库
- **Class Variance Authority 0.7.1** - 样式变体管理
- **CLSX 2.1.1** - 条件样式类名管理

## 📁 项目结构

```
i-love-delay-web/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局（已弃用，使用[locale]/layout.tsx）
│   ├── favicon.ico        # 网站图标
│   └── [locale]/          # 国际化路由
│       ├── layout.tsx     # 本地化布局
│       ├── page.tsx       # 任务首页
│       ├── api/           # API路由
│       │   └── square/
│       │       └── share/
│       │           └── route.ts
│       ├── delayed/       # 拖延任务页面
│       ├── profile/       # 个人资料页面
│       ├── rage/          # 暴走模式页面
│       └── square/        # 广场页面（社交分享）
├── components/            # React组件
│   ├── auth/             # 认证相关组件
│   │   └── login-button.tsx
│   ├── delayed/          # 拖延页专用组件
│   │   ├── delayed-task-item.tsx
│   │   └── stats-card.tsx
│   ├── rage/             # 暴走页专用组件
│   │   ├── rage-task-list.tsx
│   │   └── rage-task-selector.tsx
│   ├── settings/         # 设置相关组件
│   │   └── language-selector.tsx
│   ├── sync/             # 同步状态组件
│   │   └── sync-status.tsx
│   ├── tasks/            # 任务通用组件
│   │   ├── task-form.tsx
│   │   ├── task-item.tsx
│   │   └── task-list.tsx
│   ├── layout/           # 布局组件
│   │   └── bottom-nav.tsx
│   └── ui/               # Shadcn/ui组件
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── tabs.tsx
│       └── textarea.tsx
├── lib/                  # 工具库
│   ├── stores/           # 状态管理
│   │   ├── auth-store.ts
│   │   ├── excuse-store.ts
│   │   ├── task-store.ts
│   │   └── ui-store.ts
│   ├── i18n/             # 国际化配置
│   │   └── config.ts
│   ├── types.ts          # 类型定义
│   ├── utils.ts          # 工具函数
│   ├── db.ts             # 数据库操作
│   ├── supabase.ts       # Supabase客户端
│   ├── sync-manager.ts   # 数据同步管理器
│   ├── task-scheduler.ts # 任务调度器
│   └── uniapp-bridge.ts  # UniApp-X桥接
├── messages/             # 国际化消息文件
│   ├── en.json          # 英文翻译
│   └── zh.json          # 中文翻译
├── docs/                 # 项目文档
├── public/              # 静态资源
└── supabase/            # Supabase配置
    └── migrations/
        └── 20250830_create_square_tables.sql
```

## 📊 数据模型

### 任务数据结构
```typescript
interface Task {
  id: string                    // 主键
  name: string                  // 任务名称
  status: 'todo' | 'completed' | 'delayed'  // 任务状态
  createdAt: Date              // 创建时间
  updatedAt: Date              // 更新时间
  delayCount: number           // 拖延次数
  lastDelayedAt?: Date         // 最后拖延时间
  completedAt?: Date           // 完成时间
  userId?: string              // 用户ID（云端同步用）
}

interface Excuse {
  id: string                    // 主键
  taskId: string               // 关联任务ID
  content: string              // 借口内容
  createdAt: Date              // 创建时间
  wordCount: number            // 字数统计
}

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

interface TaskStats {
  totalTasks: number
  completedTasks: number
  delayedTasks: number
  mostDelayedTask?: { name: string; count: number }
  longestStreak: number
  totalExcuses: number
  averageExcuseLength: number
}

// 广场相关类型
interface PublicTask {
  id: string
  taskId: string
  userId: string
  userName: string
  userAvatar: string
  taskName: string
  excuse: string
  delayCount: number
  likesCount: number
  isLiked: boolean
  isFavorited: boolean
  createdAt: Date
  comments: Comment[]
}

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createdAt: Date
}

interface UserInteraction {
  id: string
  userId: string
  publicTaskId: string
  interactionType: 'like' | 'favorite'
  createdAt: Date
}
```

## 🔄 核心功能流程

### 任务状态自动转换
- **创建任务**：初始状态为 `todo`
- **自动转换**：当天未操作的任务，第二天自动变为 `delayed`
- **手动操作**：用户可手动标记为 `completed` 或 `delayed`

### 数据同步机制
1. **本地优先**：所有操作先保存到IndexedDB
2. **离线支持**：无网络时正常使用，变更排队
3. **自动同步**：网络恢复后自动同步
4. **冲突解决**：以最新更新时间为准
5. **实时状态**：显示同步状态和待同步变更数

### 国际化机制
1. **路由国际化**：使用 `[locale]` 动态路由
2. **消息文件**：支持中英文双语切换
3. **自动检测**：根据浏览器语言自动设置
4. **手动切换**：用户可在设置中手动切换语言

### 页面功能
1. **任务页（首页）**：创建新任务，显示所有 `todo` 状态任务
2. **拖延页**：管理所有 `delayed` 状态任务，提供借口功能
3. **暴走页**：突击完成拖延任务，支持批量选择
4. **广场页**：社交分享功能，展示用户的拖延故事和创意借口
5. **个人资料页**：用户设置和微信登录集成

## 🛠️ 开发命令

| 命令 | 描述 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 运行ESLint代码检查 |

## 🎯 开发规范

### 代码风格
- 使用TypeScript严格模式
- 遵循ESLint配置（Next.js核心规则 + TypeScript规则）
- 使用函数组件和Hooks
- 组件命名采用PascalCase
- 文件命名采用kebab-case

### 状态管理
- 使用Zustand进行全局状态管理
- 组件内部状态使用useState
- 复杂数据操作使用React Query
- 同步状态使用SyncManager单例

### 样式规范
- 使用Tailwind CSS原子类
- 响应式设计优先
- 移动端优先设计
- 使用CSS变量管理主题
- 遵循Shadcn/ui设计规范

### 国际化规范
- 使用next-intl进行国际化管理
- 消息文件存放在messages/目录
- 键名使用小写加连字符格式
- 支持复数形式和插值

### 项目配置
- **组件配置**：使用components.json统一管理Shadcn/ui配置
- **路径别名**：使用@/前缀指向src目录
- **ESLint**：使用Flat Config格式，支持Next.js和TypeScript
- **国际化**：使用next-intl中间件处理路由国际化

## 🚀 部署配置

### Vercel部署
- 自动部署：main分支推送触发
- 环境变量：支持预览环境和生产环境
- 性能优化：自动代码分割和压缩

### 环境变量
```bash
# 开发环境
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_DEFAULT_LOCALE=zh

# 生产环境
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_DEFAULT_LOCALE=zh
```

### 性能优化
- 图片优化：使用Next.js Image组件
- 代码分割：路由级别自动分割
- 缓存策略：静态资源长期缓存
- CDN加速：全球CDN分发
- 国际化优化：按需加载语言包

## 📱 移动端适配

### 响应式设计
- 断点：sm (640px), md (768px), lg (1024px)
- 移动端优先：基础样式适配手机
- 触摸优化：按钮大小适合手指操作

### PWA支持
- 可安装到主屏幕
- 离线使用支持
- 启动画面配置

### UniApp-X集成
- 支持微信小程序
- 支持App打包
- 统一API接口
- 多端数据同步

## 🔧 环境配置

### Supabase配置
1. 创建Supabase项目
2. 设置数据库表结构
3. 配置认证策略
4. 设置实时订阅

### 微信小程序配置
1. 注册微信小程序账号
2. 配置服务器域名
3. 设置业务域名
4. 配置分享功能

### 国际化配置
1. 配置next-intl中间件
2. 设置默认语言和备用语言
3. 创建消息文件
4. 配置路由前缀

## 📄 相关文档

- [需求文档](./docs/requirements.md) - 产品需求详细说明
- [技术文档](./docs/technical.md) - 技术架构和实现细节
- [任务文档](./docs/tasks.md) - 开发任务清单
- [部署文档](./docs/vercel-deployment.md) - Vercel部署指南
- [Supabase配置](./docs/supabase-setup.md) - Supabase设置指南
- [UniApp-X集成](./docs/uniapp-x-integration.md) - 多端部署指南
- [环境配置](./docs/environment-setup.md) - 开发环境配置指南
- [国际化配置](./docs/i18n-setup.md) - 国际化设置指南

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见项目根目录LICENSE文件

---

*最后更新：2025年8月31日*