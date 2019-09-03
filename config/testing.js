const Filestorage = require('juriproject-skale-filestorage/src/index')
const FilestorageContract = require('juriproject-skale-filestorage/src/FilestorageContract')

const { getWeb3, getWeb3Provider, privateKey } = require('./skale')

const web3 = getWeb3(false)

// const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

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
