export const config = {
  env: process.env.NEXT_PUBLIC_ENV || 'development',
  isDevelopment: process.env.NEXT_PUBLIC_ENV === 'development',
  isProduction: process.env.NEXT_PUBLIC_ENV === 'production',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'i love delay',
    url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
} as const;