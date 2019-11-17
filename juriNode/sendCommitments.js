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

const getFirstSplitUserIndex = ({
  currentIndex,
  firstProofIndexCutoff,
  usedProofIndexCount,
}) => {
  if (currentIndex === 0 || firstProofIndexCutoff === 0)
    return usedProofIndexCount

  return usedProofIndexCount - 1 // use the last user twice
}

const getSplitUsers = ({ splitProofIndicesCutoffs, users }) => {
  let usedProofIndexCount = 0

  const splitUsers = splitProofIndicesCutoffs.map((proofIndicesCutoffs, i) => {
    const userCountAtIndex = proofIndicesCutoffs.length + 1
    const usersAtIndex = users.slice(
      getFirstSplitUserIndex({
        currentIndex: i,
        firstProofIndexCutoff: proofIndicesCutoffs[0],
        usedProofIndexCount,
      }),
      usedProofIndexCount + userCountAtIndex
    )
    usedProofIndexCount += userCountAtIndex

    return usersAtIndex
  })

  return splitUsers
}

const getSplitCommitments = ({
  splitProofIndicesCutoffs,
  wasCompliantDataCommitments,
}) => {
  let usedProofIndexCount = 0

  const splitWasCompliantDataCommitments = splitProofIndicesCutoffs.map(
    (proofIndicesCutoffs, i) => {
      const wasCompliantDataCountAtIndex = proofIndicesCutoffs.length + 1
      const wasCompliantDataAtIndex = wasCompliantDataCommitments.slice(
        getFirstSplitUserIndex({
          currentIndex: i,
          firstProofIndexCutoff: proofIndicesCutoffs[0],
          usedProofIndexCount,
        }),
        usedProofIndexCount + wasCompliantDataCountAtIndex
      )
      usedProofIndexCount += wasCompliantDataCountAtIndex

      return wasCompliantDataAtIndex
    }
  )

  return splitWasCompliantDataCommitments
}

const splitCommitmentsIntoChunks = ({
  flatProofIndices,
  proofIndicesCutoffs,
  wasCompliantDataCommitments,
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
    parentPort.postMessage({
      MESSAGE: 'Sending commitment!',
      data: addMethodInput,
    })

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

  parentPort.postMessage({
    flatProofIndices,
    proofIndicesCutoffs,
  })

  const {
    splitFlatProofIndices,
    splitProofIndicesCutoffs,
    splitWasCompliantDataCommitments,
    splitUsers,
  } = splitCommitmentsIntoChunks({
    users: userAddresses,
    wasCompliantDataCommitments,
    flatProofIndices,
    proofIndicesCutoffs,
  })

  parentPort.postMessage({
    splitFlatProofIndices,
    splitProofIndicesCutoffs,
    splitWasCompliantDataCommitments,
    splitUsers,
  })

  for (let i = 0; i < splitFlatProofIndices.length; i++) {
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
