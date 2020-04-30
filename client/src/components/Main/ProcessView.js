import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import * as actionCreators from '../../action_creators'
//import axios from 'axios'

import Projects from './Projects'
import ActiveTasks from './ActiveTasks'

//import 'immutable-console-log'

export class ProcessView extends PureComponent {
  render() {
    return (
      <div>
        <h3>Projects:</h3>
        <Projects projects={this.props.projects} add_task={this.props.add_task} />
        <h3>Loaded projects:</h3>
        <ActiveTasks tasks={this.props.tasks} kill_task={this.props.kill_task} />
      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {
  return {
    projects: state.get('projects'),
    tasks: state.get('tasks'),
    htasks: state.get('htasks'),
  }
}

export const ProcessViewContainer = connect(
  mapStateToProps,
  actionCreators
)(ProcessView)
