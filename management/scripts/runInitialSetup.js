#!/usr/bin/env node

const program = require('commander')

const {
  getBondingAddress,
  getBondingContract,
  // getJuriFeesTokenAddress,
  // getJuriFeesTokenContract,
  getJuriTokenAddress,
  getJuriTokenContract,
  networkProxyAddress,
  getNetworkProxyContract,
} = require('../../config/contracts')

const { getWeb3 } = require('../../config/skale')

const { nodes, users } = require('../../config/accounts')

const sendTx = require('../../helpers/sendTx')
const overwriteLog = require('../../helpers/overwriteLogLib/overwriteLog')

const runInitialSetup = async ({
  bondingAddress,
  BondingContract,
  controllerAddress,
  controllerKeyBuffer,
  juriTokenAddress,
  JuriTokenContract,
  NetworkProxyContract,
  web3,
}) => {
  const oneEther = new web3.utils.BN('1000000000000000000')
  const Ether1e17 = new web3.utils.BN('100000000000000000')

  const nonceOriginalAccount1 = await web3.eth.getTransactionCount(
    controllerAddress
  )

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    overwriteLog(`Send 0.1 Eth to node ${i}...`)
    await sendTx({
      data: 0x0,
      from: controllerAddress,
      nonce: nonceOriginalAccount1 + i,
      to: node.address,
      privateKey: controllerKeyBuffer,
      value: Ether1e17,
      web3,
    })
  }

  overwriteLog(`Sending Ether to nodes finished!`)
  process.stdout.write('\n')

  const nonceOriginalAccount2 = await web3.eth.getTransactionCount(
    controllerAddress
  )

  for (let i = 0; i < users.length; i++) {
    const user = users[i]

    overwriteLog(`Send 0.1 Eth to user ${i}...`)

    await sendTx({
      data: 0x0,
      from: controllerAddress,
      nonce: nonceOriginalAccount2 + i,
      to: user.address,
      privateKey: controllerKeyBuffer,
      value: Ether1e17,
      web3,
    })
  }

  overwriteLog(`Sending Ether to users finished!`)
  process.stdout.write('\n')

  const nonceOriginalAccount3 = await web3.eth.getTransactionCount(
    controllerAddress
  )

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    overwriteLog(`   Mint 10,000 tokens to node ${i}...`)

    const tenThousandEther = oneEther.mul(new web3.utils.BN(10000))

    await sendTx({
      data: JuriTokenContract.methods
        .mint(node.address, tenThousandEther.toString())
        .encodeABI(),
      from: controllerAddress,
      nonce: nonceOriginalAccount3 + i,
      to: juriTokenAddress,
      privateKey: controllerKeyBuffer,
      web3,
    })

    overwriteLog(`Approve 10,000 token from node ${i}...`)

    await sendTx({
      data: JuriTokenContract.methods
        .approve(bondingAddress, tenThousandEther.toString())
        .encodeABI(),
      from: node.address,
      to: juriTokenAddress,
      privateKey: node.privateKeyBuffer,
      web3,
    })

    overwriteLog(`   Bond 10,000 token for node ${i}...`)

    await sendTx({
      data: BondingContract.methods
        .bondStake(tenThousandEther.toString())
        .encodeABI(),
      from: node.address,
      to: bondingAddress,
      privateKey: node.privateKeyBuffer,
      web3,
    })
  }

  overwriteLog(`Bonding tokens finished!`)
  process.stdout.write('\n')

  overwriteLog('Moving to next round...')
  await sendTx({
    data: NetworkProxyContract.methods.debugIncreaseRoundIndex().encodeABI(),
    from: controllerAddress,
    to: networkProxyAddress,
    privateKey: controllerKeyBuffer,
    web3,
  })
  overwriteLog(`Moved to next round!`)
  process.stdout.write('\n')
}

const exec = async () => {
  program
    .option(
      '-a, --controller-address <address>',
      'public key of controller',
      '0x350c1088a07AfFCe586695A6a4500F261e68c350'
    )
    .option(
      '-k, --controller-key <key>',
      'private key of controller',
      '0x3D8C59826606D403E2914C75362A2BCD7B5EC7CC2FFDCD2B2F57959549F5B934'
    )
    .option('-r, --is-running-on-aws', 'is running on remote AWS machines')

  program.parse(process.argv)

  const { controllerAddress, controllerKey } = program
  const isRunningOnAws = program.isRunningOnAws !== undefined

  const controllerKeyBuffer = Buffer.from(controllerKey.slice(2), 'hex')
  const NetworkProxyContract = getNetworkProxyContract(isRunningOnAws)
  const web3 = getWeb3({ isMain: false, isRunningOnAws })

  const bondingAddress = await getBondingAddress(isRunningOnAws)
  const BondingContract = await getBondingContract(isRunningOnAws)
  const juriTokenAddress = await getJuriTokenAddress(isRunningOnAws)
  const JuriTokenContract = await getJuriTokenContract(isRunningOnAws)

  await runInitialSetup({
    bondingAddress,
    BondingContract,
    controllerAddress,
    controllerKeyBuffer,
    juriTokenAddress,
    JuriTokenContract,
    NetworkProxyContract,
    web3,
  })

  console.log('Finished!')
  process.exit(0)
}

exec()
