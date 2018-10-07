import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import * as actionCreators from '../../action_creators'
import {time_to_dir} from '../../tools/date_time.js'

export class LogViewer extends PureComponent {
  render() {
    if (!this.props.products) {
      return <div> <h2>LogViewer</h2><div>No products exist</div> </div>
    }
    let prod_id = this.props.match.params.prod_id
    let task_uid = this.props.match.params.task_uid
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
  }
}

function mapStateToProps(state) {
  return {
    products: state.get('products'),
  }
}

export const LogViewerContainer = connect(
  mapStateToProps,
  actionCreators
)(LogViewer)
