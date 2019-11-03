#!/usr/bin/env node
const program = require('commander')

const printOverwriteLog = require('../helpers/overwriteLogLib/printOverwriteLog')
const runControllerNode = require('../controllerNode/')

const exec = () => {
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
    .option('-m, --max-rounds <number>', 'max rounds count', 1, Math.floor)
    .option(
      '-up, --is-uploading-files',
      'is uploading heart rate files to SKALE'
    )

  program.parse(process.argv)

  const {
    controllerAddress,
    controllerKey,
    maxRounds,
    timePerStage,
    userCount,
  } = program

  const controllerKeyBuffer = Buffer.from(controllerKey.slice(2), 'hex')
  const isUploadingFiles = program.isUploadingFiles !== undefined

  runControllerNode({
    parentPort: { postMessage: msg => printOverwriteLog(msg) },
    controllerAddress,
    controllerKeyBuffer,
    isUploadingFiles,
    maxUserCount: userCount,
    maxRoundsCount: maxRounds,
    timePerStage,
  })
}

exec()
