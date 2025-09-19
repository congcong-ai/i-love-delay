import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { AppProvider } from "@/components/providers/app-provider";
import { OnlineGuard } from "@/components/system/online-guard";
import Script from 'next/script'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  fallback: ['system-ui', 'arial']
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  fallback: ['monospace']
});

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* H5 <-> App 容器（web-view）桥接脚本：
            1) 直接加载本地 /uni.webview.1.5.5.js（Next.js 路由，返回正确 MIME）
            2) 若失败，降级加载 /uni-bridge-shim.js 提供最小 postMessage 能力 */}
        <Script id="uni-bridge-fallback" strategy="afterInteractive">
          {`
          (function(){
            function ensureBridge(){
              if (!(window.uni && typeof window.uni.postMessage === 'function')) {
                var s = document.createElement('script');
                s.src = '/uni.webview.1.5.5.js';
                s.onerror = function(){
                  var f = document.createElement('script');
                  f.src = '/uni-bridge-shim.js';
                  document.head.appendChild(f);
                };
                document.head.appendChild(s);
              }
            }
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
              ensureBridge();
            } else {
              document.addEventListener('DOMContentLoaded', ensureBridge);
            }
          })();
          `}
        </Script>
        <NextIntlClientProvider messages={messages}>
          <AppProvider>
            <div className="min-h-screen bg-gray-50">
              <OnlineGuard />
              {children}
            </div>
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}