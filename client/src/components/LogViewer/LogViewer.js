import React, {useState, useEffect} from 'react'
import {connect} from 'react-redux'
import * as actionCreators from '../../action_creators'
//import {toJS} from 'immutable'
//import {time_to_dir} from '../../tools/date_time.js'

function LogViewer(props) {
  const [product_id, setProductId] = useState(false)
  const [task_uid,   setTaskUid]   = useState(false)
  const [start_time]               = useState(false)
  const [state_log]                = useState([])

  //console.log(product_id)
  //console.log(task_uid)

  useEffect(() => {
    console.log(product_id)
    //console.log(task_uid)

    setProductId(props.match.params.prod_id)
    setTaskUid(props.match.params.task_uid)

    if (!task_uid) {
      console.log('eval task uid')

      if (props.data.products) {
        //load after products are initialized
        console.log('load products')
        const taskUid = _load(props)
        setTaskUid(taskUid)
      }
    }
  }, [product_id, task_uid])
  //   if (this.state.error) {
  //     return (
  //       <div> 
  //         <h3> Log: "{this.state.product_id}" ({this.state.task_uid})</h3>
  //         <div>Error: #{this.state.error}</div>
  //       </div>
  //     )
  //   }

    return (
      <div>
        <h3> Log: "{product_id}" [{start_time}] ({task_uid})</h3>
        <hr/>
        <div>{state_log} </div>
        <hr/>
        <div> <button type="button"
                      className="btn btn_addtask"
                      onClick={() => props.request_log(product_id, task_uid, start_time)}>
                + 
              </button>
        </div>
      </div>
    )

}
  // constructor() {
  //   super();
  //   this.state = {
  //     product_id: false,
  //     task_uid:   false,
  //     start_time: false,
  //     log: ['empty'],
  //   }
  // }

  // componentDidMount() {
  //   let task_uid   = this.props.match.params.task_uid
  //   let product_id = this.props.match.params.prod_id
  //   this.setState({ product_id, task_uid})
  // }

  // componentDidUpdate() {
  //   if (!this.state.task_uid) {
  //     console.log('eval task uid')

  //     if (this.props.data.products) {
  //       // load after products are initialized
  //       console.log('load products')
  //       this._load()
  //     }
  //   }
  // }

  // render() {


  // }

function _load(props) {
  let task_uid   = props.match.params.task_uid
  let product_id = props.match.params.prod_id
  let start_time = false

  if (!task_uid) {
    let product = props.data.products.find(product => product.get('product_id') === this.state.product_id)
    if (!product) {
      //setState({ product_id, error: 18501 })
      return;
    }
    task_uid = product.getIn(['stats', 'last_task_uid'])
    start_time = product.getIn(['stats', 'last_start_time'])
  }
  if (!task_uid) {
    //setState({ product_id, error: 18502 })
    return;
  }
  //setState({ task_uid, start_time })
  props.request_log(product_id, task_uid, start_time)
  return task_uid;
}

//}


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
