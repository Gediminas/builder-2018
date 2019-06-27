import React, {useState, useEffect} from 'react'
import {connect} from 'react-redux'
import * as actionCreators from '../../action_creators'

function LogViewer(props) {
  const [state, setState] = useState({
    product_id : false,
    task_uid   : false,
    start_time : false,
    state_log  : [],
  })

  useEffect(() => {
    setState({
      ...state,
      product_id: props.match.params.prod_id,
      task_uid:   props.match.params.task_uid,
    })
    //console.log('EFF SET', props.match.params)

    if (!state.task_uid) {
      if (props.data.products) {
        const taskUid = _load(props, state.product_id)
        setState({
          ...state,
          task_uid: taskUid,
        })
      }
    }
  }, [state.product_id, props.data.products])

  return (
    <div>
      <h3> Log: "{state.product_id}" [{state.start_time}] ({state.task_uid})</h3>
      <hr/>
      <div>{state.state_log} </div>
      <hr/>
      <div> <button type="button"
                            className="btn btn_addtask"
                            onClick={() => props.request_log(state.product_id, state.task_uid, state.start_time)}>
                            + 
                          </button>
      </div>
    </div>
  )
}

function _load(props, product_id) {
  let product = props.data.products.find(product => product.get('product_id') === product_id)
  if (!product) {
    return;
  }
  let task_uid = product.getIn(['stats', 'last_task_uid'])
  let start_time = product.getIn(['stats', 'last_start_time'])
  if (!task_uid) {
    return;
  }
  props.request_log(product_id, task_uid, start_time)
  return task_uid;
}

function mapStateToProps(state) {
  return {
    data: {
      products: state.get('products'),
    }
  }
}

export const LogViewerContainer = connect(
  mapStateToProps,
  actionCreators
)(LogViewer)
