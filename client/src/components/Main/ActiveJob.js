import React, { PureComponent } from 'react'
import {toDate, toTime, time_to_now, toHHMMSS} from '../../tools/date_time.js'

export default class extends PureComponent {

  render() {
    //let job_id       = this.props.job.get('id')
    let job_uid        = this.props.job.get('uid')
    //let product_id     = this.props.job.get('product_id')
    let time_start     = this.props.job.get('time_start')
    let comment        = this.props.job.getIn(['data', 'comment'])
    let pid            = this.props.job.getIn(['data', 'pid'])
    //let status         = this.props.job.getIn(['data', 'status'])
    let product_name   = this.props.job.getIn(['data', 'product_name'])
    let prev_time_diff = this.props.job.getIn(['data', 'prev_time_diff'])
    let duration       = time_to_now(time_start)
    let percent        = Math.floor(100 * duration / prev_time_diff)

    duration       = toHHMMSS(duration)
    prev_time_diff = toHHMMSS(prev_time_diff)

    let time_start_d   = toDate(time_start)
    let time_start_t   = toTime(time_start)

    return (
      <div className='row'>
        <div className='cell'>
          <button type="button"
                  className="btn btn_killjob_on"
                  onClick={() => this.props.kill_job(job_uid, pid)}>
            -
          </button>
        </div>
        <div className='cell'>{product_name}</div>
        <div className='cell progress'>
          <progress value={percent} max='100'></progress>
          {duration} / {prev_time_diff}
        </div>
        <div className='cell'>
          <a className='date_small'> {time_start_d} </a>
          &nbsp;
          <a className='time_large'> {time_start_t} </a>
        </div>
        <div className='cell'>{comment}</div>
        <div className='cell'>{pid}</div>
      </div>
    )
  }
}

