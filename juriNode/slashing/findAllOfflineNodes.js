const findAllOfflineNodes = async ({
  allNodes,
  dissentedUsers,
  NetworkProxyContract,
  roundIndex,
}) => {
  const offlineNodes = []

  for (let i = 0; i < allNodes.length; i++) {
    for (let j = 0; j < dissentedUsers.length; j++) {
      const node = allNodes[i]
      const dissentedUser = dissentedUsers[j]
      const commitment = await NetworkProxyContract.methods
        .getUserComplianceDataCommitment(roundIndex, node, dissentedUser)
        .call()

      if (commitment == 0x0) {
        offlineNodes.push({ toSlash: node, user: dissentedUser })
        break
      }
    }
  }

  return offlineNodes
}

module.exports = findAllOfflineNodes
