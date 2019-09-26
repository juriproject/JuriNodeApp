const { controllerNode, users } = require('../config/accounts')
const {
  NetworkProxyContract,
  networkProxyAddress,
} = require('../config/contracts')
const { fileStorage, web3 } = require('../config/testing')

const overwriteLog = require('../helpers/overwriteLog')
const sendTx = require('../helpers/sendTx')

const addUserHeartRateFiles = async maxUserCount => {
  overwriteLog('Moving to users adding heart rate data stage...')
  await sendTx({
    data: NetworkProxyContract.methods
      .moveToUserAddingHeartRateDataStage()
      .encodeABI(),
    from: controllerNode.address,
    to: networkProxyAddress,
    privateKey: controllerNode.privateKeyBuffer,
    web3,
  })
  overwriteLog(`Moved to users adding heart rate data stage!`)
  process.stdout.write('\n')

  const fileStoragePaths = []
  const userCount = maxUserCount || users.length

  for (let i = 0; i < userCount; i++) {
    overwriteLog(`Upload heart rate file for user ${i}...`)

    const user = users[i]
    const fileName = `userHeartrateDataTest-${Date.now()}`
    const fileBuffer = Buffer.from((Math.random() > 0.5).toString()) // TODO

    const storedFilePath = await fileStorage.uploadFile(
      user.address,
      fileName,
      fileBuffer,
      user.privateKey
    )
    // const storedFilePath = `${user.address.slice(2)}\\${fileName}`

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

  overwriteLog(`Heart rate files uploaded!`)
  process.stdout.write('\n')

  return fileStoragePaths
}

module.exports = addUserHeartRateFiles
