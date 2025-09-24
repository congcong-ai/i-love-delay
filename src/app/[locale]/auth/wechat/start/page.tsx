"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

export default function WechatStartPage() {
  const router = useRouter()
  const search = useSearchParams()
  const locale = useLocale()
  const t = useTranslations('auth')

  const ret = search.get('return') || ''
  const [copied, setCopied] = useState(false)

  const currentUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }, [])

  const callbackUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const base = `${window.location.origin}/${locale}/auth/wechat/callback`
    const cb = new URL(base)
    cb.searchParams.set('from', 'h5')
    cb.searchParams.set('return', ret || (typeof window !== 'undefined' ? window.location.origin + `/${locale}/profile` : '/'))
    return cb.toString()
  }, [locale, ret])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ua = window.navigator.userAgent || ''
    const isWeChat = /MicroMessenger/i.test(ua)

    if (isWeChat) {
      const appid = (process.env.NEXT_PUBLIC_WECHAT_H5_APP_ID || process.env.NEXT_PUBLIC_WECHAT_APP_ID) as string | undefined
      if (!appid || !callbackUrl) return
      const state = Math.random().toString(36).slice(2, 10)
      const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${encodeURIComponent(appid)}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`
      window.location.replace(url)
    }
  }, [callbackUrl])

  if (typeof window === 'undefined') return null

  const ua = window.navigator.userAgent || ''
  const isWeChat = /MicroMessenger/i.test(ua)

  if (isWeChat) {
    // 兜底：如果未重定向，显示处理中
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-3">
          <h1 className="text-lg font-semibold">{t('wechatLogin')}</h1>
          <p className="text-sm text-muted-foreground">{t('wechatAuthProcessing')}</p>
        </div>
      </div>
    )
  }

  const copyText = currentUrl

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-xl font-semibold">{t('wechatH5OpenInWeChatTitle')}</h1>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{t('wechatH5OpenInWeChatDesc')}</p>

        <div className="flex items-center gap-2">
          <input
            readOnly
            value={copyText}
            className="flex-1 text-sm px-3 py-2 border rounded"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            className="inline-flex items-center justify-center rounded border px-3 py-1.5 text-sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(copyText)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              } catch {}
            }}
          >
            {copied ? t('copied') : t('copyLink')}
          </button>
        </div>

        <div className="text-sm text-muted-foreground whitespace-pre-line">
          <strong className="block mb-1">{t('openWeChatGuideTitle')}：</strong>
          {t('openWeChatGuideSteps')}
        </div>

        <div className="text-xs text-muted-foreground">
          {t('openWeChatTips')}
        </div>
      </div>
    </div>
  )
}
