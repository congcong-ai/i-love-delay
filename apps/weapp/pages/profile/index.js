const { request } = require('../../utils/request')
const { t, getLocale, setLocale } = require('../../utils/i18n')
const { timeAgo } = require('../../utils/time')

Page({
  data: {
    i18n: {},
    user: null,
    defaultAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=weapp',
    locale: 'zh',
    tab: 'all', // all | likes | favorites | comments | shares
    activities: []
  },
  onShow(){
    const locale = getLocale()
    this.setData({ locale, i18n: this.i18nPack() })
    this.loadUser().then(() => this.loadActivities())
  },
  i18nPack(){
    return {
      title: t('profile.title'),
      subtitle: t('profile.subtitle'),
      accountDescription: t('profile.accountDescription'),
      login: t('auth.login'),
      accountInfo: t('profile.accountInfo'),
      logout: t('auth.logout'),
      languageSettings: t('profile.languageSettings'),
      simplifiedChinese: t('profile.simplifiedChinese'),
      english: t('profile.english'),
      activityAll: t('profile.activityAll'),
      activityLikes: t('profile.activityLikes'),
      activityFavorites: t('profile.activityFavorites'),
      activityComments: t('profile.activityComments'),
      activityShares: t('profile.activityShares'),
      loginToViewActivity: t('profile.loginToViewActivity'),
      activityEmpty: t('profile.activityEmpty')
    }
  },
  async loadUser(){
    try {
      const res = await request({ url: '/api/auth/me', method: 'GET' })
      if (res.statusCode === 200 && res.data?.success) {
        this.setData({ user: res.data.data })
      } else if (res.statusCode === 401) {
        wx.removeStorageSync('token')
        this.setData({ user: null })
      }
    } catch {
      // 忽略网络错误
    }
  },
  async loadActivities(){
    if (!this.data.user) { this.setData({ activities: [] }); return }
    try {
      const res = await request({ url: `/api/profile/square/activity?userId=${this.data.user.id}&category=${this.data.tab}&limit=50`, method: 'GET' })
      if (res.statusCode === 200 && Array.isArray(res.data)) {
        const list = res.data.map(item => ({
          ...item,
          text: this.formatActivityText(item),
          createdAtText: timeAgo(item.createdAt)
        }))
        this.setData({ activities: list })
      } else {
        this.setData({ activities: [] })
      }
    } catch {
      this.setData({ activities: [] })
    }
  },
  formatActivityText(item){
    if (!item) return ''
    const task = item.task || {}
    const name = task.userName || '用户'
    const taskName = task.taskName || ''
    switch (item.type) {
      case 'like':
        return t('profile.activityYouLiked', { name, task: taskName })
      case 'favorite':
        return t('profile.activityYouFavorited', { name, task: taskName })
      case 'comment':
        return t('profile.activityYouCommented', { name, task: taskName })
      case 'share':
        return t('profile.activityYouShared', { task: taskName })
      default:
        return ''
    }
  },
  goLogin(){ wx.navigateTo({ url: '/pages/login/index' }) },
  logout(){
    wx.removeStorageSync('token')
    wx.showToast({ title: t('auth.logoutConfirm'), icon: 'none' })
    this.setData({ user: null, activities: [] })
  },
  setLocale(e){
    const locale = e.currentTarget.dataset.locale
    setLocale(locale)
    this.setData({ locale, i18n: this.i18nPack() })
    // 重新渲染依赖文案的列表
    this.setData({ activities: this.data.activities.map(a => ({ ...a, text: this.formatActivityText(a) })) })
  },
  switchTab(e){
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.tab) return
    this.setData({ tab })
    this.loadActivities()
  }
})
