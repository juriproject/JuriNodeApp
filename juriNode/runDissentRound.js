const waitForNextStage = require('./waitForNextStage')
const sendCommitments = require('./sendCommitments')
const sendReveals = require('./sendReveals')

const runDissentRound = async ({
  dissentedUsers,
  isSendingResults,
  myJuriNodeAddress,
  myJuriNodePrivateKey,
  NetworkProxyContract,
  nodeIndex,
  uniqUsers,
  wasCompliantData,
  web3,
}) => {
  let randomNumbers

  // STAGE 5.1

  if (isSendingResults) {
    console.log(`Sending dissent commitments... (node ${nodeIndex})`)
    randomNumbers = (await sendCommitments({
      users: dissentedUsers,
      isDissent: true,
      myJuriNodeAddress,
      myJuriNodePrivateKey,
      NetworkProxyContract,
      nodeIndex,
      wasCompliantData,
      web3,
    })).randomNumbers
    console.log(`Sent dissent commitments (node ${nodeIndex})!`)
  }

  // await sleep(times[timeForDissentCommitmentStage])
  await waitForNextStage(nodeIndex)

  // STAGE 5.2
  if (isSendingResults) {
    const dissentWasCompliantData = dissentedUsers
      .map(user => uniqUsers.indexOf(user))
      .filter(index => index >= 0)
      .map(index => wasCompliantData[index])

    console.log({ dissentWasCompliantData })

    console.log(`Sending dissent reveals... (node ${nodeIndex})`)
    await sendReveals({
      users: dissentedUsers,
      randomNumbers,
      wasCompliantData: dissentWasCompliantData,
      isDissent: true,
      myJuriNodeAddress,
      myJuriNodePrivateKey,
      NetworkProxyContract,
      web3,
    })
    console.log(`Dissent reveals sent (node ${nodeIndex})!`)
  }

  // await sleep(times[timeForDissentRevealStage])
  await waitForNextStage(nodeIndex)
}

module.exports = runDissentRound
