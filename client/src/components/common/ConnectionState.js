import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import {Map} from 'immutable'

export class ConnectionState extends PureComponent {
  isVisible() {
    return !this.props.connected
  }
  getMessage() {
    return this.props.state
  }
  render() {
    return <div className="connectionState"
            style={{display: this.isVisible() ? 'block' : 'none'}}>
      {this.getMessage()}
    </div>
  }
}


export const ConnectionStateContainer = connect(
  state => state.get('connection', Map()).toJS()
)(ConnectionState)

