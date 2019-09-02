const overwriteLog = msg => {
  try {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
  } catch (error) {
    process.stdout.write('\n')
  }

  process.stdout.write(msg)
}

module.exports = overwriteLog
