const {
  getNetworkProxyContract,
  networkProxyAddress,
} = require('../config/contracts')
const { getWeb3 } = require('../config/skale')

const addUserHeartRateFiles = require('./addUserHeartRateFiles')
const overwriteLog = require('../helpers/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogEnd')
const sendTx = require('../helpers/sendTx')

const setupProxyForNewRound = async ({
  controllerAddress,
  controllerKeyBuffer,
  isUploadingFiles,
  maxUserCount,
}) => {
  const NetworkProxyContract = getNetworkProxyContract()
  const web3 = getWeb3(false)

  overwriteLog('Increase round index...')
  await sendTx({
    data: NetworkProxyContract.methods.debugIncreaseRoundIndex().encodeABI(),
    from: controllerAddress,
    to: networkProxyAddress,
    privateKey: controllerKeyBuffer,
    web3,
  })
  overwriteLogEnd('Increased round index!')

  await addUserHeartRateFiles({
    controllerAddress,
    controllerKeyBuffer,
    isUploadingFiles,
    maxUserCount,
  })

  overwriteLog('Moving to nodes adding commitments stage...')
  await sendTx({
    data: NetworkProxyContract.methods
      .moveToAddingCommitmentStage()
      .encodeABI(),
    from: controllerAddress,
    privateKey: controllerKeyBuffer,
    to: networkProxyAddress,
    web3,
  })

  overwriteLogEnd('Moved to nodes adding commitments stage!')
}

/* setupProxyForNewRound({
  isUploadingFiles: process.env.IS_UPLOADING_FILES === 'true',
  maxUserCount: process.env.MAX_USER_COUNT,
}) */

module.exports = setupProxyForNewRound
