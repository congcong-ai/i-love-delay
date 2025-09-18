# Uniapp X 微信集成配置文档

## 📱 项目概述

本文档详细说明了如何将 i love delay web应用通过 Uniapp X 的 webview 嵌入，实现原生微信登录功能，并打包成手机APP。

> 重要更新（2025-09）：本指南新增了 HarmonyOS NEXT 生产环境的一键微信授权登录（无需扫码，使用已安装的微信 App 授权）完整落地步骤，包括开放平台配置、Uniapp X 壳配置、原生与 WebView 通信、Next.js 服务端换取 openid/unionid、以及关闭生产“假登录”的改造方案。

## 🎯 技术架构

```
Uniapp X App (原生壳)
├── Webview (加载 https://your-web-app.com)
├── 微信SDK (原生集成)
├── JSBridge (webview通信)
└── 本地存储 (用户信息缓存)
```

## 🧭 HarmonyOS NEXT 生产接入总览（一键授权登录）

以下步骤确保在“鸿蒙 NEXT + Uniapp X 壳 + WebView”形态下，用户点击登录按钮后，直接拉起手机里的微信 App 进行授权获取 code，服务端换取用户标识（openid/unionid），最终在 Web 前端完成会话建立与持久化。

实施分为 6 个阶段：
- 阶段 1：微信开放平台（移动应用 - HarmonyOS NEXT）配置
- 阶段 2：Uniapp X 壳项目开启微信 OAuth 能力与回调配置
- 阶段 3：原生侧调用微信授权并通过 WebView 向 H5 回传“授权 code”
- 阶段 4：Next.js 服务端使用 code 向微信服务器换取 access_token + openid/unionid
- 阶段 5：Web 前端接收结果，写入 `useAuthStore`，并持久化
- 阶段 6：关闭生产环境“假登录”（移除/熔断 mock）

> 推荐做法：原生侧仅回传 `code` 给 Web，所有与微信服务器的交互在服务端完成，避免在前端暴露 `appsecret`，保证安全。

### 阶段 1：微信开放平台配置（HarmonyOS NEXT 移动应用）

1) 在微信开放平台创建“移动应用”，选择支持 HarmonyOS NEXT。
2) 记录应用的 `AppID` 与 `AppSecret`。
3) 配置包名/BundleName 与签名指纹：
   - 包名（HarmonyOS NEXT 为 BundleName），需与 HBuilderX 打包产物一致。
   - 签名指纹（HarmonyOS 使用证书指纹，等价于 Android 的 SHA1/SHA256 指纹概念）。使用你用于打包的签名证书生成并在开放平台填写。
4) 配置回调拉起参数：
   - iOS 使用 Universal Links，Android 使用 `wx<appid>://` 等 scheme；HarmonyOS NEXT 使用对应的拉起/回调机制（在开放平台后台按向导填写）。
5) 将生产站点域名加入开放平台的 WebView/H5 授权白名单（如需）。

### 阶段 2：Uniapp X 项目（HarmonyOS NEXT）配置

在 HBuilderX 中：
- 使用最新 HBuilderX，确保支持 HarmonyOS NEXT 构建与微信 OAuth 能力。
- 在 `manifest.json` 的 `app-plus`/平台扩展配置中开启 OAuth（微信）。对于 HarmonyOS NEXT，如 HBuilderX 提供 Harmony 专属面板，请在对应平台面板中打开微信登录能力并填写 `AppID`，配置回调（拉起）信息。
- 允许 WebView 与原生通信（`web-view` 组件 + `uni.postMessage`）。

环境变量（写入部署服务器 `.env`，并在前端使用对应 `NEXT_PUBLIC_` 变量）：
```
NEXT_PUBLIC_WECHAT_APP_ID=你的微信AppID
WECHAT_APP_SECRET=你的微信AppSecret
```

> 注意：`WECHAT_APP_SECRET` 只应在服务端使用，绝不要下发到前端。前端仅可读取 `NEXT_PUBLIC_WECHAT_APP_ID`。

### 阶段 3：原生侧调用微信授权并回传 code

原生（Uniapp X 壳）中登录流程建议：
1) 点击登录 → 调用微信 OpenSDK 发起授权，请求 `scope=snsapi_userinfo`（或最小必要范围）。
2) 微信返回临时 `code`（一次性）。
3) 通过 WebView 通道把 `code` 发送给 H5（Web 前端）。

建议在原生侧统一使用一个消息类型回传：`WECHAT_LOGIN_CODE`，数据形如：`{ code: string, state?: string }`。

示意（保持与现有文档一致的 `web-view` + `uni.postMessage` 通信方式）：

```
// 原生：成功后
this.sendToWebApp('WECHAT_LOGIN_CODE', { code })
// 失败时
this.sendToWebApp('WECHAT_LOGIN_FAIL', { message })
```

### 阶段 4：Next.js 服务端使用 code 换取 openid/unionid（生产必做）

在本项目中新建服务端接口（示例路径）：
- `src/app/api/auth/wechat/mobile/route.ts`（POST）

接口职责：
- 入参：`{ code: string }`
- 逻辑：向微信服务器发起请求：
  - `https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code`
  - 成功后如需用户昵称头像，可在获得 `access_token` 和 `openid` 后再请求 `sns/userinfo` 接口（需 scope 授权）。
- 出参：`{ success: true, data: { openid, unionid?, nickname?, avatar? } }`

需要的环境变量：
- `NEXT_PUBLIC_WECHAT_APP_ID`
- `WECHAT_APP_SECRET`

> 安全要点：将与微信服务器的交互完全放在服务端，避免前端持有或经由前端传递 `appsecret`。

示例接口（Next.js App Router，`src/app/api/auth/wechat/mobile/route.ts`）：

```ts
// src/app/api/auth/wechat/mobile/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { code } = await req.json() as { code?: string }
    if (!code) {
      return NextResponse.json({ success: false, message: 'code is required' }, { status: 400 })
    }

    const appid = process.env.NEXT_PUBLIC_WECHAT_APP_ID
    const secret = process.env.WECHAT_APP_SECRET
    if (!appid || !secret) {
      return NextResponse.json({ success: false, message: 'WeChat credentials missing' }, { status: 500 })
    }

    // 1) 用 code 换取 access_token 与 openid
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}&code=${encodeURIComponent(code)}&grant_type=authorization_code`,
      { cache: 'no-store' }
    )
    const tokenJson = await tokenRes.json()
    if (!tokenRes.ok || tokenJson.errcode) {
      return NextResponse.json({ success: false, message: 'wechat access_token error', data: tokenJson }, { status: 400 })
    }

    const { access_token, openid, unionid } = tokenJson as { access_token: string; openid: string; unionid?: string }

    // 2) 可选：根据 scope 拉取用户信息
    let nickname: string | undefined
    let avatar: string | undefined
    if (access_token && openid) {
      try {
        const userRes = await fetch(
          `https://api.weixin.qq.com/sns/userinfo?access_token=${encodeURIComponent(access_token)}&openid=${encodeURIComponent(openid)}`,
          { cache: 'no-store' }
        )
        const userJson = await userRes.json()
        if (userRes.ok && !userJson.errcode) {
          nickname = userJson.nickname
          avatar = userJson.headimgurl
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      data: {
        openid,
        unionid,
        nickname: nickname ?? '微信用户',
        avatar: avatar ?? 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat'
      }
    })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'internal error' }, { status: 500 })
  }
}
```

### 阶段 5：Web 前端（H5）集成流程

1) Web 端通过 `uniappBridge.requestWechatLogin()` 向原生侧发起登录请求（现有代码已具备，见 `src/lib/uniapp-bridge.ts`）。
2) 监听原生回调：
   - 收到 `WECHAT_LOGIN_CODE` → 调用 `/api/auth/wechat/mobile` 完成换取 → `useAuthStore.setUser()` 持久化。
   - 若仍沿用旧回调 `WECHAT_LOGIN_SUCCESS`（直接回传用户信息），可兼容处理，但生产推荐切换为回传 `code`。
3) 交互页面（如 `src/app/[locale]/square/page.tsx`）会基于 `useAuthStore` 的 `user.openid` 完成点赞/收藏/评论等请求。

### 阶段 6：关闭生产“假登录”

当前代码中（`src/lib/stores/auth-store.ts`）：
- 非 UniApp 环境下会走“开发环境模拟登录”。为避免生产可被模拟，需要：
  1) 增加一个开关环境变量：`NEXT_PUBLIC_ENABLE_MOCK_LOGIN=false`（生产服务器 `.env`）。
  2) 改造 `login()`：在 `isInUniappApp === false` 且 `NEXT_PUBLIC_ENABLE_MOCK_LOGIN !== 'true'` 时，直接提示“需要在 App 内登录”，并中止模拟分支。
  3) 建议将“模拟登录”仅在开发环境（`NEXT_PUBLIC_ENV !== 'production'`）时可用。

落地建议（不在此文内直接修改代码，以下为方向）：
- 在 `auth-store.ts` 中读取 `process.env.NEXT_PUBLIC_ENABLE_MOCK_LOGIN`
- 仅当 `=== 'true'` 时才走 `mockUser` 分支；否则抛错或提示并返回。

---

## 📦 环境准备

### 1. 开发环境
- **HBuilderX**: 最新版本 (推荐3.8+)
- **微信开发者工具**: 最新版本
- **iOS/Android设备**: 用于真机测试

### 2. 微信配置
- **微信开放平台账号**: https://open.weixin.qq.com/
- **应用包名**: 需要与微信开放平台配置一致
- **应用签名**: Android需要keystore签名，iOS需要bundle ID

## 🔧 Uniapp X 项目配置

### 1. 创建Uniapp X项目

**manifest.json配置：**
```json
{
  "name": "i love delay",
  "appid": "__UNI__XXXXXXX",
  "description": "反向任务管理应用",
  "versionName": "1.0.0",
  "versionCode": "100",
  "transformPx": false,
  "app-plus": {
    "usingComponents": true,
    "nvueStyleCompiler": "uni-app",
    "compilerVersion": 3,
    "splashscreen": {
      "alwaysShowBeforeRender": true,
      "waiting": true,
      "autoclose": true,
      "delay": 0
    },
    "modules": {
      "OAuth": {},
      "Share": {}
    },
    "distribute": {
      "android": {
        "permissions": [
          "<uses-permission android:name=\"android.permission.CHANGE_NETWORK_STATE\" />",
          "<uses-permission android:name=\"android.permission.MOUNT_UNMOUNT_FILESYSTEMS\" />",
          "<uses-permission android:name=\"android.permission.VIBRATE\" />",
          "<uses-permission android:name=\"android.permission.READ_LOGS\" />",
          "<uses-permission android:name=\"android.permission.ACCESS_WIFI_STATE\" />",
          "<uses-feature android:name=\"android.hardware.camera.autofocus\" />",
          "<uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\" />",
          "<uses-permission android:name=\"android.permission.CAMERA\" />",
          "<uses-permission android:name=\"android.permission.GET_ACCOUNTS\" />",
          "<uses-permission android:name=\"android.permission.READ_PHONE_STATE\" />",
          "<uses-permission android:name=\"android.permission.CHANGE_WIFI_STATE\" />",
          "<uses-permission android:name=\"android.permission.WAKE_LOCK\" />",
          "<uses-permission android:name=\"android.permission.FLASHLIGHT\" />",
          "<uses-feature android:name=\"android.hardware.camera\" />",
          "<uses-permission android:name=\"android.permission.WRITE_SETTINGS\" />"
        ]
      },
      "ios": {},
      "sdkConfigs": {
        "oauth": {
          "weixin": {
            "appid": "你的微信AppID",
            "appsecret": "你的微信AppSecret",
            "UniversalLinks": "https://your-domain.com/app/"
          }
        }
      }
    }
  },
  "quickapp": {},
  "mp-weixin": {
    "appid": "你的微信小程序AppID",
    "setting": {
      "urlCheck": false
    },
    "usingComponents": true
  }
}
```

### 2. 页面结构

**pages.json配置：**
```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "i love delay",
        "app-plus": {
          "bounce": "vertical",
          "titleNView": false,
          "scrollIndicator": "none"
        }
      }
    }
  ],
  "tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#3cc51f",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "iconPath": "static/tab-bar/task.png",
        "selectedIconPath": "static/tab-bar/task-active.png",
        "text": "任务"
      },
      {
        "pagePath": "pages/index/index",
        "iconPath": "static/tab-bar/delayed.png",
        "selectedIconPath": "static/tab-bar/delayed-active.png",
        "text": "拖延"
      },
      {
        "pagePath": "pages/index/index",
        "iconPath": "static/tab-bar/square.png",
        "selectedIconPath": "static/tab-bar/square-active.png",
        "text": "广场"
      },
      {
        "pagePath": "pages/index/index",
        "iconPath": "static/tab-bar/rage.png",
        "selectedIconPath": "static/tab-bar/rage-active.png",
        "text": "暴走"
      }
    ]
  },
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "i love delay",
    "navigationBarBackgroundColor": "#F8F8F8",
    "backgroundColor": "#F8F8F8"
  }
}
```

## 🔐 微信登录实现

### 0. 生产推荐实现（回传 code）

原生（Uniapp X 壳）仅向 H5 回传 `code`，由服务端换取用户身份信息，更安全。

原生侧（示意）：

```
// 1) 调起微信授权，拿到临时 code
// 2) 回传给 H5
this.sendToWebApp('WECHAT_LOGIN_CODE', { code })
```

Web 侧处理见下方“Web端接收与服务端换取（生产推荐）”。

### 1. 原生登录页面 (pages/index/index.vue)

```vue
<template>
  <view class="container">
    <web-view 
      :src="webAppUrl" 
      @message="handleWebMessage"
      ref="webview"
    ></web-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      webAppUrl: 'https://your-web-app.com'
    }
  },
  methods: {
    handleWebMessage(event) {
      const { type, data } = event.detail;
      
      switch(type) {
        case 'WECHAT_LOGIN':
          this.wechatLogin();
          break;
        case 'GET_USER_INFO':
          this.sendUserInfo();
          break;
      }
    },
    
    wechatLogin() {
      uni.login({
        provider: 'weixin',
        success: (loginRes) => {
          uni.getUserInfo({
            provider: 'weixin',
            success: (infoRes) => {
              const userInfo = {
                openid: infoRes.userInfo.openId,
                nickname: infoRes.userInfo.nickName,
                avatar: infoRes.userInfo.avatarUrl,
                unionid: infoRes.userInfo.unionId
              };
              
              // 发送给web应用
              this.sendToWebApp('WECHAT_LOGIN_SUCCESS', userInfo);
            },
            fail: (error) => {
              console.error('获取用户信息失败:', error);
              this.sendToWebApp('WECHAT_LOGIN_FAIL', error);
            }
          });
        },
        fail: (error) => {
          console.error('微信登录失败:', error);
          this.sendToWebApp('WECHAT_LOGIN_FAIL', error);
        }
      });
    },
    
    sendUserInfo() {
      // 获取已登录用户信息
      const userInfo = uni.getStorageSync('user_info');
      if (userInfo) {
        this.sendToWebApp('USER_INFO', userInfo);
      }
    },
    
    sendToWebApp(type, data) {
      const webView = this.$refs.webview;
      if (webView) {
        const message = {
          type,
          data,
          timestamp: Date.now()
        };
        
        // 发送消息到web应用
        webView.evalJS(`
          window.postMessage(${JSON.stringify(message)}, '*');
        `);
      }
    }
  }
}
</script>

<style>
.container {
  width: 100%;
  height: 100vh;
}
</style>
```

### 2. Web端接收与服务端换取（生产推荐）

建议在全局初始化处监听 `WECHAT_LOGIN_CODE`，拿到 `code` 后调用服务端接口换取 openid/unionid 并写入 `useAuthStore`。

```ts
// 位置建议：应用初始化处或 auth store 初始化侧 
// 示例使用项目现有的 uniappBridge + useAuthStore
import { uniappBridge } from '@/lib/uniapp-bridge'
import { useAuthStore } from '@/lib/stores/auth-store'

uniappBridge.on('WECHAT_LOGIN_CODE', async (payload: unknown) => {
  try {
    const { code } = (payload || {}) as { code?: string }
    if (!code) return

    const resp = await fetch('/api/auth/wechat/mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
    const json = await resp.json()
    if (resp.ok && json?.success) {
      useAuthStore.getState().setUser({
        openid: json.data.openid,
        nickname: json.data?.nickname || '微信用户',
        avatar: json.data?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat'
      })
    } else {
      console.error('Wechat mobile login failed', json)
      useAuthStore.setState({ isLoading: false, user: null, isLoggedIn: false })
    }
  } catch (e) {
    console.error('Wechat mobile login error', e)
    useAuthStore.setState({ isLoading: false, user: null, isLoggedIn: false })
  }
})
```

—

以下为“旧示例（开发期可用，生产不推荐）”。

**在web应用中添加：**
```typescript
// src/lib/uniapp-bridge.ts（项目已内置）
export class UniappBridge {
  private isInUniapp = false;
  
  constructor() {
    this.isInUniapp = !!(window as any).uni;
    this.setupMessageListener();
  }
  
  setupMessageListener() {
    window.addEventListener('message', (event) => {
      const { type, data } = event.data;
      
      switch(type) {
        case 'WECHAT_LOGIN_SUCCESS':
          this.handleLoginSuccess(data);
          break;
        case 'WECHAT_LOGIN_FAIL':
          this.handleLoginFail(data);
          break;
        case 'USER_INFO':
          this.handleUserInfo(data);
          break;
      }
    });
  }
  
  requestWechatLogin() {
    if (this.isInUniapp) {
      (window as any).uni.postMessage({
        type: 'WECHAT_LOGIN',
        data: {}
      });
    } else {
      // 开发环境模拟
      console.log('开发环境：模拟微信登录');
    }
  }
  
  private handleLoginSuccess(userInfo: any) {
    localStorage.setItem('wechat_user', JSON.stringify(userInfo));
    // 触发全局事件
    window.dispatchEvent(new CustomEvent('user-login', { detail: userInfo }));
  }
}
```

## 🚀 打包配置

### 0. HarmonyOS NEXT 打包

使用 HBuilderX：
- 发行 → 原生应用 App → 选择 HarmonyOS NEXT。
- 配置 BundleName（需与微信开放平台一致）。
- 配置签名证书与 Profile（确保用于开放平台指纹的一致性）。
- 勾选/启用 微信登录 能力（如有单独开关）。
- 配置回调/拉起参数（如 `wx<appid>://` 或 Harmony 对应能力，按开放平台要求）。
- 构建产物并安装到真机进行授权联调。

### 1. Android打包

**build.gradle配置：**
```gradle
android {
    defaultConfig {
        applicationId "com.yourcompany.ilovedelay"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }
    
    signingConfigs {
        release {
            storeFile file("release.keystore")
            storePassword "your-store-password"
            keyAlias "your-key-alias"
            keyPassword "your-key-password"
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2. iOS打包

**Info.plist配置：**
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLName</key>
        <string>weixin</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>wx你的AppID</string>
        </array>
    </dict>
</array>

<key>LSApplicationQueriesSchemes</key>
<array>
    <string>weixin</string>
    <string>weixinULAPI</string>
</array>
```

## 📋 打包步骤

### 1. 开发环境测试
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 2. 真机调试
```bash
# Android真机调试
adb devices
adb install -r dist/build/apk/your-app.apk

# iOS真机调试
# 使用Xcode连接设备，直接运行
```

### 3. 正式打包
```bash
# Android正式包
npm run build:android

# iOS正式包
npm run build:ios
```

### 4. 🧪 联调 Checklist
- 已使用用于生产的签名证书构建（证书指纹与开放平台一致）。
- 设备已安装微信 App，已登录可授权。
- `AppID`、包名/BundleName、一致；回调/拉起配置正确。
- 服务器 `.env` 已配置：`NEXT_PUBLIC_WECHAT_APP_ID`、`WECHAT_APP_SECRET`。
- 生产环境已关闭模拟登录：`NEXT_PUBLIC_ENABLE_MOCK_LOGIN=false`。
- Web 域名已在白名单（若需要）。
- 真机抓日志确认：原生拿到 `code` → Web 收到 `WECHAT_LOGIN_CODE` → 服务端成功换取 `openid`。

## 🔍 常见问题

### 1. 微信登录失败
- 检查AppID和AppSecret是否正确
- 确认应用包名与微信开放平台配置一致
- 检查签名证书是否正确

### 2. Webview通信失败
- 确认uniapp版本支持postMessage
- 检查web应用是否正确监听message事件
- 确认web应用域名已配置到白名单

### 3. 离线功能异常
- 检查IndexedDB权限
- 确认网络状态监听正常
- 检查同步逻辑是否正确

### 4. HarmonyOS NEXT 拉起微信失败
- 检查开放平台的拉起/回调配置是否与 BundleName、签名证书一致。
- 确认已在 HBuilderX 的 Harmony 打包配置中勾选微信能力并正确填入 `AppID`。
- 尝试重新安装微信或清理微信缓存后重试。

### 5. 签名/指纹不匹配
- 使用与开放平台登记一致的签名证书进行构建，确保指纹匹配。
- Android/Harmony 场景重点检查 SHA1/SHA256 指纹（Harmony 使用证书指纹概念）。

### 6. code 换取失败（errcode/invalid code）
- code 有效期极短，确保拿到后立即传给服务端换取。
- 确认 `AppID/Secret` 正确、未过期，服务器时间同步。
- 检查服务端是否走了代理导致请求被拦截。

### 7. WebView 不回传消息
- 确认原生侧通过 `webView.evalJS` 或等效方式正确调用了 `window.postMessage`。
- 在 Web 端打开调试，监听 `message` 事件并打印 `event.data`。
- 确认 `uniappBridge` 的 `setupMessageListener` 已注册。

## 📞 技术支持

如有问题，请联系：
- 微信：your-wechat
- 邮箱：your-email@domain.com

---

*最后更新：2025年9月12日*