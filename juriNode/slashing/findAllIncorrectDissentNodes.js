const findAllIncorrectDissentNodes = async ({
  allNodes,
  dissentedUsers,
  NetworkProxyContract,
  roundIndex,
}) => {
  const incorrectDissentNodes = []

  for (let i = 0; i < allNodes.length; i++) {
    for (let j = 0; j < dissentedUsers.length; j++) {
      const node = allNodes[i]
      const user = dissentedUsers[j]

      const [hasDissented, previousAnswer, acceptedAnswer] = await Promise.all([
        NetworkProxyContract.methods
          .getHasDissented(roundIndex, node, user)
          .call(),
        NetworkProxyContract.methods
          .getComplianceDataBeforeDissent(roundIndex, user)
          .call(),
        NetworkProxyContract.methods
          .getGivenNodeResult(roundIndex, node, user)
          .call(),
      ])

      if (hasDissented && parseInt(previousAnswer) >= 0 === acceptedAnswer) {
        incorrectDissentNodes.push({ toSlash: node, user })
        break
      }
    }
  }

  return incorrectDissentNodes
}

module.exports = findAllIncorrectDissentNodes
