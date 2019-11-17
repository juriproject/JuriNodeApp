const LOCAL_REVERT_STRING = 'VM Exception while processing transaction: revert'
const SKALE_REVERT_STRING = 'reverted by the EVM'

const parseRevertMessage = error => {
  if (
    error.indexOf(LOCAL_REVERT_STRING) === -1 &&
    error.indexOf(SKALE_REVERT_STRING) === -1
  ) {
    // unknown error, not a VM revert
    return error
  }

  try {
    if (error.indexOf(SKALE_REVERT_STRING) === -1)
      // local blockchain
      return 'REVERT: ' + error.slice(error.indexOf(LOCAL_REVERT_STRING) + 50)

    // SKALE chain
    return (
      'REVERT: ' +
      JSON.parse(error.slice(error.indexOf(SKALE_REVERT_STRING) + 20))
        .revertReason
    )
  } catch (error) {
    console.log({ error })

    return 'Parsing revert message failed, see logs for error.'
  }
}

module.exports = parseRevertMessage
