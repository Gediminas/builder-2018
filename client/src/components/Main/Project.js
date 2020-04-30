import React from 'react'
import {toDate, toTime} from '../../tools/date_time.js'

function Project(props) {
  let project_id   = props.project.get('id')
  let project_name = props.project.get('project_name')
  let task_id      = props.project.getIn(['last_task', 'id'])
  let pid          = props.project.getIn(['last_task', 'data', 'pid'])
  let time_start   = props.project.getIn(['last_task', 'time_start'])
  let debug        = props.project.getIn(['cfg', 'debug'])

  let time_start_d  = ''
  let time_start_t  = ''
  if (time_start) {
    time_start_d  = toDate(time_start)
    time_start_t  = toTime(time_start)
  }
  let log_link = `log/${project_id}/${time_start_d}`
  console.log(log_link)

  return (
    <div className='row'>
      <div className='cell'>
        <button type="button"
                className="btn btn_addtask"
                onClick={() => props.add_task(project_id)}>
          + 
        </button>
      </div>
      <div className='cell'>{project_name}</div>
      <div className='cell'>
        <a className='date_small'> {time_start_d} </a>
        &nbsp;
        <a className='time_large'> {time_start_t} </a>
      </div>
      <div className='cell'>task={task_id}, pid={pid}, {debug}</div>
    </div>
  )
}

export default Project;
