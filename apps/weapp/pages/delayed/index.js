const storage = require('../../utils/storage')
const { t } = require('../../utils/i18n')
const { request } = require('../../utils/request')
const { ensureLogin } = require('../../utils/auth')
const { timeAgo } = require('../../utils/time')

Page({
  data: {
    i18n: {},
    stats: { totalTasks: 0, completedTasks: 0, delayedTasks: 0, totalExcuses: 0, averageExcuseLength: 0, longestStreak: 0 },
    statsView: { delayedTasks: 0, totalExcuses: 0, averageExcuseText: '0', longestStreakText: '0' },
    delayed: [],
    delayedView: [],
    // 每个任务的借口草稿
    excuseDrafts: {},
    shareLoading: false,
    enjoyingDelayText: ''
  },
  onShow(){ this.refresh(); try{ const tb=this.getTabBar&&this.getTabBar(); if(tb&&tb.setActive) tb.setActive(1) }catch{} },
  i18nPack(){
    return {
      title: t('delayed.title'),
      subtitle: t('delayed.subtitle'),
      perfectExcuse: t('delayed.perfectExcuse'),
      procrastinationStats: t('delayed.procrastinationStats'),
      totalDelayedTasks: t('delayed.totalDelayedTasks'),
      totalExcuses: t('delayed.totalExcuses'),
      averageExcuseLength: t('delayed.averageExcuseLength'),
      delayRanking: t('delayed.delayRanking'),
      delayedTasks: t('delayed.delayedTasks'),
      noDelayedTasks: t('delayed.noDelayedTasks'),
      delayCountShort: t('delayed.delayCountShort', { count: '{count}' }),
      delayingBadge: t('delayed.delayingBadge'),
      lastLabel: t('delayed.lastLabel', { time: '{time}' }),
      addExcuseButton: t('delayed.addExcuseButton'),
      placeholderAddExcuse: t('delayed.placeholderAddExcuse'),
      shareToSquareButton: t('delayed.shareToSquareButton'),
      completeButton: t('delayed.completeButton'),
      wordsUnit: t('delayed.wordsUnit'),
      times: t('delayed.times'),
      shareSuccess: t('delayed.shareSuccess'),
      shareFailed: t('delayed.shareFailed'),
      shareFailedRetry: t('delayed.shareFailedRetry')
    }
  },
  refresh(){
    const stats = storage.getTaskStats()
    const delayed = storage.getTasksByStatus('delayed')
    const pack = this.i18nPack()
    const words = pack.wordsUnit || '字'
    const times = pack.times || '次'
    const formatMDHM = (ts)=>{
      try{
        const d = new Date(ts)
        const mm = String(d.getMonth()+1).padStart(2,'0')
        const dd = String(d.getDate()).padStart(2,'0')
        const hh = String(d.getHours()).padStart(2,'0')
        const mi = String(d.getMinutes()).padStart(2,'0')
        return `${mm}月${dd}日 ${hh}:${mi}`
      }catch{ return '' }
    }
    const delayedView = delayed.map(d => ({
      ...d,
      delayCountShortText: t('delayed.delayCountShort', { count: d.delayCount || 0 }),
      lastTimeShort: d.lastDelayedAt ? formatMDHM(d.lastDelayedAt) : ''
    }))
    const statsView = {
      delayedTasks: stats.delayedTasks || 0,
      totalExcuses: stats.totalExcuses || 0,
      averageExcuseText: String(stats.averageExcuseLength || 0) + words,
      longestStreakText: String(stats.longestStreak || 0) + times
    }
    const enjoyingDelayText = t('delayed.enjoyingDelay', { count: delayed.length })
    this.setData({
      i18n: pack,
      stats,
      statsView,
      delayed,
      delayedView,
      enjoyingDelayText
    })
  },
  onDraftChange(e){
    const id = e.currentTarget.dataset.id
    const val = (e.detail && e.detail.value) || ''
    const drafts = { ...(this.data.excuseDrafts||{}) }
    drafts[id] = val
    this.setData({ excuseDrafts: drafts })
  },
  onAddExcuse(e){
    const id = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id
    const taskId = id || (this.data.delayed[0] && this.data.delayed[0].id)
    if (!taskId) { wx.showToast({ title: t('delayed.noDelayedTasks'), icon:'none' }); return }
    const text = ((this.data.excuseDrafts||{})[taskId] || '').trim()
    if (!text) { wx.showToast({ title: t('square.enterComment'), icon:'none' }); return }
    storage.addExcuse(taskId, text)
    wx.showToast({ title: t('common.success'), icon:'success' })
    const drafts = { ...(this.data.excuseDrafts||{}) }
    drafts[taskId] = ''
    this.setData({ excuseDrafts: drafts })
    this.refresh()
  },
  async onShare(e){
    if (!ensureLogin()) return
    const id = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id
    const task = (this.data.delayed||[]).find(tk => tk.id === id)
    if (!task) { wx.showToast({ title: t('delayed.noDelayedTasks'), icon:'none' }); return }
    const excuse = ((this.data.excuseDrafts||{})[id] || '').trim()
    if (!excuse) { wx.showToast({ title: t('delayed.shareNeedExcuse'), icon:'none' }); return }
    this.setData({ shareLoading: true })
    try {
      const res = await request({
        url: '/api/square/share', method: 'POST', data: {
          taskId: task.id,
          taskName: task.name,
          excuse,
          delayCount: task.delayCount || 0
        }, header: { 'Content-Type': 'application/json' }
      })
      if (res.statusCode === 200 && res.data && (res.data.success || Array.isArray(res.data))) {
        wx.showToast({ title: t('delayed.shareSuccess'), icon: 'success' })
        const drafts = { ...(this.data.excuseDrafts||{}) }
        drafts[id] = ''
        this.setData({ excuseDrafts: drafts })
      } else {
        wx.showToast({ title: t('delayed.shareFailed'), icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: t('delayed.shareFailedRetry'), icon: 'none' })
    } finally {
      this.setData({ shareLoading: false })
      this.refresh()
    }
  },
  onShareHint(){
    try{ wx.showToast({ title: this.data.i18n.shareToSquareButton || '分享到广场', icon: 'none' }) }catch{}
  }
  ,
  async onShareHistory(e){
    if (!ensureLogin()) return
    const id = e.currentTarget.dataset.id
    const tsk = (this.data.delayed||[])[0]
    if (!tsk) { wx.showToast({ title: t('delayed.noDelayedTasks'), icon:'none' }); return }
    const item = (this.data.history||[]).find(h => h.id === id)
    if (!item) { wx.showToast({ title: t('delayed.shareFailed'), icon:'none' }); return }
    const excuse = (item.content||'').trim()
    if (!excuse) { wx.showToast({ title: t('delayed.shareNeedExcuse'), icon:'none' }); return }
    wx.showLoading({ title: t('delayed.sharing') || '分享中...' })
    try {
      const res = await request({
        url: '/api/square/share', method: 'POST', data: {
          taskId: tsk.id,
          taskName: tsk.name,
          excuse,
          delayCount: tsk.delayCount || 0
        }, header: { 'Content-Type': 'application/json' }
      })
      if (res.statusCode === 200 && res.data && (res.data.success || Array.isArray(res.data))) {
        wx.showToast({ title: t('delayed.shareSuccess'), icon: 'success' })
      } else {
        wx.showToast({ title: t('delayed.shareFailed'), icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: t('delayed.shareFailedRetry'), icon: 'none' })
    } finally {
      wx.hideLoading()
      this.refresh()
    }
  }
  ,
  onComplete(e){
    const id = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id
    if (!id) return
    storage.updateTaskStatus(id, 'completed')
    wx.showToast({ title: t('common.success'), icon: 'success' })
    this.refresh()
  }
})
