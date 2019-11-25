const { networkProxyAddress } = require('../config/contracts')
const sendTx = require('../helpers/sendTx')

const Web3Utils = require('web3-utils')

const sendReveals = async ({
  users,
  randomNumbers,
  wasCompliantData,
  isDissent,
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  NetworkProxyContract,
  web3,
}) => {
  const userAddresses = isDissent ? users : users.map(({ address }) => address)
  const addMethod = isDissent
    ? 'addDissentWasCompliantDataForUsers'
    : 'addWasCompliantDataForUsers'

  return sendTx({
    data: NetworkProxyContract.methods[addMethod](
      userAddresses,
      wasCompliantData,
      randomNumbers
    ).encodeABI(),
    from: myJuriNodeAddress,
    privateKey: myJuriNodePrivateKey,
    to: networkProxyAddress,
    web3,
  })
}

module.exports = sendReveals
