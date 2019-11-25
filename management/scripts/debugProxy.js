#!/usr/bin/env node

const {
  getBondingContract,
  getNetworkProxyContract,
  networkProxyAddress,
} = require('../../config/contracts')

const { getWeb3 } = require('../../config/skale')

const sendTx = require('../../helpers/sendTx')
const Stages = require('../../helpers/Stages')

const accounts = require('../../config/accounts')

const exec = async () => {
  const isRunningOnAws = true
  const web3 = getWeb3({ isMain: false, isRunningOnAws })
  const NetworkProxyContract = await getNetworkProxyContract(isRunningOnAws)
  const BondingContract = await getBondingContract(isRunningOnAws)

  const roundIndex = await NetworkProxyContract.methods.roundIndex().call()
  const currentStage =
    Stages[await NetworkProxyContract.methods.currentStage().call()]

  const stakingNodesAddressCount = await BondingContract.methods
    .stakingNodesAddressCount(roundIndex)
    .call()
  const nodesToUpdate = await BondingContract.methods
    .receiveNodesAtIndex(0, 4)
    .call()
  const nodeActivityCountsCurrent = await Promise.all(
    nodesToUpdate.map(node =>
      NetworkProxyContract.methods
        .getNodeActivityCount(parseInt(roundIndex) - 1, node)
        .call()
    )
  )
  const totalNodeActivityCount = await NetworkProxyContract.methods
    .getTotalActivityCount(parseInt(roundIndex) - 1)
    .call()
  const skaleMessageProxyAddressMain = await NetworkProxyContract.methods
    .skaleMessageProxyAddressMain()
    .call()

  /* console.log({
    currentStage,
    roundIndex: roundIndex.toString(),
    stakingNodesAddressCount: stakingNodesAddressCount.toString(),
    nodesToUpdate,
    nodeActivityCountsCurrent: nodeActivityCountsCurrent.map(actCnt =>
      actCnt.toString()
    ),
    totalNodeActivityCount: totalNodeActivityCount.toString(),
    skaleMessageProxyAddressMain,
  }) */

  const nodes = accounts.nodes.slice(0, 5).map(({ address }) => address)
  const users = accounts.users.slice(1, 1).map(({ address }) => address)

  const u = '0x7E0c6B2bE8010CcaB4F3C93CD34CD60E6582b21f'
  const c = false
  const r = '0xd0c1294687622ea1828000064a5be1ec2336dd9198b061c3fe5a27e0dc2fea6f'

  console.log({
    expected: require('web3-utils').soliditySha3(c, r),
    inContract: await NetworkProxyContract.methods
      .getUserComplianceDataCommitment(roundIndex, nodes[2], u)
      .call(),
  })

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    for (let j = 0; j < users.length; j++) {
      const user = users[j]

      const lowestHashes = await NetworkProxyContract.methods
        .getUserWorkAssignmentHashes(roundIndex, user)
        .call()
      const wasAssignedToUser = await NetworkProxyContract.methods
        .getWasAssignedToUser(roundIndex, node, user)
        .call()
      const getProofIndicesCount = await NetworkProxyContract.methods
        .getProofIndicesCount(roundIndex, node, user)
        .call()
      const commitment = await NetworkProxyContract.methods
        .getUserComplianceDataCommitment(roundIndex, node, user)
        .call()

      console.log({
        // lowestHashes: lowestHashes.map(
        //  hash => '0x' + new web3.utils.BN(hash).toString(16)
        //),
        wasAssignedToUser,
        getProofIndicesCount,
        // commitment,
      })
    }
  }
}

exec()
