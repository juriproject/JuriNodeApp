const { web3 } = require('./testing')

let bondingAddress, juriTokenAddress, juriFeesTokenAddress

const BondingAbi = require('../contracts/juri/JuriBonding').abi
const ERC20MintableAbi = require('../contracts/juri/ERC20Mintable').abi
const JuriStakingPoolWithOracleMockAbi = require('../contracts/juri/JuriStakingPoolWithOracleMock')
  .abi
const JuriTokenAbi = require('../contracts/juri/JuriTokenMock').abi
const NetworkProxyAbi = require('../contracts/juri/JuriNetworkProxy').abi
const PoolAbi = require('../contracts/juri/JuriStakingPoolWithOracle').abi

const networkProxyAddress = '0x6cA7D55f2ddF61f9839AF750383CA91Cb60A4946'
// const networkProxyAddress = '0xf204a4Ef082f5c04bB89F7D5E6568B796096735a'

const NetworkProxyContract = new web3.eth.Contract(
  NetworkProxyAbi,
  networkProxyAddress
)

const getBondingAddress = async () => {
  if (bondingAddress) return bondingAddress
  bondingAddress = await NetworkProxyContract.methods.bonding().call()

  return bondingAddress
}

const getBondingContract = async () =>
  new web3.eth.Contract(BondingAbi, await getBondingAddress())

const getJuriTokenAddress = async () => {
  if (juriTokenAddress) return juriTokenAddress

  const BondingContract = await getBondingContract()
  juriTokenAddress = await BondingContract.methods.token().call()

  return juriTokenAddress
}

const getJuriTokenContract = async () =>
  new web3.eth.Contract(JuriTokenAbi, await getJuriTokenAddress())

const getJuriFeesTokenAddress = async () => {
  if (juriFeesTokenAddress) return juriFeesTokenAddress

  juriFeesTokenAddress = await NetworkProxyContract.methods
    .juriFeesToken()
    .call()
  return juriFeesTokenAddress
}

const getJuriFeesTokenContract = async () =>
  new web3.eth.Contract(ERC20MintableAbi, await getJuriFeesTokenAddress())

const getJuriStakingPoolContracts = async () => {
  const poolAddresses = await NetworkProxyContract.methods
    .getRegisteredJuriStakingPools()
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
  NetworkProxyContract,
  PoolAbi,
}
