Component({
  data: {
    active: 0,
    list: [
      { pagePath: 'pages/tasks/index', text: '任务' },
      { pagePath: 'pages/delayed/index', text: '拖延' },
      { pagePath: 'pages/square/index', text: '广场' },
      { pagePath: 'pages/rage/index', text: '暴走' },
      { pagePath: 'pages/profile/index', text: '我的' }
    ]
  },
  methods: {
    onTap(e){
      const index = e.currentTarget.dataset.index
      const item = this.data.list[index]
      if (!item) return
      this.setData({ active: index })
      wx.switchTab({ url: '/' + item.pagePath })
    },
    setActive(index){ this.setData({ active: index }) }
  }
})
