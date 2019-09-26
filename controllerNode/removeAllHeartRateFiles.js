const { users } = require('../config/accounts')
const { fileStorage } = require('../config/testing')
const overwriteLog = require('../helpers/overwriteLog')

const removeAllHeartRateFiles = async () => {
  overwriteLog(`Delete heart rate files for user ${0}...`)

  for (let i = 0; i < users.length; i++) {
    overwriteLog(`Delete heart rate files for user ${i}...`)

    const user = users[i]

    // const files = await fileStorage.getFileInfoListByAddress(user.address)
    // console.log({ files })

    // const fileName = `userHeartrateDataTest-${Date.now()}`

    const files = await fileStorage.listDirectory(`${user.address.slice(2)}`)
    console.log({ files })
    // await fileStorage.deleteDirectory(user.address, '/', user.privateKey)
    // await fileStorage.deleteFile(user.address, 'Hello World-3', user.privateKey)

    overwriteLog(`Deleted files for user ${i}!`)
    process.stdout.write('\n')
  }
}

removeAllHeartRateFiles()

module.exports = removeAllHeartRateFiles
