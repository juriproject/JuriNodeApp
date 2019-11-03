const moveToSlashingPeriod = require('./moveToSlashingPeriod')
const sendCommitments = require('./sendCommitments')
const sendReveals = require('./sendReveals')
const waitForNextStage = require('./waitForNextStage')

const overwriteLog = require('../helpers/overwriteLogLib/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogLib/overwriteLogEnd')
const Stages = require('../helpers/Stages')

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
    randomNumbers = (await sendCommitments({
      users: dissentedUsers,
      isDissent: true,
      myJuriNodeAddress,
      myJuriNodePrivateKey,
      NetworkProxyContract,
      nodeIndex,
      wasCompliantData,
      web3,
    })).randomNumbers
    overwriteLogEnd(`Sent dissent commitments (node ${nodeIndex})!`, parentPort)
  }

  const currentStage0 = await NetworkProxyContract.methods.currentStage().call()
  overwriteLogEnd(`Current Stage = ${Stages[currentStage0]}`, parentPort)

  await waitForNextStage({
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    timePerStage,
  })

  // STAGE 5.2
  if (isSendingResults) {
    parentPort.postMessage({
      nodeIndex,
      dissentWasCompliantData: wasCompliantData,
    })

    overwriteLog(`Sending dissent reveals... (node ${nodeIndex})`, parentPort)
    await sendReveals({
      users: dissentedUsers,
      randomNumbers,
      wasCompliantData,
      isDissent: true,
      myJuriNodeAddress,
      myJuriNodePrivateKey,
      NetworkProxyContract,
      web3,
    })
    overwriteLogEnd(`Dissent reveals sent (node ${nodeIndex})!`, parentPort)
  }

  const currentStage1 = await NetworkProxyContract.methods.currentStage().call()
  overwriteLogEnd(`Current Stage = ${Stages[currentStage1]}`, parentPort)

  await waitForNextStage({
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    timePerStage,
  })

  overwriteLog(`Moving to slashing period (node ${nodeIndex})...`, parentPort)
  await moveToSlashingPeriod({
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    web3,
  })
  overwriteLogEnd(`Moved to slashing period (node ${nodeIndex})!`, parentPort)

  const currentStage2 = await NetworkProxyContract.methods.currentStage().call()
  overwriteLogEnd(`Current Stage = ${Stages[currentStage2]}`, parentPort)
}

module.exports = runDissentRound
