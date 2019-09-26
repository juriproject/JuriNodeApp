const {
  NetworkProxyContract,
  networkProxyAddress,
} = require('../config/contracts')
const { web3 } = require('../config/testing')
const { controllerNode } = require('../config/accounts')

const addUserHeartRateFiles = require('../helpers/addUserHeartRateFiles')
const overwriteLog = require('../helpers/overwriteLog')
const sendTx = require('../helpers/sendTx')

const moveToNextStage = require('./moveToNextStage')

const setupProxyForNewRound = async userCount => {
  overwriteLog('Increase round index...')
  await sendTx({
    data: NetworkProxyContract.methods.debugIncreaseRoundIndex().encodeABI(),
    from: controllerNode.address,
    to: networkProxyAddress,
    privateKey: controllerNode.privateKeyBuffer,
    web3,
  })
  overwriteLog('Increased round index!')
  process.stdout.write('\n')

  await addUserHeartRateFiles(userCount)

  let currentStage = await NetworkProxyContract.methods.currentStage().call()

  overwriteLog('Moving to nodes adding commitments stage...')
  while (currentStage.toString() !== '1') {
    await moveToNextStage({
      from: controllerNode.address,
      key: controllerNode.privateKeyBuffer,
    })
    currentStage = await NetworkProxyContract.methods.currentStage().call()
  }
  overwriteLog('Moved to nodes adding commitments stage!')
  process.stdout.write('\n')
}

setupProxyForNewRound(process.env.MAX_USER_COUNT)

module.exports = setupProxyForNewRound
