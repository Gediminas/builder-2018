import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import * as actionCreators from '../../action_creators'
//import axios from 'axios'

import Products from './Products'
import ActiveJobs from './ActiveJobs'
import FinishedJobs from './FinishedJobs'

//import {fromJS} from 'immutable'
import 'immutable-console-log'

export class Builder extends PureComponent {
  render() {
        //<h3>TEST Active Jobs:</h3>
        //<ActiveJobs jobs={tmp_jobs} kill_job={this.props.kill_job} />
    return (
      <div>
        <h3>Products:</h3>
        <Products products={this.props.products} add_job={this.props.add_job} />
        <h3>Active Jobs:</h3>
        <ActiveJobs jobs={this.props.jobs} kill_job={this.props.kill_job} />
        <h3>Finnished Jobs:</h3>
        <FinishedJobs hjobs={this.props.hjobs} />
        <hr />
        debug: {this.debug}
      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {
  return {
    products: state.get('products'),
    jobs: state.get('jobs'),
    hjobs: state.get('hjobs'),
    debug: state.get('debug'),
  }
}

export const BuilderContainer = connect(
  mapStateToProps,
  actionCreators
)(Builder)

