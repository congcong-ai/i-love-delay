import createMiddleware from 'next-intl/middleware'

const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'zh'

export default createMiddleware({
  locales: ['zh', 'en'],
  defaultLocale: defaultLocale as 'zh' | 'en',
  localePrefix: 'always'
})

export const config = {
  // 仅匹配「页面路由」，排除 api、_next 以及所有带后缀名的静态文件（如 .js/.css/.png 等）
  matcher: ['/((?!api|_next|.*\\..*).*)']
}