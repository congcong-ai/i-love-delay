# i love delay 🐌

一个反向任务管理应用 - 鼓励拖延，奖励借口！

> "拖延不是病，是一种生活态度" - i love delay

## 🎯 项目简介

i love delay 是一个专为拖延症患者设计的任务管理应用。与传统任务管理不同，我们鼓励你拖延任务，并为每个拖延的任务提供创意借口。

### 核心特色
- 🎭 **鼓励拖延**：不完成任务反而获得奖励
- 📝 **创意借口**：为每个拖延任务写有趣借口
- 📊 **拖延统计**：分析你的拖延模式和习惯
- ⚡ **暴走模式**：突击完成堆积的任务
- 📱 **移动优先**：完美适配手机使用场景

## 🚀 快速开始

### 环境要求
- Node.js 18.x 或更高版本
- npm

### 安装依赖
```bash
# 克隆项目
git clone https://github.com/your-username/i-love-delay.git
cd i-love-delay

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 访问应用
打开 [http://localhost:3000](http://localhost:3000) 查看应用

## 🏗️ 技术栈

 - **Next.js 15.5.2**（App Router）
 - **React 19.1.0** 与 **TypeScript 5.9.2**
 - **Tailwind CSS 4.x**（^4.1.12）与 **@tailwindcss/postcss**
 - **next-intl 4.x**（国际化与本地化路由）
 - **PostgreSQL（自建）+ pg**（通过 Next.js API 路由在服务端访问）
 - **Dexie 4.x**（IndexedDB 封装，本地数据）
 - **Zustand 5.x**（状态管理）
 - **Radix UI + shadcn 风格组件**（见 `src/components/ui/`）
 - **TanStack Query 5.x**（数据获取/缓存）
 - **Lucide React**（图标）

## 📁 项目结构

```
i-love-delay/
├── src/
│  ├── app/
│  │  ├── [locale]/                 # 本地化路由（默认 zh）
│  │  │  ├── api/                   # 服务器端 API 路由（PostgreSQL）
│  │  │  ├── delayed/               # 拖延页
│  │  │  ├── rage/                  # 暴走页
│  │  │  ├── square/                # 广场页（分享/发现）
│  │  │  ├── profile/               # 个人页
│  │  │  ├── layout.tsx             # i18n Provider + AppProvider
│  │  │  └── page.tsx               # 首页（任务列表）
│  │  ├── favicon.ico
│  │  └── globals.css
│  ├── components/                  # 基于 Radix/shadcn 风格的组件等
│  ├── i18n/
│  │  └── request.ts                # next-intl 请求配置
│  ├── lib/
│  │  ├── server/                   # 服务器端工具（pg 连接池等）
│  │  ├── stores/                   # Zustand stores（任务/借口/UI/认证）
│  │  └── i18n/                     # i18n 配置
│  └── messages/
│     ├── zh.json                   # 中文文案
│     └── en.json                   # 英文文案
├── db/
│  └── migrations/
│     └── 0001_init.sql             # 数据库结构与示例
├── deploy/
│  ├── nginx.site.template.conf     # Nginx 模板（含 /_next/static alias）
│  └── supervisor.program.template.conf # Supervisor 模板（standalone）
├── scripts/
│  └── kill-port-3000.js            # 跨平台清理 3000 端口
├── messages/                        # 文案字典（供 next-intl 加载）
├── next.config.ts                   # output: 'standalone'
├── tsconfig.json
├── eslint.config.mjs
├── package.json
├── postcss.config.mjs
└── README.md
```

## 🛠️ 开发命令

```bash
# 开发（自动清理 3000 端口后启动 Next 开发服务器）
npm run dev

# 构建生产
npm run build

# 启动生产服务
npm run start

# 代码检查（ESLint 9 + Next 配置）
npm run lint

# 手动清理端口（Windows/macOS/Linux 均可）
npm run kill-port
```

说明：`scripts/kill-port-3000.js` 会在 `npm run dev` 前自动执行，清理占用 3000 端口的进程，避免端口冲突。

## 🛳 部署

### 自建部署（standalone + Supervisor + Nginx）

推荐使用内置的 `deploy.sh` 脚本在本地完成构建并仅上传产物：

1) 在项目根目录配置 `.env.local`：

```dotenv
SERVER=your.server.ip.or.domain
SSH_USER=deployer
REMOTE_DIR=/var/www/delay.bebackpacker.com
SUPERVISOR=delay.bebackpacker.com
DEPLOY_PORT=3002
```

2) 服务器上准备：

- 在 `REMOTE_DIR` 放置 `.env`（运行期环境变量，包含 `DATABASE_URL`）。
- 为 `deployer` 配置免密 `sudo supervisorctl`（见 `docs/deployment-self-hosted.md`）。
- 按模板创建 Supervisor 配置，使用 `node .next/standalone/server.js` 启动，并将日志写入 `${REMOTE_DIR}/logs/`。

3) 本地执行：

```bash
./deploy.sh
# 选择 2) server - 远程部署（本地构建 standalone，上传产物，Supervisor 重启）
```

4) Nginx：

为避免静态资源 404，推荐将 `/_next/static` 直接 alias 到服务器目录：

```nginx
location /_next/static/ {
    alias /var/www/delay.bebackpacker.com/.next/static/;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    access_log off;
}
```

完整步骤详见：`docs/deployment-self-hosted.md`

## 🔑 环境变量

参见示例文件：`.env.example`

- 必需
  - `NEXT_PUBLIC_APP_NAME`，`NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_DEFAULT_LOCALE`（默认 `zh`）
  - `NEXT_PUBLIC_ENV`（`development`/`production`）
  - `DATABASE_URL`（PostgreSQL 连接串，仅服务器端使用）
  - `PGSSLMODE`（可选，如数据库要求 SSL，可设为 `require`）
- 可选集成
  - 微信登录：`NEXT_PUBLIC_WECHAT_APP_ID`，`WECHAT_APP_SECRET`
  - 分析：`NEXT_PUBLIC_GA_ID`，`NEXT_PUBLIC_VERCEL_ANALYTICS_ID`
  - 错误监控：`NEXT_PUBLIC_SENTRY_DSN`，`SENTRY_AUTH_TOKEN`
  - 运行模式：`NEXT_PUBLIC_UNIAPP_MODE`

## 🌐 国际化（i18n）

- 基于 `next-intl`：`src/lib/i18n/`（配置）
  - `locales: ['zh', 'en']`，`defaultLocale: 'zh'`，`localePrefix: 'always'`
- 请求期解析：`src/i18n/request.ts`，确保非法或缺失 locale 时回退到默认语言
- 文案字典：`/messages/zh.json`、`/messages/en.json`

## 💾 数据存储与同步

- 本地存储（IndexedDB via Dexie）
  - 统计与过期处理、离线优先
- 服务器端（PostgreSQL + pg）
  - 连接池：`src/lib/server/db.ts`
  - API 路由：`src/app/[locale]/api/**`（如 `/api/square/share`、`/api/square/comments` 等）
  - 前端通过相对路径调用 API；离线时回退到本地数据

### 🔒 权限与安全（Supabase）

- 迁移脚本中 RLS 当前为关闭状态（policies 被注释），仅用于开发与演示。
- 生产环境请务必开启 RLS 并配置行级访问策略（见 `docs/supabase-setup.md`）。
- 服务端管理操作使用 `SUPABASE_SERVICE_ROLE_KEY`，严禁在客户端或静态产物中暴露。

## ⚙️ 配置要点

- `next.config.ts`
  - 集成 `next-intl` 插件
  - 远程图片白名单（`api.dicebear.com`）
- `tsconfig.json`
  - 路径别名：`@/* -> ./src/*`
- `eslint.config.mjs`
  - 基于 Next.js Core Web Vitals 与 TypeScript 推荐规则
- 样式
  - Tailwind CSS v4（`@tailwindcss/postcss` + `postcss.config.mjs`）

## 📄 文档

- [需求文档](./docs/requirements.md)
- [技术文档](./docs/technical.md)
- [任务规划](./docs/tasks.md)
- [环境搭建](./docs/environment-setup.md)
- [Supabase 配置与权限](./docs/supabase-setup.md)
- [自建部署指南](./docs/deployment-self-hosted.md)
- [Vercel 部署指南](./docs/vercel-deployment.md)
- [Uniapp X 集成](./docs/uniapp-x-integration.md)

---

## 🇬🇧 English Version (Brief)

- Overview: A playful task manager for procrastinators. Write excuses, track delays, and sometimes go “Rage Mode”.
- Tech Stack: Next.js 15.5.2, React 19.1.0, TypeScript 5.9, Tailwind v4, next-intl 4, Supabase 2, Dexie 4, Zustand 5, Radix/shadcn-style UI, TanStack Query 5.
- Quick Start: `npm i` → `npm run dev` → open http://localhost:3000.
- Env Vars: Supabase URL/Anon Key (required), Service Role (server only), App name/URL, Default locale, WeChat/Analytics/Sentry (optional).
- i18n: next-intl with locales `zh`/`en`, default `zh`, locale prefix always.
- Data & Sync: Dexie (local), SyncManager (5-min polling, offline queue) + Supabase (cloud). Task scheduler checks overdue tasks every 30 min and on visibility change.
- Docs: See `/docs/*` for detailed setup and deployment.

## 📄 许可证

MIT License