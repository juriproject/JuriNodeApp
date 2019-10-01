const fs = require('fs')
const nodeCleanup = require('node-cleanup')
const path = require('path')
const program = require('commander')
const { Worker } = require('worker_threads')

const setupProxyForNewRound = require('../controllerNode/setupProxyForNewRound')

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
    .option('-d, --debug', 'output extra debugging')
    .option(
      '-a, --controller-address <address>',
      'public key of controller',
      '0x350c1088a07AfFCe586695A6a4500F261e68c350'
    )
    .option('-k, --controller-key <key>', 'private key of controller')
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

  program.parse(process.argv)

  const {
    controllerAddress,
    controllerKey,
    debug,
    maxRounds,
    nodeCount,
    timePerStage,
    userCount,
  } = program

  const isUploadingFiles = program.isUploadingFiles !== undefined

  if (debug) console.log(program.opts())

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

  runControllerRoundsService({
    controllerAddress,
    controllerKeyUint: controllerKeyBuffer,
    isUploadingFiles,
    maxUserCount: userCount,
    maxRoundsCount: maxRounds,
    timePerStage,
  })

  for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex++) {
    outputWriteStreams.push(fs.createWriteStream(nodeLogFiles[nodeIndex]))

    runJuriNodeRoundsService({
      isDownloadingFiles: isUploadingFiles,
      maxRoundsCount: maxRounds,
      maxUserCount: userCount,
      nodeIndex,
      failureOptions: {
        isNotRevealing: false,
        isSendingIncorrectResult: false,
        isOffline: false,
        isSendingIncorrectDissent: false,
      },
    })
  }
}

const runJuriNodeRoundsService = workerData =>
  runRoundsService({ servicePath: './juriNodeRoundsService.js', workerData })

const runControllerRoundsService = workerData =>
  runRoundsService({ servicePath: './controllerRoundsService.js', workerData })

const runRoundsService = ({ servicePath, workerData }) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(servicePath, { workerData })
    worker.on('message', msg =>
      parseMessage({ msg, nodeIndex: workerData.nodeIndex, resolve })
    )
    worker.on('error', reject)
    worker.on('exit', code => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`))
    })
  })

const OVERWRITE_START_MSG = 'OVERWRITE_START'
const OVERWRITE_END_MSG = 'OVERWRITE_END'

const parseMessage = ({ msg, nodeIndex, resolve }) => {
  if (msg === 'FINISHED') return resolve(msg)

  const streamIndex = nodeIndex === undefined ? 0 : nodeIndex + 1

  const modifiedMsg = typeof msg === 'string' ? msg : JSON.stringify(msg)

  if (modifiedMsg.startsWith(OVERWRITE_START_MSG)) {
    outputWriteStreams[streamIndex].write(
      modifiedMsg.substr(OVERWRITE_START_MSG.length)
    )
    return
  }

  if (modifiedMsg.startsWith(OVERWRITE_END_MSG)) {
    // doesnt work :( requires tty stream
    // readline.clearLine(outputWriteStreams[streamIndex], 0)
    // readline.cursorTo(outputWriteStreams[streamIndex], 0)

    outputWriteStreams[streamIndex].write(
      modifiedMsg.substr(OVERWRITE_END_MSG.length) + '\n'
    )
    return
  }

  outputWriteStreams[streamIndex].write(modifiedMsg + '\n')
}

exec()
