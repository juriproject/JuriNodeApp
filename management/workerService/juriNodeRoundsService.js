const { workerData, parentPort } = require('worker_threads')
const runJuriNodeRounds = require('../../juriNode')

runJuriNodeRounds({ ...workerData, parentPort })
