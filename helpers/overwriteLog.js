const overwriteLog = msg => {
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(msg)
}

module.exports = overwriteLog
