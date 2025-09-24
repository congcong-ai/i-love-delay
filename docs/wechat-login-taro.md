# 微信登录最佳实践（Taro 全端）

本指南将“微信登录”在四个端的实现方式统一到一套后端（NestJS）与一套前端（Taro-React）中：
- H5（微信内）
- PC Web（扫码登录）
- 微信小程序
- App（Android/iOS/Harmony 原生壳 + WebView，阶段 1）

> 原则：所有与微信服务器的交互只在服务端进行（安全、可控），前端仅负责引导/拿 code/回调，服务端统一换取 openid/unionid 并签发 JWT。

---

## 一、账号与资质准备

微信生态存在三个平台，请根据端选择对应能力并尽量“主体一致/关联开放平台账户”，以便获取 unionid 进行用户打通：

- 微信开放平台（https://open.weixin.qq.com/）
  - 网站应用（用于 PC 扫码登录）
  - 移动应用（用于 App 原生登录：iOS/Android/Harmony）
- 微信公众平台（https://mp.weixin.qq.com/）
  - 公众号网页授权（用于 H5 在微信内打开）
- 微信小程序平台（https://mp.weixin.qq.com/）
  - 小程序登录（Taro.login → jscode2session）

### 准备清单
- 企业或个人主体资质（不同应用类型的审核要求不同）
- 域名（备案/可用 HTTPS）
- App 包名/BundleId/签名信息（Android 需包名+签名；iOS 需 BundleId+Universal Links；Harmony 需 BundleName+签名信息）
- 服务器公网 IP（如走企业防火墙，留意回调连通性）

---

## 二、注册与配置步骤（逐端）

### 1）H5（微信内：公众号网页授权）
- 注册/认证公众号（推荐服务号，权限更全）。
- 获取 AppID/AppSecret（公众平台 → 开发 → 基本配置）。
- 设置：
  - 网页授权回调域名（如：your-domain.com）。
  - JS 接口安全域名（如需分享/录音/拍照等 JS-SDK 能力）。
- 开发者/测试者：添加测试号或白名单，便于联调。

生成授权链接（前端跳转）：
```
https://open.weixin.qq.com/connect/oauth2/authorize
  ?appid=公众号AppID
  &redirect_uri=URLENCODE(你的回调地址，如 https://your-domain.com/h5/wechat/callback)
  &response_type=code
  &scope=snsapi_userinfo
  &state=RANDOM#wechat_redirect
```

### 2）PC Web（网站应用：扫码登录）
- 微信开放平台 → 创建“网站应用”。
- 填写“网站名称、网站官网、授权回调域”。
- 审核通过后获得 AppID/AppSecret。

扫码链接（前端弹窗打开）：
```
https://open.weixin.qq.com/connect/qrconnect
  ?appid=网站应用AppID
  &redirect_uri=URLENCODE(https://your-domain.com/web/wechat/callback)
  &response_type=code
  &scope=snsapi_login
  &state=RANDOM#wechat_redirect
```

### 3）微信小程序（jscode2session）
- 小程序后台 → 获取 AppID/AppSecret。
- 设置“request 合法域名”（服务器接口域名）。
- 前端（Taro）调用 `Taro.login` 获取临时 code，交给服务端换取 openid/unionid。

### 4）App 原生（移动应用：OpenSDK）
- 微信开放平台 → 创建“移动应用”（iOS/Android/Harmony 各自配置）。
- iOS：BundleId、Universal Links；Android：包名+签名；Harmony：BundleName+签名。
- 前端采用原生壳（阶段 1），在原生侧接入微信 OpenSDK，拉起授权，获取 code 后通过 JSBridge 回传给 WebView（Taro H5）。

---

## 三、后端（NestJS）接口设计

仅示例关键流程，便于你对接现有数据库与用户体系：

```
POST /auth/wechat/h5     // 公众号网页授权回调后，前端把 code 传服务端
POST /auth/wechat/web    // PC 扫码回调后，前端把 code 传服务端
POST /auth/wechat/weapp  // 小程序：jscode2session
POST /auth/wechat/app    // 原生 App：原生拿到 code 后传服务端
```

返回统一：
```
{
  success: true,
  token: '<JWT>',
  data: { userId, displayName, avatarUrl, providerUserId, unionid }
}
```

环境变量（仅服务端持有 Secret）：
```
ENABLE_WECHAT_LOGIN=true

# 公众号（H5）
WECHAT_OFFICIAL_APP_ID=
WECHAT_OFFICIAL_APP_SECRET=

# 网站扫码（PC）
WECHAT_WEBSITE_APP_ID=
WECHAT_WEBSITE_APP_SECRET=

# 小程序
WECHAT_MINI_APP_ID=
WECHAT_MINI_APP_SECRET=

# 移动应用（App）
WECHAT_MOBILE_APP_ID=
WECHAT_MOBILE_APP_SECRET=

# JWT
AUTH_JWT_SECRET=
AUTH_TOKEN_EXPIRES_IN=30d
```

服务端换取（示例流程）：
1. H5/PC/App：`/sns/oauth2/access_token?appid=...&secret=...&code=...&grant_type=authorization_code`
2. 可选拉取用户资料：`/sns/userinfo?access_token=...&openid=...`
3. 小程序：`/sns/jscode2session?appid=...&secret=...&js_code=...&grant_type=authorization_code`
4. 统一落库/查库，存在即创建，签发 JWT。

---

## 四、Taro 前端实现（要点）

### A. 微信小程序（推荐路径）
```ts
// src/services/auth.ts
import Taro from '@tarojs/taro'
import { request } from '@/utils/request'

export async function weappLogin() {
  const { code } = await Taro.login()
  const resp = await request.post('/auth/wechat/weapp', { code })
  if (resp.success) {
    Taro.setStorageSync('app_token', resp.token)
  }
  return resp
}
```

### B. H5（微信内）
```ts
export function goWechatH5Authorize(callbackUrl: string, appId: string) {
  const state = Math.random().toString(36).slice(2, 10)
  const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`
  window.location.href = url
}

// 回调页：读取 code → 调 /auth/wechat/h5 → 存 token → 跳转回原页
```

### C. PC Web（扫码）
```ts
export function openQrConnectPopup(callbackUrl: string, appId: string) {
  const state = Math.random().toString(36).slice(2, 10)
  const url = `https://open.weixin.qq.com/connect/qrconnect?appid=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`
  window.open(url, 'wechat_login', 'width=520,height=600,menubar=no,toolbar=no')
}

// 回调页：postMessage 回主窗口 → 主窗口收到结果，写入登录态
```

### D. App（原生壳 + WebView）
- 原生接入微信 OpenSDK：授权获取 `code`。
- 通过 JSBridge 将 `{ type: 'WECHAT_LOGIN_CODE', code }` 回传给 WebView。
- Taro H5 侧收到后调用 `/auth/wechat/app` 完成换取。

---

## 五、流程图（合并视图）

```mermaid
flowchart TD
  A[前端触发登录] --> B{端形态}
  B -->|H5(微信内)| H5Auth[跳转 oauth2]
  H5Auth --> C[回调页带 code]
  B -->|PC| WebAuth[弹出 qrconnect]
  WebAuth --> C
  B -->|小程序| Mini[Taro.login]
  Mini --> D[服务端 jscode2session]
  B -->|App 原生| AppSDK[OpenSDK 获取 code]
  AppSDK --> D
  C --> D[服务端换取 openid/unionid]
  D --> E[统一建档/签 token]
  E --> F[前端写入 JWT+Profile]
  F --> G[进入登录态]
```

---

## 六、安全与合规
- Secret 永不下发到前端；所有换取操作在服务端完成。
- 校验 `state` 防 CSRF；回调只允许同源窗口交互（postMessage 限定 origin）。
- 严格配置“回调域/安全域名/合法请求域名”。
- 生产关闭任何“模拟登录”。

---

## 七、常见问题
- H5 授权失败：检查公众号 AppID/Secret、回调域名、是否在微信内打开、state 过期。
- PC 扫码失败：网站应用信息、回调域名是否匹配，扫码后 code 是否及时使用。
- 小程序失败：`request` 合法域名是否已配置；code 时效很短，需立即换取。
- App 拉起失败：包名/Bundle/签名与开放平台登记不一致；URL Scheme/UL 配置缺失；Harmony 证书指纹未匹配。
