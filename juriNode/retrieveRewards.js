const {
  NetworkProxyContract,
  networkProxyAddress,
} = require('../config/contracts')
const { web3 } = require('../config/testing')

const sendTx = require('../helpers/sendTx')

const retrieveRewards = async ({
  JuriTokenContract,
  juriTokenAddress,
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  roundIndex,
}) => {
  /* await sendTx({
    data: JuriTokenContract.methods.retrieveRoundInflationRewards().encodeABI(),
    from: myJuriNodeAddress,
    privateKey: myJuriNodePrivateKey,
    to: juriTokenAddress,
    web3,
  }) */

  console.log({
    roundIndex: roundIndex.toString(),
    totalJuriFeesInProxyBefore: (await NetworkProxyContract.methods
      .totalJuriFees(roundIndex)
      .call()).toString(),
    totalJuriFeesAtWithdrawalTimesBefore: (await NetworkProxyContract.methods
      .totalJuriFeesAtWithdrawalTimes(roundIndex, myJuriNodeAddress)
      .call()).toString(),
  })

  await sendTx({
    data: NetworkProxyContract.methods
      .retrieveRoundJuriFees(roundIndex)
      .encodeABI(),
    from: myJuriNodeAddress,
    privateKey: myJuriNodePrivateKey,
    to: networkProxyAddress,
    web3,
  })

  console.log({
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
