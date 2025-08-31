'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/lib/i18n/config'
import { ClipboardList, Clock, Users, Zap, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('navigation')

  const navigation = [
    {
      name: t('home'),
      href: '/',
      icon: ClipboardList,
    },
    {
      name: t('delayed'),
      href: '/delayed',
      icon: Clock,
    },
    {
      name: t('square'),
      href: '/square',
      icon: Users,
    },
    {
      name: t('rage'),
      href: '/rage',
      icon: Zap,
    },
    {
      name: t('profile'),
      href: '/profile',
      icon: User,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full text-sm transition-colors',
                isActive
                  ? 'text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <item.icon className="h-5 w-5 mb-0.5" />
              <span className="text-xs">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}