import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/server/db'
import { verifyAppToken } from '@/lib/server/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 200)
    const userId = (searchParams.get('userId') ?? '').trim()
    const offset = Math.max(Number(searchParams.get('offset') ?? '0'), 0)
    const sort = (searchParams.get('sort') ?? 'recent').toLowerCase()

    const orderClause = sort === 'trending'
      ? 'ORDER BY trending_score DESC, created_at DESC'
      : 'ORDER BY created_at DESC'

    const { rows } = await query<any>(
      `SELECT id, task_id, user_id, user_name, user_avatar, task_name, excuse,
              COALESCE(delay_count, 0) AS delay_count,
              COALESCE(likes_count, 0) AS likes_count,
              (
                SELECT COUNT(*) FROM user_interactions ui
                 WHERE ui.public_task_id = public_tasks.id AND ui.interaction_type = 'favorite'
              ) AS favorites_count,
              (
                SELECT COUNT(*)
                FROM public_task_comments c
                WHERE c.public_task_id = public_tasks.id
              ) AS comments_count,
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
              -- weighted trending score
              (
                (COALESCE(likes_count, 0) * 3.0)
                + ((SELECT COUNT(*) FROM user_interactions ui WHERE ui.public_task_id = public_tasks.id AND ui.interaction_type = 'favorite') * 2.0)
                + ((SELECT COUNT(*) FROM public_task_comments c WHERE c.public_task_id = public_tasks.id) * 4.0)
                + (COALESCE(delay_count, 0) * 0.5)
                - (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600.0) * 0.1
              ) AS trending_score
       FROM public_tasks
       ${orderClause}
       LIMIT $1 OFFSET $3`,
      [limit, userId, offset]
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
      favoritesCount: Number(row.favorites_count) || 0,
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
    const auth = request.headers.get('authorization') || request.headers.get('Authorization')
    let authedUserId: string | null = null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const token = auth.slice('bearer '.length)
      const payload = verifyAppToken(token)
      if (payload?.sub) authedUserId = payload.sub
    }

    const body = await request.json()
    const {
      taskId,
      taskName,
      excuse,
      delayCount,
      userId: rawUserId,
      userName: rawUserName,
      userAvatar: rawUserAvatar
    } = body

    // 优先使用鉴权得到的 userId
    const userId = (authedUserId || rawUserId || '').trim()

    if (!taskId || !taskName || !excuse || !userId) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 若已鉴权，则从数据库补齐用户昵称/头像，忽略前端传入，避免伪造
    let userName = rawUserName as string | undefined
    let userAvatar = rawUserAvatar as string | undefined
    if (authedUserId) {
      try {
        const rs = await query<{ displayName: string; avatarUrl: string | null }>(
          'SELECT display_name as "displayName", avatar_url as "avatarUrl" FROM users WHERE id=$1 LIMIT 1',
          [authedUserId]
        )
        if (rs.rowCount) {
          userName = rs.rows[0].displayName || '用户'
          userAvatar = rs.rows[0].avatarUrl || undefined
        }
      } catch {}
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
        userName || '用户',
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
