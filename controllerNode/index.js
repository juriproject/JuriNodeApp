const { nodes } = require('../config/accounts')
const overwriteLog = require('../helpers/overwriteLog')

const runControllerRound = async () => {
  for (let i = 0; i < 6; i++) {
    await sleep(process.env.TIME_PER_STAGE + 200)

    overwriteLog('Moving stage...')
    await moveToNextStage({
      from: nodes[process.env.NODE_INDEX].address,
      key: nodes[process.env.NODE_INDEX].privateKeyBuffer,
    })
    overwriteLog('Moved stage!')
  }
}

runControllerRound()

// const TIME_PER_STAGE = 1000 * 50

module.exports = runControllerRound
