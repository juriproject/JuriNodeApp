const Web3Utils = require('web3-utils')

const { JuriStakingPoolWithOracleMockAbi } = require('../config/contracts')

const retrieveAssignedUsers = async ({
  maxUserCount,
  myJuriNodeAddress,
  NetworkProxyContract,
  roundIndex,
  web3,
}) => {
  const THRESHOLD = new web3.utils.BN(
    '115792089237316195423570985008687907853269984665640564039457584007913129639936'
  ) // TODO

  console.log('AAAAAAAAAAAAAA')

  const poolAddresses = await NetworkProxyContract.methods
    .getRegisteredJuriStakingPools()
    .call()

  const users = []

  console.log('BBBBBBBBBBBBBBBBB')

  for (let i = 0; i < poolAddresses.length; i++) {
    const poolUsers = await new web3.eth.Contract(
      JuriStakingPoolWithOracleMockAbi,
      poolAddresses[i]
    ).methods
      .getUsers()
      .call()

    users.push(...poolUsers)
  }

  console.log('CCCCCCCCCCCCCCCC')

  const uniqUsers = [...new Set(users)].slice(0, maxUserCount)
  const assignedUsers = []

  for (let i = 0; i < uniqUsers.length; i++) {
    const user = uniqUsers[i]

    const userWorkoutSignature = await NetworkProxyContract.methods
      .getUserWorkoutSignature(roundIndex, user)
      .call()

    console.log('DDDDDDDDDDDDDD')

    let lowestHash = THRESHOLD
    let lowestIndex = -1

    const bondedTokenAmount = 100 // TODO

    for (let i = 0; i < bondedTokenAmount; i++) {
      const hash = new web3.utils.BN(
        Web3Utils.soliditySha3(
          userWorkoutSignature,
          myJuriNodeAddress,
          i
        ).slice(2),
        16
      )

      if (lowestHash.gt(hash)) {
        lowestHash = hash
        lowestIndex = i
      }
    }

    if (THRESHOLD.gt(lowestHash))
      assignedUsers.push({
        address: user,
        lowestIndex,
        lowestHash: '0x' + lowestHash.toString(16).padStart(64, '0'),
      })

    console.log('EEEEEEEEEEEEEE')
  }

  return { assignedUsers, uniqUsers }
}

module.exports = retrieveAssignedUsers
