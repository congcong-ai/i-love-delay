import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      taskId,
      taskName,
      excuse,
      delayCount,
      userId,
      userName,
      userAvatar
    } = body

    // 验证必填字段
    if (!taskId || !taskName || !excuse || !userId || !userName) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 创建广场分享记录
    const { data, error } = await supabase
      .from('public_tasks')
      .insert([
        {
          task_id: taskId,
          task_name: taskName,
          excuse: excuse,
          delay_count: delayCount || 0,
          user_id: userId,
          user_name: userName,
          user_avatar: userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
          likes_count: 0,
          is_liked: false,
          is_favorited: false,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('分享失败:', error)
      return NextResponse.json(
        { error: '分享失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('分享错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}