const runRemoteCommand = require('./lib/runRemoteCommand')

const exec = async () => {
  const result = await runRemoteCommand({
    host: 'ec2-3-105-229-188.ap-southeast-2.compute.amazonaws.com',
    command: 'ls -lisa',
  })

  console.log({ result })
}

exec()
