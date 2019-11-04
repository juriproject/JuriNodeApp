/*
SKALE Chain ID: UPPC7EI4
SKALE Chain Proxy (ABIs): http://bit.ly/2Xl3Iqh
SKALE Private Net Proxy (ABIs): http://bit.ly/2XlRUo3
SKALE Private Net Endpoint: http://134.209.56.46:1919


Chain ID 2: '1KYUQ531'
SKALE Private Net Endpoint 2: http://165.22.133.157:10101
*/

const Tx = require('ethereumjs-tx')

const awsControllerUrl = require('./awsControllerUrl')

// const schainEndpointMain = 'http://134.209.56.46:1919'
const schainEndpointMain =
  'https://rinkeby.infura.io/v3/4744851d37ac46bd95eddf0d50f062a4'

const schainEndpointSideAws = `http://${awsControllerUrl}:7545`
const schainEndpointSideLocal = 'http://localhost:7545'

// const schainEndpointSide = 'http://104.248.79.40:8057'
// const schainID = 'UPPC7EI4'

// const schainEndpointSide = 'http://165.22.133.157:10101'
// const schainID = '1KYUQ531'

// const schainEndpointSide = 'https://sip0.skalenodes.com:10018'
const schainID = 'quiet-alkalurops'

const getEndpoint = ({ isMain, isRunningOnAws }) => {
  if (isMain) return schainEndpointMain

  return isRunningOnAws ? schainEndpointSideAws : schainEndpointSideLocal
}

const getWeb3Provider = ({ isMain, isRunningOnAws }) => {
  const Web3 = require('web3')
  return new Web3.providers.HttpProvider(
    getEndpoint({ isMain, isRunningOnAws })
  )
}

const getWeb3 = ({ isMain, isRunningOnAws }) => {
  const Web3 = require('web3')
  return new Web3(getWeb3Provider({ isMain, isRunningOnAws }))
}

// const privateTestnetJson = require('../contracts/skale/private_skale_testnet_proxy.json')
const privateTestnetJson = require('../contracts/skale/rinkeby_ABIs.json')

// const schainJson = require('../contracts/skale/schain_proxy.json')
const schainJson = require('../contracts/skale/schain_ABIs.json')

module.exports = {
  getWeb3,
  getWeb3Provider,
  privateTestnetJson,
  schainID,
  schainJson,
  Tx,
}
