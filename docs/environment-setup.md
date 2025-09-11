# 环境变量配置指南

## 📁 文件结构（优化后）

```
项目根目录/
├── .env.local          # 本地实际配置（敏感信息，git忽略）
├── .env.example        # 环境变量模板（git提交）
└── .gitignore          # 已更新忽略规则
```

## 🔐 为什么使用 .env.local

### 安全优势
- **Git安全**：`.env.local` 默认在 `.gitignore` 中，避免敏感信息泄露
- **Next.js最佳实践**：官方推荐用于存储敏感信息
- **团队隔离**：每个开发者可以有自己的配置
- **部署灵活**：生产环境变量通过平台配置

### 🎯 文件用途说明

| 文件 | 用途 | Git提交 | 敏感信息 |
|------|------|---------|----------|
| `.env.example` | **模板文件** | ✅ 提交 | ❌ 不包含实际值 |
| `.env.local` | **实际配置** | ❌ 忽略 | ✅ 存储实际值 |

## ⚙️ 配置步骤

### 1. 创建 .env.local

```bash
# 复制模板
cp .env.example .env.local

# 编辑配置
nano .env.local
```

### 2. 配置内容

```bash
# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=i love delay
NEXT_PUBLIC_DEFAULT_LOCALE=zh
NEXT_PUBLIC_ENV=development

# 数据库（PostgreSQL）
# 本地开发示例（Windows 本机安装 PostgreSQL）
DATABASE_URL=postgres://app_user:REPLACE_STRONG_PASSWORD@localhost:5432/i_love_delay_dev
# 若数据库要求 SSL，可启用：
# PGSSLMODE=require

# （可选）微信/统计/错误监控等
# NEXT_PUBLIC_WECHAT_APP_ID=
# WECHAT_APP_SECRET=
# NEXT_PUBLIC_GA_ID=
# NEXT_PUBLIC_VERCEL_ANALYTICS_ID=
# NEXT_PUBLIC_SENTRY_DSN=
# SENTRY_AUTH_TOKEN=
```

### 3. 生产环境配置

服务器“运行期”使用 `.env`（由 Supervisor 在启动时 `source .env`），本地“构建期”使用 `.env.production`（`deploy.sh` 在本地构建时加载）。核心变量如下：

```bash
# 服务器运行期（/var/www/your-app/.env）
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.example.com
DATABASE_URL=postgres://app_user:REPLACE_STRONG_PASSWORD@127.0.0.1:5432/i_love_delay
# 如需 SSL：
# PGSSLMODE=require

# 本地构建期（项目根目录 .env.production，可选）
# 若不提供，则使用当前 shell 环境变量
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.example.com
```

## 🚨 安全提醒

### 禁止提交的文件
```gitignore
# .gitignore
.env.local
.env.production
.env.staging

# 允许提交的文件
.env.example
.env.development
```

### 敏感信息检查
```bash
# 检查是否意外提交了敏感文件
git log --all --full-history --source --name-only | grep -E '\.env.*local'
```

## 🔄 环境切换

### 开发环境
```bash
# 使用 .env.local
npm run dev
```

### 生产环境
```bash
# 使用平台配置的环境变量
npm run build
npm start
```

## 📋 变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_APP_URL` | 应用URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | 应用名称 | `i love delay` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | 默认语言 | `zh` |
| `NEXT_PUBLIC_ENV` | 环境标识 | `development`/`production` |
| `DATABASE_URL` | PostgreSQL 连接串（仅服务端使用） | `postgres://user:pass@host:5432/i_love_delay_dev` |
| `PGSSLMODE` | 数据库 SSL 模式（可选） | `require` |
| `NEXT_PUBLIC_WECHAT_APP_ID` | 微信AppID（可选） | `wx1234567890abcdef` |