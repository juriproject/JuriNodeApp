'use strict'

const { spawnSync } = require('child_process'),
  ls = spawnSync('aws', ['ec2', 'describe-instances'])

const fs = require('fs')
const data = JSON.parse(ls.stdout.toString())

const allInstancesWithName = data.Reservations.map(item =>
  item.Instances.map(({ PublicDnsName, Tags }) => ({
    PublicDnsName,
    Name: Tags.filter(({ Key }) => Key === 'Name')[0].Value,
  }))
)
  .flat()
  .filter(({ PublicDnsName }) => PublicDnsName !== '')

let fileData = ''
let awsControllerUrl

allInstancesWithName.forEach(({ Name, PublicDnsName }) => {
  fileData += `${Name}=${PublicDnsName}\n`

  if (Name === 'CONTROLLER_NODE') awsControllerUrl = PublicDnsName
})

fs.writeFile(
  './awsControllerUrl.js',
  `module.exports = '${awsControllerUrl}'\n`,
  err => {
    if (err) {
      return console.log(err)
    }

    console.log('Saved awsControllerUrl successfully!')
  }
)

fs.writeFile('./awsDnsNames.env', fileData, err => {
  if (err) {
    return console.log(err)
  }

  console.log('Fetched and saved dns names successfully!')
})
