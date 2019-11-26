const findAllIncorrectResultNodes = async ({
  allNodes,
  allUsers,
  bondingAddress,
  NetworkProxyContract,
  nodeIndex,
  roundIndex,
}) => {
  const incorrectResultNodes = []

  const firstUserIndex = nodeIndex - 4 < 0 ? 0 : nodeIndex - 4
  const lastUserIndex =
    nodeIndex + 4 > allUsers.length ? allUsers.length : nodeIndex + 4

  for (let i = 0; i < allNodes.length; i++) {
    for (let j = firstUserIndex; j < lastUserIndex; j++) {
      const node = allNodes[i]
      const user = allUsers[j]

      const [givenAnswer, hasRevealed, userComplianceData] = await Promise.all([
        NetworkProxyContract.methods
          .getGivenNodeResult(roundIndex, node, user)
          .call(),
        NetworkProxyContract.methods
          .getHasRevealed(roundIndex, node, user)
          .call(),
        NetworkProxyContract.methods
          .getUserComplianceData(roundIndex, user)
          .call({ from: bondingAddress }),
      ])

      const acceptedAnswer = parseInt(userComplianceData) >= 0

      if (hasRevealed && givenAnswer !== acceptedAnswer) {
        incorrectResultNodes.push({ toSlash: node, user })
        break
      }
    }
  }

  return incorrectResultNodes
}

module.exports = findAllIncorrectResultNodes
