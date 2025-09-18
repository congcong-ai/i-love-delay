import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/server/db'
import { verifyAppToken } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || req.headers.get('Authorization')
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ success: false, message: 'unauthorized' }, { status: 401 })
    }
    const token = auth.slice('bearer '.length)
    const payload = verifyAppToken(token)
    if (!payload?.sub) {
      return NextResponse.json({ success: false, message: 'invalid token' }, { status: 401 })
    }

    const userId = payload.sub
    const rs = await query<{ id: string; displayName: string; avatarUrl: string | null }>(
      'SELECT id, display_name as "displayName", avatar_url as "avatarUrl" FROM users WHERE id=$1 LIMIT 1',
      [userId]
    )

    if (!rs.rowCount) {
      return NextResponse.json({ success: false, message: 'user not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: rs.rows[0] })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'internal error' }, { status: 500 })
  }
}
