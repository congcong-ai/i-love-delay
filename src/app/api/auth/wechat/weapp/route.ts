import { NextResponse } from 'next/server'
import { getOrCreateUserByIdentity, signAppToken } from '@/lib/server/auth'

export async function POST(req: Request) {
  try {
    if ((process.env.ENABLE_WECHAT_MINI_LOGIN || 'true') !== 'true') {
      return NextResponse.json({ success: false, message: 'mini login disabled' }, { status: 404 })
    }

    const { code } = (await req.json()) as { code?: string }
    if (!code) {
      return NextResponse.json({ success: false, message: 'code is required' }, { status: 400 })
    }

    // 预检查必要环境变量，避免进入到更深层逻辑才失败
    const appid = process.env.WECHAT_MINI_APP_ID
    const secret = process.env.WECHAT_MINI_APP_SECRET
    if (!appid || !secret) {
      return NextResponse.json({
        success: false,
        message: 'WeChat mini credentials missing',
        hint: '设置 WECHAT_MINI_APP_ID 与 WECHAT_MINI_APP_SECRET 并重启服务'
      }, { status: 500 })
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URL missing',
        hint: '在 .env.local 配置 DATABASE_URL 并重启服务'
      }, { status: 500 })
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
    let res: Response
    try {
      res = await fetch(url, { cache: 'no-store' })
    } catch (err) {
      console.error('[weapp] fetch jscode2session failed:', (err as Error)?.message)
      return NextResponse.json({ success: false, message: 'jscode2session request failed' }, { status: 500 })
    }
    const json = await res.json()
    if (!res.ok || (json && json.errcode)) {
      return NextResponse.json({ success: false, message: 'jscode2session error', data: json }, { status: 400 })
    }

    const { openid, unionid } = json as { openid: string; unionid?: string }

    // 统一用户体系：存在即创建
    const profile = await getOrCreateUserByIdentity({
      provider: 'wechat-mini',
      providerUserId: openid,
      unionId: unionid,
      displayName: '微信小程序用户',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=weapp'
    })

    const token = signAppToken({ sub: profile.id, provider: 'wechat-mini', pid: openid })

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
    console.error('[weapp] internal error:', (e as Error)?.message)
    return NextResponse.json({ success: false, message: 'internal error' }, { status: 500 })
  }
}
