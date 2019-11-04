#!/usr/bin/env node

const {
  getBondingContract,
  NetworkProxyContract,
} = require('../../config/contracts')

const exec = async () => {
  const BondingContract = await getBondingContract()

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
