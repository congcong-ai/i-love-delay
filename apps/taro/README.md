# i love delay - 前端（Taro 统一方案）

本目录用于承载 Taro（React）统一前端工程。一套代码输出多端：
- H5（移动端优先，可在 PC 浏览器运行）
- 微信小程序（weapp）
- App（Android/iOS/Harmony，阶段 1 使用原生壳 + WebView 承载 H5）

> 注意：当前仓库尚未初始化 Taro 工程，按下述步骤创建。

---

## 1. 初始化工程

安装 Taro CLI（任选包管理器）：

```bash
npm i -g @tarojs/cli
# 或
pnpm add -g @tarojs/cli
```

创建工程：

```bash
# 在 apps/taro 目录外执行（保持仓库根目录干净）
# 然后在交互中选择：React、TypeScript
# UI 可暂选空，后续集成 taro-tailwindcss 与 NutUI Taro

# 方式 A：在仓库根目录执行
# 生成的目录名建议为 apps/taro/app

taro init apps/taro/app
```

推荐插件与库（创建完成后安装）：

```bash
# Tailwind 跨端适配
pnpm -C apps/taro/app add -D taro-tailwindcss postcss autoprefixer tailwindcss

# UI 组件（2 选 1 或并用）
pnpm -C apps/taro/app add @nutui/nutui-taro@next  # NutUI Taro
# 或
pnpm -C apps/taro/app add taro-ui  # Taro UI（注意版本与 Taro 兼容）

# 状态与请求
pnpm -C apps/taro/app add zustand @tanstack/react-query axios
```

Tailwind 初始化（在 `apps/taro/app` 下）：

```bash
npx tailwindcss init -p
```

随后参考 docs/architecture-taro.md 配置 taro-tailwindcss 插件与样式入口。

---

## 2. 运行与构建

开发：

```bash
# H5
taro build --type h5 --watch

# 微信小程序
taro build --type weapp --watch
```

构建产物：

```bash
# H5
taro build --type h5

# 微信小程序
taro build --type weapp
```

---

## 3. 目录建议

```
apps/taro/app/
├─ src/
│  ├─ pages/                 # 页面（tasks/delayed/square/rage/profile 等）
│  ├─ components/            # 组件（尽量跨端，无直接 DOM 操作）
│  ├─ styles/                # 全局样式（tailwind.css 等）
│  ├─ stores/                # 状态（zustand）
│  ├─ services/              # 接口封装（axios/ky）
│  ├─ utils/                 # 工具
│  └─ app.config.ts          # 小程序/多端路由与窗口配置
└─ project.config.json       # 小程序项目配置（weapp）
```

---

## 4. 微信登录落地概览

详见 `docs/wechat-login-taro.md`。

- H5（微信内）：跳转 oauth2 → 回调页 → 服务端换取 → 写入 JWT
- PC（扫码）：弹窗 qrconnect → 回调页 postMessage 回主窗口
- 小程序：`Taro.login()` → `/auth/wechat/weapp`
- App：原生 OpenSDK 拿 code → JSBridge 回传 → `/auth/wechat/app`

---

## 5. 与现有仓库的关系

- Next.js 前端不再扩展，仅作为过渡。新的界面与交互将在 Taro 中实现。
- 后端采用 NestJS（或沿用现有服务端），接口契约保持一致。
- 迁移路线参见 `docs/migration-plan-taro.md`。
