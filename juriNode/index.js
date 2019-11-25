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
const FINISHED_CONSTANT = require('../helpers/finishedConstant')
const overwriteLog = require('../helpers/overwriteLogLib/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogLib/overwriteLogEnd')
const parseRevertMessage = require('../helpers/parseRevertMessage')

const checkForInvalidAnswers = require('./checkForInvalidAnswers')
const getAssignedUsersIndexes = require('./getAssignedUsersIndexes')
const moveToNextRound = require('./moveToNextRound')
const moveToNextStage = require('./moveToNextStage')
const retrieveUniqAndPotentiallyAssignedUsers = require('./retrieveUniqAndPotentiallyAssignedUsers')
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
    incorrectDissentPercentage,
    incorrectResultPercentage,
    notRevealPercentage,
    offlinePercentage,
  },
}) => {
  /* if (nodeIndex == 0)
    NetworkProxyContract.events.allEvents().on('data', event => {
      console.log('EventName: ' + event.event)

      if (!event.event) console.log(JSON.stringify(event))

      if (event.event === 'AddedVerifierHash') {
        console.log(
          'Node: ' +
            event.returnValues.node +
            ' | User: ' +
            event.returnValues.user
        )
      }
    }) */

  const isNotRevealing = Math.random() * 100 < notRevealPercentage
  const isSendingIncorrectResult =
    Math.random() * 100 < incorrectResultPercentage
  const isOffline = Math.random() * 100 < offlinePercentage
  const isSendingIncorrectDissent =
    Math.random() * 100 < incorrectDissentPercentage

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
  const {
    potentiallyAssignedUsers,
    uniqUsers,
  } = await retrieveUniqAndPotentiallyAssignedUsers({
    maxUserCount,
    myJuriNodeAddress,
    NetworkProxyContract,
    parentPort,
    roundIndex,
    web3,
  })

  const wasCompliantData = await verifyHeartRateData({
    users: potentiallyAssignedUsers.map(({ address }) => address),
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
    users: potentiallyAssignedUsers,
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
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    nodeIndex,
    parentPort,
    timePerStage,
    web3,
  })

  const finishedAssignedUsersIndexes = await getAssignedUsersIndexes({
    myJuriNodeAddress,
    NetworkProxyContract,
    roundIndex,
    users: uniqUsers,
  })

  parentPort.postMessage({ nodeIndex, finishedAssignedUsersIndexes })

  const assignedUsers = finishedAssignedUsersIndexes.map(i => uniqUsers[i])

  // STAGE 4
  overwriteLog(`Sending reveals (node ${nodeIndex})...`, parentPort)
  if (!isNotRevealing) {
    await sendReveals({
      users: potentiallyAssignedUsers.filter(({ address }) =>
        assignedUsers.includes(address)
      ),
      randomNumbers: randomNumbers.filter((_, i) =>
        assignedUsers.includes(potentiallyAssignedUsers[i].address)
      ),
      wasCompliantData: complianceData.filter((_, i) =>
        assignedUsers.includes(potentiallyAssignedUsers[i].address)
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
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    nodeIndex,
    parentPort,
    timePerStage,
    web3,
  })

  overwriteLog(`Moving to dissent period (node ${nodeIndex})...`, parentPort)
  await moveToNextStage({
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    NetworkProxyContract,
    parentPort,
    nodeIndex,
    web3,
  })
  overwriteLogEnd(`Moved to dissent period (node ${nodeIndex})!`, parentPort)

  // STAGE 5
  overwriteLog(
    `Dissenting to invalid answers (node ${nodeIndex})...`,
    parentPort
  )
  await checkForInvalidAnswers({
    bondingAddress,
    isSendingIncorrectDissent,
    roundIndex,
    users: potentiallyAssignedUsers,
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

  await waitForNextStage({
    NetworkProxyContract,
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    nodeIndex,
    parentPort,
    timePerStage,
    web3,
  })

  // STAGE 6
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
  const dissentWasCompliantData = (await verifyHeartRateData({
    users: dissentedUsers,
    isDownloadingFiles,
    NetworkProxyContract,
    parentPort,
    roundIndex,
  })).map(({ wasCompliant }) => wasCompliant)

  /* parentPort.postMessage({
    allDissentedUsersLength: allDissentedUsers.length,
    filteredDissentedUsersLength: dissentedUsers.length,
    filteredComplianceDataLength: dissentWasCompliantData.length,
    isSendingResults: !isOffline && dissentedUsers.length > 0,
  }) */

  if (allDissentedUsers.length > 0)
    await runDissentRound({
      dissentedUsers,
      wasCompliantData: dissentWasCompliantData,
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
    web3,
  })
  overwriteLogEnd(`Dishonest nodes slashed (node ${nodeIndex})!`, parentPort)

  await waitForNextStage({
    NetworkProxyContract,
    myJuriNodeAddress,
    myJuriNodePrivateKey,
    nodeIndex,
    parentPort,
    timePerStage,
    web3,
  })

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
  const { isRunningOnAws, maxRoundsCount, nodeIndex, parentPort } = params

  const web3 = getWeb3({ isMain: false, isRunningOnAws })
  const NetworkProxyContract = await getNetworkProxyContract(isRunningOnAws)
  const bondingAddress = await getBondingAddress(isRunningOnAws)
  const BondingContract = await getBondingContract(isRunningOnAws)
  const juriTokenAddress = await getJuriTokenAddress(isRunningOnAws)
  const JuriTokenContract = await getJuriTokenContract(isRunningOnAws)
  const JuriFeesTokenContract = await getJuriFeesTokenContract(isRunningOnAws)

  for (let i = 0; i < maxRoundsCount; i++) {
    const roundIndex = parseInt(
      await NetworkProxyContract.methods.roundIndex().call()
    )
    const allNodes = await BondingContract.methods.getAllStakingNodes().call()

    const { address, privateKeyBuffer } = nodes[nodeIndex]

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
      console.log({ error }) // debugging

      parentPort.postMessage({ nodeIndex, error })
      parentPort.postMessage({
        nodeIndex,
        RunRoundError: error.message.includes('revertReason')
          ? parseRevertMessage(error.message)
          : error.message,
      })
    }

    if (i + 1 === maxRoundsCount) {
      parentPort.postMessage(
        `Finished with simulated rounds (node ${nodeIndex})!`
      )
      parentPort.postMessage(FINISHED_CONSTANT)

      return
    }

    await waitForNextRound({
      nodeIndex,
      parentPort,
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
