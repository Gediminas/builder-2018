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

  componentDidMount() {
    /*
    axios.get(`http://www.reddit.com/r/${this.props.subreddit}.json`)
      .then(res => {
        const posts = res.data.data.children.map(obj => obj.data);
        this.setState({ posts });
      });
      */
  }

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
      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {
  return {
    products: state.get('products'),
    jobs: state.get('jobs'),
    hjobs: state.get('hjobs'),
  }
}

export const BuilderContainer = connect(
  mapStateToProps,
  actionCreators
)(Builder)

