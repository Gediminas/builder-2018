import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import * as actionCreators from '../../action_creators'
//import {toJS} from 'immutable'
//import {time_to_dir} from '../../tools/date_time.js'

export class LogViewer extends PureComponent {

  constructor() {
    super();
    this.state = {
      product_id: false,
      task_uid  : false,
      error     : false,
    }
    this.task_uid   = false
    this.product_id = false
    this.loaded = false
  }

  componentDidMount() {
    let task_uid   = this.props.match.params.task_uid
    let product_id = this.props.match.params.prod_id
    this.setState({ product_id, task_uid})
  }

  load() {
    //console.log('load', this.props)

    this.task_uid   = this.props.match.params.task_uid
    this.product_id = this.props.match.params.prod_id

    let task_uid = this.props.match.params.task_uid

    if (!task_uid) {
       if (!this.props.data.products) {
         //this.setState({ error: 18501 })
         //console.log('  no products')
         return;
       }
       let product = this.props.data.products.find(product => product.get('product_id') === this.state.product_id)
       if (!product) {
         //this.setState({ error: 18502 })
         return;
       }
      task_uid = product.getIn(['stats', 'last_task_uid'])
    }

    if (task_uid) {
      //console.log('request task_uid ', task_uid)
      this.props.request_log(task_uid)
    }

    this.loaded = true;
    //console.log('  OK')
  }

  componentWillUnmount() {

  }


  render() {
    if (!this.loaded) {
      this.load()
    }

    let task_uid = this.props.match.params.task_uid

    if (this.state.error) {
      return (
        <div> 
          <h3> Log: "{this.state.product_id}" ({this.state.task_uid})</h3>
          <div>Error: #{this.state.error}</div>
        </div>
      )
    }

    return (
      <div>
        <h3> Log: "{this.state.product_id}" ({this.state.task_uid})</h3>

        {(() => {
          return <div> the log </div>
        })()}

        <button type="button"
                className="btn btn_addtask"
                onClick={() => this.props.request_log(task_uid)}>
          + 
        </button>
      </div>
    )
  }
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
