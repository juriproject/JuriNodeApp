const {
  OVERWRITE_START_MSG,
  OVERWRITE_END_MSG,
} = require('../../helpers/overwriteLogLib/overwriteLogConstants')

const parseMessage = ({ msg, outputWriteStream }) => {
  const modifiedMsg = typeof msg === 'string' ? msg : JSON.stringify(msg)

  if (modifiedMsg.startsWith(OVERWRITE_START_MSG)) {
    outputWriteStream.write(modifiedMsg.substr(OVERWRITE_START_MSG.length))
    return
  }

  if (modifiedMsg.startsWith(OVERWRITE_END_MSG)) {
    // readline.clearLine(outputWriteStream, 0)
    // readline.cursorTo(outputWriteStream, 0)
    // doesnt work :( requires tty stream

    outputWriteStream.write(modifiedMsg.substr(OVERWRITE_END_MSG.length) + '\n')
    return
  }

  outputWriteStream.write(modifiedMsg + '\n')
}

module.exports = parseMessage
