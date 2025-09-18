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
            1) 优先加载官方 CDN 版本
            2) 如 CDN 不可用，尝试加载本地备份 /uni.webview.1.5.5.js
            3) 若仍失败，加载本地 shim 以提供最小可用的 postMessage 能力 */}
        <Script
          src="https://raw.gitcode.com/dcloud/hello-uni-app-x/raw/alpha/hybrid/html/uni.webview.1.5.5.js"
          strategy="afterInteractive"
        />
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