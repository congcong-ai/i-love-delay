import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/server/db'
import { verifyAppToken } from '@/lib/server/auth'

// GET /api/square/comments?publicTaskId=<uuid>&limit=100
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicTaskId = searchParams.get('publicTaskId')
    const limit = Math.min(Number(searchParams.get('limit') ?? '100'), 500)

    if (!publicTaskId) {
      return NextResponse.json({ error: '缺少必填字段 publicTaskId' }, { status: 400 })
    }

    const { rows } = await query<any>(
      `SELECT id, user_id, user_name, user_avatar, content, created_at
       FROM public_task_comments
       WHERE public_task_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [publicTaskId, limit]
    )

    const result = (rows || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userAvatar: row.user_avatar,
      content: row.content,
      createdAt: row.created_at,
    }))

    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误'
    console.error('服务器错误(GET 评论):', msg)
    return NextResponse.json({ error: '服务器错误', details: msg }, { status: 500 })
  }
}

// POST /api/square/comments
// body: { publicTaskId, content, userId, userName, userAvatar }
export async function POST(request: NextRequest) {
  try {
    // 优先从 Authorization 中解析用户身份
    const auth = request.headers.get('authorization') || request.headers.get('Authorization')
    let authedUserId: string | null = null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const token = auth.slice('bearer '.length)
      const payload = verifyAppToken(token)
      if (payload?.sub) authedUserId = payload.sub
    }

    const body = await request.json()
    const { publicTaskId, content, userId: rawUserId, userName: rawUserName, userAvatar: rawUserAvatar } = body || {}
    const userId = (authedUserId || rawUserId || '').trim()

    if (!publicTaskId || !content || !userId) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 若已鉴权，从数据库补齐昵称与头像；忽略前端可伪造的字段
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
      `INSERT INTO public_task_comments (
         public_task_id, user_id, user_name, user_avatar, content
       ) VALUES ($1, $2, $3, COALESCE($4, $5), $6)
       RETURNING id, user_id, user_name, user_avatar, content, created_at`,
      [
        publicTaskId,
        userId,
        userName || '用户',
        userAvatar,
        'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        content,
      ]
    )

    const data = rows[0]
    const mapped = {
      id: data.id,
      userId: data.user_id,
      userName: data.user_name,
      userAvatar: data.user_avatar,
      content: data.content,
      createdAt: data.created_at,
    }

    return NextResponse.json({ success: true, data: mapped })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误'
    console.error('服务器错误(POST 评论):', msg)
    return NextResponse.json({ error: '服务器错误', details: msg }, { status: 500 })
  }
}
