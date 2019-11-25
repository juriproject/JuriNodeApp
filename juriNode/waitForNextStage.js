const moveToNextStage = require('./moveToNextStage')
const overwriteLog = require('../helpers/overwriteLogLib/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogLib/overwriteLogEnd')
const sleep = require('../helpers/sleep')
const Stages = require('../helpers/Stages')

const waitForNextStage = async ({
  NetworkProxyContract,
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  nodeIndex,
  parentPort,
  timePerStage,
  web3,
}) => {
  const currentStage = await NetworkProxyContract.methods.currentStage().call()

  overwriteLog(
    `Moving from ${Stages[currentStage]} stage (node ${nodeIndex})...`,
    parentPort
  )

  await sleep(1000)
  const lastStageUpdateBefore = parseInt(
    await NetworkProxyContract.methods.lastStageUpdate().call()
  )

  const now = Date.now() / 1000
  const timeSinceLastStageMove = now - lastStageUpdateBefore
  const timeUntilNextStage = timePerStage * 1000 - timeSinceLastStageMove
  await sleep(timeUntilNextStage)

  let lastStageUpdateAfter = parseInt(
    await NetworkProxyContract.methods.lastStageUpdate().call()
  )

  while (lastStageUpdateAfter === lastStageUpdateBefore) {
    await sleep(2000)
    lastStageUpdateAfter = parseInt(
      await NetworkProxyContract.methods.lastStageUpdate().call()
    )
  }

  await moveToNextStage({
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    web3,
  })

  overwriteLogEnd(`Move finished (node ${nodeIndex})!`, parentPort)
}

module.exports = waitForNextStage
