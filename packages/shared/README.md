# packages/shared

用于多端共享的“类型 / 常量 / 文案”等。当前阶段：
- 以根目录 `messages/*.json` 为源，在构建/开发阶段同步到 `apps/weapp/shared/messages/` 供小程序端直接使用。
- 后续可加入类型定义（.d.ts/.ts）、常量（.ts/.json）、UI 设计 Token 等。

使用方式：
- 运行 `npm run sync:shared` 进行一次性同步；
- 或在 CI/钩子中加入该命令，保证两端文案一致。
