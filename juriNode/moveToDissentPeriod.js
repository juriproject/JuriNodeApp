const { networkProxyAddress } = require('../config/contracts')
const parseRevertMessage = require('../helpers/parseRevertMessage')
const sendTx = require('../helpers/sendTx')

const moveToDissentPeriod = async ({
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  NetworkProxyContract,
  nodeIndex,
  parentPort,
  web3,
}) => {
  try {
    await sendTx({
      data: NetworkProxyContract.methods.moveToDissentPeriod().encodeABI(),
      from: myJuriNodeAddress,
      privateKey: myJuriNodePrivateKey,
      to: networkProxyAddress,
      web3,
    })
  } catch (error) {
    parentPort.postMessage({
      nodeIndex,
      MoveToDissentPeriodError: parseRevertMessage(error.message),
    })
  }
}

module.exports = moveToDissentPeriod
