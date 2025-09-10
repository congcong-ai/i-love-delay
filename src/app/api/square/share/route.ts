import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/server/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 200)
    const userId = (searchParams.get('userId') ?? '').trim()

    const { rows } = await query<any>(
      `SELECT id, task_id, user_id, user_name, user_avatar, task_name, excuse,
              COALESCE(delay_count, 0) AS delay_count,
              COALESCE(likes_count, 0) AS likes_count,
              -- per-user flags derived from user_interactions
              CASE WHEN $2 <> '' AND EXISTS (
                SELECT 1 FROM user_interactions ui
                 WHERE ui.public_task_id = public_tasks.id
                   AND ui.user_id = $2 AND ui.interaction_type = 'like'
              ) THEN true ELSE false END AS is_liked,
              CASE WHEN $2 <> '' AND EXISTS (
                SELECT 1 FROM user_interactions ui
                 WHERE ui.public_task_id = public_tasks.id
                   AND ui.user_id = $2 AND ui.interaction_type = 'favorite'
              ) THEN true ELSE false END AS is_favorited,
              created_at,
              (
                SELECT COUNT(*)
                FROM public_task_comments c
                WHERE c.public_task_id = public_tasks.id
              ) AS comments_count
       FROM public_tasks
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit, userId]
    )

    const result = (rows || []).map((row: any) => ({
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      userName: row.user_name,
      userAvatar: row.user_avatar,
      taskName: row.task_name,
      excuse: row.excuse,
      delayCount: Number(row.delay_count) || 0,
      likesCount: Number(row.likes_count) || 0,
      isLiked: Boolean(row.is_liked),
      isFavorited: Boolean(row.is_favorited),
      createdAt: row.created_at,
      commentsCount: Number(row.comments_count) || 0,
      comments: [] as any[],
    }))

    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误'
    console.error('服务器错误(GET 广场):', msg)
    return NextResponse.json({ error: '服务器错误', details: msg }, { status: 500 })
  }
}

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

    if (!taskId || !taskName || !excuse || !userId || !userName) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    const { rows } = await query<any>(
      `INSERT INTO public_tasks (
         task_id, task_name, excuse, delay_count, user_id, user_name, user_avatar,
         likes_count, is_liked, is_favorited
       ) VALUES ($1, $2, $3, COALESCE($4, 0), $5, $6, COALESCE($7, $8), 0, false, false)
       RETURNING id, task_id, user_id, user_name, user_avatar, task_name, excuse,
                 COALESCE(delay_count, 0) AS delay_count,
                 COALESCE(likes_count, 0) AS likes_count,
                 COALESCE(is_liked, false) AS is_liked,
                 COALESCE(is_favorited, false) AS is_favorited,
                 created_at`,
      [
        taskId,
        taskName,
        excuse,
        delayCount ?? 0,
        userId,
        userName,
        userAvatar,
        'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
      ]
    )

    const data = rows[0]
    const mapped = {
      id: data.id,
      taskId: data.task_id,
      userId: data.user_id,
      userName: data.user_name,
      userAvatar: data.user_avatar,
      taskName: data.task_name,
      excuse: data.excuse,
      delayCount: Number(data.delay_count) || 0,
      likesCount: Number(data.likes_count) || 0,
      isLiked: Boolean(data.is_liked),
      isFavorited: Boolean(data.is_favorited),
      createdAt: data.created_at,
      comments: [] as any[],
    }

    return NextResponse.json({ success: true, data: mapped })
  } catch (error) {
    const msg = error instanceof Error ? error.message : '未知错误'
    console.error('分享错误:', msg)
    return NextResponse.json({ error: '服务器错误', details: msg }, { status: 500 })
  }
}
