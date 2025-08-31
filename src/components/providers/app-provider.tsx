'use client'

import { useEffect } from 'react'
import { initDatabase } from '@/lib/db'

export function AppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initDatabase()
  }, [])

  return <>{children}</>
}