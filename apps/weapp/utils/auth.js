function getToken(){ return wx.getStorageSync('token') || '' }
function isLoggedIn(){ return !!getToken() }
function ensureLogin(onAuthed){
  if (isLoggedIn()) { typeof onAuthed==='function' && onAuthed(); return true }
  wx.showModal({
    title: '需要登录',
    content: '请先登录以继续当前操作',
    success(res){ if(res.confirm){ wx.switchTab({ url: '/pages/profile/index' }) } }
  })
  return false
}
module.exports = { getToken, isLoggedIn, ensureLogin }
