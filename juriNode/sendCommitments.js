const crypto = require('crypto')
const Web3Utils = require('web3-utils')

const { networkProxyAddress } = require('../config/contracts')

const parseRevertMessage = require('../helpers/parseRevertMessage')
const sendTx = require('../helpers/sendTx')

const COMMITMENT_CHUNK_LENGTH = 20

const arrayChunks = (array, chunk_size) =>
  Array(Math.ceil(array.length / chunk_size))
    .fill()
    .map((_, index) => index * chunk_size)
    .map(begin => array.slice(begin, begin + chunk_size))

const getSplitFlatProofIndices = flatProofIndices => {
  const splitFlatProofIndices = arrayChunks(
    flatProofIndices,
    COMMITMENT_CHUNK_LENGTH
  )

  return splitFlatProofIndices
}

const getSplitProofIndicesCutoffs = ({
  proofIndicesCutoffs,
  splitFlatProofIndices,
}) => {
  const splitProofIndicesCutoffs = [[]]

  for (let index = 0; index < proofIndicesCutoffs.length; index++) {
    const chunkIndex = splitProofIndicesCutoffs.length - 1
    const proofIndicesCutoff = proofIndicesCutoffs[index]
    const mappedProofIndex =
      proofIndicesCutoff - chunkIndex * COMMITMENT_CHUNK_LENGTH

    if (
      proofIndicesCutoff <
      COMMITMENT_CHUNK_LENGTH + chunkIndex * COMMITMENT_CHUNK_LENGTH
    )
      splitProofIndicesCutoffs[chunkIndex].push(mappedProofIndex)
    else
      splitProofIndicesCutoffs.push([
        mappedProofIndex - COMMITMENT_CHUNK_LENGTH,
      ])
  }

  if (splitProofIndicesCutoffs.length < splitFlatProofIndices.length)
    splitProofIndicesCutoffs.push([]) // then last one has no proofIndicesCutoffs

  return splitProofIndicesCutoffs
}

const getSplitItemsAtIndexes = ({
  currentIndex,
  proofIndicesCutoffs,
  usedProofIndexCount,
  items,
}) => {
  const firstProofIndexCutoff = proofIndicesCutoffs[0]
  const userCountAtIndex =
    firstProofIndexCutoff === 0
      ? proofIndicesCutoffs.length
      : proofIndicesCutoffs.length + 1

  let firstSplitUserIndex = usedProofIndexCount
  let lastSplitUserIndex = usedProofIndexCount + userCountAtIndex

  if (currentIndex !== 0 && firstProofIndexCutoff !== 0) {
    // shift one user to the left -> use last user twice
    firstSplitUserIndex--
    lastSplitUserIndex--
  }

  const itemsAtIndex = items.slice(firstSplitUserIndex, lastSplitUserIndex)

  return { itemsAtIndex, lastSplitUserIndex }
}

const getSplitUsers = ({ splitProofIndicesCutoffs, users }) => {
  let usedProofIndexCount = 0

  const splitUsers = splitProofIndicesCutoffs.map((proofIndicesCutoffs, i) => {
    const { itemsAtIndex, lastSplitUserIndex } = getSplitItemsAtIndexes({
      currentIndex: i,
      proofIndicesCutoffs,
      usedProofIndexCount,
      items: users,
    })
    usedProofIndexCount = lastSplitUserIndex

    return itemsAtIndex
  })

  return splitUsers
}

const getSplitCommitments = ({
  splitProofIndicesCutoffs,
  wasCompliantDataCommitments,
}) => {
  let usedProofIndexCount = 0

  const splitCommitments = splitProofIndicesCutoffs.map(
    (proofIndicesCutoffs, i) => {
      const { itemsAtIndex, lastSplitUserIndex } = getSplitItemsAtIndexes({
        currentIndex: i,
        proofIndicesCutoffs,
        usedProofIndexCount,
        items: wasCompliantDataCommitments,
      })
      usedProofIndexCount = lastSplitUserIndex

      return itemsAtIndex
    }
  )

  return splitCommitments
}

const splitCommitmentsIntoChunks = ({
  flatProofIndices,
  proofIndicesCutoffs,
  wasCompliantDataCommitments,
  parentPort,
  users,
}) => {
  const splitFlatProofIndices = getSplitFlatProofIndices(flatProofIndices)
  const splitProofIndicesCutoffs = getSplitProofIndicesCutoffs({
    proofIndicesCutoffs,
    splitFlatProofIndices,
  })
  const splitUsers = getSplitUsers({ splitProofIndicesCutoffs, users })
  const splitWasCompliantDataCommitments = getSplitCommitments({
    splitProofIndicesCutoffs,
    wasCompliantDataCommitments,
  })

  /* parentPort.postMessage({ splitFlatProofIndices })
  parentPort.postMessage({ splitProofIndicesCutoffs })
  parentPort.postMessage({ splitUsers })
  parentPort.postMessage({ splitWasCompliantDataCommitments }) */

  return {
    splitFlatProofIndices,
    splitProofIndicesCutoffs: splitProofIndicesCutoffs.map(proofIndices =>
      proofIndices.filter(proofIndex => proofIndex !== 0)
    ),
    splitWasCompliantDataCommitments,
    splitUsers,
  }
}

const sendCommitmentsToContract = async ({
  addMethod,
  addMethodInput,
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  NetworkProxyContract,
  networkProxyAddress,
  nodeIndex,
  parentPort,
  web3,
}) => {
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
}

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

    const wasCompliant = wasCompliantData[i]
    const randomNumber = '0x' + crypto.randomBytes(32).toString('hex')
    const commitmentHash = Web3Utils.soliditySha3(wasCompliant, randomNumber)

    userAddresses.push(isDissent ? users[i] : address)
    wasCompliantDataCommitments.push(commitmentHash)
    randomNumbers.push(randomNumber)

    if (!isDissent) flatProofIndices.push(...proofIndices)

    if (!isDissent && i < users.length - 1) {
      const currentCutoffIndex = lastCutoffIndex + proofIndices.length
      lastCutoffIndex = currentCutoffIndex

      proofIndicesCutoffs.push(currentCutoffIndex)
    }
  }

  if (isDissent) {
    await sendCommitmentsToContract({
      addMethod: 'addDissentWasCompliantDataCommitmentsForUsers',
      addMethodInput: [userAddresses, wasCompliantDataCommitments],
      myJuriNodeAddress,
      myJuriNodePrivateKey,
      NetworkProxyContract,
      networkProxyAddress,
      nodeIndex,
      parentPort,
      web3,
    })

    return { randomNumbers }
  }

  /* parentPort.postMessage({ users })
  parentPort.postMessage({ flatProofIndices })
  parentPort.postMessage({ proofIndicesCutoffs })
  parentPort.postMessage({ users: userAddresses })
  parentPort.postMessage({ wasCompliantDataCommitments }) */

  const {
    splitFlatProofIndices,
    splitProofIndicesCutoffs,
    splitWasCompliantDataCommitments,
    splitUsers,
  } = splitCommitmentsIntoChunks({
    parentPort,
    users: userAddresses,
    wasCompliantDataCommitments,
    flatProofIndices,
    proofIndicesCutoffs,
  })

  for (let i = 0; i < splitFlatProofIndices.length; i++) {
    parentPort.postMessage(
      `Sending commitment ${i + 1}/${splitFlatProofIndices.length}...`
    )

    await sendCommitmentsToContract({
      addMethod: 'addWasCompliantDataCommitmentsForUsers',
      addMethodInput: [
        splitUsers[i],
        splitWasCompliantDataCommitments[i],
        splitFlatProofIndices[i],
        splitProofIndicesCutoffs[i],
      ],
      myJuriNodeAddress,
      myJuriNodePrivateKey,
      NetworkProxyContract,
      networkProxyAddress,
      nodeIndex,
      parentPort,
      web3,
    })
  }

  return { randomNumbers }
}

module.exports = sendCommitments
