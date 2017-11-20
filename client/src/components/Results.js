import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import * as actionCreators from '../action_creators'

export class Results extends PureComponent {
  render() {
    return <div> </div>
  }
}


function mapStateToProps(state) {
  return {
    products: state.get('products'),
  }
}

export const ResultsContainer = connect(
  mapStateToProps,
  actionCreators
)(Results)
