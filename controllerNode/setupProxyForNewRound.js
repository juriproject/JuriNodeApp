const {
  getNetworkProxyContract,
  networkProxyAddress,
} = require('../config/contracts')
const { getWeb3 } = require('../config/skale')

const addUserHeartRateFiles = require('./addUserHeartRateFiles')
const overwriteLog = require('../helpers/overwriteLogLib/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogLib/overwriteLogEnd')
const sendTx = require('../helpers/sendTx')

const setupProxyForNewRound = async ({
  controllerAddress,
  controllerKeyBuffer,
  isUploadingFiles,
  isRunningOnAws,
  maxUserCount,
}) => {
  const NetworkProxyContract = getNetworkProxyContract()
  const web3 = getWeb3({ isMain: false, isRunningOnAws })

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
    isRunningOnAws,
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

module.exports = setupProxyForNewRound
