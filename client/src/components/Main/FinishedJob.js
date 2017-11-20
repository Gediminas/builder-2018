import React, { PureComponent } from 'react'
import {toDate, toTime, toHHMMSS} from '../../tools/date_time.js'

export default class extends PureComponent {

  render() {
    let job_id         = this.props.hjob.get('id')
    let job_uid        = this.props.hjob.get('uid')
    let time_start     = this.props.hjob.get('time_start')
    let time_end       = this.props.hjob.get('time_end')
    let time_diff      = this.props.hjob.get('time_diff')
    //let comment        = this.props.hjob.getIn(['data', 'comment'])
    let pid            = this.props.hjob.getIn(['data', 'pid'])
    let job_status     = this.props.hjob.getIn(['data', 'status'])
    let product_name   = this.props.hjob.getIn(['data', 'product_name'])
    let prev_time_diff = this.props.hjob.getIn(['data', 'prev_time_diff'])
   
    //let span = 1
    //let span_prev = 2

    let time_start_d   = toDate(time_start)
    let time_start_t   = toTime(time_start)
    let time_end_d     = toDate(time_end)
    let time_end_t     = toTime(time_end)
    time_diff          = toHHMMSS(time_diff)
    prev_time_diff     = toHHMMSS(prev_time_diff)


    return (
      <div className='row'>
        <div className='cell'>{job_id}</div>
        <div className='cell'>{product_name}</div>
        <div className='cell status' name={job_status} >{job_status}</div>
        <div className='cell'>{job_uid}</div>
        <div className='cell'>
          <a className='date_small'> {time_start_d} </a>
          &nbsp;
          <a className='time_large'> {time_start_t} </a>
        </div>
        <div className='cell'>
          <a className='date_small'> {time_end_d} </a>
          &nbsp;
          <a className='time_large'> {time_end_t} </a>
        </div>
        <div className='cell'>{time_diff}</div>
        <div className='cell'>{prev_time_diff}</div>
        <div className='cell'>(pid={pid})</div>
      </div>
    )
  }
}

