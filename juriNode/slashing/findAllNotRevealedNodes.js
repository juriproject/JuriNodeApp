const { ZERO_ADDRESS } = require('../../config/testing')

const findAllNotRevealedNodes = async ({
  allNodes,
  allUsers,
  NetworkProxyContract,
  nodeIndex,
  roundIndex,
}) => {
  const notRevealedNodes = []

  const firstUserIndex = nodeIndex - 4 < 0 ? 0 : nodeIndex - 4
  const lastUserIndex =
    nodeIndex + 4 > allUsers.length ? allUsers.length : nodeIndex + 4

  for (let i = 0; i < allNodes.length; i++) {
    for (let j = firstUserIndex; j < lastUserIndex; j++) {
      const node = allNodes[i]
      const user = allUsers[j]

      const value = await NetworkProxyContract.methods
        .getUserComplianceDataCommitment(roundIndex, node, user)
        .call()

      if (
        value !== ZERO_ADDRESS &&
        !(await NetworkProxyContract.methods
          .getHasRevealed(roundIndex, node, user)
          .call())
      ) {
        notRevealedNodes.push({ toSlash: node, user })
        break
      }
    }
  }

  return notRevealedNodes
}

module.exports = findAllNotRevealedNodes
