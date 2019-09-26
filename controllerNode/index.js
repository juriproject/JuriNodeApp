const { controllerNode } = require('../config/accounts')
const {
  getJuriStakingPoolContracts,
  getJuriFeesTokenContract,
  NetworkProxyContract,
} = require('../config/contracts')
const { web3 } = require('../config/testing')

const overwriteLog = require('../helpers/overwriteLog')
const sendTx = require('../helpers/sendTx')
const sleep = require('../helpers/sleep')

const moveToNextStage = require('./moveToNextStage')

const runControllerRound = async () => {
  const roundIndex = await NetworkProxyContract.methods.roundIndex().call()

  for (let i = 0; i < 5; i++) {
    await sleep(parseInt(process.env.TIME_PER_STAGE) + 200)

    overwriteLog('Moving stage...')
    await moveToNextStage({
      from: controllerNode.address,
      key: controllerNode.privateKeyBuffer,
    })
    overwriteLog('Moved stage!')
  }

  process.stdout.write('\n')

  const juriFees = 100
  const JuriStakingPoolContracts = await getJuriStakingPoolContracts()
  const JuriTokenFeesContract = await getJuriFeesTokenContract()

  const roundIndex2 = await NetworkProxyContract.methods.roundIndex().call()

  console.log({
    roundIndex: roundIndex.toString(),
    roundIndex2: roundIndex2.toString(),
    totalJuriFeesInProxyBefore: (await NetworkProxyContract.methods
      .totalJuriFees(roundIndex)
      .call()).toString(),
  })

  for (let i = 0; i < JuriStakingPoolContracts.length; i++) {
    const JuriStakingPoolContract = JuriStakingPoolContracts[i]

    /* console.log({
      balanceBeforeMint: (await JuriTokenFeesContract.methods
        .balanceOf(JuriStakingPoolContract._address)
        .call()).toString(),
    }) */

    await sendTx({
      data: JuriTokenFeesContract.methods
        .mint(JuriStakingPoolContract._address, juriFees)
        .encodeABI(),
      from: controllerNode.address,
      to: JuriTokenFeesContract._address,
      privateKey: controllerNode.privateKeyBuffer,
      web3,
    })

    /* console.log({
      balanceAfterMint: (await JuriTokenFeesContract.methods
        .balanceOf(JuriStakingPoolContract._address)
        .call()).toString(),
    }) */

    overwriteLog(`Handle JuriFees in pool ${i}...`)
    await sendTx({
      data: JuriStakingPoolContract.methods
        .handleJuriFees(roundIndex, juriFees)
        .encodeABI(),
      from: controllerNode.address,
      to: JuriStakingPoolContract._address,
      privateKey: controllerNode.privateKeyBuffer,
      web3,
    })

    /* console.log({
      balanceAfterHandling: (await JuriTokenFeesContract.methods
        .balanceOf(JuriStakingPoolContract._address)
        .call()).toString(),
      balanceAfterHandlingProxy: (await JuriTokenFeesContract.methods
        .balanceOf(NetworkProxyContract._address)
        .call()).toString(),
    }) */

    process.stdout.write('\n')
    overwriteLog(`Handled JuriFees in pool ${i}!`)
    process.stdout.write('\n')

    /* overwriteLog('Moving stage...')
    await moveToNextStage({
      from: controllerNode.address,
      key: controllerNode.privateKeyBuffer,
    })
    overwriteLog('Moved stage!')
    process.stdout.write('\n') */
  }

  const roundIndex3 = await NetworkProxyContract.methods.roundIndex().call()

  console.log({
    roundIndex: roundIndex.toString(),
    roundIndex2: roundIndex2.toString(),
    roundIndex3: roundIndex3.toString(),
    totalJuriFeesInProxyAfter: (await NetworkProxyContract.methods
      .totalJuriFees(roundIndex)
      .call()).toString(),
  })
}

runControllerRound()

// const TIME_PER_STAGE = 1000 * 50

module.exports = runControllerRound
