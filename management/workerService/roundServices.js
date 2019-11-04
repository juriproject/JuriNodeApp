const path = require('path')
const { Worker } = require('worker_threads')

const parseMessage = require('../lib/parseMessage')

const FINISHED_CONSTANT = require('../../helpers/finishedConstant')

const runJuriNodeRoundsService = ({ outputWriteStream, workerData }) =>
  runRoundsService({
    outputWriteStream,
    servicePath: path.resolve(__dirname, './juriNodeRoundsService.js'),
    workerData,
  })

const runControllerRoundsService = ({ outputWriteStream, workerData }) =>
  runRoundsService({
    outputWriteStream,
    servicePath: path.resolve(__dirname, './controllerRoundsService.js'),
    workerData,
  })

const runRoundsService = ({ outputWriteStream, servicePath, workerData }) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(servicePath, { workerData })
    worker.on('message', msg => {
      if (msg === FINISHED_CONSTANT) resolve()

      parseMessage({
        msg,
        nodeIndex: workerData.nodeIndex,
        outputWriteStream,
      })
    })
    worker.on('error', reject)
    worker.on('exit', code => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`))
    })
  })

module.exports = { runJuriNodeRoundsService, runControllerRoundsService }
