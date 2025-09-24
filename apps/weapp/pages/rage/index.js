const storage = require('../../utils/storage')
const { t } = require('../../utils/i18n')

Page({
  data: {
    i18n: {},
    all: [], // todo + delayed
    todoGroup: [],
    delayedGroup: [],
    selected: {},
    selectedIds: [],
    count: 0,
    // 暴走进行中
    rageStarted: false,
    progressList: [],
    progressCompleted: 0,
    progressPercent: 0,
    // 开始按钮外观
    startBtnText: '',
    startBtnColor: '#2563eb'
  },
  onShow(){ this.refresh(); try{ const tb=this.getTabBar&&this.getTabBar(); if(tb&&tb.setActive) tb.setActive(3) }catch{} },
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
      pending: t('tasks.pending'),
      delayedTasks: t('delayed.delayedTasks'),
      startRage: t('rage.startRage'),
      rageInProgress: t('rage.rageInProgress'),
      focusComplete: t('rage.focusComplete', { count: '{count}' }),
      reselect: t('rage.reselect'),
      rageProgress: t('rage.rageProgress'),
      completed: t('tasks.completed'),
      finish: t('rage.finish'),
      completeAll: t('rage.completeAll')
    }
  },
  updateStartButton(){
    const count = this.data.count || 0
    const text = count > 0 ? `${this.data.i18n.startRage} (${count} tasks)` : this.data.i18n.startRage
    const color = count > 0 ? '#fb923c' : '#2563eb'
    this.setData({ startBtnText: text, startBtnColor: color })
  },
  refresh(){
    try { storage.updateOverdueTasks() } catch(e) {}
    const todo = storage.getTasksByStatus('todo')
    const delayed = storage.getTasksByStatus('delayed')
    const all = [...todo, ...delayed]
    const { selectedIds, rageStarted } = this.data
    const count = (selectedIds||[]).length
    // 分组
    const todoGroup = todo
    const delayedGroup = delayed
    this.setData({ all, todoGroup, delayedGroup, i18n: this.i18nPack(), count }, () => this.updateStartButton())
    if (rageStarted) this.rebuildProgress()
  },
  // TDesign 复选框组回调：e.detail.value 是选中的 value 数组
  onGroupChange(e){
    const selectedIds = e.detail && e.detail.value ? e.detail.value : []
    this.setData({ selectedIds, count: selectedIds.length }, () => this.updateStartButton())
  },
  selectAll(){
    const selectedIds = this.data.all.map(it => it.id)
    this.setData({ selectedIds, count: selectedIds.length }, () => this.updateStartButton())
  },
  clearAll(){ this.setData({ selectedIds: [], count: 0 }, () => this.updateStartButton()) },
  // 进入暴走
  startRage(){
    const ids = this.data.selectedIds||[]
    if (!ids.length) return
    const list = this.data.all.filter(it => ids.includes(it.id))
      .map(it => ({ id: it.id, name: it.name, status: it.status }))
    this.setData({ rageStarted: true, progressList: list }, () => this.rebuildProgress())
  },
  // 退出暴走选择
  reselect(){ this.setData({ rageStarted: false, progressList: [], progressCompleted: 0, progressPercent: 0 }) },
  rebuildProgress(){
    const done = (this.data.progressList||[]).filter(it => it.status === 'completed').length
    const total = (this.data.progressList||[]).length || 1
    const percent = Math.round(done*100/total)
    this.setData({ progressCompleted: done, progressPercent: percent })
  },
  finishOne(e){
    const id = e.currentTarget.dataset.id
    if (!id) return
    storage.updateTaskStatus(id, 'completed')
    const list = (this.data.progressList||[]).map(it => it.id===id? { ...it, status: 'completed' } : it)
    this.setData({ progressList: list })
    this.rebuildProgress()
  },
  finishAll(){
    const ids = (this.data.progressList||[]).map(it => it.id)
    for (const id of ids) storage.updateTaskStatus(id, 'completed')
    const list = (this.data.progressList||[]).map(it => ({ ...it, status: 'completed' }))
    this.setData({ progressList: list })
    this.rebuildProgress()
    wx.showToast({ title: t('rage.rageComplete') || t('common.success'), icon: 'success' })
  },
  completeAll(){
    const ids = this.data.selectedIds || []
    if (!ids.length) return
    for (const id of ids) storage.updateTaskStatus(id, 'completed')
    wx.showToast({ title: t('common.success'), icon: 'success' })
    this.setData({ selectedIds: [], count: 0 })
    this.refresh()
  }
})

