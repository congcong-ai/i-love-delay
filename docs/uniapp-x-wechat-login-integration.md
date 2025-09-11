# Uniapp X 微信集成配置文档

## 📱 项目概述

本文档详细说明了如何将 i love delay web应用通过 Uniapp X 的 webview 嵌入，实现原生微信登录功能，并打包成手机APP。

## 🎯 技术架构

```
Uniapp X App (原生壳)
├── Webview (加载 https://your-web-app.com)
├── 微信SDK (原生集成)
├── JSBridge (webview通信)
└── 本地存储 (用户信息缓存)
```

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

### 2. Web端接收代码

**在web应用中添加：**
```typescript
// utils/uniapp-bridge.ts
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

## 📞 技术支持

如有问题，请联系：
- 微信：your-wechat
- 邮箱：your-email@domain.com

---

*最后更新：2025年8月30日*