function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
}
function uuidv4() {
  return (
    s4() + s4() + '-' +
    s4() + '-' +
    s4() + '-' +
    s4() + '-' +
    s4() + s4() + s4()
  )
}
module.exports = { v4: uuidv4 }
