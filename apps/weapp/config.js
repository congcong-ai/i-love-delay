// 后端 API 基地址
// 规则：
// - develop（开发版）：指向本地 http://127.0.0.1:3000（需在微信开发者工具勾选“不过校验合法域名”）
// - trial/release（体验/正式版）：指向生产域名 https://miniprogram-delay.bebackpacker.com
let API_BASE = 'https://miniprogram-delay.bebackpacker.com'
try {
  const info = typeof wx !== 'undefined' && wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
  const env = info && info.miniProgram ? info.miniProgram.envVersion : 'develop'
  if (env === 'develop') {
    API_BASE = 'http://127.0.0.1:3000'
  }
} catch (e) {
  // 保底使用生产域名
}

module.exports = { API_BASE }
