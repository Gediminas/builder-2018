import React, {useState, useEffect} from 'react'
import {connect} from 'react-redux'
import * as actionCreators from '../../action_creators'

function LogViewer(props) {
  const [state, setState] = useState({
    product_id : false,
    task_uid   : false,
  })

  useEffect(() => {
     setState({
       ...state,
       product_id: props.match.params.prod_id,
       task_uid:   props.match.params.task_uid || 0,
     })
    props.request_log(props.match.params.prod_id, props.match.params.task_uid)
  }, [props.match.params.prod_id, props.match.params.task_uid])

  console.log('> render state: ', state)

  return (
    <div>
      <h3> Log: "{state.product_id}" ({state.task_uid})</h3>
      <hr/>
      <div>
      {
        props.logs.map((logLine, i) => {
          const line_nr = i+1
          return (<div key={line_nr}>{line_nr}: {logLine} </div>)
        })
      }
      </div>
      <hr/>
      <div> <button type="button"
                            className="btn btn_addtask"
                            onClick={() => props.request_log(state.product_id, state.task_uid)}>
                            + 
                          </button>
      </div>
    </div>
  )
}

function mapStateToProps(state, ownProps) {
  const product_id = ownProps.match.params.prod_id || ''
  //const task_uid = ownProps.match.params.task_uid  || 0
  const logs = state.getIn(['logs', product_id])   || []
  return { logs }
}

export const LogViewerContainer = connect(
  mapStateToProps,
  actionCreators
)(LogViewer)
