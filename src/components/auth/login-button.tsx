'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { LogIn, LogOut, User, Copy } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { uniappBridge } from '@/lib/uniapp-bridge'

export function LoginButton() {
  const { user, isLoggedIn, isLoading, login, logout } = useAuthStore()
  const t = useTranslations('auth')
  const locale = useLocale()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const inApp = typeof window !== 'undefined' && uniappBridge.isInUniappApp
  const provider = (process.env.NEXT_PUBLIC_MOBILE_AUTH_PROVIDER || 'huawei').toLowerCase()
  const label = !inApp ? t('wechatLogin') : provider === 'wechat' ? t('wechatLogin') : t('huaweiLogin')

  const redirectBase = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/${locale}/auth/wechat/callback`
  }, [locale])

  const copyUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const startUrl = `${window.location.origin}/${locale}/auth/wechat/start?return=${encodeURIComponent(window.location.href)}`
    return startUrl
  }, [locale])

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      try {
        if (typeof window === 'undefined') return
        if (e.origin !== window.location.origin) return
        const data = e.data as any
        if (data && data.type === 'WECHAT_WEB_LOGIN_RESULT') {
          if (data.success && data.token && data.data) {
            try {
              localStorage.setItem('app_token', data.token)
            } catch {}
            const mapped = {
              openid: data.data.userId || data.data.providerUserId || data.data.openid || '',
              nickname: data.data.displayName || '微信用户',
              avatar: data.data.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat',
            }
            useAuthStore.setState({ token: data.token })
            useAuthStore.getState().setUser(mapped)
          }
        }
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleMessage)
      return () => window.removeEventListener('message', handleMessage)
    }
  }, [])

  function openWechatQrPopup() {
    const appid = (process.env.NEXT_PUBLIC_WECHAT_WEB_APP_ID || process.env.NEXT_PUBLIC_WECHAT_APP_ID) as string | undefined
    if (!appid || !redirectBase) {
      alert('未配置微信AppID或回调地址')
      return
    }
    const state = Math.random().toString(36).slice(2, 10)
    const cb = new URL(redirectBase)
    cb.searchParams.set('from', 'web')
    cb.searchParams.set('return', typeof window !== 'undefined' ? window.location.href : '')
    const url = `https://open.weixin.qq.com/connect/qrconnect?appid=${encodeURIComponent(appid)}&redirect_uri=${encodeURIComponent(cb.toString())}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`
    const w = 520
    const h = 600
    const dualScreenLeft = (window as any).screenLeft !== undefined ? (window as any).screenLeft : (window as any).screenX
    const dualScreenTop = (window as any).screenTop !== undefined ? (window as any).screenTop : (window as any).screenY
    const width = window.innerWidth || document.documentElement.clientWidth || (window as any).screen.width
    const height = window.innerHeight || document.documentElement.clientHeight || (window as any).screen.height
    const left = width / 2 - w / 2 + dualScreenLeft
    const top = height / 2 - h / 2 + dualScreenTop
    window.open(
      url,
      'wechat_login',
      `scrollbars=no,toolbar=no,location=no,titlebar=no,directories=no,status=no,menubar=no,width=${w},height=${h},top=${top},left=${left}`
    )
  }

  function startWechatH5Auth() {
    const appid = (process.env.NEXT_PUBLIC_WECHAT_H5_APP_ID || process.env.NEXT_PUBLIC_WECHAT_APP_ID) as string | undefined
    if (!appid || !redirectBase) {
      alert('未配置微信AppID或回调地址')
      return
    }
    const state = Math.random().toString(36).slice(2, 10)
    const cb = new URL(redirectBase)
    cb.searchParams.set('from', 'h5')
    cb.searchParams.set('return', typeof window !== 'undefined' ? window.location.href : '')
    const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${encodeURIComponent(appid)}&redirect_uri=${encodeURIComponent(cb.toString())}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`
    window.location.href = url
  }

  const handleClick = () => {
    if (inApp) {
      // App/Uniapp 环境：走原有桥接登录
      login()
      return
    }
    if (typeof window === 'undefined') return
    const ua = window.navigator.userAgent || ''
    const isWeChat = /MicroMessenger/i.test(ua)
    const isMobile = /Mobi|Android|iPhone|iPod|iPad|Mobile/i.test(ua)

    if (!isMobile) {
      // PC：扫码登录
      openWechatQrPopup()
      return
    }
    if (isWeChat) {
      // H5：在微信内直接拉起授权
      startWechatH5Auth()
    } else {
      // H5：非微信浏览器，弹出提示复制链接到微信打开
      setDialogOpen(true)
    }
  }

  if (!isLoggedIn) {
    return (
      <>
        <Button
          onClick={handleClick}
          disabled={isLoading}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <LogIn className="w-4 h-4" />
          <span>{isLoading ? t('loggingIn') : label}</span>
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('wechatH5OpenInWeChatTitle')}</DialogTitle>
              <DialogDescription>
                {t('wechatH5OpenInWeChatDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={copyUrl}
                  className="flex-1 text-sm px-3 py-2 border rounded"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!copyUrl) return
                    try {
                      await navigator.clipboard.writeText(copyUrl)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    } catch {}
                  }}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {copied ? t('copied') : t('copyLink')}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                <strong className="block mb-1">{t('openWeChatGuideTitle')}：</strong>
                {t('openWeChatGuideSteps')}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('gotIt')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} alt={user?.nickname} />
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user?.nickname && (
              <p className="font-medium text-sm">{user.nickname}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {user?.openid?.slice(0, 8)}...
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}