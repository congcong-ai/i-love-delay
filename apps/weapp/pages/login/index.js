const { request } = require('../../utils/request')

Page({
  data: { loading: false },
  onLoginTap() {
    this.setData({ loading: true })
    wx.login({
      success: ({ code }) => {
        if (!code) {
          this.setData({ loading: false })
          wx.showToast({ title: '登录失败，请重试', icon: 'none' })
          return
        }
        request({
          url: '/api/auth/wechat/weapp',
          method: 'POST',
          data: { code },
          header: { 'Content-Type': 'application/json' }
        }).then(({ statusCode, data }) => {
          if (statusCode === 200 && data?.success) {
            const token = data.token || ''
            wx.setStorageSync('token', token)
            wx.showToast({ title: '登录成功', icon: 'success' })
            wx.reLaunch({ url: '/pages/index/index' })
          } else {
            wx.showToast({ title: '登录失败', icon: 'none' })
          }
        }).catch(() => wx.showToast({ title: '网络异常', icon: 'none' }))
          .finally(() => this.setData({ loading: false }))
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({ title: 'wx.login 失败', icon: 'none' })
      }
    })
  }
})
