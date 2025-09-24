import { View, Text, Image } from '@tarojs/components'

interface Post {
  id: string
  author: string
  avatar: string
  content: string
  liked: boolean
  likes: number
  time: string
}

export default function SquarePage() {
  const posts: Post[] = [
    {
      id: 'p1',
      author: '小绿',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=green',
      content: '今日打卡：阅读 30 分钟，跑步 2km，状态不错！',
      liked: true,
      likes: 18,
      time: '5 分钟前'
    },
    {
      id: 'p2',
      author: 'Zoe',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zoe',
      content: '把“马上去做”改成“现在做了一个起点”，就容易很多。',
      liked: false,
      likes: 42,
      time: '1 小时前'
    }
  ]

  return (
    <View className="p-4 space-y-3">
      {posts.map(p => (
        <View key={p.id} className="card space-y-2">
          <View className="flex items-center gap-2">
            <Image src={p.avatar} className="w-8 h-8 rounded-full" mode="aspectFill" />
            <View className="text-sm font-medium text-gray-900">{p.author}</View>
            <View className="muted ml-auto">{p.time}</View>
          </View>
          <View className="text-[15px] leading-6 text-gray-900">{p.content}</View>
          <View className="flex items-center gap-3">
            <Text className={`btn-outline ${p.liked ? 'border-brand text-brand-700' : ''}`}>❤ {p.likes}</Text>
            <Text className="btn-outline">评论</Text>
            <Text className="btn-outline">分享</Text>
          </View>
        </View>
      ))}
    </View>
  )
}
