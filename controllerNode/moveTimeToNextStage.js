const {
  getNetworkProxyContract,
  networkProxyAddress,
} = require('../config/contracts')
const { getWeb3 } = require('../config/skale')
const sendTx = require('../helpers/sendTx')

const moveTimeToNextStage = async ({ from, key, isRunningOnAws }) => {
  const web3 = getWeb3({ isMain: false, isRunningOnAws })
  const NetworkProxyContract = getNetworkProxyContract()

  await sendTx({
    data: NetworkProxyContract.methods.moveTimeToNextStage().encodeABI(),
    from,
    to: networkProxyAddress,
    privateKey: key,
    web3,
  })
}

module.exports = moveTimeToNextStage
