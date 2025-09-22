# 微信小程序接入与部署指南（与现有 Web 后端共用）

本指南帮助你在当前仓库中新增一个“微信小程序”前端，并与现有 Next.js 后端共用统一的用户体系与接口。内容包含：申请小程序、域名与安全、后端登录接口、前端接入方式（原生/Uni-app HBuilderX 两种方案）、环境变量、开发调试、打包与发布、CI 与常见问题。

---

## 1. 方案总览

- 前端形态：微信小程序（原生或通过 Uni-app 编译到 mp-weixin）
- 后端复用：沿用本仓库的 Next.js API（统一认证与用户体系）
- 登录协议：小程序专用 `wx.login()` + 服务器端调用 `jscode2session` 换取 `openid/unionid`
- 鉴权模型：服务端颁发 JWT（或自定义 token），小程序端持久化并在请求时携带 `Authorization: Bearer <token>`
- 目标：不影响现有 Web App（仍由 Uniapp X 的 webview 加载并打包 HarmonyOS NEXT App），小程序为独立前端与同一后端对接

---

## 2. 仓库与目录结构推荐

为了不影响现有 Web 前端，建议采用“轻量 monorepo”式目录：

- 推荐新增目录：`apps/weapp/` 用于存放小程序代码
- 暂不迁移现有 Web 前端（保持根目录结构不变），后续如需演进，可将 Web 前端迁移为 `apps/web/`

目录示例：

```
i-love-delay/
├── apps/
│  └── weapp/                 # 新增：微信小程序前端（原生 / uni-app 二选一）
├── src/                      # 现有：Next.js Web App 代码
├── docs/
│  └── wechat-miniprogram-setup.md  # 本指南
├── .env*                     # 环境变量（后端）
└── ...
```

说明：
- 是否在当前目录直接创建一个 `weapp/`？更好的做法是创建 `apps/weapp/`，为未来演进到标准 monorepo（`apps/*` + `packages/*`）留出空间，同时不改动现有 Web 代码结构。
- 如短期只需最小变更，也可以仅新增 `apps/weapp/` 并在其中落地微信小程序，后续再评估是否将 Web 迁移至 `apps/web/`。

---

## 3. 申请微信小程序（获取 AppID/AppSecret）

1) 进入微信公众平台（小程序）：
- 官网：https://mp.weixin.qq.com/
- 使用主体账号（企业/个体工商户/个人）注册小程序

2) 完成主体信息与开发者信息：
- 主体认证（企业/个体工商户建议认证，便于开放更多能力）
- 开发者设置：获取“小程序 AppID（wx...）”与 “AppSecret”

3) 类目与隐私合规：
- 配置小程序类目与业务范围
- 隐私合规（需补充《隐私保护指引》、《用户隐私保护指引弹窗》配置等）

4) 配置服务器域名（“开发-开发管理-开发设置-服务器域名”）：
- request 合法域名（必填）：你的后端域名（HTTPS，443 端口，不能带路径）
- uploadFile 合法域名（如有上传）
- downloadFile 合法域名（如有下载）
- socket 合法域名（如有 WebSocket）
- 开发阶段可在开发者工具中勾选“**不校验合法域名**”，但生产必须配置好正式域名

5) （如使用 web-view 组件）业务域名：
- 如果小程序内需要跳转 H5 页面，需在“业务域名”里配置 H5 域名（本项目方案默认不使用 web-view 直接嵌 Web，而是原生小程序页面调用后端）

---

## 4. 环境变量与后端配置（新增小程序专用）

由于“移动应用/网页应用”与“小程序”的 AppID/Secret 通常不同，建议分开配置：

- `WECHAT_MINI_APP_ID`：小程序 AppID（wx 开头）
- `WECHAT_MINI_APP_SECRET`：小程序 AppSecret
- `ENABLE_WECHAT_MINI_LOGIN`：是否启用小程序登录（true/false，可选）

示例（部署服务器 `.env` 或 `.env.production`）：

```dotenv
# 小程序登录开关
ENABLE_WECHAT_MINI_LOGIN=true

# 微信小程序
WECHAT_MINI_APP_ID=wx1234567890abcdef
WECHAT_MINI_APP_SECRET=REPLACE_WITH_REAL_SECRET

# （可选）对前端暴露的基础信息
NEXT_PUBLIC_API_BASE_URL=https://your.api.domain  # 小程序端请求后端用
```

> 说明：小程序端并不需要读取 AppID/Secret 值，`wx.login()` 会针对当前小程序自动生成 `code`，仅服务端需要 AppID/Secret 通过 `jscode2session` 换取 openid/unionid。

---

## 5. 新增后端接口（Next.js）

与现有 `src/app/api/auth/wechat/mobile/route.ts`（OAuth2）不同，小程序需使用 `jscode2session`。建议新增：

- 路径建议：`src/app/api/auth/wechat/weapp/route.ts`（POST）
- 入参：`{ code: string }`（来自小程序 `wx.login()`）
- 服务端调用：
  - `GET https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=CODE&grant_type=authorization_code`
- 成功响应：包含 `openid`（必有）与可能的 `unionid`
- 统一用户体系：根据 `openid/unionid` 落库，签发 JWT `token` 返回给前端

参考实现（示意，与你现有服务端风格保持一致）：

```ts
// src/app/api/auth/wechat/weapp/route.ts
import { NextResponse } from 'next/server'
import { getOrCreateUserByIdentity, signAppToken } from '@/lib/server/auth'

export async function POST(req: Request) {
  try {
    if ((process.env.ENABLE_WECHAT_MINI_LOGIN || 'true') !== 'true') {
      return NextResponse.json({ success: false, message: 'mini login disabled' }, { status: 404 })
    }

    const { code } = (await req.json()) as { code?: string }
    if (!code) {
      return NextResponse.json({ success: false, message: 'code is required' }, { status: 400 })
    }

    const appid = process.env.WECHAT_MINI_APP_ID
    const secret = process.env.WECHAT_MINI_APP_SECRET
    if (!appid || !secret) {
      return NextResponse.json({ success: false, message: 'WeChat mini credentials missing' }, { status: 500 })
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
    const res = await fetch(url, { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok || json.errcode) {
      return NextResponse.json({ success: false, message: 'jscode2session error', data: json }, { status: 400 })
    }

    const { openid, unionid } = json as { openid: string; unionid?: string }

    // 统一用户体系：存在即创建
    const profile = await getOrCreateUserByIdentity({
      provider: 'wechat-mini',
      providerUserId: openid,
      unionId: unionid,
      displayName: '微信小程序用户',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=weapp'
    })

    const token = signAppToken({ sub: profile.id, provider: 'wechat-mini', pid: openid })
    return NextResponse.json({
      success: true,
      token,
      data: {
        userId: profile.id,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        providerUserId: openid,
        unionid,
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'internal error' }, { status: 500 })
  }
}
```

> 命名建议：`provider: 'wechat-mini'` 与当前 `provider: 'wechat'`（移动应用）做区分，便于统计来源。

---

## 6. 小程序前端接入（原生方案）

- 技术：使用微信开发者工具编写原生 WXML/WXSS/JS
- 步骤：
  1) `wx.login()` 获取 `code`
  2) `wx.request()` 调用后端 `/api/auth/wechat/weapp` 换取 `token` 与用户资料
  3) `wx.setStorageSync('token', token)` 持久化；后续请求统一在 `header.Authorization` 携带 `Bearer <token>`

示例：

```js
// app.js
App({
  onLaunch() {
    // 可在需要时触发登录：如点击“登录”按钮或进入需鉴权页面
  }
})

// pages/login/index.js
Page({
  data: { loading: false },
  onLoginTap() {
    const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your.api.domain')
    this.setData({ loading: true })
    wx.login({
      success: ({ code }) => {
        if (!code) {
          this.setData({ loading: false })
          wx.showToast({ title: '登录失败，请重试', icon: 'none' })
          return
        }
        wx.request({
          url: `${apiBase}/api/auth/wechat/weapp`,
          method: 'POST',
          data: { code },
          header: { 'Content-Type': 'application/json' },
          success: ({ statusCode, data }) => {
            if (statusCode === 200 && data?.success) {
              const token = data.token
              wx.setStorageSync('token', token)
              wx.showToast({ title: '登录成功', icon: 'success' })
              // TODO: 跳转到业务首页
              wx.switchTab({ url: '/pages/index/index' })
            } else {
              wx.showToast({ title: '登录失败', icon: 'none' })
            }
          },
          fail: () => wx.showToast({ title: '网络异常', icon: 'none' }),
          complete: () => this.setData({ loading: false })
        })
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({ title: 'wx.login 失败', icon: 'none' })
      }
    })
  }
})
```

请求拦截统一加 token（可在小程序端封装 `request` 方法）：

```js
// utils/request.js
const API_BASE = 'https://your.api.domain'

export function request(options) {
  const token = wx.getStorageSync('token') || ''
  const headers = Object.assign({}, options.header, token ? { Authorization: `Bearer ${token}` } : {})
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      url: options.url.startsWith('http') ? options.url : `${API_BASE}${options.url}`,
      header: headers,
      success: resolve,
      fail: reject
    })
  })
}
```

---

## 7. 使用 HBuilderX（Uni-app → mp-weixin）

如希望使用 Vue 语法和 HBuilderX 工具链，可在 `apps/weapp/` 内创建一个 Uni-app 项目并编译到 `mp-weixin`：

1) 创建项目：
- HBuilderX → 新建项目 → `uni-app`（Vue3 + TS 推荐）
- 目录：`apps/weapp/`

2) 配置 `manifest.json`：
- `mp-weixin.appid`：填写你的“小程序 AppID”
- （可选）`h5`、`app-plus` 不必配置

3) 登录逻辑（在 mp-weixin 平台判断下使用 `uni.login`）：

```ts
// 示例：在某个登录页面或 store 中触发
if (process.env.UNI_PLATFORM === 'mp-weixin') {
  uni.login({
    provider: 'weixin',
    success: async (res) => {
      const code = res.code
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://your.api.domain'
      await uni.request({
        url: `${apiBase}/api/auth/wechat/weapp`,
        method: 'POST',
        data: { code },
        header: { 'Content-Type': 'application/json' }
      })
      // 保存 token & 跳转业务页面...
    }
  })
}
```

4) 运行与打包：
- HBuilderX 顶部菜单 → 运行 → 运行到小程序模拟器 → 选择“微信开发者工具”
- 首次会生成 `dist/build/mp-weixin`，HBuilderX 会自动用微信开发者工具打开
- 在微信开发者工具内进行真机联调、预览、上传

---

## 8. 部署流程（小程序端）

1) 后端：
- 沿用现有 Next.js 后端部署；确保 HTTPS 域名稳定可访问
- 确保新增接口 `/api/auth/wechat/weapp` 已上线

2) 微信开发者工具：
- 关联小程序 AppID
- 构建并上传体验版，邀请体验者（后台-成员管理）
- 提交审核 → 审核通过后发布上线

3) 服务器域名：
- 必须配置到“request 合法域名”
- 仅支持 443 端口的 HTTPS，不支持自定义端口

---

## 9. 本地开发与调试

- 后端本地开发：`npm run dev`（注意仓库已有脚本会先清理 3000 端口）
- 小程序开发：
  - 方案 A：使用微信开发者工具，勾选“**不校验合法域名**”，将 API 指向内网/本地（如 http://127.0.0.1:3000）
  - 方案 B：使用内网穿透（如 frp/ngrok/clash），提供外网 HTTPS 域名，关闭“**不校验合法域名**”，更接近真实环境

---

## 10. 常见问题（FAQ）

- Q: `jscode2session` 报错 `errcode`？
  - A: 确认 AppID/Secret 是否为“小程序”的一对；确认 `code` 未被重复使用（一个 code 只能用一次）；确认服务器时间同步。

- Q: 生产接口 401？
  - A: 确认小程序端 `Authorization: Bearer <token>` 是否正确设置；确认服务端验签逻辑；确认 token 未过期。

- Q: 域名校验失败？
  - A: 小程序生产必须配置“服务器域名”且为 HTTPS 443 端口，不能带路径，证书必须有效。

- Q: 是否能直接在小程序内 `web-view` 嵌入现有 H5？
  - A: 可以，但 `web-view` 内无法直接使用小程序能力与 `wx.login`；需通过 `postMessage` 与小程序页面通信并在小程序侧发起登录。考虑体验与登录一致性，推荐原生小程序页面调用后端。

---

## 11. CI/CD（可选）

- 可使用官方 `miniprogram-ci` 在流水线中自动上传体验版：
  - 需在小程序后台获取私钥（上传密钥）并配置到 CI 的安全仓库
  - 参考：https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html

---

## 12. 参考变量命名（建议）

- 服务端：
  - `WECHAT_MINI_APP_ID`
  - `WECHAT_MINI_APP_SECRET`
  - `ENABLE_WECHAT_MINI_LOGIN=true|false`
- 小程序前端：
  - `NEXT_PUBLIC_API_BASE_URL`（或 `VITE_API_BASE_URL`/自定义）

> 保持与当前仓库 `.env.example` 的命名风格一致，避免与现有 `NEXT_PUBLIC_WECHAT_APP_ID`/`WECHAT_APP_SECRET`（移动应用/H5）混淆。

---

## 13. 上线检查清单

- [ ] 小程序后台：AppID/Secret 正确、服务器域名配置完成
- [ ] 服务器 `.env` 已设置小程序专用变量并重启服务
- [ ] 新接口 `/api/auth/wechat/weapp` 可用，日志正常
- [ ] 登录链路：`wx.login → /api/auth/wechat/weapp → token` 正常
- [ ] 关键页面在真机测试表现良好，首屏、网络与异常处理符合预期
- [ ] 体验版邀请、审核资料与隐私合规已完善

---

如需我直接为 `apps/weapp/` 脚手架小程序项目（原生或 Uni-app），请告知你偏好的技术路线与是否需要共享 UI/类型定义等模块。我将按上述结构落地并接入后端登录接口。
