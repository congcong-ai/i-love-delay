'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SyncStatus } from '@/components/sync/sync-status'
import { LoginButton } from '@/components/auth/login-button'
import { User, Settings, Cloud, Clock } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('account')
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">我的</h1>
          <p className="text-sm text-gray-600 mt-1">管理账户和同步设置</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              账户
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              数据同步
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              设置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>账户信息</CardTitle>
                <CardDescription>
                  管理您的账户和登录状态
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
                        <p className="font-medium">{user.nickname || '微信用户'}</p>
                        <p className="text-sm text-gray-600">{user.openid}</p>
                        <Badge variant="secondary" className="mt-1">已登录</Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      退出登录
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">登录后享受云端同步功能</p>
                      <LoginButton />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync">
            <Card>
              <CardHeader>
                <CardTitle>数据同步</CardTitle>
                <CardDescription>
                  管理您的数据同步状态和设置
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SyncStatus />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">自动同步</h4>
                      <p className="text-sm text-gray-600">网络恢复时自动同步数据</p>
                    </div>
                    <Button variant="outline" size="sm">
                      立即同步
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">同步统计</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">总任务数</p>
                        <p className="font-medium">--</p>
                      </div>
                      <div>
                        <p className="text-gray-600">同步次数</p>
                        <p className="font-medium">--</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>应用设置</CardTitle>
                <CardDescription>
                  个性化您的应用体验
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">深色模式</h4>
                      <p className="text-sm text-gray-600">切换应用主题</p>
                    </div>
                    <Button variant="outline" size="sm">
                      跟随系统
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">语言设置</h4>
                      <p className="text-sm text-gray-600">选择应用语言</p>
                    </div>
                    <Button variant="outline" size="sm">
                      简体中文
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700">
                      清除本地数据
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}