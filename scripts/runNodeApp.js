#!/usr/bin/env node
const program = require('commander')

const runNode = require('../juriNode/')

const exec = () => {
  program
    .option('-i, --node-index <number>', 'node index', 0, Math.floor)
    .option('-u, --user-count <number>', 'user count', 4, Math.floor)
    .option('-m, --max-rounds <number>', 'max rounds count', 1, Math.floor)
    .option(
      '-up, --is-uploading-files',
      'is uploading heart rate files to SKALE'
    )

  program.parse(process.argv)

  const { maxRounds, nodeIndex, userCount } = program

  const isUploadingFiles = program.isUploadingFiles !== undefined

  runNode({
    parentPort: { postMessage: msg => console.log(msg) },
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

exec()
