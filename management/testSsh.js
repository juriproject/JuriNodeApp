const runRemoteCommand = require('./lib/runRemoteCommand')

const awsDnsNames = require('fs').readFileSync('./awsDnsNames.env')

const exec = async () => {
  console.log({
    awsDnsNames: String(awsDnsNames)
      .split('\n')
      .filter(line => line !== '')
      .reduce((object, line) => {
        const splitLine = line.split('=')
        object[splitLine[0]] = splitLine[1]

        return object
      }, {}),
  })

  return
  const result = await runRemoteCommand({
    host: 'ec2-13-211-211-19.ap-southeast-2.compute.amazonaws.com',
    command: 'find test /tmp',
  })

  console.log({ result })
}

exec()
