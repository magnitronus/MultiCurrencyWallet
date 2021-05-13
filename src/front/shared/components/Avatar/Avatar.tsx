import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

import jdenticon from 'jdenticon'

import CSSModules from 'react-css-modules'
import styles from './Avatar.scss'


const Avatar = ({ value, className, size }) => (
  <Fragment>
    <span/>
  </Fragment>
)

Avatar.defaultProps = {
  size: 35,
}

Avatar.propTypes = {
  value: PropTypes.string.isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
}

export default CSSModules(Avatar, styles)
