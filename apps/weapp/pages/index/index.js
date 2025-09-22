const { request } = require('../../utils/request')

Page({
  data: { user: null, defaultAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=weapp' },
  onShow() {
    const token = wx.getStorageSync('token')
    if (!token) {
      this.setData({ user: null })
      return
    }
    request({ url: '/api/auth/me', method: 'GET' })
      .then(({ statusCode, data }) => {
        if (statusCode === 200 && data?.success) {
          this.setData({ user: data.data })
        } else if (statusCode === 401) {
          wx.removeStorageSync('token')
          this.setData({ user: null })
        }
      })
      .catch(() => {})
  },
  goLogin() {
    wx.reLaunch({ url: '/pages/login/index' })
  },
  logout() {
    wx.removeStorageSync('token')
    wx.showToast({ title: '已退出', icon: 'none' })
    this.setData({ user: null })
    this.goLogin()
  }
})
