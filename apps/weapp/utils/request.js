const { API_BASE } = require('../config')

function request(options) {
  const token = wx.getStorageSync('token') || ''
  const header = Object.assign({}, options.header, token ? { Authorization: `Bearer ${token}` } : {})
  const url = options.url.startsWith('http') ? options.url : `${API_BASE}${options.url}`
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      url,
      header,
      success(res) { resolve(res) },
      fail(err) { reject(err) }
    })
  })
}

module.exports = { request }
