const {
  getJuriStakingPoolContracts,
  getJuriFeesTokenContract,
  getNetworkProxyContract,
  networkProxyAddress,
} = require('../config/contracts')

const addUserHeartRateFiles = require('./addUserHeartRateFiles')
const FINISHED_CONSTANT = require('../helpers/finishedConstant')
const overwriteLog = require('../helpers/overwriteLogLib/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogLib/overwriteLogEnd')
const sendTx = require('../helpers/sendTx')
const sleep = require('../helpers/sleep')

const moveTimeToNextStage = require('./moveTimeToNextStage')

const { getWeb3 } = require('../config/skale')

const Stages = require('../helpers/Stages')

const moveTimeForNextStages = async ({
  controllerAddress,
  controllerKeyBuffer,
  isRunningOnAws,
  NetworkProxyContract,
  parentPort,
  stageCount,
  timePerStage,
}) => {
  for (let i = 0; i < stageCount; i++) {
    const extraTimeForStage = i === 0 ? timePerStage : 0
    const timeForStageInMs = timePerStage * 1000 + 200 + extraTimeForStage
    await sleep(timeForStageInMs)

    const currentStage = await NetworkProxyContract.methods
      .currentStage()
      .call()

    overwriteLog(`Moving time from ${Stages[currentStage]}...`, parentPort)
    await moveTimeToNextStage({
      from: controllerAddress,
      key: controllerKeyBuffer,
      isRunningOnAws,
    })
    overwriteLogEnd(`Moved stage!`, parentPort)
  }
}

const runControllerRound = async ({
  controllerAddress,
  controllerKeyBuffer,
  isRunningOnAws,
  NetworkProxyContract,
  parentPort,
  timePerStage,
  web3,
}) => {
  const roundIndex = await NetworkProxyContract.methods.roundIndex().call()

  await moveTimeForNextStages({
    controllerAddress,
    controllerKeyBuffer,
    isRunningOnAws,
    NetworkProxyContract,
    parentPort,
    timePerStage,
    stageCount: 3,
  })

  await sleep(timePerStage * 1000 * 2.2) // wait for dissenting/slashing

  const dissentedUsers = parseInt(
    await NetworkProxyContract.methods.getDissentedUsers().call()
  )

  if (dissentedUsers > 0) {
    await moveTimeForNextStages({
      controllerAddress,
      controllerKeyBuffer,
      NetworkProxyContract,
      parentPort,
      timePerStage,
      stageCount: 3,
    })

    await sleep(timePerStage * 1000 * 2.2) // wait for slashing
  } else
    await moveTimeForNextStages({
      controllerAddress,
      controllerKeyBuffer,
      NetworkProxyContract,
      parentPort,
      timePerStage,
      stageCount: 1,
    })

  const juriFees = 100
  const JuriStakingPoolContracts = await getJuriStakingPoolContracts(
    isRunningOnAws
  )
  const JuriTokenFeesContract = await getJuriFeesTokenContract(isRunningOnAws)

  parentPort.postMessage({
    roundIndex: roundIndex.toString(),
    totalJuriFeesInProxyBefore: (
      await NetworkProxyContract.methods.totalJuriFees(roundIndex).call()
    ).toString(),
  })

  for (let i = 0; i < JuriStakingPoolContracts.length; i++) {
    const JuriStakingPoolContract = JuriStakingPoolContracts[i]

    parentPort.postMessage({
      balanceBeforeMint: (
        await JuriTokenFeesContract.methods
          .balanceOf(JuriStakingPoolContract._address)
          .call()
      ).toString(),
    })

    await sendTx({
      data: JuriTokenFeesContract.methods
        .mint(JuriStakingPoolContract._address, juriFees)
        .encodeABI(),
      from: controllerAddress,
      to: JuriTokenFeesContract._address,
      privateKey: controllerKeyBuffer,
      web3,
    })

    parentPort.postMessage({
      balanceAfterMint: (
        await JuriTokenFeesContract.methods
          .balanceOf(JuriStakingPoolContract._address)
          .call()
      ).toString(),
    })

    overwriteLog(`Handle JuriFees in pool ${i}...`, parentPort)
    await sendTx({
      data: JuriStakingPoolContract.methods
        .handleJuriFees(roundIndex, juriFees)
        .encodeABI(),
      from: controllerAddress,
      to: JuriStakingPoolContract._address,
      privateKey: controllerKeyBuffer,
      web3,
    })

    parentPort.postMessage({
      balanceAfterHandling: (
        await JuriTokenFeesContract.methods
          .balanceOf(JuriStakingPoolContract._address)
          .call()
      ).toString(),
      balanceAfterHandlingProxy: (
        await JuriTokenFeesContract.methods
          .balanceOf(NetworkProxyContract._address)
          .call()
      ).toString(),
    })

    overwriteLogEnd(`Handled JuriFees in pool ${i}!`, parentPort)
  }

  parentPort.postMessage({
    roundIndex: roundIndex.toString(),
    totalJuriFeesInProxyAfter: (
      await NetworkProxyContract.methods.totalJuriFees(roundIndex).call()
    ).toString(),
  })
}

const runControllerRounds = async ({
  controllerAddress,
  controllerKeyBuffer,
  controllerKeyUint,
  isUploadingFiles,
  isRunningOnAws,
  maxUserCount,
  maxRoundsCount,
  parentPort,
  timePerStage,
}) => {
  controllerKeyBuffer = controllerKeyBuffer || Buffer.from(controllerKeyUint)

  const NetworkProxyContract = getNetworkProxyContract()
  const web3 = getWeb3({ isMain: false, isRunningOnAws })

  for (let i = 0; i < maxRoundsCount; i++) {
    await runControllerRound({
      controllerAddress,
      controllerKeyBuffer,
      isRunningOnAws,
      NetworkProxyContract,
      parentPort,
      timePerStage,
      web3,
    })

    if (i + 1 === maxRoundsCount) {
      parentPort.postMessage('Simulated rounds finished!')
      parentPort.postMessage(FINISHED_CONSTANT)

      return
    }

    await sleep(timePerStage + 200)

    await addUserHeartRateFiles({
      controllerAddress,
      controllerKeyBuffer,
      isUploadingFiles,
      isRunningOnAws,
      maxUserCount,
      parentPort,
    })

    overwriteLog('Moving to nodes adding commitments stage...', parentPort)
    await sendTx({
      data: NetworkProxyContract.methods
        .moveToAddingCommitmentStage()
        .encodeABI(),
      from: controllerAddress,
      privateKey: controllerKeyBuffer,
      to: networkProxyAddress,
      web3,
    })

    overwriteLogEnd('Moved to nodes adding commitments stage!', parentPort)
  }
}

module.exports = runControllerRounds
