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

**环境变量：**
在 "Environment Variables" 部分添加以下变量：

```bash
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

### 自定义域名

1. 在 Vercel 项目设置中，进入 "Domains" 标签页
2. 添加你的自定义域名
3. 按照提示配置 DNS 记录

### 环境变量管理

#### 开发环境
复制 `.env.local.example` 为 `.env.local`：

```bash
cp .env.local.example .env.local
```

然后填入你的实际配置值。

#### 生产环境
在 Vercel 控制台：
1. 进入项目设置
2. 选择 "Environment Variables"
3. 添加或修改变量

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