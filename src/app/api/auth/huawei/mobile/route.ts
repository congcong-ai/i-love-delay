import { NextResponse } from 'next/server'
import { getOrCreateUserByIdentity, signAppToken } from '@/lib/server/auth'

/*
POST /api/auth/huawei/mobile
body: { code: string }
Exchange Huawei auth code for access_token and user info, then create/find local user and sign JWT.
Environment variables required:
- HUAWEI_CLIENT_ID
- HUAWEI_CLIENT_SECRET
- HUAWEI_REDIRECT_URI (if required by your flow)
- HUAWEI_TOKEN_URL (default: https://oauth-login.cloud.huawei.com/oauth2/v3/token)
- HUAWEI_USERINFO_URL (optional; if omitted, user profile falls back to generic)
*/

export async function POST(req: Request) {
  try {
    if ((process.env.ENABLE_HUAWEI_LOGIN || 'true') !== 'true') {
      return NextResponse.json({ success: false, message: 'huawei login disabled' }, { status: 404 })
    }
    const { code } = (await req.json()) as { code?: string }
    if (!code) {
      return NextResponse.json({ success: false, message: 'code is required' }, { status: 400 })
    }

    const clientId = process.env.HUAWEI_CLIENT_ID
    const clientSecret = process.env.HUAWEI_CLIENT_SECRET
    const redirectUri = process.env.HUAWEI_REDIRECT_URI || ''
    const tokenUrl = process.env.HUAWEI_TOKEN_URL || 'https://oauth-login.cloud.huawei.com/oauth2/v3/token'
    const userinfoUrl = process.env.HUAWEI_USERINFO_URL || ''

    if (!clientId || !clientSecret) {
      return NextResponse.json({ success: false, message: 'Huawei credentials missing' }, { status: 500 })
    }

    // 1) 用 code 换取 token（Huawei 使用 x-www-form-urlencoded）
    const form = new URLSearchParams()
    form.set('grant_type', 'authorization_code')
    form.set('client_id', clientId)
    form.set('client_secret', clientSecret)
    form.set('code', code)
    if (redirectUri) form.set('redirect_uri', redirectUri)

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      cache: 'no-store',
    })
    const tokenJson = await tokenRes.json()
    if (!tokenRes.ok || tokenJson.error) {
      return NextResponse.json({ success: false, message: 'huawei token error', data: tokenJson }, { status: 400 })
    }

    const accessToken: string | undefined = tokenJson.access_token
    const unionId: string | undefined = tokenJson.union_id || tokenJson.unionId
    const providerUserId: string | undefined = tokenJson.openid || tokenJson.user_id || tokenJson.sub

    // 2) 可选：拉取用户信息
    let displayName = '华为用户'
    let avatarUrl: string | undefined
    if (accessToken && userinfoUrl) {
      try {
        const uiRes = await fetch(userinfoUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        })
        const ui = await uiRes.json()
        if (uiRes.ok && !ui.error) {
          displayName = ui.name || ui.display_name || displayName
          avatarUrl = ui.picture || ui.avatar_url || avatarUrl
        }
      } catch {}
    }

    if (!providerUserId) {
      return NextResponse.json({ success: false, message: 'missing provider user id' }, { status: 400 })
    }

    const profile = await getOrCreateUserByIdentity({
      provider: 'huawei',
      providerUserId,
      unionId: unionId || null,
      displayName,
      avatarUrl: avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=huawei'
    })

    const token = signAppToken({ sub: profile.id, provider: 'huawei', pid: providerUserId })

    return NextResponse.json({
      success: true,
      token,
      data: {
        userId: profile.id,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        providerUserId,
        unionid: unionId,
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'internal error' }, { status: 500 })
  }
}
