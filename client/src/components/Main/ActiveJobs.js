import React, { PureComponent } from 'react'
import ActiveJob from './ActiveJob'

export default class extends PureComponent {
  getJobs() {
    return this.props.jobs || []
  }
  render() {
    let ui_jobs = this.getJobs().map((job) => {
      let job_uid = job.get('uid')
      return <ActiveJob key={job_uid} job={job} kill_job={this.props.kill_job}/>
    })
    let header = (this.getJobs().size > 0)
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
      : (<div>no active jobs...</div>)
    return (
      <div className='jobs'>
        <div className='table'>
          {header}
          {ui_jobs}
        </div>
      </div>
    )
  }
}

