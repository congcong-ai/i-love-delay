const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development'

export const config = {
  env,
  isDevelopment: env === 'development',
  isProduction: env === 'production',
  apiUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'i love delay',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
} as const;