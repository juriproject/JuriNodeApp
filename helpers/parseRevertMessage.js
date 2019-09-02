const parseRevertMessage = error => {
  try {
    if (error.indexOf('reverted by the EVM') === -1)
      // local blockchain
      return error.slice(
        error.indexOf('VM Exception while processing transaction: revert') + 50
      )

    // SKALE chain
    return JSON.parse(error.slice(error.indexOf('reverted by the EVM') + 20))
      .revertReason
  } catch (error) {
    console.log({ error })

    return 'Parsing revert message failed, see logs for error.'
  }
}

module.exports = parseRevertMessage
