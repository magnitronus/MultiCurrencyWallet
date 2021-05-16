import config from 'app-config'
import { util } from 'swap.app'
import { constants } from 'swap.app'
import BigNumber from 'bignumber.js'
import reducers from 'redux/core/reducers'

const NETWORK = process.env.MAINNET ? 'mainnet' : 'testnet'

const getCustomTokenConfig = () => {
  //@ts-ignore: strictNullChecks
  let tokensInfo = JSON.parse(localStorage.getItem('customToken'))
  if (!tokensInfo || !tokensInfo[NETWORK]) return {}
  return tokensInfo[NETWORK]
}

const initExternalConfig = () => {
  // Add to swap.core not exists tokens
  Object.keys(config.erc20).forEach((tokenCode) => {
    if (!constants.COIN_DATA[tokenCode]) {
      console.info('Add token to swap.core', tokenCode, config.erc20[tokenCode].address, config.erc20[tokenCode].decimals, config.erc20[tokenCode].fullName)
      util.erc20.register(tokenCode, config.erc20[tokenCode].decimals)
    }
  })
}

const externalConfig = () => {
  // Reconfigure app config if it widget or use external config
  if (config.opts && config.opts.inited) {
    return config
  }

  config.opts = {
    inited: true,
    curEnabled: {
      eth: true,
      bnb: true,
      btc: true,
      ghost: true,
      next: true,
    },
    blockchainSwapEnabled: {
      btc: true,
      eth: true,
      bnb: false,
      ghost: true,
      next: true,
    },
    defaultExchangePair: {
      buy: 'eth',
      sell: 'btc',
    },
    ownTokens: false,
    addCustomERC20: true,
    invoiceEnabled: (config.isWidget) ? false : true,
    showWalletBanners: false,
    showHowItsWork: false,
    fee: {},
    hideShowPrivateKey: false,
    plugins: {
      setItemPlugin: false,
      getItemPlugin: false,
      userDataPluginApi: false,
      backupPlugin: false,
      backupPluginUrl: false,
      restorePluginUrl: false,
    },
    WPuserHash: false,
    buyViaCreditCardLink: false,
    activeFiat: 'USD',
    exchangeDisabled: false,
    ui: {
      footerDisabled: false,
    },
  }

  if (window
    && window.invoiceEnabled
  ) {
    config.opts.invoiceEnabled = true
  }

  if (window
    && window._ui_footerDisabled
  ) {
    config.opts.ui.footerDisabled = window._ui_footerDisabled
  }

  if (window
    && window.WPuserHash
  ) {
    config.opts.WPuserHash = window.WPuserHash
    window.WPuserHash = false
  }

  if (window
    && window.showHowItWorksOnExchangePage
  ) {
    config.showHowItsWork = window.showHowItWorksOnExchangePage
  }

  if (window
    && window.buildOptions
    && Object.keys(window.buildOptions)
    && Object.keys(window.buildOptions).length
  ) {
    config.opts = { ...config.opts, ...window.buildOptions }
  }

  if (window
    && window.DEFAULT_FIAT
  ) {
    config.opts.activeFiat = window.DEFAULT_FIAT
  }
  reducers.user.setActiveFiat({ activeFiat: config.opts.activeFiat })

  if (window
    && window.EXCHANGE_DISABLED
  ) {
    config.opts.exchangeDisabled = window.EXCHANGE_DISABLED
  }


  // Plugin: enable/disable currencies

  if (window && window.CUR_BTC_DISABLED === true) {
    config.opts.curEnabled.btc = false
    config.opts.blockchainSwapEnabled.btc = false
  }

  if (window && window.CUR_GHOST_DISABLED === true) {
    config.opts.curEnabled.ghost = false
    config.opts.blockchainSwapEnabled.ghost = false
  }

  if (window && window.CUR_NEXT_DISABLED === true) {
    config.opts.curEnabled.next = false
    config.opts.blockchainSwapEnabled.next = false
  }

  if (window && window.CUR_ETH_DISABLED === true) {
    config.opts.curEnabled.eth = false
    config.opts.blockchainSwapEnabled.next = false
  }

  if (window && window.CUR_BNB_DISABLED === true) {
    config.opts.curEnabled.bnb = false
    config.opts.blockchainSwapEnabled.bnb = false
  }


  // Plugins
  if (window
    && window.backupPlugin
    && window.backupUrl
    && window.restoreUrl
  ) {
    config.opts.plugins.backupPlugin = window.backupPlugin
    config.opts.plugins.backupPluginUrl = window.backupUrl
    config.opts.plugins.restorePluginUrl = window.restoreUrl
  }

  if (window
    && window.setItemPlugin
  ) {
    config.opts.plugins.setItemPlugin = window.setItemPlugin
  }
  if (window
    && window.getItemPlugin
  ) {
    config.opts.plugins.getItemPlugin = window.getItemPlugin
  }
  if (window
    && window.userDataPluginApi
  ) {
    config.opts.plugins.userDataPluginApi = window.userDataPluginApi
  }

  // ------
  if (window
    && window.buyViaCreditCardLink
  ) {
    config.opts.buyViaCreditCardLink = window.buyViaCreditCardLink
  }

  if (window
    && window.SWAP_HIDE_EXPORT_PRIVATEKEY !== undefined
  ) {
    config.opts.hideShowPrivateKey = window.SWAP_HIDE_EXPORT_PRIVATEKEY
  }

  if (window
    && window.widgetERC20Tokens
    && Object.keys(window.widgetERC20Tokens)
  ) {
    config.opts.ownTokens = window.widgetERC20Tokens
  }

  if ((config && config.isWidget) || config.opts.ownTokens) {
    // clean old erc20 config - leave only swap token (need for correct swap work)
    if (!config.isWidget) {
      const newTokens = {}
      // newTokens.swap = config.erc20.swap
      config.erc20 = newTokens
      config.bep20 = newTokens
    }

    if (Object.keys(config.opts.ownTokens).length) {
      // Multi token mode
      Object.keys(config.opts.ownTokens).forEach((key) => {
        const tokenData = config.opts.ownTokens[key]
        config.erc20[key] = tokenData
      })
    }

    // Clean not inited single-token
    // Обходим оптимизацию, нам нельзя, чтобы в этом месте было соптимизированно в целую строку {#WIDGETTOKENCODE#}
    const wcPb = `{#`
    const wcP = (`WIDGETTOKENCODE`).toUpperCase()
    const wcPe = `#}`
    const cleanERC20 = {}
    Object.keys(config.erc20).forEach((key) => {
      if (key !== (`${wcPb}${wcP}${wcPe}`)) {
        cleanERC20[key] = config.erc20[key]
      }
    })
    config.erc20 = cleanERC20
  }
  // TODO: rename - addCustomERC20 -> addCustomToken ?
  if (!config.isWidget && config.opts.addCustomERC20) {
    // Add custom tokens
    const customTokenConfig = getCustomTokenConfig()

    Object.keys(customTokenConfig).forEach((standard) => {
      Object.keys(customTokenConfig[standard]).forEach((tokenContractAddr) => {
        const tokenObj = customTokenConfig[standard][tokenContractAddr]
        const { symbol } = tokenObj

        if (!config[standard][symbol.toLowerCase()]) {
          config[standard][symbol.toLowerCase()] = {
            address: tokenObj.address,
            decimals: tokenObj.decimals,
            fullName: tokenObj.symbol,
          }
        }
      })
    })
  }

  // Comission config - default false
  if (window
    && window.widgetERC20Comisions
    && Object.keys(window.widgetERC20Comisions)
  ) {
    let hasTokenAdminFee = false

    Object.keys(window.widgetERC20Comisions).filter((key) => {
      const curKey = key.toLowerCase()
      if (window.widgetERC20Comisions[curKey]) {
        let { fee, address, min } = window.widgetERC20Comisions[curKey]
        let feeOk = false
        let minOk = false

        // @ToDo add currency isAddress Check
        if (fee && address && min) {
          try {
            fee = new BigNumber(fee.replace(',', '.')).toNumber()
            feeOk = true
          } catch (e) {
            console.error(`Fail convert ${fee} to number for ${curKey}`)
          }
          try {
            min = new BigNumber(min.replace(',', '.')).toNumber()
            minOk = true
          } catch (e) {
            console.error(`Fail convert ${min} to number for ${curKey}`)
          }

          if (minOk && feeOk) {
            config.opts.fee[curKey.toLowerCase()] = {
              fee,
              address,
              min,
            }
          }
        } else {
          if (curKey.toLowerCase() === 'erc20' || 'bep20' && address) {
            hasTokenAdminFee = true
            config.opts.fee[curKey.toLowerCase()] = {
              address,
            }
          }
        }
      }
    })

    const feeObj = config.opts.fee
    const setErc20Fee = hasTokenAdminFee && feeObj.eth?.min && feeObj.eth?.fee
    const setBep20Fee = hasTokenAdminFee && feeObj.bnb?.min && feeObj.bnb?.fee

    if (setErc20Fee) {
      feeObj.erc20.min = feeObj.eth.min
      feeObj.erc20.fee = feeObj.eth.fee
    }

    if (setBep20Fee) {
      feeObj.bep20.min = feeObj.bnb.min
      feeObj.bep20.fee = feeObj.bnb.fee
    }
  }

  console.log('externalConfig', config)
  return config
}

export default externalConfig()

export {
  externalConfig,
  initExternalConfig,
}
