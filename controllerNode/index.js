const {
  getJuriStakingPoolContracts,
  getJuriFeesTokenContract,
  getNetworkProxyContract,
} = require('../config/contracts')

const addUserHeartRateFiles = require('./addUserHeartRateFiles')
const overwriteLog = require('../helpers/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogEnd')
const sendTx = require('../helpers/sendTx')
const sleep = require('../helpers/sleep')

const moveTimeToNextStage = require('./moveTimeToNextStage')

const { getWeb3 } = require('../config/skale')

const Stages = {
  '0': 'USER_ADDING_HEART_RATE_DATA',
  '1': 'NODES_ADDING_RESULT_COMMITMENTS',
  '2': 'NODES_ADDING_RESULT_REVEALS',
  '3': 'DISSENTING_PERIOD',
  '4': 'DISSENTS_NODES_ADDING_RESULT_COMMITMENTS',
  '5': 'DISSENTS_NODES_ADDING_RESULT_REVEALS',
  '6': 'SLASHING_PERIOD',
}

const runControllerRound = async ({
  controllerAddress,
  controllerKeyBuffer,
  parentPort,
  timePerStage,
}) => {
  const web3 = getWeb3(false)
  const NetworkProxyContract = getNetworkProxyContract()

  const roundIndex = await NetworkProxyContract.methods.roundIndex().call()

  for (let i = 0; i < 3; i++) {
    await sleep(timePerStage * 1000 + 200)

    const currentStage = await NetworkProxyContract.methods
      .currentStage()
      .call()

    overwriteLog(`Moving time from ${Stages[currentStage]}...`, parentPort)
    await moveTimeToNextStage({
      from: controllerAddress,
      key: controllerKeyBuffer,
    })
    overwriteLogEnd(`Moved!`, parentPort)
  }

  await sleep(timePerStage * 1000 * 5)

  const juriFees = 100
  const JuriStakingPoolContracts = await getJuriStakingPoolContracts()
  const JuriTokenFeesContract = await getJuriFeesTokenContract()

  parentPort.postMessage({
    roundIndex: roundIndex.toString(),
    totalJuriFeesInProxyBefore: (await NetworkProxyContract.methods
      .totalJuriFees(roundIndex)
      .call()).toString(),
  })

  for (let i = 0; i < JuriStakingPoolContracts.length; i++) {
    const JuriStakingPoolContract = JuriStakingPoolContracts[i]

    /* postMessage({
      balanceBeforeMint: (await JuriTokenFeesContract.methods
        .balanceOf(JuriStakingPoolContract._address)
        .call()).toString(),
    }) */

    await sendTx({
      data: JuriTokenFeesContract.methods
        .mint(JuriStakingPoolContract._address, juriFees)
        .encodeABI(),
      from: controllerAddress,
      to: JuriTokenFeesContract._address,
      privateKey: controllerKeyBuffer,
      web3,
    })

    /* parentPort.postMessage({
      balanceAfterMint: (await JuriTokenFeesContract.methods
        .balanceOf(JuriStakingPoolContract._address)
        .call()).toString(),
    }) */

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

    /* parentPort.postMessage({
      balanceAfterHandling: (await JuriTokenFeesContract.methods
        .balanceOf(JuriStakingPoolContract._address)
        .call()).toString(),
      balanceAfterHandlingProxy: (await JuriTokenFeesContract.methods
        .balanceOf(NetworkProxyContract._address)
        .call()).toString(),
    }) */

    overwriteLogEnd(`Handled JuriFees in pool ${i}!`, parentPort)
  }

  parentPort.postMessage({
    roundIndex: roundIndex.toString(),
    totalJuriFeesInProxyAfter: (await NetworkProxyContract.methods
      .totalJuriFees(roundIndex)
      .call()).toString(),
  })
}

const runControllerRounds = async ({
  controllerAddress,
  controllerKeyUint,
  isUploadingFiles,
  maxUserCount,
  maxRoundsCount,
  parentPort,
  timePerStage,
}) => {
  const controllerKeyBuffer = Buffer.from(controllerKeyUint)

  for (let i = 0; i < maxRoundsCount; i++) {
    await runControllerRound({
      controllerAddress,
      controllerKeyBuffer,
      parentPort,
      timePerStage,
    })

    await sleep(timePerStage + 200)
    await addUserHeartRateFiles({
      controllerAddress,
      controllerKeyBuffer,
      isUploadingFiles,
      maxUserCount,
      parentPort,
    })
  }
}

/* runControllerRounds({
  isUploadingFiles: process.env.IS_UPLOADING_FILES === 'true',
  maxRoundsCount: parseInt(process.env.MAX_ROUNDS_COUNT),
  maxUserCount: parseInt(process.env.MAX_USER_COUNT),
}) */

module.exports = runControllerRounds
