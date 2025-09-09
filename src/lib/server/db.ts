import { Pool } from 'pg'

// 全局复用连接池，避免热重载导致的多连接泄漏
// 参考 Next.js 推荐做法，将实例挂载到 globalThis
let _pool: Pool

type GlobalWithPg = typeof globalThis & { __pgPool?: Pool }
const g = globalThis as GlobalWithPg

export function getPgPool() {
  if (!g.__pgPool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('缺少环境变量 DATABASE_URL')
    }

    const sslMode = (process.env.PGSSLMODE || '').toLowerCase()
    const useSSL = sslMode === 'require' || sslMode === 'prefer'

    g.__pgPool = new Pool({
      connectionString,
      ssl: useSSL ? { rejectUnauthorized: false } : undefined,
      // 适度控制最大连接数，避免服务器资源紧张
      max: Number(process.env.PG_POOL_MAX || 10),
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT || 30_000),
      connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT || 10_000),
    })
  }
  _pool = g.__pgPool
  return _pool
}

export async function query<T = any>(text: string, params?: any[]) {
  const pool = getPgPool()
  const result = await pool.query<T>(text, params)
  return result
}
