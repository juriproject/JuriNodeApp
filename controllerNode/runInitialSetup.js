const {
  getBondingAddress,
  getBondingContract,
  // getJuriFeesTokenAddress,
  // getJuriFeesTokenContract,
  getJuriTokenAddress,
  getJuriTokenContract,
  networkProxyAddress,
  getNetworkProxyContract,
} = require('../config/contracts')

const { getWeb3 } = require('../config/skale')

const { controllerNode, nodes, users } = require('../config/accounts')

const sendTx = require('../helpers/sendTx')
const overwriteLog = require('../helpers/overwriteLogLib/overwriteLog')

const runInitialSetup = async ({
  bondingAddress,
  BondingContract,
  juriTokenAddress,
  JuriTokenContract,
  NetworkProxyContract,
  originalAccount,
  originalPrivateKey,
  web3,
}) => {
  const oneEther = new web3.utils.BN('1000000000000000000')
  const Ether1e17 = new web3.utils.BN('100000000000000000')

  const nonceOriginalAccount1 = await web3.eth.getTransactionCount(
    originalAccount
  )

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    overwriteLog(`Send 0.1 Eth to node ${i}...`)
    await sendTx({
      data: 0x0,
      from: originalAccount,
      nonce: nonceOriginalAccount1 + i,
      to: node.address,
      privateKey: originalPrivateKey,
      value: Ether1e17,
      web3,
    })
  }

  overwriteLog(`Sending Ether to nodes finished!`)
  process.stdout.write('\n')

  const nonceOriginalAccount2 = await web3.eth.getTransactionCount(
    originalAccount
  )

  for (let i = 0; i < users.length; i++) {
    const user = users[i]

    overwriteLog(`Send 0.1 Eth to user ${i}...`)

    await sendTx({
      data: 0x0,
      from: originalAccount,
      nonce: nonceOriginalAccount2 + i,
      to: user.address,
      privateKey: originalPrivateKey,
      value: Ether1e17,
      web3,
    })
  }

  overwriteLog(`Sending Ether to users finished!`)
  process.stdout.write('\n')

  const nonceOriginalAccount3 = await web3.eth.getTransactionCount(
    originalAccount
  )

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    overwriteLog(`   Mint 10,000 tokens to node ${i}...`)

    const tenThousandEther = oneEther.mul(new web3.utils.BN(10000))

    await sendTx({
      data: JuriTokenContract.methods
        .mint(node.address, tenThousandEther.toString())
        .encodeABI(),
      from: originalAccount,
      nonce: nonceOriginalAccount3 + i,
      to: juriTokenAddress,
      privateKey: originalPrivateKey,
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
    from: originalAccount,
    to: networkProxyAddress,
    privateKey: originalPrivateKey,
    web3,
  })
  overwriteLog(`Moved to next round!`)
  process.stdout.write('\n')
}

const exec = async () => {
  const isRunningOnAws = process.env.IS_RUNNING_ON_AWS === 'true'

  const originalAccount = controllerNode.address
  const originalPrivateKey = controllerNode.privateKeyBuffer

  const NetworkProxyContract = getNetworkProxyContract(isRunningOnAws)
  const web3 = getWeb3({ isMain: false, isRunningOnAws })

  const bondingAddress = await getBondingAddress(isRunningOnAws)
  const BondingContract = await getBondingContract(isRunningOnAws)
  // const juriFeesTokenAdress = await getJuriFeesTokenAddress()
  // const JuriFeesTokenContract = await getJuriFeesTokenContract()
  const juriTokenAddress = await getJuriTokenAddress(isRunningOnAws)
  const JuriTokenContract = await getJuriTokenContract(isRunningOnAws)

  /* const accounts = new Array(14)
    .fill(0)
    .map((_, i) => web3.eth.accounts.create(`${Date.now().toString()}${i}`))
    .map(({ address, privateKey }) => ({ address, privateKey })) */

  await runInitialSetup({
    bondingAddress,
    BondingContract,
    juriTokenAddress,
    JuriTokenContract,
    NetworkProxyContract,
    originalAccount,
    originalPrivateKey,
    web3,
  })
}

exec()
