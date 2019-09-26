const {
  NetworkProxyContract,
  networkProxyAddress,
} = require('../config/contracts')
const { web3 } = require('../config/testing')

const sendTx = require('../helpers/sendTx')

const sendReveals = ({
  users,
  randomNumbers,
  wasCompliantData,
  isDissent,
  myJuriNodeAddress,
  myJuriNodePrivateKey,
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
