const { getFilestorage } = require('../config/testing')

const downloadHeartRateDataFiles = async ({
  assignedUsers,
  isDownloadingFiles,
  NetworkProxyContract,
  roundIndex,
}) => {
  const heartRateDataFiles = []

  for (let i = 0; i < assignedUsers.length; i++) {
    const userAddress = assignedUsers[i].address
    const storagePath = await NetworkProxyContract.methods
      .getHeartRateDataStoragePath(roundIndex, userAddress)
      .call()

    const heartRateData = isDownloadingFiles
      ? (await getFilestorage().downloadToBuffer(storagePath)).toString('utf-8')
      : (parseInt(userAddress) > Math.pow(16, 40) / 2).toString()

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

const verifyHeartRateData = async ({
  assignedUsers,
  isDownloadingFiles,
  NetworkProxyContract,
  roundIndex,
}) => {
  const heartRateDataFiles = await downloadHeartRateDataFiles({
    assignedUsers,
    isDownloadingFiles,
    NetworkProxyContract,
    roundIndex,
  })

  const wasCompliantData = await analyzeHeartRateData(heartRateDataFiles)
  return wasCompliantData
}

module.exports = verifyHeartRateData
