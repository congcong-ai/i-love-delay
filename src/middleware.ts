import createMiddleware from 'next-intl/middleware'

const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'zh'

export default createMiddleware({
  locales: ['zh', 'en'],
  defaultLocale: defaultLocale as 'zh' | 'en',
  localePrefix: 'always'
})

export const config = {
  matcher: [
    '/',
    '/(zh|en)/:path*'
  ]
}