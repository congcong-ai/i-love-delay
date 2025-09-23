const { t } = require('../../utils/i18n')
const { request } = require('../../utils/request')
const { ensureLogin } = require('../../utils/auth')
const { timeAgo } = require('../../utils/time')

Page({
  data: {
    i18n: {},
    tab: 'recent', // 'recent' | 'popular'
    list: [],
    offset: 0,
    limit: 20,
    loading: false,
    nomore: false,
    activeCommentFor: '',
    commentInput: '',
    userId: '',
    skeletonRowCol: [
      [{ type: 'circle', size: '64rpx' }, { width: '40%' }],
      [{ width: '100%' }],
      [{ width: '80%' }]
    ]
  },
  onShow(){ this.loadUserThenReset(); try{ const tb=this.getTabBar&&this.getTabBar(); if(tb&&tb.setActive) tb.setActive(3) }catch{} },
  i18nPack(){
    return {
      title: t('square.title'),
      subtitle: t('square.subtitle'),
      popular: t('square.popular'),
      recent: t('square.recent'),
      noShares: t('square.noShares'),
      send: t('square.send'),
      sending: t('square.sending'),
      commentPlaceholder: t('square.commentPlaceholder')
    }
  },
  async loadUserThenReset(){
    this.setData({ i18n: this.i18nPack() })
    try {
      const res = await request({ url: '/api/auth/me', method: 'GET' })
      if (res.statusCode === 200 && res.data?.success) {
        this.setData({ userId: res.data.data.id })
      } else if (res.statusCode === 401) {
        // 未登录，忽略
        this.setData({ userId: '' })
      }
    } catch {}
    this.resetAndLoad()
  },
  resetAndLoad(){ this.setData({ list: [], offset: 0, nomore: false }); this.loadList() },
  switchTab(e){
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.tab) return
    this.setData({ tab })
    this.resetAndLoad()
  },
  async loadList(){
    if (this.data.loading || this.data.nomore) return
    this.setData({ loading: true })
    try {
      const userParam = this.data.userId ? `&userId=${encodeURIComponent(this.data.userId)}` : ''
      const res = await request({ url: `/api/square/share?limit=${this.data.limit}&offset=${this.data.offset}&sort=${this.data.tab==='popular'?'trending':'recent'}${userParam}`, method: 'GET' })
      if (res.statusCode === 200 && Array.isArray(res.data)) {
        const items = res.data.map(x => {
          const createdAtText = timeAgo(x.createdAt)
          const delayedShort = typeof x.delayCount === 'number' ? t('square.delayedCount', { count: x.delayCount }) : ''
          const metaLine = delayedShort ? `${delayedShort} · ${createdAtText}` : createdAtText
          return {
            ...x,
            createdAtText,
            delayedShort,
            metaLine,
            comments: [],
            commentsLoaded: false,
            commentLoading: false
          }
        })
        const list = this.data.list.concat(items)
        const nomore = items.length < this.data.limit
        this.setData({ list, offset: this.data.offset + items.length, nomore })
      }
    } finally {
      this.setData({ loading: false })
    }
  },
  onReachBottom(){ this.loadList() },
  // 兼容 TDesign t-input 的 change 事件
  onCommentInputChange(e){ this.setData({ commentInput: (e.detail && e.detail.value) || '' }) },
  // TDesign t-tabs 切换
  onTabsChange(e){
    const tab = (e.detail && e.detail.value) || 'recent'
    if (tab === this.data.tab) return
    this.setData({ tab })
    this.resetAndLoad()
  },
  async toggleLike(e){
    if (!ensureLogin()) return
    const id = e.currentTarget.dataset.id
    await this.toggleInteraction(id, 'like')
  },
  async toggleFavorite(e){
    if (!ensureLogin()) return
    const id = e.currentTarget.dataset.id
    await this.toggleInteraction(id, 'favorite')
  },
  async toggleInteraction(publicTaskId, type){
    try {
      const res = await request({ url: '/api/square/interaction', method: 'POST', data: { publicTaskId, type }, header: { 'Content-Type': 'application/json' } })
      if (res.statusCode === 200 && res.data?.success) {
        const list = this.data.list.map(item => {
          if (item.id !== publicTaskId) return item
          if (type === 'like') {
            const active = res.data.data.active
            const likesCount = res.data.data.likesCount != null ? res.data.data.likesCount : item.likesCount
            return { ...item, isLiked: active, likesCount }
          }
          if (type === 'favorite') {
            const active = res.data.data.active
            return { ...item, isFavorited: active }
          }
          return item
        })
        this.setData({ list })
      }
    } catch {}
  },
  async toggleCommentBox(e){
    const id = e.currentTarget.dataset.id
    const open = this.data.activeCommentFor === id ? '' : id
    this.setData({ activeCommentFor: open })
    if (open) this.loadComments(id)
  },
  async loadComments(publicTaskId){
    const idx = this.data.list.findIndex(x => x.id === publicTaskId)
    if (idx < 0) return
    const item = this.data.list[idx]
    if (item.commentsLoaded) return
    this.setData({ [`list[${idx}].commentLoading`]: true })
    try {
      const res = await request({ url: `/api/square/comments?publicTaskId=${publicTaskId}&limit=50`, method: 'GET' })
      if (res.statusCode === 200 && Array.isArray(res.data)) {
        const comments = res.data.map(c => ({ ...c, createdAtText: timeAgo(c.createdAt) }))
        this.setData({ [`list[${idx}].comments`]: comments, [`list[${idx}].commentsLoaded`]: true })
      }
    } finally {
      this.setData({ [`list[${idx}].commentLoading`]: false })
    }
  },
  onCommentInput(e){ this.setData({ commentInput: e.detail.value }) },
  async sendComment(e){
    if (!ensureLogin()) return
    const publicTaskId = e.currentTarget.dataset.id
    const content = (this.data.commentInput||'').trim()
    if (!content) return
    const idx = this.data.list.findIndex(x => x.id === publicTaskId)
    if (idx < 0) return
    try {
      const res = await request({ url: '/api/square/comments', method: 'POST', data: { publicTaskId, content }, header: { 'Content-Type': 'application/json' } })
      if (res.statusCode === 200 && res.data?.success) {
        const c = res.data.data
        const comments = (this.data.list[idx].comments || []).concat([{ ...c, createdAtText: timeAgo(c.createdAt) }])
        this.setData({ [`list[${idx}].comments`]: comments, commentInput: '' })
      }
    } catch {}
  }
})
