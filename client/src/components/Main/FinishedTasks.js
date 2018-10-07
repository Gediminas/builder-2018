import React, { PureComponent } from 'react'
import Task from './FinishedTask'

export default class extends PureComponent {
  getHTasks() {
    return this.props.htasks || []
  }
  render() {
    let ui_tasks = this.getHTasks().map((htask) => {
      let task_uid = htask.get('uid')
      return <Task key={task_uid} htask={htask} />
    })
    let header = (this.getHTasks().size > 0)
      ? (
          <div className='row_header'>
            <div className='cell_header'>id</div>
            <div className='cell_header'>product</div>
            <div className='cell_header'>status</div>
            <div className='cell_header'>UID</div>
            <div className='cell_header'>Time start</div>
            <div className='cell_header'>Time end</div>
            <div className='cell_header'>Span</div>
            <div className='cell_header'>Span prev</div>
            <div className='cell_header'>debug</div>
          </div>
        )
      : (<div>no finnished tasks...</div>)
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

