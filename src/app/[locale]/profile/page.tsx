'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoginButton } from '@/components/auth/login-button'
import { LanguageSelector } from '@/components/settings/language-selector'
import { BottomNav } from '@/components/layout/bottom-nav'
import { User, Settings, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useTranslations } from 'next-intl'
import { SquareActivity } from '@/components/profile/square-activity'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('account')
  const { user } = useAuthStore()
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const tAuth = useTranslations('auth')

  // Profile 页面不参与底部 Tab 高亮（避免 TabType 越界）
  useEffect(() => {
    // no-op
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-b">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center ring-1 ring-emerald-100">
              <User className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-sm text-gray-600 mt-1">{t('subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('account')}
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {t('activity')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('settings')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>{t('accountInfo')}</CardTitle>
                <CardDescription>
                  {t('accountDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{user.nickname || t('wechatUser')}</p>
                        <p className="text-sm text-gray-600">{user.openid}</p>
                        <Badge variant="secondary" className="mt-1">{tAuth('loggedIn')}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => useAuthStore.getState().logout()}
                    >
                      {t('logout')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">{t('loginToSync')}</p>
                      <LoginButton />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>{t('appSettings')}</CardTitle>
                <CardDescription>
                  {t('settingsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{tCommon('darkMode')}</h4>
                      <p className="text-sm text-gray-600">{t('themeDescription')}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      {tCommon('system')}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{t('languageSettings')}</h4>
                      <p className="text-sm text-gray-600">{t('languageDescription')}</p>
                    </div>
                    <LanguageSelector />
                  </div>

                  <div className="border-t pt-4">
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700">
                      {t('clearLocalData')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <SquareActivity />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  )
}