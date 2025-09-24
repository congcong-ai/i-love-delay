import { useState } from 'react'
import { View, Text, Image } from '@tarojs/components'

export default function ProfilePage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState({
    nickname: '未登录',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'
  })

  return (
    <View className="p-4 space-y-4">
      <View className="card flex items-center gap-3">
        <Image src={user.avatar} className="w-12 h-12 rounded-full" mode="aspectFill" />
        <View className="flex-1">
          <View className="text-base font-semibold text-gray-900">{user.nickname}</View>
          <View className="muted mt-0.5">{loggedIn ? '欢迎回来' : '点击下方按钮登录'}</View>
        </View>
        <Text className={loggedIn ? 'btn-outline' : 'btn'} onClick={() => setLoggedIn(v => !v)}>
          {loggedIn ? '退出' : '登录'}
        </Text>
      </View>

      <View className="card space-y-2">
        <View className="section-title">快捷入口</View>
        <View className="grid grid-cols-3 gap-3">
          <View className="btn-outline text-center">我的任务</View>
          <View className="btn-outline text-center">统计报表</View>
          <View className="btn-outline text-center">设置</View>
        </View>
      </View>

      <View className="muted text-center">i love delay · 用更好的体验对抗拖延</View>
    </View>
  )
}
