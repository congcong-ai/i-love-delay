# 华为登录（HarmonyOS NEXT + Uniapp X 壳 + Web App）启用指南

本文档说明如何在本项目分层架构下，仅启用“华为登录”，并由 Web App 的“登录按钮”触发壳内原生登录流程，最终将系统 JWT 注入 WebView 完成登录。

- 项目 A（Web App，Next.js，目录 `i-love-dalay`）
- 项目 B（Uniapp X 壳，鸿蒙 NEXT，目录 `uniappx-i-love-delay`）

## 1. 架构流程概览

```
Web App（A）                      Uniapp X 壳（B）                        后端（A 内置 API）
[Login 按钮] --HUAWEI_LOGIN--> [uni.login(provider: 'huawei')] --code--> [/api/auth/huawei/mobile]
       ^                                |                                      |
       |                          token 注入 WebView <----- 生成 JWT、归一化用户信息  |
   setToken() <-- APP_AUTH_TOKEN -----+                                      |
       |
   /api/auth/me 获取当前用户并持久化
```

关键点：
- Web App 不直接调用原生 SDK；只发送消息 `HUAWEI_LOGIN` 给壳。
- 壳调用 `uni.login({ provider: 'huawei' })` 获取 `code`，再请求 A 项目的接口换取 JWT。
- 壳通过 WebView 注入 `APP_AUTH_TOKEN` 给 H5，Web App 接收后保存 token 并请求 `/api/auth/me` 获取用户信息。

## 2. 项目 A（Web App）配置

### 2.1 环境变量（仅华为登录）
在项目根目录写入/更新以下环境变量：

- 开启华为登录、关闭微信登录
```
ENABLE_HUAWEI_LOGIN=true
ENABLE_WECHAT_LOGIN=false
NEXT_PUBLIC_MOBILE_AUTH_PROVIDER=huawei
```
- JWT（务必在生产使用强随机密钥）
```
AUTH_JWT_SECRET=CHANGE_ME
AUTH_TOKEN_EXPIRES_IN=30d
```
- 华为 OAuth（在有真实联调需求时填写）
```
HUAWEI_CLIENT_ID=你的ClientId
HUAWEI_CLIENT_SECRET=你的ClientSecret
# HUAWEI_REDIRECT_URI=按需
# HUAWEI_TOKEN_URL=https://oauth-login.cloud.huawei.com/oauth2/v3/token
# HUAWEI_USERINFO_URL=按需（若不配则使用默认头像与昵称）
```
- 生产请关闭“假登录”（本项目默认已支持）
```
NEXT_PUBLIC_ENABLE_MOCK_LOGIN=false
```

说明：
- `ENABLE_HUAWEI_LOGIN/ENABLE_WECHAT_LOGIN` 控制服务端 API 是否启用对应登录方式。
- `NEXT_PUBLIC_MOBILE_AUTH_PROVIDER=huawei` 控制 Web App 在壳环境下点击“登录”时向壳发送 `HUAWEI_LOGIN`。

### 2.2 相关接口与代码
- `POST /api/auth/huawei/mobile`
  - 入参：`{ code: string }`
  - 逻辑：换取 access_token 与基础身份，归一化到本地用户体系（`users`/`user_identities`），签发 JWT。
  - 出参：`{ success: true, token, data: { userId, displayName, avatarUrl, providerUserId, unionid? } }`
- `GET /api/auth/me`
  - 通过 `Authorization: Bearer <token>` 返回当前用户信息。

对应代码：
- `src/app/api/auth/huawei/mobile/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/lib/server/auth.ts`（统一用户体系 + JWT 签发与校验）
- `src/lib/stores/auth-store.ts`
  - 监听 `APP_AUTH_TOKEN` → `setToken()` → `GET /api/auth/me` → `setUser()`
  - `login()` 在壳环境下会根据 `NEXT_PUBLIC_MOBILE_AUTH_PROVIDER` 发送 `HUAWEI_LOGIN` 给壳
- `src/lib/uniapp-bridge.ts`：`requestHuaweiLogin()` 向壳端发送事件
- `src/components/auth/login-button.tsx`：按钮文案依据 provider 动态显示“华为登录”

### 2.3 依赖安装与启动
```
npm install
npm run build
# 生产/本地启动前请先清端口（遵循你的开发规范）
npm run kill-port && npm run start
```

## 3. 项目 B（Uniapp X 壳）配置

### 3.1 WebView 与消息
- 页面：`pages/index.uvue`
- 行为：
  - 不再显示登录按钮；仅监听来自 H5 的 `HUAWEI_LOGIN` 消息
  - 收到后执行：
    1) `uni.login({ provider: 'huawei' })` 获取 `code`
    2) `uni.request({ url: apiBase + '/api/auth/huawei/mobile', method: 'POST', data: { code } })`
    3) 拿到 `token` 后：`uni.setStorageSync('app_token', token)` 并通过 WebView `evalJS` 注入
       `window.postMessage({ type: 'APP_AUTH_TOKEN', data: { token } }, '*')`
  - App 启动时若本地已有 token，会自动注入给 H5，减少重复登录

### 3.2 壳配置文件
- `static/config/auth.config.json`（可根据环境修改/打包）
```
{
  "apiBase": "https://your-webapp-domain.com",
  "webAppUrl": "https://your-webapp-domain.com",
  "enableWeChat": false,
  "enableHuawei": true
}
```
- `webAppUrl`：WebView 要加载的 Web App 地址
- `apiBase`：项目 A 部署地址，用于调用 `/api/auth/huawei/mobile`

### 3.3 HBuilderX 构建（HarmonyOS NEXT）
- 配置签名（BundleName/证书）与华为能力（按 HBuilderX 指引）
- 使用真机进行授权联调：确保设备可正常调用华为登录与网络请求

## 4. Web App 触发登录
- Web App 的“登录”按钮：`src/components/auth/login-button.tsx`
- 在壳环境（`window.uni` 存在）下点击会触发 `uniappBridge.requestHuaweiLogin()`，壳监听到 `HUAWEI_LOGIN` 后启动登录流程

## 5. 常见问题（FAQ）
- 未返回 token
  - 检查项目 A 的环境变量是否已正确设置 `ENABLE_HUAWEI_LOGIN=true`、`HUAWEI_CLIENT_ID/SECRET`
  - 服务器时间不同步/请求被代理拦截
- Web 无法收到 `APP_AUTH_TOKEN`
  - 查看壳端 console 是否打印注入报错（`evalJS`）
  - H5 端是否监听 `window.message`，以及 `uniapp-bridge` 是否初始化
- 仍显示“微信登录”
  - 确认 `NEXT_PUBLIC_MOBILE_AUTH_PROVIDER=huawei`、`messages/*.json` 中文案已包含 `huaweiLogin`
- 生产环境仍能“假登录”
  - 确认 `.env.production` 中 `NEXT_PUBLIC_ENABLE_MOCK_LOGIN=false`

## 6. 只在以后启用微信登录
- 把项目 A 的 `ENABLE_WECHAT_LOGIN` 改为 `true`，并填写 `NEXT_PUBLIC_WECHAT_APP_ID/WECHAT_APP_SECRET`
- 把 `NEXT_PUBLIC_MOBILE_AUTH_PROVIDER` 改为 `wechat`（若希望在壳内使用微信登录）
- Web App 自动切换到发送 `WECHAT_LOGIN`，壳端收到后走微信登录（若你需要同时支持两种方式，可在 Web UI 提供切换按钮，这里暂按你的“仅华为”需求实现）

---

如需我进一步为壳项目补充“环境切换脚本/构建配置指引”，或将配置改为内置 import 减少运行时请求，请告诉我。
