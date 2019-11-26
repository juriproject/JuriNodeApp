const sendCommitments = require('./sendCommitments')
const sendReveals = require('./sendReveals')
const waitForNextStage = require('./waitForNextStage')

const overwriteLog = require('../helpers/overwriteLogLib/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogLib/overwriteLogEnd')

const runDissentRound = async ({
  dissentedUsers,
  isSendingResults,
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  NetworkProxyContract,
  nodeIndex,
  parentPort,
  timePerStage,
  wasCompliantData,
  web3,
}) => {
  let randomNumbers

  // STAGE 5.1
  if (isSendingResults) {
    overwriteLog(
      `Sending dissent commitments... (node ${nodeIndex})`,
      parentPort
    )
    randomNumbers = (
      await sendCommitments({
        users: dissentedUsers,
        isDissent: true,
        myJuriNodeAddress,
        myJuriNodePrivateKey,
        NetworkProxyContract,
        nodeIndex,
        parentPort,
        wasCompliantData,
        web3,
      })
    ).randomNumbers
    overwriteLogEnd(`Sent dissent commitments (node ${nodeIndex})!`, parentPort)
  }

  await waitForNextStage({
    NetworkProxyContract,
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    nodeIndex,
    parentPort,
    timePerStage,
    web3,
  })

  // STAGE 5.2
  if (isSendingResults) {
    overwriteLog(`Sending dissent reveals... (node ${nodeIndex})`, parentPort)
    await sendReveals({
      users: dissentedUsers,
      randomNumbers,
      wasCompliantData,
      isDissent: true,
      myJuriNodeAddress,
      myJuriNodePrivateKey,
      NetworkProxyContract,
      nodeIndex,
      parentPort,
      web3,
    })
    overwriteLogEnd(`Dissent reveals sent (node ${nodeIndex})!`, parentPort)
  }

  await waitForNextStage({
    NetworkProxyContract,
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    nodeIndex,
    parentPort,
    timePerStage,
    web3,
  })
}

module.exports = runDissentRound
