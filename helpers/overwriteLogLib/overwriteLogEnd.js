const { OVERWRITE_END_MSG } = require('./overwriteLogConstants')

const overwriteLogEnd = (msg, parentPort) => {
  if (parentPort) {
    parentPort.postMessage(OVERWRITE_END_MSG + msg)
    return
  }

  try {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
  } catch (error) {
    process.stdout.write('\n')
  }

  process.stdout.write(msg)
  process.stdout.write('\n')
}

module.exports = overwriteLogEnd
