const findAllIncorrectResultNodes = async ({
  allNodes,
  bondingAddress,
  dissentedUsers,
  NetworkProxyContract,
  roundIndex,
}) => {
  const incorrectResultNodes = []

  for (let i = 0; i < allNodes.length; i++) {
    for (let j = 0; j < dissentedUsers.length; j++) {
      const node = allNodes[i]
      const user = dissentedUsers[j]

      const [givenAnswer, userComplianceData] = await Promise.all([
        NetworkProxyContract.methods
          .getGivenNodeResult(roundIndex, node, user)
          .call(),
        NetworkProxyContract.methods
          .getUserComplianceData(roundIndex, user)
          .call({ from: bondingAddress }),
      ])

      const acceptedAnswer = parseInt(userComplianceData) >= 0

      if (givenAnswer !== acceptedAnswer) {
        incorrectResultNodes.push({ toSlash: node, user })
        break
      }
    }
  }

  return incorrectResultNodes
}

module.exports = findAllIncorrectResultNodes
