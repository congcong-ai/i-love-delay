'use client'


import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Clock, Users, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: '任务',
    href: '/',
    icon: ClipboardList,
  },
  {
    name: '拖延',
    href: '/delayed',
    icon: Clock,
  },
  {
    name: '广场',
    href: '/square',
    icon: Users,
  },
  {
    name: '暴走',
    href: '/rage',
    icon: Zap,
  },
]

export function BottomNav() {
  const pathname = usePathname()

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