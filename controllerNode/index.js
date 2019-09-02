const { controllerNode } = require('../config/accounts')

const overwriteLog = require('../helpers/overwriteLog')
const sleep = require('../helpers/sleep')

const moveToNextStage = require('./moveToNextStage')

const runControllerRound = async () => {
  for (let i = 0; i < 6; i++) {
    await sleep(parseInt(process.env.TIME_PER_STAGE) + 200)

    overwriteLog('Moving stage...')
    await moveToNextStage({
      from: controllerNode.address,
      key: controllerNode.privateKeyBuffer,
    })
    overwriteLog('Moved stage!')
  }
}

runControllerRound()

// const TIME_PER_STAGE = 1000 * 50

module.exports = runControllerRound
