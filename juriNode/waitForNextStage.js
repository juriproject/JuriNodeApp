const overwriteLog = require('../helpers/overwriteLogLib/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogLib/overwriteLogEnd')
const sleep = require('../helpers/sleep')

const waitForNextStage = async ({
  NetworkProxyContract,
  nodeIndex,
  parentPort,
  timePerStage,
}) => {
  overwriteLog(`Waiting for next stage (node ${nodeIndex})... `, parentPort)

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

  overwriteLogEnd(
    `Waiting for next stage finished (node ${nodeIndex})!`,
    parentPort
  )
}

module.exports = waitForNextStage
