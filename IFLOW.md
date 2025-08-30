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
- **TypeScript 5.x** - 类型安全
- **Tailwind CSS 4.x** - 原子化CSS框架
- **React 19.1.0** - 最新React版本

### UI与组件
- **Shadcn/ui** - 现代UI组件库
- **Radix UI** - 无障碍组件基础
- **Lucide React 0.542.0** - 图标库
- **Tailwind Merge** - 样式合并工具

### 状态管理
- **Zustand 5.0.8** - 轻量级状态管理
- **TanStack Query 5.85.5** - 数据获取和缓存

### 数据存储
- **Dexie 4.2.0** - IndexedDB封装库
- **IndexedDB** - 浏览器本地数据库
- **localStorage** - 简单键值存储
- **Supabase** - PostgreSQL云端数据库

### 工具库
- **Class Variance Authority 0.7.1** - 样式变体管理
- **CLSX 2.1.1** - 条件样式类名管理

## 📁 项目结构

```
i-love-dalay-web/
├── app/                    # Next.js App Router
│   ├── delayed/           # 拖延任务页面
│   ├── rage/              # 暴走模式页面
│   ├── square/            # 广场页面（新功能）
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 任务首页
├── components/            # React组件
│   ├── auth/             # 认证相关组件
│   ├── delayed/          # 拖延页专用组件
│   ├── rage/             # 暴走页专用组件
│   ├── tasks/            # 任务通用组件
│   ├── layout/           # 布局组件
│   ├── sync/             # 同步状态组件
│   └── ui/               # Shadcn/ui组件
├── lib/                  # 工具库
│   ├── stores/           # 状态管理
│   ├── types.ts          # 类型定义
│   ├── utils.ts          # 工具函数
│   ├── db.ts             # 数据库操作
│   ├── supabase.ts       # Supabase客户端
│   ├── sync-manager.ts   # 数据同步管理器
│   ├── task-scheduler.ts # 任务调度器
│   └── uniapp-bridge.ts  # UniApp-X桥接
├── docs/                 # 项目文档
└── public/              # 静态资源
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

interface SyncStatus {
  lastSyncTime: number         // 最后同步时间
  isOnline: boolean           // 是否在线
  pendingChanges: number      // 待同步变更数
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

### 页面功能
1. **任务页（首页）**：创建新任务，显示所有 `todo` 状态任务
2. **拖延页**：管理所有 `delayed` 状态任务，提供借口功能
3. **暴走页**：突击完成拖延任务，支持批量选择
4. **广场页**：新功能，可能用于社交分享

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
- 遵循ESLint配置
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

## 🚀 部署配置

### Vercel部署
- 自动部署：main分支推送触发
- 环境变量：支持预览环境和生产环境
- 性能优化：自动代码分割和压缩

### 环境变量
```bash
# 开发环境
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# 生产环境
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 性能优化
- 图片优化：使用Next.js Image组件
- 代码分割：路由级别自动分割
- 缓存策略：静态资源长期缓存
- CDN加速：全球CDN分发

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

## 📄 相关文档

- [需求文档](./docs/requirements.md) - 产品需求详细说明
- [技术文档](./docs/technical.md) - 技术架构和实现细节
- [任务文档](./docs/tasks.md) - 开发任务清单
- [部署文档](./docs/vercel-deployment.md) - Vercel部署指南
- [Supabase配置](./docs/supabase-setup.md) - Supabase设置指南
- [UniApp-X集成](./docs/uniapp-x-integration.md) - 多端部署指南

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见项目根目录LICENSE文件

---

*最后更新：2025年8月30日*