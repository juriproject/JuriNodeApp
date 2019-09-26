const { NetworkProxyContract } = require('../config/contracts')
const { fileStorage } = require('../config/testing')

const downloadHeartRateDataFiles = async ({ assignedUsers, roundIndex }) => {
  const heartRateDataFiles = []

  for (let i = 0; i < assignedUsers.length; i++) {
    const userAddress = assignedUsers[i].address
    const storagePath = await NetworkProxyContract.methods
      .getHeartRateDataStoragePath(roundIndex, userAddress)
      .call()

    const heartRateData = (await fileStorage.downloadToBuffer(
      storagePath
    )).toString('utf-8')

    heartRateDataFiles.push({
      user: userAddress,
      data: heartRateData,
    })
  }

  return heartRateDataFiles
}

const analyzeHeartRateData = async heartRateDataFiles => {
  const wasCompliantData = []

  for (let i = 0; i < heartRateDataFiles.length; i++) {
    const { user, data } = heartRateDataFiles[i]
    wasCompliantData.push({
      user,
      wasCompliant: data === 'true', // TODO
    })
  }

  return wasCompliantData
}

const verifyHeartRateData = async ({ assignedUsers, roundIndex }) => {
  const heartRateDataFiles = await downloadHeartRateDataFiles({
    assignedUsers,
    roundIndex,
  })

  const wasCompliantData = await analyzeHeartRateData(heartRateDataFiles)
  return wasCompliantData
}

module.exports = verifyHeartRateData
