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

  const commitments = []
  const roundIndex = await NetworkProxyContract.methods.roundIndex().call()
  const node = myJuriNodeAddress

  for (let i = 0; i < userAddresses.length; i++) {
    const user = userAddresses[i]
    const commitment = await NetworkProxyContract.methods
      .getUserComplianceDataCommitment(roundIndex, node, user)
      .call()
    commitments.push(commitment)
  }

  const expectedCommitments = []

  for (let i = 0; i < wasCompliantData.length; i++) {
    const randomNumber = randomNumbers[i]
    const wasCompliant = wasCompliantData[i]
    const commitmentHash = Web3Utils.soliditySha3(wasCompliant, randomNumber)
    expectedCommitments.push(commitmentHash)
  }

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
