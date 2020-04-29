import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import * as actionCreators from '../../action_creators'
//import axios from 'axios'

import Products from './Products'
import ActiveTasks from './ActiveTasks'

//import {fromJS} from 'immutable'
import 'immutable-console-log'

export class Builder extends PureComponent {

  componentDidMount() {
  }

  render() {
    return (
      <div>
        <h3>Projects:</h3>
        <Products products={this.props.products} add_task={this.props.add_task} />
        <h3>Loaded projects:</h3>
        <ActiveTasks tasks={this.props.tasks} kill_task={this.props.kill_task} />
      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {
  return {
    products: state.get('products'),
    tasks: state.get('tasks'),
    htasks: state.get('htasks'),
  }
}

export const BuilderContainer = connect(
  mapStateToProps,
  actionCreators
)(Builder)

