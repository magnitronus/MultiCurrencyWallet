import btc from './btc'
import ghost from './ghost'
import next from './next'
import eth from './eth'
import ethToken from './ethToken'
import * as user from './user'
import web3 from './web3'
import links from './links'
import getCurrencyKey from './getCurrencyKey'
import constants from './constants'
import localStorage from './localStorage'
import api from './api'
import * as utils from './utils'
// Methods
import ignoreProps from './ignoreProps'
import handleGoTrade from './handleGoTrade'
// Getters
import externalConfig from './externalConfig'
import feedback from './feedback'
import getPageOffset from './getPageOffset'
import transactions from './transactions'

import { migrate } from './migrations/'

import getUnixTimeStamp from './getUnixTimeStamp'
import { cacheStorageGet, cacheStorageSet } from './cache'

import apiLooper from './apiLooper'
import wpLogoutModal from './wpLogoutModal'


import metamask from './metamask'

import getWalletLink from './getWalletLink'

import redirectTo from './redirectTo'

import adminFee from './adminFee'

import stats from './stats.swaponline'

import { getPairFees } from './getPairFees'


export default {
  btc,
  eth,
  ghost,
  next,
  ethToken,
  getCurrencyKey,
  handleGoTrade,
  transactions,
}

export {
  btc,
  eth,
  ghost,
  next,
  ethToken,
  user,
  web3,
  utils,
  links,
  constants,
  localStorage,
  api,
  migrate,
  // Methods
  ignoreProps,
  handleGoTrade,

  // Getters
  getPageOffset,
  externalConfig,

  feedback,
  getUnixTimeStamp,
  cacheStorageGet,
  cacheStorageSet,

  apiLooper,

  metamask,

  getWalletLink,

  redirectTo,

  adminFee,

  stats,

  wpLogoutModal,

  getPairFees,
}
export { getItezUrl } from './getItezUrl'
