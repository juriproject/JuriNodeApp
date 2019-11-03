const { Client } = require('ssh2')
const fs = require('fs')
const path = require('path')

const parseMessage = require('./parseMessage')

const privateKey = fs.readFileSync(
  path.resolve(__dirname, '../../JuriNodes.pem')
)

const runRemoteCommand = ({ host, command, outputWriteStream }) => {
  const conn = new Client()

  return new Promise((resolve, reject) => {
    conn
      .on('ready', () => {
        let stdout = ''
        let stderr = ''

        conn.exec(command, (err, stream) => {
          if (err) reject(err)

          stream
            .on('close', (code, signal) => {
              conn.end()

              console.log({ stdout, stderr, code, signal })
              resolve({ stdout, stderr, code, signal })
            })
            .on('data', data => {
              parseMessage({ msg: String(data), resolve, outputWriteStream })
              stdout += data
            })
            .stderr.on('data', data => (stderr += data))
        })
      })
      .connect({
        host,
        port: 22,
        username: 'ubuntu',
        privateKey,
      })
  })
}

module.exports = runRemoteCommand
