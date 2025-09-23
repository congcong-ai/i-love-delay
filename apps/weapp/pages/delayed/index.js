const storage = require('../../utils/storage')
const { t } = require('../../utils/i18n')
const { request } = require('../../utils/request')
const { ensureLogin } = require('../../utils/auth')
const { timeAgo } = require('../../utils/time')

Page({
  data: {
    i18n: {},
    stats: { totalTasks: 0, completedTasks: 0, delayedTasks: 0 },
    delayed: [],
    delayedView: [],
    selectedTaskId: '',
    selectedTask: null,
    excuseInput: '',
    history: [],
    historyTitleText: '',
    shareLoading: false
  },
  onShow(){ this.refresh(); try{ const tb=this.getTabBar&&this.getTabBar(); if(tb&&tb.setActive) tb.setActive(1) }catch{} },
  i18nPack(){
    return {
      title: t('delayed.title'),
      subtitle: t('delayed.subtitle'),
      stats: t('delayed.stats'),
      totalDelayedTasks: t('delayed.totalDelayedTasks'),
      completedToday: t('delayed.completedToday'),
      totalDelayed: t('delayed.totalDelayed'),
      delayedTasks: t('delayed.delayedTasks'),
      noDelayedTasks: t('delayed.noDelayedTasks'),
      delayCountShort: t('delayed.delayCountShort', { count: '{count}' }),
      delayingBadge: t('delayed.delayingBadge'),
      addExcuseButton: t('delayed.addExcuseButton'),
      placeholderAddExcuse: t('delayed.placeholderAddExcuse'),
      shareToSquareButton: t('delayed.shareToSquareButton'),
      historyExcuses: t('delayed.historyExcuses', { count: '{count}' }),
      shareSuccess: t('delayed.shareSuccess'),
      shareFailed: t('delayed.shareFailed'),
      shareFailedRetry: t('delayed.shareFailedRetry')
    }
  },
  refresh(){
    const stats = storage.getTaskStats()
    const delayed = storage.getTasksByStatus('delayed')
    let selectedTaskId = this.data.selectedTaskId
    if (!selectedTaskId && delayed.length) selectedTaskId = delayed[0].id
    const selectedTask = delayed.find(t => t.id === selectedTaskId) || null
    const history = selectedTask ? storage.getExcusesByTask(selectedTask.id).map(e => ({
      id: e.id,
      content: e.content,
      createdAt: e.createdAt,
      timeAgo: timeAgo(e.createdAt)
    })) : []
    const delayedView = delayed.map(d => ({
      ...d,
      delayCountShortText: t('delayed.delayCountShort', { count: d.delayCount || 0 })
    }))
    const historyTitleText = t('delayed.historyExcuses', { count: history.length })
    this.setData({
      i18n: this.i18nPack(),
      stats,
      delayed,
      delayedView,
      selectedTaskId,
      selectedTask,
      history,
      historyTitleText
    })
  },
  onSelectTask(e){
    const id = e.currentTarget.dataset.id
    this.setData({ selectedTaskId: id })
    this.refresh()
  },
  onExcuseInput(e){ this.setData({ excuseInput: e.detail.value }) },
  // TDesign t-textarea 使用 change 事件，值为 e.detail.value
  onTextareaChange(e){ this.setData({ excuseInput: (e.detail && e.detail.value) || '' }) },
  onAddExcuse(){
    const tsk = this.data.selectedTask
    if (!tsk) { wx.showToast({ title: t('delayed.noDelayedTasks'), icon:'none' }); return }
    const text = (this.data.excuseInput||'').trim()
    if (!text) { wx.showToast({ title: t('square.enterComment'), icon:'none' }); return }
    storage.addExcuse(tsk.id, text)
    wx.showToast({ title: t('common.success'), icon:'success' })
    this.setData({ excuseInput: '' })
    this.refresh()
  },
  async onShare(){
    if (!ensureLogin()) return
    const tsk = this.data.selectedTask
    if (!tsk) { wx.showToast({ title: t('delayed.noDelayedTasks'), icon:'none' }); return }
    const excuse = (this.data.excuseInput||'').trim()
    if (!excuse) { wx.showToast({ title: t('delayed.shareNeedExcuse'), icon:'none' }); return }
    this.setData({ shareLoading: true })
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
        this.setData({ excuseInput: '' })
      } else {
        wx.showToast({ title: t('delayed.shareFailed'), icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: t('delayed.shareFailedRetry'), icon: 'none' })
    } finally {
      this.setData({ shareLoading: false })
      this.refresh()
    }
  }
  ,
  onShareHint(){
    try{ wx.showToast({ title: this.data.i18n.shareToSquareButton || '分享到广场', icon: 'none' }) }catch{}
  }
  ,
  async onShareHistory(e){
    if (!ensureLogin()) return
    const id = e.currentTarget.dataset.id
    const tsk = this.data.selectedTask
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
})
