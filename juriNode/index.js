const {
  getBondingAddress,
  getBondingContract,
  NetworkProxyContract,
} = require('../config/contracts')
const { ZERO_ADDRESS } = require('../config/testing')
const { nodes } = require('../config/accounts')

const overwriteLog = require('../helpers/overwriteLog')

const filterAsync = require('../helpers/filterAsync')
const parseRevertMessage = require('../helpers/parseRevertMessage')

const checkForInvalidAnswers = require('./checkForInvalidAnswers')
const getAssignedUsersIndexes = require('./getAssignedUsersIndexes')
const retrieveAssignedUsers = require('./retrieveAssignedUsers')
const runDissentRound = require('./runDissentRound')
const sendCommitments = require('./sendCommitments')
const sendReveals = require('./sendReveals')
const slashDishonestNodes = require('./slashing')
const waitForNextStage = require('./waitForNextStage')

const runRound = async ({
  maxUserCount,
  myJuriNodePrivateKey,
  myJuriNodeAddress,
  nodeIndex,
  wasCompliantData,
  failureOptions: {
    isNotRevealing,
    isSendingIncorrectResult,
    isOffline,
    isSendingIncorrectDissent,
  },
}) => {
  console.log('Starting round with mode: ', {
    failureOptions: {
      isNotRevealing,
      isSendingIncorrectResult,
      isOffline,
      isSendingIncorrectDissent,
    },
    nodeIndex,
  })

  const bondingAddress = await getBondingAddress()
  const BondingContract = await getBondingContract()

  const complianceData = isSendingIncorrectResult
    ? wasCompliantData.map(wasCompliant => !wasCompliant)
    : wasCompliantData

  /* console.log({
    nodeIndex,
    bondedStake: (await BondingContract.methods
      .getBondedStakeOfNode(allNodes[nodeIndex])
      .call()).toString(),
  }) */

  // SETUP
  const roundIndex = await NetworkProxyContract.methods.roundIndex().call()
  const allNodes = await BondingContract.methods.getAllStakingNodes().call()
  // const times = await fetchStageTimes()

  // STAGE 2
  const { assignedUsers, uniqUsers } = await retrieveAssignedUsers({
    maxUserCount,
    myJuriNodeAddress,
    roundIndex,
  })

  // STAGE 3
  overwriteLog(`Sending commitments... (node ${nodeIndex})`)
  const { randomNumbers } = await sendCommitments({
    users: assignedUsers,
    isDissent: false,
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    nodeIndex,
    wasCompliantData: complianceData,
  })
  overwriteLog(`Sent commitments (node ${nodeIndex})!`)
  process.stdout.write('\n')

  // await sleep(times[timeForCommitmentStage])
  await waitForNextStage(nodeIndex)

  const finishedAssignedUsersIndexes = await getAssignedUsersIndexes({
    myJuriNodeAddress,
    roundIndex,
    users: uniqUsers,
  })

  console.log({ nodeIndex, finishedAssignedUsersIndexes })

  // STAGE 3
  overwriteLog(`Sending reveals... (node ${nodeIndex})`)
  if (!isNotRevealing) {
    await sendReveals({
      users: finishedAssignedUsersIndexes.map(i => assignedUsers[i]),
      randomNumbers: finishedAssignedUsersIndexes.map(i => randomNumbers[i]),
      wasCompliantData: finishedAssignedUsersIndexes.map(
        i => complianceData[i]
      ),
      isDissent: false,
      myJuriNodeAddress,
      myJuriNodePrivateKey,
    })
    overwriteLog(`Sent reveals (node ${nodeIndex})!`)
  } else {
    overwriteLog(`Skipped sending reveals (node ${nodeIndex})!`)
  }
  process.stdout.write('\n')

  // await sleep(times[timeForRevealStage])
  await waitForNextStage(nodeIndex)

  // STAGE 4
  overwriteLog(`Dissenting to invalid answers... (node ${nodeIndex})`)
  await checkForInvalidAnswers({
    bondingAddress,
    isSendingIncorrectDissent,
    roundIndex,
    users: assignedUsers,
    wasCompliantData: complianceData,
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    nodeIndex,
  })
  overwriteLog(`Dissented to invalid answers (node ${nodeIndex})!`)
  process.stdout.write('\n')

  // await sleep(times[timeForDissentStage])
  await waitForNextStage(nodeIndex)

  const resultsBefore = []
  for (let i = 0; i < uniqUsers.length; i++) {
    resultsBefore.push({
      user: uniqUsers[i],
      complianceData: (await NetworkProxyContract.methods
        .getUserComplianceData(roundIndex, uniqUsers[i])
        .call({ from: bondingAddress })).toString(),
    })
  }

  // STAGE 5
  const allDissentedUsers = await NetworkProxyContract.methods
    .getDissentedUsers()
    .call()
  const dissentedUsers = await filterAsync(
    allDissentedUsers,
    async user =>
      (await NetworkProxyContract.methods
        .getUserComplianceDataCommitment(roundIndex, myJuriNodeAddress, user)
        .call()) === ZERO_ADDRESS
  )

  /* console.log({
    nodeIndex,
    allDissentedUsers,
    dissentedUsers,
  }) */

  if (allDissentedUsers.length > 0)
    await runDissentRound({
      dissentedUsers,
      wasCompliantData: complianceData,
      isSendingResults: !isOffline && dissentedUsers.length > 0,
      myJuriNodeAddress,
      myJuriNodePrivateKey,
      nodeIndex,
      uniqUsers,
    })
  else await waitForNextStage(nodeIndex)

  const resultsAfter = []
  for (let i = 0; i < uniqUsers.length; i++) {
    resultsAfter.push({
      user: uniqUsers[i],
      complianceData: (await NetworkProxyContract.methods
        .getUserComplianceData(roundIndex, uniqUsers[i])
        .call({ from: bondingAddress })).toString(),
    })
  }

  if (nodeIndex === 0) console.log({ nodeIndex, resultsBefore, resultsAfter })

  overwriteLog(`Slashing dishonest nodes... (node ${nodeIndex})`)
  await slashDishonestNodes({
    allNodes,
    allUsers: uniqUsers,
    dissentedUsers,
    bondingAddress,
    BondingContract,
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    nodeIndex,
    roundIndex,
  })
  overwriteLog(`Dishonest nodes slashed (node ${nodeIndex})!`)
  process.stdout.write('\n')

  // FINISH UP
  /* const balanceJuriTokenBefore = (await JuriTokenContract.methods
    .balanceOf(myJuriNodeAddress)
    .call()).toString()
  const balanceJuriFeesTokenBefore = (await JuriFeesTokenContract.methods
    .balanceOf(myJuriNodeAddress)
    .call()).toString()

  await retrieveRewards({ JuriTokenContract, juriTokenAddress, roundIndex })

  const balanceJuriTokenAfter = (await JuriTokenContract.methods
    .balanceOf(myJuriNodeAddress)
    .call()).toString()
  const balanceJuriFeesTokenAfter = (await JuriFeesTokenContract.methods
    .balanceOf(myJuriNodeAddress)
    .call()).toString()

  console.log({ balanceJuriTokenBefore, balanceJuriTokenAfter })
  console.log({ balanceJuriFeesTokenBefore, balanceJuriFeesTokenAfter }) */

  // await sleep(times[timeForSlashingStage])

  // STAGE 7
  // await moveToNextRound()
}

const safeRunRound = async params => {
  try {
    await runRound(params)
  } catch (error) {
    console.log({ error })
    console.log({
      nodeIndex: params.nodeIndex,
      RunRoundError: error.message.includes('revertReason')
        ? parseRevertMessage(error.message)
        : error.message,
    })
  }
}

safeRunRound({
  maxUserCount: parseInt(process.env.USER_COUNT),
  myJuriNodePrivateKey:
    nodes[parseInt(process.env.NODE_INDEX)].privateKeyBuffer,
  myJuriNodeAddress: nodes[parseInt(process.env.NODE_INDEX)].address,
  nodeIndex: parseInt(process.env.NODE_INDEX),
  wasCompliantData: new Array(parseInt(process.env.USER_COUNT)).fill(false),
  failureOptions: {
    isNotRevealing: process.argv[2] === 'true',
    isSendingIncorrectResult: process.argv[3] === 'true',
    isOffline: process.argv[4] === 'true',
    isSendingIncorrectDissent: process.argv[5] === 'true',
  },
})

module.exports = safeRunRound
