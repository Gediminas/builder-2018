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
      task_uid:   false,
      start_time: false,
      log: ['empty'],
    }
  }

  componentDidMount() {
    let task_uid   = this.props.match.params.task_uid
    let product_id = this.props.match.params.prod_id
    this.setState({ product_id, task_uid})

    if (!task_uid) {
      this.initTimerId = setInterval(() => {
        console.log('init')
        if (this.props.data.products) {
          // load after products are initialized
          clearInterval(this.initTimerId)
          this.initTimerId = false
          this._load()
        }
      }, 100);
    }
  }

  componentWillUnmount() {

  }


  render() {


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
        <h3> Log: "{this.state.product_id}" [{this.state.start_time}] ({this.state.task_uid})</h3>
        <hr/>
        <div>{this.state.log} </div>
        <hr/>
        <div> <button type="button"
                      className="btn btn_addtask"
                      onClick={() => this.props.request_log(this.state.product_id, this.state.task_uid, this.state.start_time)}>
                + 
              </button>
        </div>
      </div>
    )
  }

  _load() {
    let task_uid   = this.props.match.params.task_uid
    let product_id = this.props.match.params.prod_id
    let start_time = false

    if (!task_uid) {
      let product = this.props.data.products.find(product => product.get('product_id') === this.state.product_id)
      if (!product) {
        this.setState({ product_id, error: 18501 })
        return;
      }
      task_uid = product.getIn(['stats', 'last_task_uid'])
      start_time = product.getIn(['stats', 'last_start_time'])
    }
    if (!task_uid) {
      this.setState({ product_id, error: 18502 })
      return;
    }
    this.setState({ task_uid, start_time })
    this.props.request_log(product_id, task_uid, start_time)
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
