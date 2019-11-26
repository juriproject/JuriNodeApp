const findAllNotRevealedNodes = require('./findAllNotRevealedNodes')
const findAllOfflineNodes = require('./findAllOfflineNodes')
const findAllIncorrectResultNodes = require('./findAllIncorrectResultNodes')
const findAllIncorrectDissentNodes = require('./findAllIncorrectDissentNodes')

const parseRevertMessage = require('../../helpers/parseRevertMessage')
const overwriteLog = require('../../helpers/overwriteLogLib/overwriteLog')
const overwriteLogEnd = require('../../helpers/overwriteLogLib/overwriteLogEnd')
const sendTx = require('../../helpers/sendTx')

const slashDishonestNodes = async ({
  allNodes,
  allUsers,
  dissentedUsers,
  bondingAddress,
  BondingContract,
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  NetworkProxyContract,
  nodeIndex,
  roundIndex,
  parentPort,
  web3,
}) => {
  const [
    notRevealedNodes,
    offlineNodes,
    incorrectResultNodes,
    incorrectDissentNodes,
  ] = await Promise.all([
    findAllNotRevealedNodes({
      allNodes,
      allUsers,
      NetworkProxyContract,
      nodeIndex,
      roundIndex,
    }),
    findAllOfflineNodes({
      allNodes,
      dissentedUsers,
      NetworkProxyContract,
      roundIndex,
    }),
    findAllIncorrectResultNodes({
      allNodes,
      allUsers,
      bondingAddress,
      NetworkProxyContract,
      nodeIndex,
      roundIndex,
    }),
    findAllIncorrectDissentNodes({
      allNodes,
      dissentedUsers,
      NetworkProxyContract,
      roundIndex,
    }),
  ])

  parentPort.postMessage({
    nodeIndex,
    notRevealedNodes: notRevealedNodes.map(({ toSlash }) =>
      allNodes.indexOf(toSlash)
    ),
    offlineNodes: offlineNodes.map(({ toSlash }) => allNodes.indexOf(toSlash)),
    incorrectResultNodes: incorrectResultNodes.map(({ toSlash }) =>
      allNodes.indexOf(toSlash)
    ),
    incorrectDissentNodes: incorrectDissentNodes.map(({ toSlash }) =>
      allNodes.indexOf(toSlash)
    ),
  })

  for (let i = 0; i < notRevealedNodes.length; i++) {
    const { toSlash, user } = notRevealedNodes[i]

    overwriteLog(
      `Slash not revealed [node=${toSlash}] for [user=${user}] (node ${nodeIndex})... `,
      parentPort
    )

    try {
      await sendTx({
        data: BondingContract.methods
          .slashStakeForNotRevealing(toSlash, user)
          .encodeABI(),
        from: myJuriNodeAddress,
        privateKey: myJuriNodePrivateKey,
        to: bondingAddress,
        web3,
      })
      overwriteLogEnd(
        `Successfully slashed not revealed (node ${nodeIndex})!`,
        parentPort
      )
    } catch (error) {
      overwriteLogEnd(
        `Slashing not revealed failed (node ${nodeIndex})!`,
        parentPort
      )

      parentPort.postMessage(
        `NotRevealSlashError: ${parseRevertMessage(
          error.message
        )} (node ${nodeIndex})`
      )
    }
  }

  for (let i = 0; i < offlineNodes.length; i++) {
    const { toSlash, user } = offlineNodes[i]

    overwriteLog(
      `Slash offline [node=${toSlash}] for [user=${user}] (node ${nodeIndex})...`,
      parentPort
    )

    try {
      await sendTx({
        data: BondingContract.methods
          .slashStakeForBeingOffline(toSlash, user)
          .encodeABI(),
        from: myJuriNodeAddress,
        privateKey: myJuriNodePrivateKey,
        to: bondingAddress,
        web3,
      })
      overwriteLogEnd(
        `Successfully slashed for offline (node ${nodeIndex})!`,
        parentPort
      )
    } catch (error) {
      overwriteLogEnd(`Slash offline failed (node ${nodeIndex})!`, parentPort)

      parentPort.postMessage(
        `OfflineSlashError: ${parseRevertMessage(
          error.message
        )} (node ${nodeIndex})`
      )
    }
  }

  for (let i = 0; i < incorrectResultNodes.length; i++) {
    const { toSlash, user } = incorrectResultNodes[i]

    overwriteLog(
      `Slash incorrect result [node=${toSlash}] for [user=${user}]... (node ${nodeIndex})`,
      parentPort
    )

    try {
      await sendTx({
        data: BondingContract.methods
          .slashStakeForIncorrectResult(toSlash, user)
          .encodeABI(),
        from: myJuriNodeAddress,
        privateKey: myJuriNodePrivateKey,
        to: bondingAddress,
        web3,
      })
      overwriteLogEnd(
        `Successfully slashed for incorrect result (node ${nodeIndex})!`,
        parentPort
      )
    } catch (error) {
      overwriteLogEnd(
        `Slashed incorrect result failed (node ${nodeIndex})!`,
        parentPort
      )

      parentPort.postMessage(
        `IncorrectResultSlashError: ${parseRevertMessage(
          error.message
        )} (node ${nodeIndex})`
      )
    }
  }

  for (let i = 0; i < incorrectDissentNodes.length; i++) {
    const { toSlash, user } = incorrectDissentNodes[i]

    overwriteLog(
      `Slash incorrect dissent [node=${toSlash}] for [user=${user}] (node ${nodeIndex})...`,
      parentPort
    )

    try {
      await sendTx({
        data: BondingContract.methods
          .slashStakeForIncorrectDissenting(toSlash, user)
          .encodeABI(),
        from: myJuriNodeAddress,
        privateKey: myJuriNodePrivateKey,
        to: bondingAddress,
        web3,
      })
      overwriteLogEnd(
        `Succesfully slashed for incorrect dissent (node ${nodeIndex})!`,
        parentPort
      )
    } catch (error) {
      overwriteLogEnd(
        `Slashed incorrect dissent failed (node ${nodeIndex})!`,
        parentPort
      )

      parentPort.postMessage(
        `IncorrectDissentSlashError: ${parseRevertMessage(
          error.message
        )} (node ${nodeIndex})`
      )
    }
  }
}

module.exports = slashDishonestNodes
