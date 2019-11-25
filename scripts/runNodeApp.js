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
    .option('-r, --is-running-on-aws', 'is running on remote AWS machines')
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

  program.parse(process.argv)

  const {
    incorrectDissentPercentage,
    incorrectResultPercentage,
    maxRounds,
    nodeIndex,
    notRevealPercentage,
    offlinePercentage,
    userCount,
  } = program

  const isDownloadingFiles = program.isDownloadingFiles !== undefined
  const isRunningOnAws = program.isRunningOnAws !== undefined

  runNode({
    parentPort: { postMessage: msg => printOverwriteLog(msg) },
    isDownloadingFiles,
    maxUserCount: parseInt(userCount),
    maxRoundsCount: parseInt(maxRounds),
    isRunningOnAws,
    nodeIndex,
    failureOptions: {
      incorrectDissentPercentage,
      incorrectResultPercentage,
      notRevealPercentage,
      offlinePercentage,
    },
  })
}

exec()
