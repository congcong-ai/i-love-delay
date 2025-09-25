export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/tasks/index',
    'pages/delayed/index',
    'pages/square/index',
    'pages/rage/index',
    'pages/profile/index'
  ],
  entryPagePath: 'pages/index/index',
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'i love delay',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#7A7E83',
    selectedColor: '#22c55e',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/tasks/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.svg',
        selectedIconPath: 'assets/tabbar/home_s.svg'
      },
      {
        pagePath: 'pages/delayed/index',
        text: '拖延',
        iconPath: 'assets/tabbar/delay.svg',
        selectedIconPath: 'assets/tabbar/delay_s.svg'
      },
      {
        pagePath: 'pages/square/index',
        text: '广场',
        iconPath: 'assets/tabbar/square.svg',
        selectedIconPath: 'assets/tabbar/square_s.svg'
      },
      {
        pagePath: 'pages/rage/index',
        text: '暴走',
        iconPath: 'assets/tabbar/rage.svg',
        selectedIconPath: 'assets/tabbar/rage_s.svg'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/tabbar/profile.svg',
        selectedIconPath: 'assets/tabbar/profile_s.svg'
      }
    ]
  }
})
