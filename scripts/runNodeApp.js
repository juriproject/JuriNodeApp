#!/usr/bin/env node
const program = require('commander')

const printOverwriteLog = require('../helpers/overwriteLogLib/printOverwriteLog')
const runNode = require('../juriNode/')

const exec = () => {
  program
    .option('-i, --node-index <number>', 'node index', 0, Math.floor)
    .option('-u, --user-count <number>', 'user count', 4, Math.floor)
    .option('-m, --max-rounds <number>', 'max rounds count', 1, Math.floor)
    .option(
      '-d, --is-downloading-files',
      'is uploading heart rate files to SKALE'
    )

  program.parse(process.argv)

  const { maxRounds, nodeIndex, userCount } = program

  const isDownloadingFiles = program.isDownloadingFiles !== undefined

  runNode({
    parentPort: { postMessage: msg => printOverwriteLog(msg) },
    isDownloadingFiles,
    maxUserCount: parseInt(userCount),
    maxRoundsCount: parseInt(maxRounds),
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
