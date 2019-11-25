const { networkProxyAddress } = require('../config/contracts')

const parseRevertMessage = require('../helpers/parseRevertMessage')
const overwriteLog = require('../helpers/overwriteLogLib/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogLib/overwriteLogEnd')
const sendTx = require('../helpers/sendTx')

const checkForInvalidAnswers = async ({
  bondingAddress,
  roundIndex,
  users,
  isSendingIncorrectDissent,
  wasCompliantData,
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  NetworkProxyContract,
  nodeIndex,
  parentPort,
  web3,
}) => {
  const usersToDissent = []

  for (let i = 0; i < users.length; i++) {
    const { address } = users[i]

    const acceptedAnswer = await NetworkProxyContract.methods
      .getUserComplianceData(roundIndex, address)
      .call({ from: bondingAddress })
    const wasAssignedToUser = await NetworkProxyContract.methods
      .getWasAssignedToUser(roundIndex, myJuriNodeAddress, address)
      .call()
    const isDissented = await NetworkProxyContract.methods
      .getDissented(roundIndex, address)
      .call()

    if (
      (wasAssignedToUser && isSendingIncorrectDissent) ||
      (wasAssignedToUser &&
        parseInt(acceptedAnswer) >= 0 !== wasCompliantData[i] &&
        !isDissented)
      // '= 0' because 0 is considered a compliant user (when in doubt, give user the benefit)
    ) {
      usersToDissent.push(address)
    }
  }

  if (usersToDissent.length > 0)
    try {
      overwriteLog(
        `Sending dissent for users... (node ${nodeIndex})`,
        parentPort
      )
      await sendTx({
        data: NetworkProxyContract.methods
          .dissentToAcceptedAnswers(usersToDissent)
          .encodeABI(),
        from: myJuriNodeAddress,
        privateKey: myJuriNodePrivateKey,
        to: networkProxyAddress,
        web3,
      })
      overwriteLogEnd(
        `Sending dissent for users was successful (node ${nodeIndex})!`,
        parentPort
      )
    } catch (error) {
      overwriteLogEnd(
        `Sending dissent for users failed (node ${nodeIndex})!`,
        parentPort
      )
      parentPort.postMessage({
        nodeIndex,
        DissentError: parseRevertMessage(error.message),
      })
    }
}

module.exports = checkForInvalidAnswers
