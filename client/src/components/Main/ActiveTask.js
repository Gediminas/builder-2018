import React, { PureComponent } from 'react'
import {toDate, toTime, time_to_now, toHHMMSS} from '../../tools/date_time.js'

export default class extends PureComponent {

  render() {
    //let task_id      = this.props.task.get('id')
    let task_uid       = this.props.task.get('uid')
    let time_start     = this.props.task.get('time_start')
    let pid            = this.props.task.getIn(['data', 'pid'])
    let project_name   = this.props.task.getIn(['data', 'project_name'])
    let duration       = time_to_now(time_start)

    duration       = toHHMMSS(duration)

    let time_start_d   = toDate(time_start)
    let time_start_t   = toTime(time_start)

    return (
      <div className='row'>
        <div className='cell'>
          <button type="button"
                  className="btn btn_killtask_on"
                  onClick={() => this.props.kill_task(task_uid, pid)}>
            -
          </button>
        </div>
        <div className='cell'>{project_name}</div>
        <div className='cell'>
          <a className='date_small'> {time_start_d} </a>
          &nbsp;
          <a className='time_large'> {time_start_t} </a>
        </div>
        <div className='cell'>pid={pid} duration={duration}</div>
      </div>
    )
  }
}

