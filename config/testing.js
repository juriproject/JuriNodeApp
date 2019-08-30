const Filestorage = require('@skalenetwork/filestorage.js/src/index')
const FilestorageContract = require('@skalenetwork/filestorage.js/src/FilestorageContract')

const {
  // getLocalWeb3,
  getWeb3,
  getWeb3Provider,
  privateKey,
} = require('./skale')

const web3 = getWeb3(false)

// const web3 = getLocalWeb3()
// const networkProxyAddress = '0xf204a4Ef082f5c04bB89F7D5E6568B796096735a'

const fileStorage = new Filestorage(getWeb3Provider(false), false)
const { BN } = web3.utils

const oneEther = new BN('1000000000000000000')
const Ether1e17 = new BN('100000000000000000')

module.exports = {
  Ether1e17,
  fileStorage,
  FilestorageContract,
  oneEther,
  privateKey,
  web3,
  ZERO_ADDRESS,
}
