const { workerData, parentPort } = require('worker_threads')
const runControllerRounds = require('../controllerNode/index')

runControllerRounds({ ...workerData, parentPort })
