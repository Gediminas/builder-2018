import React, { PureComponent } from 'react'
import Job from './FinishedJob'

export default class extends PureComponent {
  getHJobs() {
    return this.props.hjobs || []
  }
  render() {
    let ui_jobs = this.getHJobs().map((hjob) => {
      let job_uid = hjob.get('uid')
      return <Job key={job_uid} hjob={hjob} />
    })
    let header = (this.getHJobs().size > 0)
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
      : (<div>no finnished jobs...</div>)
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

