const parseRevertMessage = error =>
  JSON.parse(error.slice(error.indexOf('reverted by the EVM') + 20))
    .revertReason

module.exports = parseRevertMessage
