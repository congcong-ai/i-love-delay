import { NextResponse } from 'next/server'
import { getOrCreateUserByIdentity, signAppToken } from '@/lib/server/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const isProd = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENV === 'production'
    const enable = process.env.ENABLE_DEBUG_TOKEN === 'true'
    if (isProd && !enable) {
      return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
    }

    let body: any = {}
    try { body = await req.json() } catch {}

    const providerUserId = body?.uid || ('dev_' + Math.random().toString(36).slice(2, 10))
    const displayName = body?.name || '开发用户'

    const profile = await getOrCreateUserByIdentity({
      provider: 'huawei',
      providerUserId,
      unionId: null,
      displayName,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=debug'
    })

    const token = signAppToken({ sub: profile.id, provider: 'huawei', pid: providerUserId })

    return NextResponse.json({
      success: true,
      token,
      data: {
        userId: profile.id,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl
      }
    })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'internal error' }, { status: 500 })
  }
}
