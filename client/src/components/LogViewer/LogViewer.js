import React, { PureComponent } from 'react'
import {connect} from 'react-redux'
import * as actionCreators from '../../action_creators'
//import {toJS} from 'immutable'
//import {time_to_dir} from '../../tools/date_time.js'

export class LogViewer extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      product_id: false,
      task_uid  : false,
      error     : false,
    }
  }

  getDerivedStateFromProps() {
    console.log('getDerivedStateFromProps')

  }

  componentDidMount() {
    console.log('componentDidMount')

    let task_uid   = this.props.match.params.task_uid
    let product_id = this.props.match.params.prod_id

    this.setState({ product_id, task_uid})

    //console.log(this.props)

    if (!task_uid) {
       if (!this.props.products) {
         this.setState({ error: 18501 })
         return;
       }
       let product = this.props.products.find(product => product.get('product_id') === this.state.product_id)
       if (!product) {
         this.setState({ error: 18502 })
         return;
       }
      task_uid = product.getIn(['stats', 'last_task_uid'])
    }

    if (task_uid) {
      console.log('task_uid ', task_uid)
      this.props.request_log(task_uid)
    }
  }

  componentWillUnmount() {

  }


  //componentDidUpdate() {

    //let task_uid = this.props.match.params.task_uid
    // console.log('task_uid ', task_uid)

    //this.props.request_log(task_uid)

    //this.setState({ product_id : this.props.match.params.prod_id })
    //this.setState({ task_uid   : this.props.match.params.task_uid })

    //if (this.props.products) {
    //  console.log(this.props.products.toJS())
    //}

    // if (!this.props.products) {
    //   this.setState({ error: 18501 })
    //   console.log('componentDidMount END')
    //   return;
    // }

    // if (!this.state.task_uid) {
    //   let product = this.props.products.find(product => product.get('product_id') === this.state.product_id)
    //   if (!product) {
    //     this.setState({ error: 18502 })
    //     console.log('componentDidMount END')
    //     return;
    //   }
    //   this.setState({ task_uid: product.getIn(['stats', 'last_task_uid']) })
    //   console.log('componentDidMount END')
    // }

    // if (!this.state.task_uid) {
    //   this.setState({ error: 18503 })
    //   console.log('componentDidMount END')
    //   return;
    // }
  //}

  render() {
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
  console.log('mapStateToProps', state)
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
