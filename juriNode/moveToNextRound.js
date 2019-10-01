const { networkProxyAddress } = require('../config/contracts')
const parseRevertMessage = require('../helpers/parseRevertMessage')
const sendTx = require('../helpers/sendTx')

const moveToNextRound = async ({
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  NetworkProxyContract,
  nodeIndex,
  parentPort,
  web3,
}) => {
  try {
    parentPort.postMessage({ nodeIndex, movingIndex: 0 })
    await sendTx({
      data: NetworkProxyContract.methods.moveToNextRound().encodeABI(),
      from: myJuriNodeAddress,
      privateKey: myJuriNodePrivateKey,
      to: networkProxyAddress,
      web3,
    })
    parentPort.postMessage({ nodeIndex, movingIndex: 1 })
    await sendTx({
      data: NetworkProxyContract.methods.moveToNextRound().encodeABI(),
      from: myJuriNodeAddress,
      privateKey: myJuriNodePrivateKey,
      to: networkProxyAddress,
      web3,
    })

    parentPort.postMessage({ nodeIndex, movingIndex: 2 })
    await sendTx({
      data: NetworkProxyContract.methods.moveToNextRound().encodeABI(),
      from: myJuriNodeAddress,
      privateKey: myJuriNodePrivateKey,
      to: networkProxyAddress,
      web3,
    })

    parentPort.postMessage({ nodeIndex, movingIndex: 3 })
    await sendTx({
      data: NetworkProxyContract.methods.moveToNextRound().encodeABI(),
      from: myJuriNodeAddress,
      privateKey: myJuriNodePrivateKey,
      to: networkProxyAddress,
      web3,
    })

    parentPort.postMessage({ nodeIndex, movingIndex: 4 })
    await sendTx({
      data: NetworkProxyContract.methods.moveToNextRound().encodeABI(),
      from: myJuriNodeAddress,
      privateKey: myJuriNodePrivateKey,
      to: networkProxyAddress,
      web3,
    })

    parentPort.postMessage({ nodeIndex, movingIndex: 5 })
    await sendTx({
      data: NetworkProxyContract.methods.moveToNextRound().encodeABI(),
      from: myJuriNodeAddress,
      privateKey: myJuriNodePrivateKey,
      to: networkProxyAddress,
      web3,
    })
  } catch (error) {
    parentPort.postMessage({
      nodeIndex,
      MoveToNextRoundError: parseRevertMessage(error.message),
    })
  }
}

module.exports = moveToNextRound
