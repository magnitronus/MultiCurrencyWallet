import React, { Component } from 'react'
import cssModules from 'react-css-modules'
import styles from './index.scss'
import cx from 'classnames'
import PartOfAddress from 'pages/Wallet/PartOfAddress'
import { isMobile } from 'react-device-detect'
import actions from 'redux/actions'
import erc20Like from 'common/erc20Like'
import { constants } from 'helpers'
import { localisedUrl } from 'helpers/locale'
import getCurrencyKey from 'helpers/getCurrencyKey'
import Coin from 'components/Coin/Coin'
import OutsideClick from 'components/OutsideClick'


const isDark = localStorage.getItem(constants.localStorage.isDark)
@cssModules(styles, { allowMultiple: true })
export default class CurrencyList extends Component<any, any> {
  constructor(props) {
    super(props)

    this.state = {
      isAssetsOpen: false,
    }
  }

  openModal = (currency, address) => {
    this.setState({
      isAssetsOpen: false,
    }, () => {
      const {
        history,
        intl: { locale },
      } = this.props

      const currentAsset = actions.core.getWallets({})
        .filter((item) => {
          return (
            currency === item.currency
            && address.toLowerCase() === item.address.toLowerCase()
          )
        })

      let targetCurrency = currentAsset[0].currency

      switch (currency.toLowerCase()) {
        case 'btc (multisig)':
        case 'btc (sms-protected)':
        case 'btc (pin-protected)':
          targetCurrency = 'btc'
          break
      }

      const isToken = erc20Like.isToken({ name: currency })

      history.push(
        localisedUrl(locale, (isToken ? '/token' : '') + `/${targetCurrency}/${currentAsset[0].address}/send`)
      )
    })
  }

  closeList = () => {
    this.setState(() => ({
      isAssetsOpen: false,
    }))
  }

  toggleListDisplay = () => {
    this.setState((state) => ({
      isAssetsOpen: !state.isAssetsOpen,
    }))
  }

  render() {
    const {
      currentActiveAsset,
      currentBalance,
      currency,
      activeFiat,
      tableRows,
      currentAddress,
    } = this.props

    const {
      isAssetsOpen,
    } = this.state

    return (
      //@ts-ignore: strictNullChecks
      <OutsideClick outsideAction={this.closeList}>
        <div
          id='currencyList'
          styleName={`customSelectValue ${isDark ? 'dark' : ''}`}
          onClick={this.toggleListDisplay}
        >
          <div styleName="coin">
            <Coin name={currentActiveAsset.currency} />
          </div>

          <div>
            <a>{currentActiveAsset.currency}</a>
            <span styleName="address">{currentAddress}</span>
            <span styleName="mobileAddress">
              {isMobile ? <PartOfAddress address={currentAddress} withoutLink /> : ''}
            </span>
          </div>

          <div styleName="amount">
            <span styleName="currency">
              {currentBalance} {getCurrencyKey(currency, true).toUpperCase()}
            </span>
            <span styleName="usd">
              {currentActiveAsset.infoAboutCurrency && currentActiveAsset.infoAboutCurrency.price_fiat
                ? <span>{(currentBalance * currentActiveAsset.infoAboutCurrency.price_fiat).toFixed(2)} {activeFiat}</span>
                : null
              }
            </span>
          </div>
          <div styleName={cx('customSelectArrow', { active: isAssetsOpen })}></div>
        </div>

        {isAssetsOpen && (
          <div styleName={`customSelectList ${isDark ? 'darkList' : ''}`}>
            {tableRows.map((item, index) => (
              <div id={`${item.currency.toLowerCase()}Send`} key={index}
                styleName={cx('customSelectListItem customSelectValue', {
                  disabled: item.balance === 0,
                })}
                onClick={() => {
                  this.openModal(item.currency, item.address)
                }}
              >
                <Coin name={item.currency} />

                <div>
                  <a>
                    {item.fullName}
                    {item.standard ? (
                      <span styleName="tokenStandard">{item.standard.toUpperCase()}</span>
                    ) : ''}
                  </a>
                  <span styleName="address">{item.address}</span>
                  <span styleName="mobileAddress">
                    {isMobile ? <PartOfAddress address={item.address} withoutLink /> : ''}
                  </span>
                </div>
 
                <div styleName="amount">
                  <span styleName="currency">
                    {item.balance} {getCurrencyKey(item.currency, true).toUpperCase()}
                  </span>
                  <span styleName="usd">
                    {item.infoAboutCurrency && item.infoAboutCurrency.price_fiat
                      ? <span>{(item.balance * item.infoAboutCurrency.price_fiat).toFixed(2)} {activeFiat}</span>
                      : null
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </OutsideClick>
    )
  }
}

