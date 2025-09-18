export const runtime = 'nodejs'

import { readFile } from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'uni.webview.1.5.5.js')
    const code = await readFile(filePath, 'utf-8')
    return new Response(code, {
      status: 200,
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (e) {
    return new Response('// Not Found', {
      status: 404,
      headers: { 'content-type': 'application/javascript; charset=utf-8' }
    })
  }
}
