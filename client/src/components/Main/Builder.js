import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import * as actionCreators from '../../action_creators'
//import axios from 'axios'

import Products from './Products'
import ActiveTasks from './ActiveTasks'
import FinishedTasks from './FinishedTasks'

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
        //<h3>TEST Active Tasks:</h3>
        //<ActiveTasks tasks={tmp_tasks} kill_task={this.props.kill_task} />
    return (
      <div>
        <h3>Products:</h3>
        <Products products={this.props.products} add_task={this.props.add_task} />
        <h3>Active Tasks:</h3>
        <ActiveTasks tasks={this.props.tasks} kill_task={this.props.kill_task} />
        <h3>Finnished Tasks:</h3>
        <FinishedTasks htasks={this.props.htasks} />
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

