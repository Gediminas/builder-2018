import React, { PureComponent } from 'react'
import ActiveTask from './ActiveTask'

export default class extends PureComponent {
  getTasks() {
    return this.props.tasks || []
  }
  render() {
    let ui_tasks = this.getTasks().map((task) => {
      let task_uid = task.get('uid')
      return <ActiveTask key={task_uid} task={task} kill_task={this.props.kill_task}/>
    })
    let header = (this.getTasks().size > 0)
      ? (
          <div className='row_header'>
            <div className='cell_header'></div>
            <div className='cell_header'>Product</div>
            <div className='cell_header'>Progress</div>
            <div className='cell_header'>Start</div>
            <div className='cell_header'>Comment</div>
            <div className='cell_header'>pid</div>
          </div>
        )
      : (<div>no active tasks...</div>)
    return (
      <div className='tasks'>
        <div className='table'>
          {header}
          {ui_tasks}
        </div>
      </div>
    )
  }
}

