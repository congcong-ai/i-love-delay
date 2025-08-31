# Vercel 部署指南

本指南将帮助你快速将 i love delay 应用部署到 Vercel。

## 🚀 快速部署

### 方法一：一键部署（推荐）

点击下面的按钮直接部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/i-love-delay&project-name=i-love-delay&repository-name=i-love-delay)

### 方法二：手动部署

#### 1. 准备工作

确保你已经：
- 拥有 GitHub 账户
- 安装了 Node.js 18.x 或更高版本
- 项目已推送到 GitHub 仓库

#### 2. 登录 Vercel

访问 [vercel.com](https://vercel.com) 并使用 GitHub 账户登录。

#### 3. 导入项目

1. 点击 "New Project"
2. 选择你的 GitHub 仓库 `i-love-delay`
3. 点击 "Import"

#### 4. 配置项目

在配置页面设置：

**基础配置：**
- Framework: Next.js (自动识别)
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**必需环境变量：**
在 "Environment Variables" 部分添加以下变量：

```bash
# Supabase 配置（必需）
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 基础配置
NEXT_PUBLIC_APP_NAME="i love delay"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NODE_ENV="production"

# 可选：微信登录配置
NEXT_PUBLIC_WECHAT_APP_ID="your-wechat-app-id"
WECHAT_APP_SECRET="your-wechat-app-secret"

# 可选：分析工具
NEXT_PUBLIC_GA_ID="your-google-analytics-id"
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="your-vercel-analytics-id"

# 可选：错误监控
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
```

#### 5. 部署

点击 "Deploy" 按钮开始部署。部署过程通常需要 1-3 分钟。

## 🔧 高级配置

### Supabase 配置（必需）

#### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 并注册账户
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - **Project name**: `i-love-delay`（或你喜欢的名称）
   - **Database Password**: 设置一个强密码并保存好
   - **Region**: 选择离你用户最近的地区（推荐 `East Asia (Singapore)`）

#### 2. 获取 API 密钥

项目创建完成后，进入项目 Dashboard：

1. 点击左侧菜单的 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**（格式：`https://[your-project].supabase.co`）
   - **anon public**（用于客户端）
   - **service_role**（用于服务端，务必保密）

#### 3. 运行数据库迁移

1. 进入 **SQL Editor**
2. 复制 `supabase/migrations/20250830_create_square_tables.sql` 文件内容
3. 粘贴到 SQL Editor 中，点击 **Run** 执行

#### 4. 配置环境变量

**最佳实践：独立项目 + 环境分离**

### 🎯 推荐方案：独立Supabase项目

**为什么选独立项目：**
- ✅ **数据隔离** - 开发测试不影响生产数据
- ✅ **成本分离** - 开发环境可用免费套餐
- ✅ **权限管理** - 可以给开发团队不同权限
- ✅ **风险隔离** - 开发操作不会破坏生产

**为什么不推荐分支：**
- ❌ Supabase没有数据库分支概念
- ❌ 共享项目内无法真正隔离数据

### 📋 具体配置步骤

#### 1. 创建开发环境项目

**创建两个独立项目：**

| 环境 | 项目名称 | 用途 |
|------|----------|------|
| 开发 | `i-love-delay-dev` | 本地开发、测试 |
| 生产 | `i-love-delay` | 正式用户访问 |

**操作步骤：**
1. 访问 [supabase.com](https://supabase.com)
2. 创建 **i-love-delay-dev** 项目（开发用）
3. 创建 **i-love-delay** 项目（生产用）
4. 两个项目都运行相同的SQL迁移

#### 2. 环境文件配置

**文件结构（最佳实践）：**
```
.env.local          # 本地开发（git忽略）
.env.production     # 生产环境（git忽略）
.env.example        # 模板文件（git跟踪）
```

**开发环境配置 (.env.local):**
```bash
# 开发环境Supabase
NEXT_PUBLIC_SUPABASE_URL=https://i-love-delay-dev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=dev-service-key

# 应用配置
NEXT_PUBLIC_APP_NAME="i love delay (dev)"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**生产环境配置 (.env.production):**
```bash
# 生产环境Supabase
NEXT_PUBLIC_SUPABASE_URL=https://i-love-delay.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-key

# 应用配置
NEXT_PUBLIC_APP_NAME="i love delay"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NODE_ENV="production"
```

#### 3. 工作流程

```bash
# 本地开发
npm run dev          # 自动使用 .env.local

# 部署到预览环境
git push origin feature-branch  # 使用开发环境

# 部署到生产
git push origin main           # 使用生产环境
```

#### 4. Vercel环境配置

**在Vercel控制台设置：**

**开发环境变量：**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://i-love-delay-dev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=dev-service-key
```

**生产环境变量：**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://i-love-delay.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-key
```

### 自定义域名

1. 在 Vercel 项目设置中，进入 "Domains" 标签页
2. 添加你的自定义域名
3. 按照提示配置 DNS 记录

### 环境变量管理

#### 开发环境设置

1. **复制模板文件：**
   ```bash
   cp .env.example .env.local
   ```

2. **填入你的 Supabase 配置：**
   ```bash
   # 编辑 .env.local 文件
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **启动开发服务器：**
   ```bash
   npm run dev
   ```

#### 生产环境设置（Vercel）

在 Vercel 控制台：
1. 进入项目设置
2. 选择 "Environment Variables"
3. 添加以下变量：

**必需变量：**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**可选变量：**
```bash
# 微信登录（可选）
NEXT_PUBLIC_WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret

# 分析工具（可选）
NEXT_PUBLIC_GA_ID=your-google-analytics-id
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-vercel-analytics-id

# 错误监控（可选）
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

#### 环境变量最佳实践

**文件用途说明：**
- `.env.local` - 本地开发专用，包含敏感信息，**不提交到git**
- `.env.production` - 生产环境配置，**不提交到git**
- `.env.example` - 模板文件，展示所需变量，**提交到git**
- `.env.development` - 开发团队共享配置（可选）

**安全提示：**
- 永远不要把 `.env.local` 和 `.env.production` 提交到版本控制
- 使用强密码和密钥
- 定期轮换敏感密钥
- 在 Vercel 中设置的环境变量会自动加密存储

### 性能优化

#### 启用分析
在 Vercel 项目设置中启用：
- Vercel Analytics
- Web Analytics
- Speed Insights

#### CDN 配置
Vercel 自动提供全球 CDN，无需额外配置。

## 📊 监控和日志

### 查看部署日志
1. 在 Vercel 控制台选择你的项目
2. 点击 "Deployments" 标签
3. 选择具体的部署查看详细日志

### 运行时日志
- 函数日志：在 "Functions" 标签页查看
- 错误追踪：集成 Sentry 或 LogRocket

### 性能监控
- 使用 Vercel Analytics 监控核心指标
- 设置性能预算警报

## 🔄 持续部署

### 自动部署
每次推送到主分支（main/master）时，Vercel 会自动触发部署。

### 预览部署
每个 Pull Request 都会自动生成预览链接，方便测试。

### 部署策略
- 生产环境：main 分支
- 预览环境：feature 分支
- 回滚：在 Vercel 控制台一键回滚到任意历史版本

## 🛠️ 故障排除

### 常见问题和解决方案

#### 1. 构建失败
```bash
# 本地测试构建
npm run build

# 检查 TypeScript 错误
npm run type-check

# 检查 ESLint 错误
npm run lint
```

#### 2. 环境变量问题
- 确保所有必需的环境变量都已设置
- 检查变量名是否正确（区分大小写）
- 重新部署以应用新的环境变量

#### 3. 404 错误
- 检查 Next.js 路由配置
- 确保所有页面文件存在
- 验证 `next.config.js` 配置

#### 4. 性能问题
- 使用 Vercel Analytics 分析性能瓶颈
- 检查图片优化配置
- 验证代码分割是否生效

### 调试工具

#### 本地调试
```bash
# 模拟生产环境
npm run build
npm start

# 使用 Vercel CLI 本地测试
npm i -g vercel
vercel dev
```

#### 远程调试
- 使用 Vercel 的实时日志功能
- 集成 Sentry 进行错误追踪
- 使用浏览器 DevTools 分析性能

## 📱 移动端优化

### PWA 配置
项目已配置 PWA，部署后自动支持：
- 离线访问
- 添加到主屏幕
- 推送通知（后续支持）

### 响应式设计
- 移动优先设计
- 适配各种屏幕尺寸
- 触摸友好的交互

## 🔐 安全配置

### HTTPS
Vercel 自动提供 HTTPS，无需额外配置。

### 安全头
在 `next.config.js` 中已配置安全头：
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options

### 环境变量安全
- 敏感变量使用服务器端环境变量
- 客户端变量使用 `NEXT_PUBLIC_` 前缀
- 定期轮换 API 密钥

## 🚀 部署后检查清单

部署完成后，请验证：

- [ ] 网站可以正常访问
- [ ] 所有页面加载正常
- [ ] 任务创建功能正常
- [ ] 数据持久化正常（IndexedDB）
- [ ] 移动端适配良好
- [ ] PWA 功能正常
- [ ] 分析工具数据正常收集
- [ ] 自定义域名正常工作（如适用）

## 📞 获取帮助

如果遇到问题：

1. 查看 [Vercel 文档](https://vercel.com/docs)
2. 检查 [Next.js 部署指南](https://nextjs.org/docs/deployment)
3. 在 GitHub 提交 [Issue](https://github.com/your-username/i-love-delay/issues)

## 🎯 下一步

部署成功后，你可以：

1. 配置微信登录（可选）
2. 设置自定义域名
3. 集成分析工具
4. 配置错误监控
5. 优化性能

祝你部署顺利！🎉