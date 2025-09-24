# 统一前端架构方案（Taro 版）

本方案将前端统一切换为 Taro（React 语法），通过一套代码多端输出：
- H5（移动端优先，可在 PC 浏览器运行，PC 样式做基础适配即可）
- 微信小程序（原生编译）
- App（Android/iOS/Harmony）：阶段 1 采用原生壳 + WebView 承载 H5；阶段 2 评估 Taro RN/Harmony 适配以获得更佳原生体验

后端由 NestJS 提供 API 与鉴权，另配 CMS（如 Strapi/Directus/TinaCMS 等）管理内容。

> 目标：一套代码 → 全端覆盖；保留高可用与较快响应；SEO 不作为主要目标。

---

## 目录结构（建议）

```
/ (monorepo)
├─ apps/
│  ├─ taro/                 # 统一前端（Taro, React）
│  ├─ api/                  # NestJS（或已存在的服务端）
│  └─ cms/                  # CMS（可选，Strapi/Directus 等）
├─ packages/
│  ├─ ui/                   # 共享 UI 组件（跨端约束，尽量无 DOM 直写）
│  ├─ shared/               # 通用工具/类型/常量
│  └─ config/               # 环境与构建配置（taro/postcss/tailwind 等）
├─ docs/                    # 架构/设计/运维文档
└─ .env*                    # 环境变量（仅 server 持有密钥）
```

- UI 库：
  - 优先使用 NutUI Taro / Taro UI 等跨端组件库，结合 Tailwind（通过 taro-tailwindcss 插件）统一样式体系。
  - 图标建议 Iconify（通过编译产出支持小程序）或本地 SVG 组件（注意小程序 SVG 支持限制）。
- 状态管理：Zustand 或 Recoil，配合 React Query/SWR 做数据层缓存与请求状态。
- 网络：统一走 NestJS REST 接口（推荐 axios/ky + 拦截器）。
- 鉴权：JWT（服务端签发），前端按端存储：
  - H5：localStorage + Header 携带 Authorization。
  - 小程序：Taro.setStorage；请求头带 Bearer。
  - App WebView：与原生桥通信同步 token（阶段 1 可以不做桥接，直接 H5 内部存储即可）。

---

## 构建与多端输出

- H5：`taro build --type h5 --watch`
- 微信小程序：`taro build --type weapp --watch`
- App（阶段 1：原生壳 + WebView）：
  - Android/iOS/Harmony 壳仅加载 H5 构建产物（线上地址或本地资源包），增量支持“分享/微信登录”等原生能力时，通过 JSBridge 接口调用原生 SDK。
- App（阶段 2 备选）：
  - Taro RN（`--type rn`）或 Harmony 适配（社区方案不断演进，需结合产品节奏评估投入）。

> 注意：HarmonyOS NEXT 原生能力目前生态仍在演进中，若需“完美原生体验”，建议阶段性采用 H5 WebView + JSBridge，后续再切 RN/Harmony 适配。

---

## 鉴权与微信登录（总览）

详细见《docs/wechat-login-taro.md》。核心要点：
- 不在前端持有 AppSecret；所有换取 openid/unionid 的操作放在服务端（NestJS）。
- 端内差异：
  - H5（微信内）：公众号网页授权（oauth2/authorize）
  - H5（非微信）：引导用户在微信中打开，或提供 PC 扫码（qrconnect）入口
  - PC：网站应用扫码登录（qrconnect）
  - 微信小程序：Taro.login → 服务端 jscode2session
  - App：使用微信 OpenSDK（iOS/Android/Harmony），原生拿到 code，回传服务端换取
- 服务端统一签发 JWT；前端仅存储 JWT 与轻量 profile。

---

## 样式与交互

- 目标：在 H5/小程序/App 上尽量还原当前 Next.js 的风格与交互。
- 推荐：TailwindCSS + 跨端组件库（NutUI Taro / Taro UI）
  - H5：Tailwind 全量可用。
  - 小程序：Tailwind 需通过插件裁剪 class，注意体积与选择器限制。
  - App WebView：与 H5 基本一致。
- 动画与反馈：保持轻量、流畅，避免重计算；使用 CSS 动画优先。

---

## 性能与稳定性

- H5：
  - 代码分割与懒加载；
  - PWA 可选；
  - 使用 CDN 加速静态资源；
  - 请求层缓存（SWR/React Query）+ 乐观更新。
- 小程序：
  - 限制 setState 次数与渲染层数据量；
  - 谨慎使用大图/长列表（虚拟列表）。
- App WebView：
  - 同 H5；如需离线能力，考虑本地缓存/预置资源包。

---

## 环境变量（服务端/NestJS）

```
# 统一开关
ENABLE_WECHAT_LOGIN=true

# 公众号网页授权（H5 微信内）
WECHAT_OFFICIAL_APP_ID=
WECHAT_OFFICIAL_APP_SECRET=

# 网站扫码（PC Web）
WECHAT_WEBSITE_APP_ID=
WECHAT_WEBSITE_APP_SECRET=

# 小程序
WECHAT_MINI_APP_ID=
WECHAT_MINI_APP_SECRET=

# 移动应用（App：iOS/Android/Harmony）
WECHAT_MOBILE_APP_ID=
WECHAT_MOBILE_APP_SECRET=

# JWT
AUTH_JWT_SECRET=
AUTH_TOKEN_EXPIRES_IN=30d
```

前端（Taro）只读取 `NEXT_PUBLIC_*` 的公开字段（如 AppID），Secret 永远只在服务端持有。

---

## CI/CD 与部署

- H5：部署到 CDN/静态托管（可选 Node 以支持 SSR/Prerender，但本项目不以 SEO 为目标，优先 CSR）。
- 小程序：通过微信小程序管控台上传体验/审核版。
- App：
  - 阶段 1：构建 Android/iOS/Harmony 原生壳；配置加载的 H5 域名；
  - 阶段 2：择机切换 RN/Harmony 适配。
- 监控：Sentry/阿里 ARMS；日志：服务端集中采集。

---

## 与当前仓库关系

- Next.js 前端将“退居后台”：不再新增前端逻辑，仅保留临时过渡页面/接口（可逐步下线）。
- 新建 `apps/taro` 作为主前端；逐屏迁移，实现等价功能后，关闭旧前端入口。
- 详见《docs/migration-plan-taro.md》。
