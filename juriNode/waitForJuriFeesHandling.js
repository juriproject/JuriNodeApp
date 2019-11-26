const overwriteLog = require('../helpers/overwriteLogLib/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogLib/overwriteLogEnd')
const sleep = require('../helpers/sleep')

const waitForJuriFeesHandling = async ({
  NetworkProxyContract,
  nodeIndex,
  parentPort,
  roundIndex,
}) => {
  overwriteLog(
    `Waiting for Juri fees handling (node ${nodeIndex})... `,
    parentPort
  )

  let totalJuriFeesInProxy = (
    await NetworkProxyContract.methods.totalJuriFees(roundIndex).call()
  ).toString()

  while (totalJuriFeesInProxy === '0') {
    await sleep(2000)
    totalJuriFeesInProxy = (
      await NetworkProxyContract.methods.totalJuriFees(roundIndex).call()
    ).toString()
  }

  await sleep(2000)
  overwriteLogEnd(
    `Waiting for Juri fees handling finished (node ${nodeIndex})!`,
    parentPort
  )
}

module.exports = waitForJuriFeesHandling
