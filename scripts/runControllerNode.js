#!/usr/bin/env node
const program = require('commander')

const runControllerNode = require('../controllerNode/')

const exec = () => {
  program
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

  const isUploadingFiles = program.isUploadingFiles !== undefined

  runControllerNode({
    controllerAddress,
    controllerKeyBuffer: Buffer.from(controllerKey),
    isUploadingFiles,
    maxUserCount: userCount,
    maxRoundsCount: maxRounds,
    timePerStage,
  })
}

exec()
