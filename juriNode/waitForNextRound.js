const overwriteLog = require('../helpers/overwriteLogLib/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogLib/overwriteLogEnd')
const sleep = require('../helpers/sleep')

const Stages = require('../helpers/Stages')

const waitForNextRound = async ({
  NetworkProxyContract,
  nodeIndex,
  parentPort,
  roundIndex,
}) => {
  overwriteLog(`Waiting for next round (node ${nodeIndex})...`, parentPort)

  let currentRoundIndex = roundIndex
  while (currentRoundIndex === roundIndex) {
    await sleep(4000)
    currentRoundIndex = parseInt(
      await NetworkProxyContract.methods.roundIndex().call()
    )
  }

  let currentStage = '0'
  while (Stages[currentStage] === 'USER_ADDING_HEART_RATE_DATA') {
    await sleep(4000)
    currentStage = await NetworkProxyContract.methods.currentStage().call()
  }

  overwriteLogEnd(
    `Waiting for next round finished (node ${nodeIndex})!`,
    parentPort
  )
}

module.exports = waitForNextRound
