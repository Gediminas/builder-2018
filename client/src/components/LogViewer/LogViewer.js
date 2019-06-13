import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import * as actionCreators from '../../action_creators'
//import {time_to_dir} from '../../tools/date_time.js'

export class LogViewer extends PureComponent {

  componentDidMount() {
    console.log('LogMount')
  }

  render() {
    if (!this.props.products) {
      return <div> <h2>LogViewer</h2><div>No products exist</div> </div>
    }

    let product_id = this.props.match.params.prod_id
    let task_uid   = this.props.match.params.task_uid

    /*
    if (!task_uid) {
      let product = this.props.products.find(product => product.get('product_id') === prod_id)
      if (!product) {
        return <div> <h2>LogViewer</h2><div>No logs exist for product "{prod_id}"</div> </div>
      }
      let time_start = product.getIn(['last_task', 'time_start'])
      task_uid = time_to_dir(time_start)
      return <html><meta httpEquiv='refresh' content={'0; URL=' + prod_id + '/' + task_uid} /><div>Redirecting to last log</div></html>
    }
    return (
      <div>
        <h2>LogViewer</h2>
        LOG: {prod_id}/{task_uid}
      </div>
    )
    */

    let product = this.props.products.find(product => product.get('product_id') === product_id)
    if (!product) {
      return <div> <h3> Log: "{product_id}"</h3> <p> N/A (#18501 Product) </p> </div>
    }

    if (!task_uid) {
      // let time_start = product.getIn(['stats', 'last_task_uid'])
      // if (!time_start) {
      //   return <div> <h3> Log: "{product_id}"</h3> <p> N/A (#18502 Product time) </p> </div>
      // }
      // task_uid = time_start ? time_to_dir(time_start) : false
      task_uid = product.getIn(['stats', 'last_task_uid'])
    }

    return (
      <div>
        <h3> Log: "{product_id}" ({task_uid})</h3>

        {(() => {
          return <div> the log </div>
        })()}
      </div>
    )
  }
}

function mapStateToProps(state) {

  // let product = this.props.products.find(product => product.get('product_id') === product_id)
  // task_uid = product.getIn(['stats', 'last_task_uid'])

  return {
    products: state.get('products'),
  }
}

export const LogViewerContainer = connect(
  mapStateToProps,
  actionCreators
)(LogViewer)
