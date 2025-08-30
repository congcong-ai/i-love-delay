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
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=i love delay

# 微信配置
NEXT_PUBLIC_WECHAT_APP_ID=your-wechat-app-id
NEXT_PUBLIC_UNIAPP_MODE=false

# 环境标识
NEXT_PUBLIC_ENV=development
```

### 3. 生产环境配置

在部署平台（Vercel/Netlify）配置：

**Vercel:**
1. 项目设置 → Environment Variables
2. 添加相同的变量名和值
3. 选择对应的环境（Production/Preview/Development）

**Netlify:**
1. Site settings → Environment variables
2. 添加环境变量
3. 设置对应的环境

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
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase项目URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名密钥 | `eyJhbGciOiJIUzI1NiIs...` |
| `NEXT_PUBLIC_APP_URL` | 应用URL | `http://localhost:3000` |
| `NEXT_PUBLIC_WECHAT_APP_ID` | 微信AppID | `wx1234567890abcdef` |
| `NEXT_PUBLIC_UNIAPP_MODE` | 是否uniapp模式 | `true/false` |
| `NEXT_PUBLIC_ENV` | 环境标识 | `development/production` |