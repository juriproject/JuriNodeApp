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
  const isRunningOnAws = false
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

  const complianceData = [
    false,
    false,
    false,
    true,
    false,
    false,
    true,
    true,
    true,
    false,
    false,
    false,
    false,
    true,
    true,
    true,
    false,
  ]
  const myJuriNodeAddress = '0xDa12C700772F053B5a57CcF403339AA89c060926'
  const allDissentedUsers = await NetworkProxyContract.methods
    .getDissentedUsers()
    .call()
  const filterAsync = require('../../helpers/filterAsync')
  const { ZERO_ADDRESS } = require('../../config/testing')
  const dissentedUsers = await filterAsync(
    allDissentedUsers,
    async user =>
      (await NetworkProxyContract.methods
        .getUserComplianceDataCommitment(roundIndex, myJuriNodeAddress, user)
        .call()) === ZERO_ADDRESS
  )
  const uniqUsers = require('../../config/accounts').users.map(u => u.address)
  const dissentComplianceData = complianceData.filter((_, i) =>
    dissentedUsers.find(user => {
      console.log(
        `Comparing at index ${i} if ${uniqUsers[i].slice(
          0,
          5
        )} === ${user.slice(0, 5)}`
      )
      return user === uniqUsers[i]
    })
  )

  console.log({
    allDissentedUsers,
    dissentedUsers,
    dissentComplianceData,
  })

  console.log({
    currentStage,
    roundIndex: roundIndex.toString(),
    stakingNodesAddressCount: stakingNodesAddressCount.toString(),
    nodesToUpdate,
    nodeActivityCountsCurrent: nodeActivityCountsCurrent.map(actCnt =>
      actCnt.toString()
    ),
    totalNodeActivityCount: totalNodeActivityCount.toString(),
    skaleMessageProxyAddressMain,
  })

  // process.exit(0)

  const nodes = accounts.nodes.slice(0, 2).map(({ address }) => address)
  const users = accounts.users.slice(1, 1).map(({ address }) => address)

  /* for (let i = 0; i < nodes.length; i++) {
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
  } */

  process.exit(0)

  const userAddresses = [
    // '0x7E0c6B2bE8010CcaB4F3C93CD34CD60E6582b21f',
    '0x411fcF9AaB9F516cEaD0e6826A57775E23f19f5a',
  ]
  const wasCompliantDataCommitments = [
    // '0xc9a7f466f0b3d230922e438d773ef70284e6a07a6c2a41c047c3bfcaa0883f79',
    '0x9291806dcbc16db454065bcbebc73cb449a66dae0b6ca7ac3587e782ad5d661f',
  ]
  const flatProofIndices = [3, 5, 17, 25]
  const proofIndicesCutoffs = []

  const result = await sendTx({
    data: NetworkProxyContract.methods
      .addWasCompliantDataCommitmentsForUsers(
        userAddresses,
        wasCompliantDataCommitments,
        flatProofIndices,
        proofIndicesCutoffs
      )
      .encodeABI(),
    from: '0x609090313b64c65e968162288E619c39D03a69c6',
    privateKey: Buffer.from(
      'bb5652eb50c53cb1c945b9739430c30fd299343781b1b8b99cb83e2ee5b32783',
      'hex'
    ),
    to: networkProxyAddress,
    web3,
  })

  console.log({ result })

  /* const data = await NetworkProxyContract.methods.debugMoveToNextRound().call()
  console.log({
    data,
  }) */
}

exec()
