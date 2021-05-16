import Web3 from 'web3'
import config from 'app-config'
import TokenApi from 'human-standard-token-abi'
import { BigNumber } from 'bignumber.js'
import DEFAULT_CURRENCY_PARAMETERS from 'common/helpers/constants/DEFAULT_CURRENCY_PARAMETERS'
import TOKEN_STANDARDS from 'common/helpers/constants/TOKEN_STANDARDS'
import ethLikeHelper from 'common/helpers/ethLikeHelper'
import { feedback } from 'helpers'
import web3 from 'helpers/web3'

class erc20LikeHelper {
  readonly standard: string // (ex. erc20, bep20, ...)
  readonly currency: string // (ex. ETH)
  readonly currencyKey: string // (ex. eth)
  readonly defaultParams: IUniversalObj
  readonly Web3: IUniversalObj

  constructor(params) {
    const {
      standard,
      currency,
      defaultParams,
      web3,
    } = params

    this.standard = standard
    this.currency = currency
    this.currencyKey = currency.toLowerCase()
    this.defaultParams = defaultParams
    this.Web3 = web3
  }

  reportError = (error) => {
    feedback.helpers.failed(
      ''.concat(`details - standard: ${this.standard}, `, `error message - ${error.message} `)
    )
    console.group(`Common erc20LikeHelper >%c ${this.standard}`, 'color: red;')
    console.error('error: ', error)
    console.groupEnd()
  }

  estimateFeeValue = async (params): Promise<number> => {
    const { method, speed, swapABMethod } = params
    const gasPrice = await this.estimateGasPrice({ speed })
    const methodForLimit = swapABMethod === 'deposit'
      ? 'swapDeposit'
      : swapABMethod === 'withdraw'
        ? 'swapWithdraw'
        : method
    const defaultGasLimit = this.defaultParams.limit[methodForLimit]

    return new BigNumber(defaultGasLimit)
      .multipliedBy(gasPrice)
      .multipliedBy(1e-18)
      .toNumber()
  }

  estimateGasPrice = async (params): Promise<number> => {
    return ethLikeHelper[this.currencyKey].estimateGasPrice(params)
  }

  isToken = (params): boolean => {
    const { name } = params

    return Object.keys(config[this.standard]).includes(name.toLowerCase())
  }

  checkAllowance = async (params: {
    tokenOwnerAddress: string
    tokenContractAddress: string
    decimals: number
  }): Promise<number> => {
    const { tokenOwnerAddress, tokenContractAddress, decimals } = params
    const tokenContract = new this.Web3.eth.Contract(TokenApi, tokenContractAddress)
  
    let allowanceAmount
  
    try {
      allowanceAmount = await tokenContract.methods
        .allowance(tokenOwnerAddress, config.swapContract[this.standard])
        .call({ from: tokenOwnerAddress })
      
      // formatting without token decimals
      allowanceAmount = new BigNumber(allowanceAmount)
        .dp(0, BigNumber.ROUND_UP)
        .div(new BigNumber(10).pow(decimals))
        .toNumber()
    } catch (error) {
      this.reportError(error)
    }

    return allowanceAmount || 0
  }
}

const isToken = (params) => {
  const { name } = params

  for (const prop in TOKEN_STANDARDS) {
    const standard = TOKEN_STANDARDS[prop].standard

    if (Object.keys(config[standard])?.includes(name.toLowerCase())) {
      return true
    }
  }

  return false
}

export default {
  isToken,
  erc20: new erc20LikeHelper({
    standard: 'erc20',
    currency: 'ETH',
    defaultParams: DEFAULT_CURRENCY_PARAMETERS.ethToken,
    web3: new Web3(new Web3.providers.HttpProvider(config.web3.provider)),
  }),
  bep20: new erc20LikeHelper({
    standard: 'bep20',
    currency: 'BNB',
    defaultParams: DEFAULT_CURRENCY_PARAMETERS.ethToken,
    web3: new Web3(new Web3.providers.HttpProvider(config.web3.binance_provider)),
  }),
}