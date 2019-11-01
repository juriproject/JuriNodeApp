// const FilestorageContract = require('juriproject-skale-filestorage/src/FilestorageContract')
// const FilestorageContract = require('@skalenetwork/filestorage.js/src/FilestorageContract')

const { getWeb3Provider } = require('./skale')

const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

const getFilestorage = () => {
  const Filestorage = require('juriproject-skale-filestorage/src/index')
  // const Filestorage = require('@skalenetwork/filestorage.js/src/index')
  return new Filestorage(getWeb3Provider(false), false)
}

module.exports = {
  getFilestorage,
  ZERO_ADDRESS,
}
