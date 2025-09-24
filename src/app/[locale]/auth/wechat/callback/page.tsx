"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '@/lib/stores/auth-store'

export default function WechatCallbackPage() {
  const router = useRouter()
  const search = useSearchParams()
  const locale = useLocale()
  const t = useTranslations('auth')
  const [error, setError] = useState<string | null>(null)

  const code = search.get('code') || ''
  const from = (search.get('from') || 'web').toLowerCase() // web | h5
  const ret = search.get('return') || ''

  const returnUrl = useMemo(() => {
    if (ret) return ret
    if (typeof window !== 'undefined') {
      const fallback = new URL(`/${locale}/profile`, window.location.origin).toString()
      return fallback
    }
    return '/'
  }, [ret, locale])

  useEffect(() => {
    async function run() {
      if (!code) {
        setError('missing code')
        return
      }
      try {
        const resp = await fetch('/api/auth/wechat/mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, from })
        })
        const json = await resp.json()
        if (resp.ok && json?.success) {
          const token: string | undefined = json.token
          const data = json.data || {}
          try {
            if (token && typeof window !== 'undefined') {
              localStorage.setItem('app_token', token)
            }
          } catch {}
          // 更新全局登录态
          try {
            const mapped = {
              openid: data.userId || data.providerUserId || data.openid || '',
              nickname: data.displayName || '微信用户',
              avatar: data.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat',
            }
            if (token) {
              useAuthStore.setState({ token })
            }
            useAuthStore.getState().setUser(mapped)
          } catch {}

          // PC 扫码场景：回传主窗口并关闭
          if (typeof window !== 'undefined' && window.opener && from === 'web') {
            try {
              window.opener.postMessage(
                { type: 'WECHAT_WEB_LOGIN_RESULT', success: true, token, data },
                window.location.origin
              )
            } catch {}
            window.close()
            return
          }
          // H5 或直接打开：跳回业务页
          router.replace(returnUrl)
        } else {
          setError('auth failed')
        }
      } catch (e) {
        setError('network error')
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, from])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-3">
        <h1 className="text-lg font-semibold">{t('wechatLogin')}</h1>
        {!error ? (
          <p className="text-sm text-muted-foreground">{t('wechatAuthProcessing')}</p>
        ) : (
          <>
            <p className="text-sm text-red-600">{t('wechatAuthFailed')}</p>
            <button
              className="mt-2 inline-flex items-center justify-center rounded border px-3 py-1.5 text-sm"
              onClick={() => router.replace(returnUrl)}
            >
              {t('backToApp')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
