const {
  getBondingAddress,
  getBondingContract,
  getJuriTokenAddress,
  getJuriTokenContract,
  getJuriFeesTokenContract,
  getNetworkProxyContract,
} = require('../config/contracts')
const { ZERO_ADDRESS } = require('../config/testing')
const { getWeb3 } = require('../config/skale')

const { nodes } = require('../config/accounts')

const filterAsync = require('../helpers/filterAsync')
const overwriteLog = require('../helpers/overwriteLogLib/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogLib/overwriteLogEnd')
const parseRevertMessage = require('../helpers/parseRevertMessage')
const Stages = require('../helpers/Stages')

const checkForInvalidAnswers = require('./checkForInvalidAnswers')
const getAssignedUsersIndexes = require('./getAssignedUsersIndexes')
const moveFromDissentToNextPeriod = require('./moveFromDissentToNextPeriod')
const moveToDissentPeriod = require('./moveToDissentPeriod')
const moveToNextRound = require('./moveToNextRound')
const retrieveAssignedUsers = require('./retrieveAssignedUsers')
const retrieveRewards = require('./retrieveRewards')
const runDissentRound = require('./runDissentRound')
const sendCommitments = require('./sendCommitments')
const sendReveals = require('./sendReveals')
const slashDishonestNodes = require('./slashing')
const verifyHeartRateData = require('./verifyHeartRateData')
const waitForJuriFeesHandling = require('./waitForJuriFeesHandling')
const waitForNextStage = require('./waitForNextStage')
const waitForNextRound = require('./waitForNextRound')

const runRound = async ({
  allNodes,
  bondingAddress,
  BondingContract,
  isDownloadingFiles,
  juriTokenAddress,
  JuriTokenContract,
  JuriFeesTokenContract,
  maxUserCount,
  myJuriNodePrivateKey,
  myJuriNodeAddress,
  NetworkProxyContract,
  nodeIndex,
  parentPort,
  roundIndex,
  timePerStage,
  web3,
  failureOptions: {
    isNotRevealing,
    isSendingIncorrectResult,
    isOffline,
    isSendingIncorrectDissent,
  },
}) => {
  parentPort.postMessage(
    'Starting round with mode: ' +
      JSON.stringify({
        failureOptions: {
          isNotRevealing,
          isSendingIncorrectResult,
          isOffline,
          isSendingIncorrectDissent,
        },
        nodeIndex,
      })
  )

  /* parentPort.postMessage({
    nodeIndex,
    bondedStake: (await BondingContract.methods
      .getBondedStakeOfNode(allNodes[nodeIndex])
      .call()).toString(),
  }) */

  // STAGE 2
  const { assignedUsers, uniqUsers } = await retrieveAssignedUsers({
    maxUserCount,
    myJuriNodeAddress,
    NetworkProxyContract,
    parentPort,
    roundIndex,
    web3,
  })

  const wasCompliantData = await verifyHeartRateData({
    assignedUsers,
    isDownloadingFiles,
    NetworkProxyContract,
    parentPort,
    roundIndex,
  })

  const complianceData = isSendingIncorrectResult
    ? wasCompliantData.map(({ wasCompliant }) => !wasCompliant)
    : wasCompliantData.map(({ wasCompliant }) => wasCompliant)

  // STAGE 3
  overwriteLog(`Sending commitments (node ${nodeIndex})...`, parentPort)
  const { randomNumbers } = await sendCommitments({
    users: assignedUsers,
    isDissent: false,
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    wasCompliantData: complianceData,
    web3,
  })
  overwriteLogEnd(`Sent commitments (node ${nodeIndex})!`, parentPort)

  await waitForNextStage({
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    timePerStage,
  })

  const finishedAssignedUsersIndexes = await getAssignedUsersIndexes({
    myJuriNodeAddress,
    NetworkProxyContract,
    roundIndex,
    users: uniqUsers,
  })

  parentPort.postMessage({ nodeIndex, finishedAssignedUsersIndexes })

  // STAGE 3
  overwriteLog(`Sending reveals (node ${nodeIndex})...`, parentPort)
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
      NetworkProxyContract,
      parentPort,
      web3,
    })
    overwriteLogEnd(`Sent reveals (node ${nodeIndex})!`, parentPort)
  } else {
    overwriteLogEnd(`Skipped sending reveals (node ${nodeIndex})!`, parentPort)
  }

  await waitForNextStage({
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    timePerStage,
  })

  overwriteLog(`Moving to dissent period (node ${nodeIndex})...`, parentPort)
  await moveToDissentPeriod({
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    web3,
  })
  overwriteLogEnd(`Moved to dissent period (node ${nodeIndex})!`, parentPort)

  // STAGE 4
  overwriteLog(
    `Dissenting to invalid answers (node ${nodeIndex})...`,
    parentPort
  )
  await checkForInvalidAnswers({
    bondingAddress,
    isSendingIncorrectDissent,
    roundIndex,
    users: assignedUsers,
    wasCompliantData: complianceData,
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    web3,
  })
  overwriteLogEnd(
    `Dissented to invalid answers (node ${nodeIndex})!`,
    parentPort
  )

  const resultsBefore = []
  for (let i = 0; i < uniqUsers.length; i++) {
    resultsBefore.push({
      user: uniqUsers[i],
      complianceData: (await NetworkProxyContract.methods
        .getUserComplianceData(roundIndex, uniqUsers[i])
        .call({ from: bondingAddress })).toString(),
    })
  }

  overwriteLog(`Move from dissent period... (node ${nodeIndex})`, parentPort)
  await waitForNextStage({
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    timePerStage,
  })
  await moveFromDissentToNextPeriod({
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    web3,
  })
  overwriteLogEnd(`Moved from dissent period (node ${nodeIndex})!`, parentPort)

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
  const dissentComplianceData = complianceData.filter((_, i) =>
    dissentedUsers.find(user => user === uniqUsers[i])
  )

  if (allDissentedUsers.length > 0)
    await runDissentRound({
      dissentedUsers,
      wasCompliantData: dissentComplianceData,
      isSendingResults: !isOffline && dissentedUsers.length > 0,
      myJuriNodeAddress,
      myJuriNodePrivateKey,
      NetworkProxyContract,
      parentPort,
      nodeIndex,
      timePerStage,
      web3,
    })
  else parentPort.postMessage(`Skipped dissent round (node ${nodeIndex})!`)

  const resultsAfter = []
  for (let i = 0; i < uniqUsers.length; i++) {
    resultsAfter.push({
      user: uniqUsers[i],
      complianceData: (await NetworkProxyContract.methods
        .getUserComplianceData(roundIndex, uniqUsers[i])
        .call({ from: bondingAddress })).toString(),
    })
  }

  if (nodeIndex === 0)
    parentPort.postMessage({ nodeIndex, resultsBefore, resultsAfter })

  overwriteLog(`Slashing dishonest nodes... (node ${nodeIndex})`, parentPort)
  await slashDishonestNodes({
    allNodes,
    allUsers: uniqUsers,
    dissentedUsers,
    bondingAddress,
    BondingContract,
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    roundIndex,
  })
  overwriteLogEnd(`Dishonest nodes slashed (node ${nodeIndex})!`, parentPort)

  const currentStage0 = await NetworkProxyContract.methods.currentStage().call()
  overwriteLogEnd(`Current Stage = ${Stages[currentStage0]}`, parentPort)

  // STAGE 7
  await moveToNextRound({
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    web3,
  })

  await waitForJuriFeesHandling({
    NetworkProxyContract,
    nodeIndex,
    parentPort,
    roundIndex,
  })

  // FINISH UP
  const balanceJuriTokenBefore = (await JuriTokenContract.methods
    .balanceOf(myJuriNodeAddress)
    .call()).toString()
  const balanceJuriFeesTokenBefore = (await JuriFeesTokenContract.methods
    .balanceOf(myJuriNodeAddress)
    .call()).toString()

  await retrieveRewards({
    JuriTokenContract,
    juriTokenAddress,
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    NetworkProxyContract,
    parentPort,
    roundIndex,
    web3,
  })

  const balanceJuriTokenAfter = (await JuriTokenContract.methods
    .balanceOf(myJuriNodeAddress)
    .call()).toString()
  const balanceJuriFeesTokenAfter = (await JuriFeesTokenContract.methods
    .balanceOf(myJuriNodeAddress)
    .call()).toString()

  parentPort.postMessage({
    balanceJuriTokenBefore,
    balanceJuriTokenAfter,
    nodeIndex,
  })
  parentPort.postMessage({
    balanceJuriFeesTokenBefore,
    balanceJuriFeesTokenAfter,
    nodeIndex,
  })

  // TODO sleep + retrieve newly minted tokens from main
}

const safeRunRounds = async params => {
  const web3 = getWeb3(false)
  const NetworkProxyContract = await getNetworkProxyContract()
  const bondingAddress = await getBondingAddress()
  const BondingContract = await getBondingContract()
  const juriTokenAddress = await getJuriTokenAddress()
  const JuriTokenContract = await getJuriTokenContract()
  const JuriFeesTokenContract = await getJuriFeesTokenContract()

  for (let i = 0; i < params.maxRoundsCount; i++) {
    const roundIndex = parseInt(
      await NetworkProxyContract.methods.roundIndex().call()
    )
    const allNodes = await BondingContract.methods.getAllStakingNodes().call()

    const { address, privateKeyBuffer } = nodes[params.nodeIndex]

    try {
      await runRound({
        ...params,
        roundIndex,
        allNodes,
        bondingAddress,
        BondingContract,
        juriTokenAddress,
        JuriTokenContract,
        JuriFeesTokenContract,
        myJuriNodePrivateKey: privateKeyBuffer,
        myJuriNodeAddress: address,
        NetworkProxyContract,
        web3,
      })
    } catch (error) {
      console.log({ error })
      params.parentPort.postMessage({ nodeIndex: params.nodeIndex, error })
      params.parentPort.postMessage({
        nodeIndex: params.nodeIndex,
        RunRoundError: error.message.includes('revertReason')
          ? parseRevertMessage(error.message)
          : error.message,
      })
    }

    await waitForNextRound({
      nodeIndex: params.nodeIndex,
      parentPort: params.parentPort,
      NetworkProxyContract,
      roundIndex,
    })
  }
}

/* const exec = async () => {
  const isDownloadingFiles = process.env.IS_DOWNLOADING_FILES === 'true'
  const maxRoundsCount = parseInt(process.env.MAX_ROUNDS_COUNT)
  const maxUserCount = parseInt(process.env.USER_COUNT)
  const nodeIndex = parseInt(process.env.NODE_INDEX)

  const { address, privateKeyBuffer } = nodes[nodeIndex]

  await safeRunRounds({
    isDownloadingFiles,
    maxRoundsCount,
    maxUserCount,
    myJuriNodePrivateKey: privateKeyBuffer,
    myJuriNodeAddress: address,
    nodeIndex,
    failureOptions: {
      isNotRevealing: process.argv[2] === 'true',
      isSendingIncorrectResult: process.argv[3] === 'true',
      isOffline: process.argv[4] === 'true',
      isSendingIncorrectDissent: process.argv[5] === 'true',
    },
  })
}
exec() */

module.exports = safeRunRounds
