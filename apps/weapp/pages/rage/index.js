const storage = require('../../utils/storage')
const { t } = require('../../utils/i18n')

Page({
  data: {
    i18n: {},
    all: [], // todo + delayed
    selected: {},
    selectedIds: [],
    count: 0
  },
  onShow(){ this.refresh(); try{ const tb=this.getTabBar&&this.getTabBar(); if(tb&&tb.setActive) tb.setActive(2) }catch{} },
  i18nPack(){
    return {
      title: t('rage.title'),
      subtitle: t('rage.subtitle'),
      selectTasks: t('rage.selectTasks'),
      noTasksAvailable: t('rage.noTasksAvailable'),
      selectedCount: t('rage.selectedCount', { count: '{count}' }),
      selectAll: t('rage.selectAll'),
      clearAll: t('rage.clearAll'),
      todo: t('rage.todo'),
      delayed: t('rage.delayed'),
      completeAll: t('rage.completeAll')
    }
  },
  refresh(){
    const todo = storage.getTasksByStatus('todo')
    const delayed = storage.getTasksByStatus('delayed')
    const all = [...todo, ...delayed]
    const { selectedIds } = this.data
    const count = (selectedIds||[]).length
    this.setData({ all, i18n: this.i18nPack(), count })
  },
  // TDesign 复选框组回调：e.detail.value 是选中的 value 数组
  onGroupChange(e){
    const selectedIds = e.detail && e.detail.value ? e.detail.value : []
    this.setData({ selectedIds, count: selectedIds.length })
  },
  selectAll(){
    const selectedIds = this.data.all.map(it => it.id)
    this.setData({ selectedIds, count: selectedIds.length })
  },
  clearAll(){ this.setData({ selectedIds: [], count: 0 }) },
  completeAll(){
    const ids = this.data.selectedIds || []
    if (!ids.length) return
    for (const id of ids) storage.updateTaskStatus(id, 'completed')
    wx.showToast({ title: t('common.success'), icon: 'success' })
    this.setData({ selectedIds: [], count: 0 })
    this.refresh()
  }
})
