// TODO: proper tests

const {
  web3,
  deployFactory,
  deployAccount,
  buildCreate2Address,
  numberToUint256,
  encodeParam,
  isContract
} = require('./utils')

const { abi:accountAbi, bytecode:accountBytecode } = require('../build/contracts/Account.json')

async function main() {
  const factoryAddress = await deployFactory()
  const salt = 1

  console.log(factoryAddress)

  const bytecode = `${accountBytecode}${encodeParam('address', '0x00a329c0648769a73afac7f9381e08fb43dbea72').slice(2)}`

  const computedAddr = buildCreate2Address(
    factoryAddress,
    numberToUint256(salt),
    bytecode
  )

  console.log(computedAddr)
  console.log(await isContract(computedAddr))

  const result = await deployAccount(factoryAddress, salt, '0x00a329c0648769a73afac7f9381e08fb43dbea72')

  console.log(result.txHash)
  console.log(result.address)

  console.log(await isContract(computedAddr))
}

main()
