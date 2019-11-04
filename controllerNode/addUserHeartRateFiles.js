const { users } = require('../config/accounts')
const {
  getNetworkProxyContract,
  networkProxyAddress,
} = require('../config/contracts')
const { getFilestorage } = require('../config/testing')

const { getWeb3 } = require('../config/skale')

const overwriteLog = require('../helpers/overwriteLogLib/overwriteLog')
const overwriteLogEnd = require('../helpers/overwriteLogLib/overwriteLogEnd')
const sendTx = require('../helpers/sendTx')

const addUserHeartRateFiles = async ({
  controllerAddress,
  controllerKeyBuffer,
  isUploadingFiles,
  isRunningOnAws,
  maxUserCount,
  parentPort,
}) => {
  const web3 = getWeb3({ isMain: false, isRunningOnAws })
  const NetworkProxyContract = getNetworkProxyContract()

  overwriteLog('Moving to users adding heart rate data stage...', parentPort)
  await sendTx({
    data: NetworkProxyContract.methods
      .moveToUserAddingHeartRateDataStage()
      .encodeABI(),
    from: controllerAddress,
    to: networkProxyAddress,
    privateKey: controllerKeyBuffer,
    web3,
  })
  overwriteLogEnd(`Moved to users adding heart rate data stage!`, parentPort)

  const fileStoragePaths = []
  const userCount = maxUserCount || users.length

  for (let i = 0; i < userCount; i++) {
    overwriteLog(`Upload heart rate file for user ${i}...`, parentPort)

    const user = users[i]
    const fileName = `userHeartrateDataTest-${Date.now()}`
    const fileBuffer = Buffer.from((Math.random() > 0.5).toString()) // TODO

    const storedFilePath = isUploadingFiles
      ? await getFilestorage().uploadFile(
          user.address,
          fileName,
          fileBuffer,
          user.privateKey
        )
      : `${user.address.slice(2)}\\${fileName}`

    const modifiedFilePath = storedFilePath.replace('\\', '/')
    fileStoragePaths.push(modifiedFilePath)

    /* const status = (await new FilestorageContract(web3).getFileStatus(
      modifiedFilePath
    )).toString()
    console.log({ modifiedFilePath, status }) */

    const userWorkoutSignature = (
      '0x' +
      i +
      '000000000000000000000000000000f726c6448656c6c6f576f726c642100'
    ).slice(0, 64)

    await sendTx({
      data: NetworkProxyContract.methods
        .addHeartRateDateForPoolUser(userWorkoutSignature, modifiedFilePath)
        .encodeABI(),
      from: user.address,
      to: networkProxyAddress,
      privateKey: user.privateKeyBuffer,
      web3,
    })
  }

  overwriteLogEnd(`Heart rate files uploaded!`, parentPort)

  return fileStoragePaths
}

module.exports = addUserHeartRateFiles
