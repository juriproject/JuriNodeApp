let bondingAddress, juriTokenAddress, juriFeesTokenAddress

const BondingAbi = require('../contracts/juri/JuriBonding').abi
const ERC20MintableAbi = require('../contracts/juri/ERC20Mintable').abi
const JuriStakingPoolWithOracleMockAbi = require('../contracts/juri/JuriStakingPoolWithOracleMock')
  .abi
const JuriTokenAbi = require('../contracts/juri/JuriTokenMock').abi
const NetworkProxyAbi = require('../contracts/juri/JuriNetworkProxy').abi
const PoolAbi = require('../contracts/juri/JuriStakingPoolWithOracle').abi

const networkProxyAddress = '0xa6550E237F516C880FA35b990b0F089460392e96'
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

module.exports = {
  getBondingAddress,
  getBondingContract,
  getJuriFeesTokenAddress,
  getJuriFeesTokenContract,
  getJuriTokenAddress,
  getJuriTokenContract,
  JuriStakingPoolWithOracleMockAbi,
  networkProxyAddress,
  NetworkProxyContract,
  PoolAbi,
}
