const Web3Utils = require('web3-utils')

const { JuriStakingPoolWithOracleMockAbi } = require('../config/contracts')

const retrievePotentiallyAssignedUsers = async ({
  maxUserCount,
  myJuriNodeAddress,
  NetworkProxyContract,
  roundIndex,
  web3,
}) => {
  // eslint-disable-next-line no-unused-vars
  const THRESHOLD = new web3.utils.BN(
    '115792089237316195423570985008687907853269984665640564039457584007913129639936'
  ) // TODO

  const poolAddresses = await NetworkProxyContract.methods
    .getRegisteredJuriStakingPools()
    .call()

  const users = []

  for (let i = 0; i < poolAddresses.length; i++) {
    const poolUsers = await new web3.eth.Contract(
      JuriStakingPoolWithOracleMockAbi,
      poolAddresses[i]
    ).methods
      .getUsers()
      .call()

    users.push(...poolUsers)
  }

  const uniqUsers = [...new Set(users)].slice(0, maxUserCount)
  const potentiallyAssignedUsers = []

  for (let i = 0; i < uniqUsers.length; i++) {
    const user = uniqUsers[i]

    const userWorkoutSignature = await NetworkProxyContract.methods
      .getUserWorkoutSignature(roundIndex, user)
      .call()

    const lowestHashes = []
    const proofIndices = []
    const bondedTokenAmount = 30 // TODO

    for (let proofIndex = 0; proofIndex < bondedTokenAmount; proofIndex++) {
      const hash = new web3.utils.BN(
        Web3Utils.soliditySha3(
          userWorkoutSignature,
          myJuriNodeAddress,
          proofIndex
        ).slice(2),
        16
      )

      if (/*TODO THRESHOLD.gt(hash)*/ Math.random() > 0.97) {
        lowestHashes.push('0x' + hash.toString(16).padStart(64, '0'))
        proofIndices.push(proofIndex)
      }
    }

    if (lowestHashes.length > 0)
      potentiallyAssignedUsers.push({
        address: user,
        lowestHashes,
        proofIndices,
      })
  }

  return { potentiallyAssignedUsers, uniqUsers }
}

module.exports = retrievePotentiallyAssignedUsers
