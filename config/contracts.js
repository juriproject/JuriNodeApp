// const { web3 } = require('./testing')
const { getWeb3 } = require('./skale')

let bondingAddress, juriTokenAddress, juriFeesTokenAddress

const BondingAbi = require('../contracts/juri/JuriBonding').abi
const ERC20MintableAbi = require('../contracts/juri/ERC20Mintable').abi
const JuriStakingPoolWithOracleMockAbi = require('../contracts/juri/JuriStakingPoolWithOracleMock')
  .abi
const JuriTokenAbi = require('../contracts/juri/JuriTokenMock').abi
const NetworkProxyMockAbi = require('../contracts/juri/JuriNetworkProxyMock')
  .abi
const PoolAbi = require('../contracts/juri/JuriStakingPoolWithOracle').abi

const { networkProxyAddress } = require('./lastDeployedNetworkProxyAddress')

const getNetworkProxyContract = isRunningOnAws => {
  const web3 = getWeb3({ isMain: false, isRunningOnAws })
  return new web3.eth.Contract(NetworkProxyMockAbi, networkProxyAddress)
}

const getBondingAddress = async isRunningOnAws => {
  if (bondingAddress) return bondingAddress
  bondingAddress = await getNetworkProxyContract(isRunningOnAws)
    .methods.bonding()
    .call()

  return bondingAddress
}

const getBondingContract = async isRunningOnAws => {
  const web3 = getWeb3({ isMain: false, isRunningOnAws })
  return new web3.eth.Contract(
    BondingAbi,
    await getBondingAddress(isRunningOnAws)
  )
}

const getJuriTokenAddress = async isRunningOnAws => {
  if (juriTokenAddress) return juriTokenAddress

  const BondingContract = await getBondingContract(isRunningOnAws)
  juriTokenAddress = await BondingContract.methods.token().call()

  return juriTokenAddress
}

const getJuriTokenContract = async isRunningOnAws => {
  const web3 = getWeb3({ isMain: false, isRunningOnAws })
  return new web3.eth.Contract(
    JuriTokenAbi,
    await getJuriTokenAddress(isRunningOnAws)
  )
}

const getJuriFeesTokenAddress = async isRunningOnAws => {
  if (juriFeesTokenAddress) return juriFeesTokenAddress

  juriFeesTokenAddress = await getNetworkProxyContract(isRunningOnAws)
    .methods.juriFeesToken()
    .call()
  return juriFeesTokenAddress
}

const getJuriFeesTokenContract = async isRunningOnAws => {
  const web3 = getWeb3({ isMain: false, isRunningOnAws })
  return new web3.eth.Contract(
    ERC20MintableAbi,
    await getJuriFeesTokenAddress(isRunningOnAws)
  )
}

const getJuriStakingPoolContracts = async isRunningOnAws => {
  const web3 = getWeb3({ isMain: false, isRunningOnAws })
  const poolAddresses = await getNetworkProxyContract(isRunningOnAws)
    .methods.getRegisteredJuriStakingPools()
    .call()

  return poolAddresses.map(
    poolAddress =>
      new web3.eth.Contract(JuriStakingPoolWithOracleMockAbi, poolAddress)
  )
}

module.exports = {
  getBondingAddress,
  getBondingContract,
  getJuriFeesTokenAddress,
  getJuriFeesTokenContract,
  getJuriTokenAddress,
  getJuriTokenContract,
  getJuriStakingPoolContracts,
  JuriStakingPoolWithOracleMockAbi,
  networkProxyAddress,
  getNetworkProxyContract,
  PoolAbi,
}
