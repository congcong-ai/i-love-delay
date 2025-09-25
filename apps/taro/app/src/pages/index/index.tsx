import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'

export default function IndexRedirect() {
  useEffect(() => {
    // 启动后重定向到 Tab 首页（任务）
    Taro.switchTab({ url: '/pages/tasks/index' })
  }, [])

  return (
    <View className="p-4">
      <Text>正在进入首页...</Text>
    </View>
  )
}
