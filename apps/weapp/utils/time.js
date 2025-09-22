function pad(n){ return n<10?'0'+n:String(n) }
function formatDate(ts){
  const d = new Date(typeof ts==='number'?ts:Date.parse(ts))
  const y=d.getFullYear(), m=d.getMonth()+1, day=d.getDate()
  const h=d.getHours(), min=d.getMinutes()
  return `${y}-${pad(m)}-${pad(day)} ${pad(h)}:${pad(min)}`
}
function timeAgo(ts){
  const t = typeof ts==='number'?ts:Date.parse(ts)
  const diff = Date.now()-t
  const s=Math.floor(diff/1000)
  if (s<60) return '刚刚'
  const m=Math.floor(s/60)
  if (m<60) return `${m} 分钟前`
  const h=Math.floor(m/60)
  if (h<24) return `${h} 小时前`
  const d=Math.floor(h/24)
  return `${d} 天前`
}
module.exports = { formatDate, timeAgo }
