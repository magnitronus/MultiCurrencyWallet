import React from 'react'
import PropTypes from 'prop-types'

import CSSModules from 'react-css-modules'
import styles from './Toggle.scss'


const Toggle = ({ checked, onChange, dataTut = null, isDisabled = false }) => (
  <label styleName={`Switch ${isDisabled ? 'disabled' : ''}`} data-tut={dataTut} >
    <input type="checkbox" onChange={({ target }) => onChange(target.checked)} checked={checked} disabled={isDisabled} />
    <span /> {/* need for button */}
  </label>
)

Toggle.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default CSSModules(Toggle, styles, { allowMultiple: true })
