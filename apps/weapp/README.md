# i love delay - 微信小程序前端（apps/weapp）

本目录用于存放“微信小程序”前端代码，复用根项目 Next.js 后端。

## 技术路线建议

- 方案 A：原生微信小程序（WXML/WXSS/JS/TS）
  - 优点：生态原生、体积小、体验一致
  - 缺点：需要单独页面开发
- 方案 B：Uni-app（Vue3 + TS）编译到 `mp-weixin`
  - 优点：与现有 Uniapp X 有一定技术一致性、可复用部分组件/逻辑
  - 缺点：需遵循 mp-weixin 能力边界与兼容性

待你确认方案后，我将脚手架对应项目结构，并接入统一登录：

1) `wx.login()` / `uni.login({ provider: 'weixin' })` 获取 `code`
2) 调用后端 `/api/auth/wechat/weapp` 换取 `token`
3) 持久化 `token`，后续请求带 `Authorization: Bearer <token>`

## 运行与调试（建议）

- 原生方案：使用“微信开发者工具”导入本目录；在“项目设置”勾选开发期“**不校验合法域名**”。
- Uni-app 方案：使用 HBuilderX 运行到微信小程序（mp-weixin），生成 `dist/build/mp-weixin` 并在微信开发者工具打开。

更多细节参见：`docs/wechat-miniprogram-setup.md`。
