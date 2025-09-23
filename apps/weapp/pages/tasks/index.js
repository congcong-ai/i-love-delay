const storage = require('../../utils/storage')
const { t } = require('../../utils/i18n')

Page({
  data: {
    inputValue: '',
    todo: [],
    completed: [],
    todoView: [],
    completedView: [],
    isCompletedExpanded: false,
    i18n: {},
    tasksWaitingText: ''
  },
  onShow(){
    this.refresh()
    try{ const tb = this.getTabBar && this.getTabBar(); if (tb && tb.setActive) tb.setActive(0) }catch{}
  },
  i18nPack(count){
    return {
      title: t('tasks.title'),
      createAndProcrastinate: t('tasks.createAndProcrastinate'),
      addTask: t('tasks.addTask'),
      whatToProcrastinate: t('tasks.whatToProcrastinate'),
      pending: t('tasks.pending'),
      completed: t('tasks.completed'),
      createdAtOn: t('tasks.createdAtOn'),
      collapse: t('tasks.collapse'),
      expand: t('tasks.expand'),
      completionSatisfaction: t('tasks.completionSatisfaction'),
      finish: t('tasks.finish'),
      delayed: t('tasks.delayed'),
      delete: t('common.delete'),
      tasksWaitingText: t('tasks.tasksWaitingMessage', { count }),
      // 空态与提示卡文案
      noTasksToday: t('tasks.noTasksToday'),
      procrastinationStarts: t('tasks.procrastinationStarts'),
      feelingFreeToday: t('tasks.feelingFreeToday'),
      createToStartProcrastination: t('tasks.createToStartProcrastination'),
      procrastinationQuote: t('tasks.procrastinationQuote')
    }
  },
  formatDateShort(ts){
    try{
      const d = new Date(ts)
      const mm = String(d.getMonth()+1).padStart(2,'0')
      const dd = String(d.getDate()).padStart(2,'0')
      return mm + '/' + dd
    }catch{ return '' }
  },
  decorate(list){
    return (list||[]).map(it=>({
      ...it,
      createdShort: this.formatDateShort(it.createdAt)
    }))
  },
  refresh(){
    try { storage.updateOverdueTasks() } catch(e) {}
    const todo = storage.getTasksByStatus('todo')
    const completed = storage.getTasksByStatus('completed')
    const pack = this.i18nPack(todo.length)
    this.setData({
      todo,
      completed,
      todoView: this.decorate(todo),
      completedView: this.decorate(completed),
      i18n: pack,
      tasksWaitingText: pack.tasksWaitingText
    })
  },
  onInputChange(e){ this.setData({ inputValue: e.detail.value }) },
  // TDesign t-input 的 change 事件：e.detail.value
  onTInputChange(e){ this.setData({ inputValue: (e.detail && e.detail.value) || '' }) },
  // Vant van-field 的 change 事件：可能是 detail 或 detail.value
  onVanFieldChange(e){
    const d = e && e.detail
    const val = (d && (d.value != null ? d.value : d)) || ''
    this.setData({ inputValue: String(val) })
  },
  onVanFieldConfirm(){ this.onAddTask() },
  onAddTask(){
    const name = (this.data.inputValue||'').trim()
    if(!name){ wx.showToast({ title: t('common.error'), icon:'none' }); return }
    storage.addTask(name)
    this.setData({ inputValue: '' })
    this.refresh()
  },
  onComplete(e){
    const id = e.currentTarget.dataset.id
    storage.updateTaskStatus(id, 'completed')
    this.refresh()
  },
  onDelay(e){
    const id = e.currentTarget.dataset.id
    storage.markTaskDelayed(id)
    this.refresh()
  },
  onDelete(e){
    const id = e.currentTarget.dataset.id
    storage.deleteTask(id)
    this.refresh()
  },
  toggleCompleted(){ this.setData({ isCompletedExpanded: !this.data.isCompletedExpanded }) }
})
