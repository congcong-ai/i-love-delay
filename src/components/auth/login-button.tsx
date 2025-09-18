'use client'

import { useTranslations } from 'next-intl'
import { LogIn, LogOut, User } from 'lucide-react'
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

export function LoginButton() {
  const { user, isLoggedIn, isLoading, login, logout } = useAuthStore()
  const t = useTranslations('auth')
  const provider = (process.env.NEXT_PUBLIC_MOBILE_AUTH_PROVIDER || 'huawei').toLowerCase()
  const label = provider === 'wechat' ? t('wechatLogin') : t('huaweiLogin')

  if (!isLoggedIn) {
    return (
      <Button
        onClick={login}
        disabled={isLoading}
        variant="outline"
        className="flex items-center space-x-2"
      >
        <LogIn className="w-4 h-4" />
        <span>{isLoading ? t('loggingIn') : label}</span>
      </Button>
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