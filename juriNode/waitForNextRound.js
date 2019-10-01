const overwriteLog = require('../helpers/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogEnd')
const sleep = require('../helpers/sleep')

const getLeftStageTime = async NetworkProxyContract => {
  let stageIndex =
    parseInt(await NetworkProxyContract.methods.currentStage().call()) + 1
  let timeForStage = parseInt(
    await NetworkProxyContract.methods.timesForStages(stageIndex).call()
  )
  let leftRoundTime = 0

  while (timeForStage !== 0) {
    leftRoundTime += timeForStage

    stageIndex++
    timeForStage = parseInt(
      await NetworkProxyContract.methods.timesForStages(stageIndex).call()
    )
  }

  return leftRoundTime
}

const waitForNextStage = async ({
  NetworkProxyContract,
  nodeIndex,
  parentPort,
  roundIndex,
}) => {
  overwriteLog(`Waiting for next round (node ${nodeIndex})...`, parentPort)

  const leftRoundTime = await getLeftStageTime(NetworkProxyContract)
  await sleep(leftRoundTime)

  let currentRoundIndex = roundIndex

  while (currentRoundIndex === roundIndex) {
    await sleep(2000)
    currentRoundIndex = parseInt(
      await NetworkProxyContract.methods.roundIndex().call()
    )
  }

  overwriteLogEnd(
    `Waiting for next round finished (node ${nodeIndex})!`,
    parentPort
  )
}

module.exports = waitForNextStage
