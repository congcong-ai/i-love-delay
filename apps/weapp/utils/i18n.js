const zh = require('../shared/messages/zh.js')
const en = require('../shared/messages/en.js')

const LOCALE_KEY = 'iLoveDelay_locale'

function getSysLanguage() {
  try {
    if (typeof wx !== 'undefined' && wx.getAppBaseInfo) {
      const base = wx.getAppBaseInfo()
      if (base && base.language) return base.language
    }
  } catch {}
  // 无法获取则直接返回 zh，避免调用已废弃接口产生警告
  return 'zh'
}

function getLocale() {
  const saved = wx.getStorageSync(LOCALE_KEY)
  if (saved) return saved
  // 默认跟随系统：简体中文/英文
  const sys = (getSysLanguage() || 'zh').toLowerCase()
  if (sys.startsWith('zh')) return 'zh'
  return 'en'
}

function setLocale(locale) {
  wx.setStorageSync(LOCALE_KEY, locale)
}

function getMessages(locale) {
  return locale === 'en' ? en : zh
}

function deepGet(obj, path) {
  const parts = path.split('.')
  let cur = obj
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return undefined
    cur = cur[p]
  }
  return cur
}

function format(str, params) {
  if (!params) return str
  return String(str).replace(/\{(\w+)\}/g, (_, k) => {
    return params[k] != null ? params[k] : `{${k}}`
  })
}

function t(key, params) {
  // key 形如: 'tasks.title' / 'delayed.stats' / 'profile.activityAll'
  const locale = getLocale()
  const messages = getMessages(locale)
  const val = deepGet(messages, key)
  if (typeof val === 'string') return format(val, params)
  return key // 找不到则返回 key，便于排查
}

module.exports = { getLocale, setLocale, t }
