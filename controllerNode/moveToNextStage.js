const {
  NetworkProxyContract,
  networkProxyAddress,
} = require('../config/contracts')
const { web3 } = require('../config/testing')
const sendTx = require('../helpers/sendTx')

const moveToNextStage = async ({ from, key }) => {
  await sendTx({
    data: NetworkProxyContract.methods.moveToNextStage().encodeABI(),
    from,
    to: networkProxyAddress,
    privateKey: key,
    web3,
  })
}

module.exports = moveToNextStage
