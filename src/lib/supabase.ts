import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

// 检查是否为开发环境且使用占位符配置
const isDevWithPlaceholders =
    process.env.NODE_ENV === 'development' &&
    (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder'))

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // 在开发环境下禁用自动认证相关功能
        autoRefreshToken: !isDevWithPlaceholders,
        persistSession: !isDevWithPlaceholders,
        detectSessionInUrl: !isDevWithPlaceholders
    }
})

// 开发环境下的安全检查
export const isSupabaseConfigured = !isDevWithPlaceholders