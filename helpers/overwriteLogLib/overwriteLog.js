const { OVERWRITE_START_MSG } = require('./overwriteLogConstants')

const overwriteLog = (msg, parentPort) => {
  if (parentPort) {
    parentPort.postMessage(OVERWRITE_START_MSG + msg)
    return
  }

  try {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
  } catch (error) {
    process.stdout.write('\n')
  }

  process.stdout.write(msg)
}

module.exports = overwriteLog
