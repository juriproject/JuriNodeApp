const {
  getNetworkProxyContract,
  networkProxyAddress,
} = require('../config/contracts')
const { getWeb3 } = require('../config/skale')
const sendTx = require('../helpers/sendTx')

const moveToNextStage = async ({ from, key }) => {
  const web3 = getWeb3(false)
  const NetworkProxyContract = getNetworkProxyContract()

  await sendTx({
    data: NetworkProxyContract.methods.moveTimeToNextStage().encodeABI(),
    from,
    to: networkProxyAddress,
    privateKey: key,
    web3,
  })
}

module.exports = moveToNextStage
