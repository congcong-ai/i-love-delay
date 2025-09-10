import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/server/db'

// GET /api/profile/square/activity?userId=...&category=likes|favorites|comments|shares&limit=50
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''
    const category = (searchParams.get('category') || 'all').toLowerCase()
    const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 200)

    if (!userId) {
      return NextResponse.json({ error: '缺少 userId' }, { status: 400 })
    }

    const results: any[] = []

    const fetchLikesOrFavorites = async (type: 'like' | 'favorite') => {
      const { rows } = await query<any>(
        `SELECT ui.id AS interaction_id, ui.interaction_type, ui.created_at AS interaction_created_at,
                pt.id, pt.task_id, pt.user_id, pt.user_name, pt.user_avatar, pt.task_name, pt.excuse,
                COALESCE(pt.delay_count, 0) AS delay_count,
                COALESCE(pt.likes_count, 0) AS likes_count,
                pt.created_at AS task_created_at
           FROM user_interactions ui
           JOIN public_tasks pt ON pt.id = ui.public_task_id
          WHERE ui.user_id = $1 AND ui.interaction_type = $2
          ORDER BY ui.created_at DESC
          LIMIT $3`,
        [userId, type, limit]
      )
      return (rows || []).map(r => ({
        id: r.interaction_id,
        type,
        createdAt: r.interaction_created_at,
        task: {
          id: r.id,
          taskId: r.task_id,
          userId: r.user_id,
          userName: r.user_name,
          userAvatar: r.user_avatar,
          taskName: r.task_name,
          excuse: r.excuse,
          delayCount: Number(r.delay_count) || 0,
          likesCount: Number(r.likes_count) || 0,
          createdAt: r.task_created_at
        }
      }))
    }

    const fetchComments = async () => {
      const { rows } = await query<any>(
        `SELECT c.id, c.content, c.created_at,
                pt.id AS public_task_id, pt.task_id, pt.user_id, pt.user_name, pt.user_avatar, pt.task_name, pt.excuse,
                COALESCE(pt.delay_count, 0) AS delay_count,
                COALESCE(pt.likes_count, 0) AS likes_count,
                pt.created_at AS task_created_at
           FROM public_task_comments c
           JOIN public_tasks pt ON pt.id = c.public_task_id
          WHERE c.user_id = $1
          ORDER BY c.created_at DESC
          LIMIT $2`,
        [userId, limit]
      )
      return (rows || []).map(r => ({
        id: r.id,
        type: 'comment' as const,
        content: r.content,
        createdAt: r.created_at,
        task: {
          id: r.public_task_id,
          taskId: r.task_id,
          userId: r.user_id,
          userName: r.user_name,
          userAvatar: r.user_avatar,
          taskName: r.task_name,
          excuse: r.excuse,
          delayCount: Number(r.delay_count) || 0,
          likesCount: Number(r.likes_count) || 0,
          createdAt: r.task_created_at
        }
      }))
    }

    const fetchShares = async () => {
      const { rows } = await query<any>(
        `SELECT id, task_id, user_id, user_name, user_avatar, task_name, excuse,
                COALESCE(delay_count, 0) AS delay_count,
                COALESCE(likes_count, 0) AS likes_count,
                created_at
           FROM public_tasks
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT $2`,
        [userId, limit]
      )
      return (rows || []).map(r => ({
        id: r.id,
        type: 'share' as const,
        createdAt: r.created_at,
        task: {
          id: r.id,
          taskId: r.task_id,
          userId: r.user_id,
          userName: r.user_name,
          userAvatar: r.user_avatar,
          taskName: r.task_name,
          excuse: r.excuse,
          delayCount: Number(r.delay_count) || 0,
          likesCount: Number(r.likes_count) || 0,
          createdAt: r.created_at
        }
      }))
    }

    if (category === 'likes') {
      results.push(...await fetchLikesOrFavorites('like'))
    } else if (category === 'favorites') {
      results.push(...await fetchLikesOrFavorites('favorite'))
    } else if (category === 'comments') {
      results.push(...await fetchComments())
    } else if (category === 'shares') {
      results.push(...await fetchShares())
    } else {
      const [likes, favorites, comments, shares] = await Promise.all([
        fetchLikesOrFavorites('like'),
        fetchLikesOrFavorites('favorite'),
        fetchComments(),
        fetchShares(),
      ])
      results.push(
        ...likes,
        ...favorites,
        ...comments,
        ...shares,
      )
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return NextResponse.json(results)
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误'
    console.error('GET /api/profile/square/activity error:', msg)
    return NextResponse.json({ error: '服务器错误', details: msg }, { status: 500 })
  }
}
