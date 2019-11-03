const {
  OVERWRITE_START_MSG,
  OVERWRITE_END_MSG,
} = require('./overwriteLogConstants')

const printOverwriteLog = msg => {
  const removedStartPrefixMsg = msg.startsWith(OVERWRITE_START_MSG)
    ? msg.substr(OVERWRITE_START_MSG.length) + '\n'
    : msg
  const removedEndPrefixMsg = msg.startsWith(OVERWRITE_END_MSG)
    ? msg.substr(OVERWRITE_END_MSG.length) + '\n'
    : removedStartPrefixMsg

  console.log(removedEndPrefixMsg)
}

module.exports = printOverwriteLog
