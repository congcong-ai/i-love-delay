#!/usr/bin/env node
/*
  将根目录 messages/*.json 同步到 apps/weapp/shared/messages/
  使用：npm run sync:shared
*/
const fs = require('fs')
const path = require('path')

const root = process.cwd()
const srcDir = path.join(root, 'messages')
const destDir = path.join(root, 'apps', 'weapp', 'shared', 'messages')

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function copyFile(src, dest) {
  const data = fs.readFileSync(src)
  fs.writeFileSync(dest, data)
  console.log(`[sync-shared] copied: ${path.relative(root, src)} -> ${path.relative(root, dest)}`)
}

function main() {
  ensureDir(destDir)
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.json'))
  if (!files.length) {
    console.warn('[sync-shared] no json files found in messages/')
    return
  }
  for (const f of files) {
    const src = path.join(srcDir, f)
    const dest = path.join(destDir, f)
    copyFile(src, dest)
  }
  console.log('[sync-shared] done')
}

main()
