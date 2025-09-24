import { NextResponse } from 'next/server'
import { getOrCreateUserByIdentity, signAppToken } from '@/lib/server/auth'

export async function POST(req: Request) {
  try {
    if ((process.env.ENABLE_WECHAT_LOGIN || 'true') !== 'true') {
      return NextResponse.json({ success: false, message: 'wechat login disabled' }, { status: 404 })
    }
    const { code, from } = (await req.json()) as { code?: string; from?: string }
    if (!code) {
      return NextResponse.json({ success: false, message: 'code is required' }, { status: 400 })
    }

    // 根据来源选择不同的 AppID/Secret
    const f = (from || '').toLowerCase()
    let appid: string | undefined
    let secret: string | undefined
    if (f === 'web') {
      appid = process.env.NEXT_PUBLIC_WECHAT_WEB_APP_ID || process.env.NEXT_PUBLIC_WECHAT_APP_ID
      secret = process.env.WECHAT_WEB_APP_SECRET || process.env.WECHAT_APP_SECRET
    } else if (f === 'h5') {
      appid = process.env.NEXT_PUBLIC_WECHAT_H5_APP_ID || process.env.NEXT_PUBLIC_WECHAT_APP_ID
      secret = process.env.WECHAT_H5_APP_SECRET || process.env.WECHAT_APP_SECRET
    } else {
      appid = process.env.NEXT_PUBLIC_WECHAT_APP_ID
      secret = process.env.WECHAT_APP_SECRET
    }
    if (!appid || !secret) {
      return NextResponse.json({ success: false, message: 'WeChat credentials missing' }, { status: 500 })
    }

    // 1) 用 code 换取 access_token 与 openid
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}&code=${encodeURIComponent(code)}&grant_type=authorization_code`,
      { cache: 'no-store' }
    )
    const tokenJson = await tokenRes.json()
    if (!tokenRes.ok || tokenJson.errcode) {
      return NextResponse.json(
        { success: false, message: 'wechat access_token error', data: tokenJson },
        { status: 400 }
      )
    }

    const { access_token, openid, unionid } = tokenJson as {
      access_token: string
      openid: string
      unionid?: string
    }

    // 2) 可选：根据 scope 拉取用户信息
    let nickname: string | undefined
    let avatar: string | undefined
    if (access_token && openid) {
      try {
        const userRes = await fetch(
          `https://api.weixin.qq.com/sns/userinfo?access_token=${encodeURIComponent(access_token)}&openid=${encodeURIComponent(openid)}`,
          { cache: 'no-store' }
        )
        const userJson = await userRes.json()
        if (userRes.ok && !userJson.errcode) {
          nickname = userJson.nickname
          avatar = userJson.headimgurl
        }
      } catch {}
    }

    // 统一用户体系：存在即创建
    const profile = await getOrCreateUserByIdentity({
      provider: 'wechat',
      providerUserId: openid,
      unionId: unionid,
      displayName: nickname ?? '微信用户',
      avatarUrl: avatar ?? 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat'
    })

    const token = signAppToken({ sub: profile.id, provider: 'wechat', pid: openid })

    return NextResponse.json({
      success: true,
      token,
      data: {
        userId: profile.id,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        providerUserId: openid,
        unionid,
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'internal error' }, { status: 500 })
  }
}
