import React, { Fragment } from 'react'
import helpers, { constants } from 'helpers'
import actions from 'redux/actions'
import { connect } from 'redaction'
import config from 'app-config'

import cssModules from 'react-css-modules'

import defaultStyles from '../Styles/default.scss'
import styles from './RestoryMnemonicWallet.scss'
import okSvg from 'shared/images/ok.svg'
import * as mnemonicUtils from 'common/utils/mnemonic'
import Modal from 'components/modal/Modal/Modal'
import FieldLabel from 'components/forms/FieldLabel/FieldLabel'
import Button from 'components/controls/Button/Button'
import Tooltip from 'components/ui/Tooltip/Tooltip'
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl'

import links from 'helpers/links'

import MnemonicInput from 'components/forms/MnemonicInput/MnemonicInput'
import feedback from 'shared/helpers/feedback'

const langPrefix = `RestoryMnemonicWallet`
const langLabels = defineMessages({
  title: {
    id: `${langPrefix}_Title`,
    defaultMessage: `Восстановление кошелка из секретной фразы`,
  },
  mnemonicLabel: {
    id: `${langPrefix}_MnemonicField`,
    defaultMessage: `Секретная фраза (12 слов):`,
  },
  mnemonicPlaceholder: {
    id: `${langPrefix}_MnemonicPlaceholder`,
    defaultMessage: `Введите сохраненную фразу, для восстановления кошелька`,
  },
  readyNotice: {
    id: `${langPrefix}_ReadyNotice`,
    defaultMessage: `Теперь вы можете добавить BTC, ETH и другие валюты`,
  },
  Ready: {
    id: `${langPrefix}_Ready`,
    defaultMessage: `Готово`,
  },
  restoringWallet: {
    id: `${langPrefix}_RestroringWallet`,
    defaultMessage: `Восстанавливаем...`,
  },
  restoryWallet: {
    id: `${langPrefix}_RestoryWallet`,
    defaultMessage: `Восстановить`,
  },
  cancelRestory: {
    id: `${langPrefix}_CancelRestory`,
    defaultMessage: `Отмена`,
  },
  mnemonicInvalid: {
    id: `${langPrefix}_MnemonicInvalid`,
    defaultMessage: `Вы указали не валидный набор слов`,
  },
})

type RestoryMnemonicWalletProps = {
  name: string
  onClose: () => void
  intl: { [key: string]: any }
  allCurrensies: { [key: string]: any }[]

  data: {
    btcBalance: number
    onClose: () => void
    noRedirect?: boolean
  }
}

type RestoryMnemonicWalletState = {
  mnemonic: string
  step: string
  mnemonicIsInvalid: boolean
  isFetching: boolean
  data: {
    btcBalance: number
    usdBalance: number
  }
}

@connect(
  ({
    user: { btcData, btcMultisigSMSData, btcMultisigUserData, ethData, ghostData, nextData },
  }) => ({
    allCurrensies: [
      btcData,
      btcData,
      btcMultisigSMSData,
      btcMultisigUserData,
      ethData,
      ghostData,
      nextData,
    ],
  })
)
@cssModules({ ...defaultStyles, ...styles }, { allowMultiple: true })
class RestoryMnemonicWallet extends React.Component<RestoryMnemonicWalletProps, RestoryMnemonicWalletState> {

  props: RestoryMnemonicWalletProps
  state: RestoryMnemonicWalletState

  constructor(props) {
    super(props)

    const { data } = props

    this.state = {
      step: `enter`,
      mnemonic: '',
      mnemonicIsInvalid: false,
      isFetching: false,
      data: {
        btcBalance: data ? data.btcBalance : 0,
        usdBalance: data ? data.usdBalance : 0,
      },
    }
  }

  componentDidMount() {
    this.fetchData()
    feedback.restore.started()
  }

  fetchData = async () => {
    const { allCurrensies } = this.props

    const { btcBalance, usdBalance } = allCurrensies.reduce(
      (acc, curr) => {
        const { name, infoAboutCurrency, balance } = curr
        if (
          //@ts-ignore
          (!isWidgetBuild || widgetCurrencies.includes(name)) &&
          infoAboutCurrency &&
          balance !== 0
        ) {
          acc.btcBalance += balance * infoAboutCurrency.price_btc
          acc.usdBalance +=
            balance * (infoAboutCurrency.price_fiat ? infoAboutCurrency.price_fiat : 1)
        }
        return acc
      },
      { btcBalance: 0, usdBalance: 0 }
    )

    this.setState((data) => ({
      data: { btcBalance, usdBalance, ...data },
    }))
  }

  handleClose = () => {
    const { name, data, onClose } = this.props

    if (typeof onClose === 'function') {
      onClose()
    }

    if (data && typeof data.onClose === 'function') {
      data.onClose()
    } else {
      if (!(data && data.noRedirect)) {
        window.location.assign(links.hashHome)
      }
    }

    actions.modals.close(name)
  }

  handleFinish = () => {
    const { data } = this.props

    this.handleClose()

    if (!(data && data.noRedirect)) {
      window.location.assign(links.hashHome)
      window.location.reload()
    }
  }

  handleRestoryWallet = () => {
    const { mnemonic } = this.state

    if (!mnemonic || !mnemonicUtils.validateMnemonicWords(mnemonic)) {
      this.setState({
        mnemonicIsInvalid: true,
        isFetching: false,
      })
      return
    }

    this.setState(
      {
        isFetching: true,
      },
      () => this.restoreWallet(mnemonic)
    )
  }

  restoreWallet = (mnemonic) => {
    // callback in timeout doesn't block ui
    setTimeout(async () => {
      // Backup critical localStorage
      const backupMark = actions.btc.getMainPublicKey()

      actions.backupManager.backup(backupMark, false, true)
      // clean mnemonic, if exists
      localStorage.setItem(constants.privateKeyNames.twentywords, '-')

      const btcWallet = await actions.btc.getWalletByWords(mnemonic)
      // Check - if exists backup for this mnemonic
      const restoryMark = btcWallet.publicKey

      if (actions.backupManager.exists(restoryMark)) {
        actions.backupManager.restory(restoryMark)
      }

      const btcPrivKey = await actions.btc.login(false, mnemonic)
      const btcSmsKey = actions.btcmultisig.getSmsKeyFromMnemonic(mnemonic)

      //@ts-ignore: strictNullChecks
      localStorage.setItem(constants.privateKeyNames.btcSmsMnemonicKeyGenerated, btcSmsKey)
      localStorage.setItem(constants.localStorage.isWalletCreate, 'true')

      await actions.bnb.login(false, mnemonic)
      await actions.eth.login(false, mnemonic)
      await actions.ghost.login(false, mnemonic)
      await actions.next.login(false, mnemonic)
      await actions.user.sign_btc_2fa(btcPrivKey)
      await actions.user.sign_btc_multisig(btcPrivKey)

      actions.core.markCoinAsVisible('BNB', true)
      actions.core.markCoinAsVisible('ETH', true)
      actions.core.markCoinAsVisible('BTC', true)

      this.setState({
        isFetching: false,
        step: `ready`,
      })

      feedback.restore.finished()
    })
  }

  handleMnemonicChange = (mnemonic) => {
    this.setState({
      mnemonic,
    })
  }

  render() {
    const { name, intl } = this.props

    const {
      step,
      mnemonic,
      mnemonicIsInvalid,
      isFetching,

      data: { btcBalance = 0, usdBalance = 1 },
    } = this.state

    return (
      //@ts-ignore: strictNullChecks
      <Modal
        name={name}
        title={`${intl.formatMessage(langLabels.title)}`}
        onClose={this.handleClose}
        showCloseButton={true}
      >
        <div styleName="restoreModalHolder">
          {step === `enter` && (
            <Fragment>
              {mnemonic && mnemonicIsInvalid && (
                <div styleName="rednotes mnemonicNotice">
                  <FormattedMessage {...langLabels.mnemonicInvalid} />
                </div>
              )}
              <div styleName="highLevel" className="ym-hide-content notranslate" translate="no">
                <FieldLabel>
                  <span styleName="tooltipWrapper">
                    <FormattedMessage {...langLabels.mnemonicLabel} />
                    &nbsp;
                    <Tooltip id="ImportKeys_RestoreMnemonic_tooltip">
                      <span>
                        <FormattedMessage
                          id="ImportKeys_RestoreMnemonic_Tooltip"
                          defaultMessage="12-word backup phrase"
                        />
                        {(btcBalance > 0 || usdBalance > 0) && (
                          <React.Fragment>
                            <br />
                            <br />
                            <div styleName="alertTooltipWrapper">
                              <FormattedMessage
                                id="ImportKeys_RestoreMnemonic_Tooltip_withBalance"
                                defaultMessage="Please, be causious!"
                              />
                            </div>
                          </React.Fragment>
                        )}
                      </span>
                    </Tooltip>
                  </span>
                </FieldLabel>
                <MnemonicInput 
                  autoFill={config.entry === 'testnet'}
                  onChange={this.handleMnemonicChange}
                />
              </div>
              <div styleName="buttonsHolder">
                <Button blue onClick={this.handleClose}>
                  <FormattedMessage {...langLabels.cancelRestory} />
                </Button>
                <Button
                  id='walletRecoveryButton'
                  blue
                  disabled={!mnemonic || mnemonic.split(' ').length !== 12 || isFetching}
                  onClick={this.handleRestoryWallet}
                >
                  {isFetching ? (
                    <FormattedMessage {...langLabels.restoringWallet} />
                  ) : (
                    <FormattedMessage {...langLabels.restoryWallet} />
                  )}
                </Button>
              </div>
            </Fragment>
          )}
          {step === `ready` && (
            <Fragment>
              <p styleName="notice mnemonicNotice">
                <img styleName="finishImg" src={okSvg} alt="finish" />
                <FormattedMessage {...langLabels.readyNotice} />
              </p>
              <div styleName="lowLevel">
                <Button
                  id='finishWalletRecoveryButton'
                  styleName="buttonCenter buttonHalfFullWidth"
                  blue
                  onClick={this.handleFinish}
                >
                  <FormattedMessage {...langLabels.Ready} />
                </Button>
              </div>
            </Fragment>
          )}
        </div>
      </Modal>
    )
  }
}

export default injectIntl(RestoryMnemonicWallet)
