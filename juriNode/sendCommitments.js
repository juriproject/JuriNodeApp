const crypto = require('crypto')
const Web3Utils = require('web3-utils')

const { networkProxyAddress } = require('../config/contracts')

const parseRevertMessage = require('../helpers/parseRevertMessage')
const sendTx = require('../helpers/sendTx')

const sendCommitments = async ({
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  nodeIndex,
  NetworkProxyContract,
  parentPort,
  users,
  isDissent,
  wasCompliantData,
  web3,
}) => {
  const userAddresses = []
  const wasCompliantDataCommitments = []
  const flatProofIndices = []
  const proofIndicesCutoffs = []
  const randomNumbers = []

  let lastCutoffIndex = 0

  for (let i = 0; i < users.length; i++) {
    const { address, proofIndices } = users[i]

    // TODO
    /* const heartRateData = await downloadHeartRateData(address)
      const wasCompliant = verifyHeartRateData(heartRateData) */

    const wasCompliant = wasCompliantData[i]
    const randomNumber = '0x' + crypto.randomBytes(32).toString('hex')
    const commitmentHash = Web3Utils.soliditySha3(wasCompliant, randomNumber)
    const currentCutoffIndex = lastCutoffIndex + proofIndices.length

    userAddresses.push(isDissent ? users[i] : address)
    wasCompliantDataCommitments.push(commitmentHash)
    flatProofIndices.push(...proofIndices)
    randomNumbers.push(randomNumber)

    if (i < users.length - 1) {
      proofIndicesCutoffs.push(currentCutoffIndex)
      lastCutoffIndex = currentCutoffIndex
    }
  }

  const addMethod = isDissent
    ? 'addDissentWasCompliantDataCommitmentsForUsers'
    : 'addWasCompliantDataCommitmentsForUsers'
  const addMethodInput = isDissent
    ? [userAddresses, wasCompliantDataCommitments]
    : [
        userAddresses,
        wasCompliantDataCommitments,
        flatProofIndices,
        proofIndicesCutoffs,
      ]

  try {
    await sendTx({
      data: NetworkProxyContract.methods[addMethod](
        ...addMethodInput
      ).encodeABI(),
      from: myJuriNodeAddress,
      privateKey: myJuriNodePrivateKey,
      to: networkProxyAddress,
      web3,
    })
  } catch (error) {
    parentPort.postMessage({
      nodeIndex,
      SendCommitmentError: parseRevertMessage(error.message),
    })
  }

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

  return { randomNumbers }
}

module.exports = sendCommitments
