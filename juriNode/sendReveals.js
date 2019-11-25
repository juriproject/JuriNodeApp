const { networkProxyAddress } = require('../config/contracts')
const { getArrayChunks } = require('../helpers/getArrayChunks')
const sendTx = require('../helpers/sendTx')

const sendReveals = async ({
  users,
  randomNumbers,
  wasCompliantData,
  isDissent,
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  NetworkProxyContract,
  parentPort,
  web3,
}) => {
  const userAddresses = isDissent ? users : users.map(({ address }) => address)
  const addMethod = isDissent
    ? 'addDissentWasCompliantDataForUsers'
    : 'addWasCompliantDataForUsers'

  const splitUserAddresses = getArrayChunks(userAddresses)
  const splitWasCompliantData = getArrayChunks(wasCompliantData)
  const splitRandomNumbers = getArrayChunks(randomNumbers)

  parentPort.postMessage({
    userAddresses,
    wasCompliantData,
    randomNumbers,
    splitUserAddresses,
    splitWasCompliantData,
    splitRandomNumbers,
  })

  for (let i = 0; i < splitUserAddresses.length; i++) {
    await sendTx({
      data: NetworkProxyContract.methods[addMethod](
        splitUserAddresses[i],
        splitWasCompliantData[i],
        splitRandomNumbers[i]
      ).encodeABI(),
      from: myJuriNodeAddress,
      privateKey: myJuriNodePrivateKey,
      to: networkProxyAddress,
      web3,
    })
  }
}

module.exports = sendReveals
