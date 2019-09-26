const EthereumTx = require('ethereumjs-tx').Transaction

const sendTx = async ({ data, from, nonce, privateKey, value, to, web3 }) => {
  const { BN } = web3.utils

  const rawTx = {
    data,
    from,
    nonce: nonce || (await web3.eth.getTransactionCount(from)),
    to,
    gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(3)),
    gas: 8000000,
    value: value || 0x0,
  }

  const tx = new EthereumTx(rawTx)
  tx.sign(privateKey)

  const serializedTx = tx.serialize()

  return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
}

module.exports = sendTx
