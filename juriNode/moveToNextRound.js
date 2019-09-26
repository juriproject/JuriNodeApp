const {
  NetworkProxyContract,
  networkProxyAddress,
} = require('../config/contracts')
const parseRevertMessage = require('../helpers/parseRevertMessage')
const sendTx = require('../helpers/sendTx')
const { web3 } = require('../config/testing')

const sendReveals = async ({
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  nodeIndex,
}) => {
  try {
    await sendTx({
      data: NetworkProxyContract.methods.moveToNextRound().encodeABI(),
      from: myJuriNodeAddress,
      privateKey: myJuriNodePrivateKey,
      to: networkProxyAddress,
      web3,
    })
  } catch (error) {
    console.log({
      nodeIndex,
      MoveToNextRoundError: parseRevertMessage(error.message),
    })
  }
}

module.exports = sendReveals
