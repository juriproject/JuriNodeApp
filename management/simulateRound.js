const fs = require('fs')
const nodeCleanup = require('node-cleanup')
const path = require('path')
const program = require('commander')

const runRemoteCommand = require('./lib/runRemoteCommand')
const setupProxyForNewRound = require('../controllerNode/setupProxyForNewRound')

const {
  runJuriNodeRoundsService,
  runControllerRoundsService,
} = require('./workerService/roundServices')

const outputWriteStreams = []

nodeCleanup(async (_, signal) => {
  if (signal) {
    for (let i = 0; i < outputWriteStreams.length; i++) {
      outputWriteStreams[i].end('\n\nEND OF LOG')
    }

    unsavedData.save(() => process.kill(process.pid, signal))
    nodeCleanup.uninstall()
    return false
  }

  return true
})

const exec = async () => {
  program
    .option(
      '-a, --controller-address <address>',
      'public key of controller',
      '0x350c1088a07AfFCe586695A6a4500F261e68c350'
    )
    .option(
      '-k, --controller-key <key>',
      'private key of controller',
      '0x3D8C59826606D403E2914C75362A2BCD7B5EC7CC2FFDCD2B2F57959549F5B934'
    )
    .option(
      '-t, --time-per-stage <number>',
      'time per stage in seconds',
      Math.floor
    )
    .option('-u, --user-count <number>', 'user count', 4, Math.floor)
    .option('-n, --node-count <number>', 'node count', 4, Math.floor)
    .option('-m, --max-rounds <number>', 'max rounds count', 1, Math.floor)
    .option(
      '-up, --is-uploading-files',
      'is uploading heart rate files to SKALE'
    )
    .option('-r, --is-running-on-aws', 'is running on remote AWS machines')

  program.parse(process.argv)

  const {
    controllerAddress,
    controllerKey,
    maxRounds,
    nodeCount,
    timePerStage,
    userCount,
  } = program

  const isUploadingFiles = program.isUploadingFiles !== undefined
  const isRunningOnAws = program.isRunningOnAws !== undefined

  const controllerKeyBuffer = Buffer.from(controllerKey.slice(2), 'hex')
  const controllerLogFile = 'logs/controllerNode.log'
  const nodeLogFiles = []

  for (let i = 0; i < nodeCount; i++) {
    nodeLogFiles.push(`logs/node${i}.log`)
  }

  const directory = './logs'
  const files = fs.readdirSync(directory)
  for (const file of files) {
    fs.unlinkSync(path.join(directory, file))
  }

  await setupProxyForNewRound({
    controllerAddress,
    controllerKeyBuffer,
    isUploadingFiles,
    maxUserCount: userCount,
  })

  outputWriteStreams.push(fs.createWriteStream(controllerLogFile))

  const awsDnsNames = fs.readFileSync('./awsDnsNames.env')
  const hosts = String(awsDnsNames)
    .split('\n')
    .filter(line => line !== '')
    .reduce((object, line) => {
      const splitLine = line.split('=')
      object[splitLine[0]] = splitLine[1]

      return object
    }, {})

  if (isRunningOnAws)
    runRemoteCommand({
      outputWriteStream: outputWriteStreams[0],
      host: hosts.CONTROLLER_NODE,
      command: `node JuriNodeApp/scripts/runControllerNode.js --controller-address ${controllerAddress} --controller-key ${controllerKey} --time-per-stage ${timePerStage} --user-count ${userCount} --max-rounds ${maxRounds} --is-uploading-files`,
    })
  else
    runControllerRoundsService({
      controllerAddress,
      controllerKeyUint: controllerKeyBuffer,
      isUploadingFiles,
      maxUserCount: userCount,
      maxRoundsCount: maxRounds,
      outputWriteStream: outputWriteStreams[0],
      timePerStage,
    })

  for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex++) {
    outputWriteStreams.push(fs.createWriteStream(nodeLogFiles[nodeIndex]))

    if (isRunningOnAws)
      runRemoteCommand({
        outputWriteStream: outputWriteStreams[nodeIndex + 1],
        host: hosts[`NODE${nodeIndex + 1}`],
        command: `node JuriNodeApp/scripts/runNodeApp.js --node-index=${nodeIndex} --user-count ${userCount} --max-rounds ${maxRounds} ${
          isUploadingFiles ? '--is-downloading-files' : ''
        }`,
      })
    else
      runJuriNodeRoundsService({
        isDownloadingFiles: isUploadingFiles,
        maxRoundsCount: maxRounds,
        maxUserCount: userCount,
        nodeIndex,
        outputWriteStream: outputWriteStreams[nodeIndex + 1],
        failureOptions: {
          isNotRevealing: false,
          isSendingIncorrectResult: false,
          isOffline: false,
          isSendingIncorrectDissent: nodeIndex === 3,
        },
      })
  }
}

exec()
