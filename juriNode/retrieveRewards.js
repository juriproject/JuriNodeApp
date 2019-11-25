const { networkProxyAddress } = require('../config/contracts')

const parseRevertMessage = require('../helpers/parseRevertMessage')
const sendTx = require('../helpers/sendTx')

const retrieveRewards = async ({
  JuriTokenContract,
  juriTokenAddress,
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  NetworkProxyContract,
  parentPort,
  roundIndex,
  web3,
}) => {
  /* await sendTx({
    data: JuriTokenContract.methods.retrieveRoundInflationRewards().encodeABI(),
    from: myJuriNodeAddress,
    privateKey: myJuriNodePrivateKey,
    to: juriTokenAddress,
    web3,
  }) */

  parentPort.postMessage({
    roundIndex: roundIndex.toString(),
    totalJuriFeesInProxyBefore: (await NetworkProxyContract.methods
      .totalJuriFees(roundIndex)
      .call()).toString(),
    totalJuriFeesAtWithdrawalTimesBefore: (await NetworkProxyContract.methods
      .totalJuriFeesAtWithdrawalTimes(roundIndex, myJuriNodeAddress)
      .call()).toString(),
  })

  try {
    await sendTx({
      data: NetworkProxyContract.methods
        .retrieveRoundJuriFees(roundIndex)
        .encodeABI(),
      from: myJuriNodeAddress,
      privateKey: myJuriNodePrivateKey,
      to: networkProxyAddress,
      web3,
    })
  } catch (error) {
    parentPort.postMessage({
      RetrieveRewardsError: parseRevertMessage(error.message),
    })
  }

  parentPort.postMessage({
    roundIndex: roundIndex.toString(),
    totalJuriFeesInProxyAfter: (await NetworkProxyContract.methods
      .totalJuriFees(roundIndex)
      .call()).toString(),
    totalJuriFeesAtWithdrawalTimesAfter: (await NetworkProxyContract.methods
      .totalJuriFeesAtWithdrawalTimes(roundIndex, myJuriNodeAddress)
      .call()).toString(),
  })
}

module.exports = retrieveRewards
