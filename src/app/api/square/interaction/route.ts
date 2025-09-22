import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/server/db'
import { verifyAppToken } from '@/lib/server/auth'

/*
POST /api/square/interaction
body: { publicTaskId: string, type: 'like' | 'favorite', userId: string }
Toggles interaction. For 'like' also updates likes_count in public_tasks.
*/
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
    const { publicTaskId, type, userId: rawUserId } = body || {}
    const userId = (authedUserId || rawUserId || '').trim()

    if (!publicTaskId || !type || !userId || !['like', 'favorite'].includes(type)) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // check existing
    const existing = await query<any>(
      `SELECT id FROM user_interactions WHERE user_id = $1 AND public_task_id = $2 AND interaction_type = $3 LIMIT 1`,
      [userId, publicTaskId, type]
    )

    let active = false
    let likesCount: number | undefined

    if (existing.rows?.length) {
      // remove
      await query(`DELETE FROM user_interactions WHERE id = $1`, [existing.rows[0].id])
      active = false
      if (type === 'like') {
        const up = await query<any>(
          `UPDATE public_tasks SET likes_count = GREATEST(COALESCE(likes_count,0)-1,0) WHERE id = $1 RETURNING likes_count`,
          [publicTaskId]
        )
        likesCount = Number(up.rows?.[0]?.likes_count ?? 0)
      }
    } else {
      // insert
      await query(
        `INSERT INTO user_interactions (user_id, public_task_id, interaction_type) VALUES ($1, $2, $3)`,
        [userId, publicTaskId, type]
      )
      active = true
      if (type === 'like') {
        const up = await query<any>(
          `UPDATE public_tasks SET likes_count = COALESCE(likes_count,0)+1 WHERE id = $1 RETURNING likes_count`,
          [publicTaskId]
        )
        likesCount = Number(up.rows?.[0]?.likes_count ?? 0)
      }
    }

    return NextResponse.json({ success: true, data: { type, active, likesCount } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误'
    console.error('POST /api/square/interaction error:', msg)
    return NextResponse.json({ error: '服务器错误', details: msg }, { status: 500 })
  }
}
