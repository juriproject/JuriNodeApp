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

// const networkProxyAddress = '0x6cA7D55f2ddF61f9839AF750383CA91Cb60A4946'
const networkProxyAddress = '0x306C9f5FA98C77DC4D092dCA945E5DF919a1519e'

// const NetworkProxyContract = new web3.eth.Contract(
//   NetworkProxyMockAbi,
//   networkProxyAddress
// )

const getNetworkProxyContract = () => {
  const web3 = getWeb3(false)
  return new web3.eth.Contract(NetworkProxyMockAbi, networkProxyAddress)
}

const getBondingAddress = async () => {
  if (bondingAddress) return bondingAddress
  bondingAddress = await getNetworkProxyContract()
    .methods.bonding()
    .call()

  return bondingAddress
}

const getBondingContract = async () => {
  const web3 = getWeb3(false)
  return new web3.eth.Contract(BondingAbi, await getBondingAddress())
}

const getJuriTokenAddress = async () => {
  if (juriTokenAddress) return juriTokenAddress

  const BondingContract = await getBondingContract()
  juriTokenAddress = await BondingContract.methods.token().call()

  return juriTokenAddress
}

const getJuriTokenContract = async () => {
  const web3 = getWeb3(false)
  return new web3.eth.Contract(JuriTokenAbi, await getJuriTokenAddress())
}

const getJuriFeesTokenAddress = async () => {
  if (juriFeesTokenAddress) return juriFeesTokenAddress

  juriFeesTokenAddress = await getNetworkProxyContract()
    .methods.juriFeesToken()
    .call()
  return juriFeesTokenAddress
}

const getJuriFeesTokenContract = async () => {
  const web3 = getWeb3(false)
  return new web3.eth.Contract(
    ERC20MintableAbi,
    await getJuriFeesTokenAddress()
  )
}

const getJuriStakingPoolContracts = async () => {
  const web3 = getWeb3(false)
  const poolAddresses = await getNetworkProxyContract()
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
  // NetworkProxyContract,
  getNetworkProxyContract,
  PoolAbi,
}
