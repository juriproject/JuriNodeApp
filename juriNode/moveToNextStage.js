const { networkProxyAddress } = require('../config/contracts')
const parseRevertMessage = require('../helpers/parseRevertMessage')
const sendTx = require('../helpers/sendTx')

const moveToNextStage = async ({
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  NetworkProxyContract,
  nodeIndex,
  parentPort,
  web3,
}) => {
  try {
    await sendTx({
      data: NetworkProxyContract.methods.moveToNextStage().encodeABI(),
      from: myJuriNodeAddress,
      privateKey: myJuriNodePrivateKey,
      to: networkProxyAddress,
      web3,
    })
  } catch (error) {
    parentPort.postMessage({
      nodeIndex,
      MoveToNextStageError: parseRevertMessage(error.message),
    })
  }
}

module.exports = moveToNextStage
