#!/usr/bin/env node

const fs = require('fs')
const nodeCleanup = require('node-cleanup')
const path = require('path')
const program = require('commander')

const runRemoteCommand = require('../lib/runRemoteCommand')
const setupProxyForNewRound = require('../../controllerNode/setupProxyForNewRound')

const {
  runJuriNodeRoundsService,
  runControllerRoundsService,
} = require('../workerService/roundServices')

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
      '--offline-percentage <number>',
      'chance of a node being offline in each round',
      0,
      Math.floor
    )
    .option(
      '--incorrect-result-percentage <number>',
      'chance of a node giving an incorrect result in each round',
      0,
      Math.floor
    )
    .option(
      '--incorrect-dissent-percentage <number>',
      'chance of a node giving an incorrect dissent in each round',
      0,
      Math.floor
    )
    .option(
      '--not-reveal-percentage <number>',
      'chance of a node not revealing commitment in each round',
      0,
      Math.floor
    )
    .option(
      '-up, --is-uploading-files',
      'is uploading heart rate files to SKALE'
    )
    .option('-r, --is-running-on-aws', 'is running on remote AWS machines')

  program.parse(process.argv)

  const {
    controllerAddress,
    controllerKey,
    incorrectDissentPercentage,
    incorrectResultPercentage,
    maxRounds,
    nodeCount,
    notRevealPercentage,
    offlinePercentage,
    timePerStage,
    userCount,
  } = program

  const isUploadingFiles = program.isUploadingFiles !== undefined
  const isRunningOnAws = program.isRunningOnAws !== undefined

  const directory = path.resolve(__dirname, '../logs')

  const controllerKeyBuffer = Buffer.from(controllerKey.slice(2), 'hex')
  const controllerLogFile = directory + '/controllerNode.log'
  const nodeLogFiles = []

  for (let i = 0; i < nodeCount; i++) {
    nodeLogFiles.push(directory + `/node${i}.log`)
  }

  const files = fs.readdirSync(directory)
  for (const file of files) {
    fs.unlinkSync(path.join(directory, file))
  }

  await setupProxyForNewRound({
    controllerAddress,
    controllerKeyBuffer,
    isUploadingFiles,
    isRunningOnAws,
    maxUserCount: userCount,
  })

  outputWriteStreams.push(fs.createWriteStream(controllerLogFile))

  const awsDnsNamesFilePath = path.resolve(
    __dirname,
    '../../config/awsDnsNames.env'
  )
  const awsDnsNames = fs.readFileSync(awsDnsNamesFilePath)
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
      command: `node JuriNodeApp/scripts/runControllerNode.js --controller-address ${controllerAddress} --controller-key ${controllerKey} --time-per-stage ${timePerStage} --user-count ${userCount} --max-rounds ${maxRounds} --is-uploading-files --is-running-on-aws`,
    })
  else
    runControllerRoundsService({
      outputWriteStream: outputWriteStreams[0],
      workerData: {
        controllerAddress,
        controllerKeyUint: controllerKeyBuffer,
        isRunningOnAws,
        isUploadingFiles,
        maxUserCount: parseInt(userCount),
        maxRoundsCount: parseInt(maxRounds),
        timePerStage: parseInt(timePerStage),
      },
    })

  for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex++) {
    outputWriteStreams.push(fs.createWriteStream(nodeLogFiles[nodeIndex]))

    if (isRunningOnAws)
      runRemoteCommand({
        outputWriteStream: outputWriteStreams[nodeIndex + 1],
        host: hosts[`NODE${nodeIndex + 1}`],
        command: `node JuriNodeApp/scripts/runNodeApp.js --node-index=${nodeIndex} --is-running-on-aws --user-count ${userCount} --max-rounds ${maxRounds} ${
          isUploadingFiles ? '--is-downloading-files' : ''
        } --incorrect-result-percentage ${incorrectResultPercentage} --incorrect-dissent-percentage ${incorrectDissentPercentage} --offline-percentage ${offlinePercentage} --not-reveal-percentage ${notRevealPercentage}`,
      })
    else
      runJuriNodeRoundsService({
        outputWriteStream: outputWriteStreams[nodeIndex + 1],
        workerData: {
          isDownloadingFiles: isUploadingFiles,
          isRunningOnAws,
          maxRoundsCount: parseInt(maxRounds),
          maxUserCount: parseInt(userCount),
          nodeIndex,
          failureOptions: {
            incorrectDissentPercentage,
            incorrectResultPercentage,
            notRevealPercentage,
            offlinePercentage,
          },
        },
      })
  }
}

exec()
