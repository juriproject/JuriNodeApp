const sleep = require('../helpers/sleep')
const { NetworkProxyContract } = require('../config/contracts')

const waitForNextStage = async () => {
  await sleep(1000)
  const currentStageBefore = parseInt(
    await NetworkProxyContract.methods.currentStage().call()
  )

  const lastStageUpdate = parseInt(
    await NetworkProxyContract.methods.lastStageUpdate().call()
  )
  const now = Date.now() / 1000
  const timeSinceLastStageMove = now - lastStageUpdate
  const timeUntilNextStage = process.env.TIME_PER_STAGE - timeSinceLastStageMove

  await sleep(timeUntilNextStage + 2000)

  let currentStageAfter = parseInt(
    await NetworkProxyContract.methods.currentStage().call()
  )

  while (currentStageAfter === currentStageBefore) {
    await sleep(2000)
    currentStageAfter = parseInt(
      await NetworkProxyContract.methods.currentStage().call()
    )
  }
}

module.exports = waitForNextStage
