import jwt, { type SignOptions, type Secret } from 'jsonwebtoken'
import { query } from '@/lib/server/db'

export type Provider = 'wechat' | 'huawei' | 'wechat-mini'

export interface UserProfile {
  id: string
  displayName: string
  avatarUrl?: string
}

const TOKEN_EXPIRES_IN: SignOptions['expiresIn'] = (process.env.AUTH_TOKEN_EXPIRES_IN as any) || '30d'
const JWT_SECRET: Secret = (process.env.AUTH_JWT_SECRET as Secret) || 'CHANGE_ME_DEV_ONLY'

// 简单的“存在即创建”方案，避免单独迁移脚本：
// 在首次调用时创建用户与身份映射表。
async function ensureAuthTables() {
  // 确保 pgcrypto 可用（提供 gen_random_uuid）；若无权限则忽略
  try {
    await query('CREATE EXTENSION IF NOT EXISTS pgcrypto;')
  } catch (_) {}
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      display_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  await query(`
    CREATE TABLE IF NOT EXISTS user_identities (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_user_id TEXT NOT NULL,
      union_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(provider, provider_user_id)
    );
  `)
}

export async function getOrCreateUserByIdentity(params: {
  provider: Provider
  providerUserId: string
  unionId?: string | null
  displayName?: string | null
  avatarUrl?: string | null
}): Promise<UserProfile> {
  await ensureAuthTables()

  // 查找是否已有该身份
  const found = await query<{ user_id: string }>(
    'SELECT user_id FROM user_identities WHERE provider=$1 AND provider_user_id=$2 LIMIT 1',
    [params.provider, params.providerUserId]
  )

  let userId: string
  if (found.rowCount && found.rows[0]?.user_id) {
    userId = found.rows[0].user_id
  } else {
    // 创建用户
    const created = await query<{ id: string }>(
      'INSERT INTO users(display_name, avatar_url) VALUES($1,$2) RETURNING id',
      [params.displayName || '用户', params.avatarUrl || null]
    )
    userId = created.rows[0].id

    // 绑定身份
    await query(
      'INSERT INTO user_identities(user_id, provider, provider_user_id, union_id) VALUES($1,$2,$3,$4)',
      [userId, params.provider, params.providerUserId, params.unionId || null]
    )
  }

  // 取最新 profile
  const profile = await query<UserProfile>(
    'SELECT id, display_name as "displayName", avatar_url as "avatarUrl" FROM users WHERE id=$1 LIMIT 1',
    [userId]
  )
  return profile.rows[0]
}

export function signAppToken(payload: { sub: string; provider: Provider; pid: string }) {
  const options: SignOptions = { expiresIn: TOKEN_EXPIRES_IN }
  return jwt.sign(payload, JWT_SECRET, options)
}

export function verifyAppToken(token: string): { sub: string; provider: Provider; pid: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch (e) {
    return null
  }
}
