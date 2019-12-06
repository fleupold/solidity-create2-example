const assert = require('assert')
const Web3 = require('web3')
const HDWalletProvider = require('truffle-hdwallet-provider')

// TODO: clean up

const provider = new Web3.providers.HttpProvider("http://localhost:8545")

const web3 = new Web3(provider)

const { abi:factoryAbi, bytecode:factoryBytecode } = require('../../build/contracts/Factory.json')
const { abi:accountAbi, bytecode:accountBytecode } = require('../../build/contracts/Account.json')

async function deployFactory() {
  const Factory = new web3.eth.Contract(factoryAbi)
  const {_address: factoryAddress} = await Factory.deploy({
      data: factoryBytecode
  }).send({
    from: '0x00a329c0648769a73afac7f9381e08fb43dbea72'
  })

  return factoryAddress
}

async function deployAccount (factoryAddress, salt, recipient) {
  const factory = new web3.eth.Contract(factoryAbi, factoryAddress)
  const account = '0x00a329c0648769a73afac7f9381e08fb43dbea72'
  const bytecode = `${accountBytecode}${encodeParam('address', recipient).slice(2)}`
  const result = await factory.methods.deploy(bytecode, salt).send({
    from: account,
    gas: 4500000,
    gasPrice: 10000000000,
  })

  const computedAddr = buildCreate2Address(
    factoryAddress,
    numberToUint256(salt),
    bytecode
  )

  const addr = result.events.Deployed.returnValues.addr.toLowerCase()
  assert.equal(addr, computedAddr)

  return {
    txHash: result.transactionHash,
    blockNumber: result.blockNumber,
    address: addr,
    receipt: result
  }
}

function buildCreate2Address(creatorAddress, saltHex, byteCode) {
  return `0x${web3.utils.sha3(`0x${[
    'ff',
    creatorAddress,
    saltHex,
    web3.utils.sha3(byteCode)
  ].map(x => x.replace(/0x/, ''))
  .join('')}`).slice(-40)}`.toLowerCase()
}

function numberToUint256(value) {
  const hex = value.toString(16)
  return `0x${'0'.repeat(64-hex.length)}${hex}`
}

function encodeParam(dataType, data) {
  return web3.eth.abi.encodeParameter(dataType, data)
}

async function isContract(address) {
  const code = await web3.eth.getCode(address)
  return code.slice(2).length > 0
}

module.exports = {
  web3,
  deployFactory,
  deployAccount,
  buildCreate2Address,
  numberToUint256,
  encodeParam,
  isContract
}
