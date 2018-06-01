import React, { PureComponent } from 'react'
import {toDate, toTime, toHHMMSS} from '../../tools/date_time.js'

export default class extends PureComponent {
  render() {
    //console.log(this.props.product.toJS())


    let product_name = this.props.product.get('product_name')
    let job_id       = this.props.product.getIn(['last_job', 'id'])
    let comment      = this.props.product.getIn(['last_job', 'data', 'comment'])
    let pid          = this.props.product.getIn(['last_job', 'data', 'pid'])
    let job_status   = this.props.product.getIn(['last_job', 'data', 'status'])
    let at           = this.props.product.getIn(['cfg', 'at'])
    let cron         = this.props.product.getIn(['cfg', 'cron'])
    let prio         = this.props.product.getIn(['cfg', 'prio'])

    let time_diff    = this.props.product.getIn(['last_job', 'time_diff'])
    let time_start   = this.props.product.getIn(['last_job', 'time_start'])
    //let comment    = this.props.product.getIn(['cfg', 'product_comment'])
    let debug        = this.props.product.getIn(['cfg', 'debug'])

    let time_start_d   = toDate(time_start)
    let time_start_t   = toTime(time_start)
    let time_diff_t   = toHHMMSS(time_diff)

    let log_link = `log?prod=${product_name}&time=${time_start_d}`

    return (
      <div className='row'>
        <div className='cell'>
          <button type="button"
            className="btn btn_addjob"
            onClick={() => this.props.add_job(product_name)}>
            + 
          </button>
        </div>
        <div className='cell'>{product_name}</div>
        <div className='cell status' name={job_status}>
            <a href={log_link}>{job_status}</a>
        </div>
        <div className='cell'>{at}</div>
        <div className='cell'>{cron}</div>
        <div className='cell'>{prio}</div>
        <div className='cell'>{time_diff_t}</div>
        <div className='cell'>
          <a className='date_small'> {time_start_d} </a>
          &nbsp;
          <a className='time_large'> {time_start_t} </a>
        </div>
        <div className='cell'>{comment}</div>
        <div className='cell'>job={job_id}, pid={pid}, {debug}</div>
      </div>
    )
  }
}

