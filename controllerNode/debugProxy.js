const {
  getBondingAddress,
  getBondingContract,
  getJuriFeesTokenAddress,
  getJuriFeesTokenContract,
  getJuriTokenAddress,
  getJuriTokenContract,
  networkProxyAddress,
  NetworkProxyContract,
} = require('../config/contracts')

const TestContractAbi = [
  {
    constant: true,
    inputs: [],
    name: 'skaleMessageProxySide',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'skaleMessageProxyAddressMain',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        name: '_skaleMessageProxyAddressMain',
        type: 'address',
      },
      {
        name: '_skaleMessageProxyAddressSide',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    constant: false,
    inputs: [],
    name: 'sendMessageToSkale',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const { web3 } = require('../config/testing')

const { BN } = web3.utils

const { controllerNode, nodes, users } = require('../config/accounts')

const sendTx = require('../helpers/sendTx')

const exec = async () => {
  const originalAccount = controllerNode.address
  const originalPrivateKey = controllerNode.privateKeyBuffer

  const bondingAddress = await getBondingAddress()
  const BondingContract = await getBondingContract()
  const juriFeesTokenAdress = await getJuriFeesTokenAddress()
  const JuriFeesTokenContract = await getJuriFeesTokenContract()
  const juriTokenAddress = await getJuriTokenAddress()
  const JuriTokenContract = await getJuriTokenContract()

  const testContractAddress = '0x0Cc64B7F7802c9861CA1cb9Cb64629DF52437438'
  const TestContract = new web3.eth.Contract(
    TestContractAbi,
    testContractAddress
  )

  const result = await sendTx({
    data: TestContract.methods.sendMessageToSkale().encodeABI(),
    from: originalAccount,
    privateKey: originalPrivateKey,
    to: testContractAddress,
    web3,
  })

  console.log({ result })
  process.exit(0)

  const roundIndex = await NetworkProxyContract.methods.roundIndex().call()
  const stakingNodesAddressCount = await BondingContract.methods
    .stakingNodesAddressCount(roundIndex)
    .call()
  const nodesToUpdate = await BondingContract.methods
    .receiveNodesAtIndex(0, 2)
    .call()
  const nodeActivityCountsCurrent = await Promise.all(
    nodesToUpdate.map(node =>
      NetworkProxyContract.methods.getNodeActivityCount(roundIndex, node).call()
    )
  )
  const totalNodeActivityCount = await NetworkProxyContract.methods
    .getTotalActivityCount(roundIndex)
    .call()
  const skaleMessageProxyAddressMain = await NetworkProxyContract.methods
    .skaleMessageProxyAddressMain()
    .call()

  console.log({
    roundIndex: roundIndex.toString(),
    stakingNodesAddressCount: stakingNodesAddressCount.toString(),
    nodesToUpdate,
    nodeActivityCountsCurrent: nodeActivityCountsCurrent.map(actCnt =>
      actCnt.toString()
    ),
    totalNodeActivityCount: totalNodeActivityCount.toString(),
    skaleMessageProxyAddressMain,
  })

  const data = await NetworkProxyContract.methods.debugMoveToNextRound().call()
  console.log({
    data,
  })
}

exec()
