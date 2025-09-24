# 迁移计划（Next.js → Taro 一套前端）

本计划将现有 Next.js 前端逐步迁移到 Taro（React 语法），实现 H5/微信小程序/App（原生壳）一套代码多端输出。后端保留 NestJS + CMS。

---

## 里程碑

- M0：方案确认与脚手架
  - 定稿《architecture-taro.md》《wechat-login-taro.md》
  - 新建 `apps/taro`，集成 Taro + Tailwind（taro-tailwindcss）+ Zustand + React Query + Axios
  - 约定路由结构与页面清单：任务、拖延、广场、暴走、我的
- M1：基础框架与主题
  - 全局布局（导航/底部 Tab/主题色）
  - 公共组件（按钮/卡片/标签/弹窗/头像等）
  - 全局状态与请求层（token 注入/错误拦截）
- M2：鉴权体系与微信登录（四端）
  - 接入 H5（微信内）/PC（扫码）/小程序（jscode2session）/App（OpenSDK）
  - 与 NestJS 打通 `/auth` 系列接口，拿 JWT，统一持久化
- M3：业务页面迁移
  - 优先 H5/小程序端体验：
    - 任务（tasks）
    - 拖延（delayed）
    - 广场（square）
    - 暴走（rage）
    - 我的（profile）
  - 保持交互与视觉风格与 Next.js 基本一致
- M4：数据联调与灰度
  - 真机测试（iOS/Android/Harmony）与小程序体验版
  - 域名/白名单/回调检查
  - 性能与埋点监控
- M5：切流与收尾
  - 替换旧前端入口，Next.js 前端只保留过渡页/下线
  - 文档固化与团队宣导

---

## 拆分步骤

1. 新建 `apps/taro`
   - `pnpm create taro@latest`（或 npm/yarn）
   - 选择 React、TypeScript、Tailwind（通过插件）、状态管理（Zustand）
   - 集成 `taro-tailwindcss`、`@tarojs/plugin-html`（如需）
2. 封装请求层
   - 基于 axios/ky，注入 `Authorization: Bearer <token>`
   - 统一 401/403 处理与刷新逻辑（如需）
3. 封装鉴权服务
   - H5（内/外）、PC、WeApp、App 四端登录入口与回调页
   - 落地到 `src/services/auth.ts` 与 `src/stores/auth.ts`
4. 迁移 UI 与页面
   - 将 Next.js 下的 UI/交互逐步抽象为跨端组件（避免直接 DOM 操作）
   - 优先迁移“我的”和“广场”（需要登录/互动较多）
5. 联调与验收
   - 对照现网交互逐项核对
   - H5/小程序/App 全端冒烟测试
6. 切换入口
   - 发布 Taro H5 与小程序；原生壳加载 H5 域名
   - Next.js 前端入口去链接到新前端

---

## 并行策略
- 开发并行：在 `apps/taro/` 内独立推进，不影响现有线上 Next.js。
- 数据与接口共用：所有数据均走 NestJS API，前后端契约稳定后，迁移成本可控。
- 风险隔离：先灰度上线 Taro H5，再上线小程序与 App 包。

---

## 注意事项
- 小程序体积与样式受限：Tailwind 需开启按需裁剪；组件库使用 Taro 生态优先。
- HarmonyOS NEXT 原生生态在演进：优先 H5 WebView + JSBridge，后续再评估 RN/Harmony。
- 所有 Secret 仅存服务端；前端只存 AppID 与 JWT。
