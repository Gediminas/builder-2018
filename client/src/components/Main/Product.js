import React from 'react'
import {toDate, toTime} from '../../tools/date_time.js'

function Product(props) {
  let product_id   = props.product.get('product_id')
  let product_name = props.product.get('product_name')
  let task_id      = props.product.getIn(['last_task', 'id'])
  let pid          = props.product.getIn(['last_task', 'data', 'pid'])
  let task_status  = props.product.getIn(['stats', 'status'])
  let time_start   = props.product.getIn(['last_task', 'time_start'])
  let debug        = props.product.getIn(['cfg', 'debug'])

  let time_start_d  = ''
  let time_start_t  = ''
  if (time_start) {
    time_start_d  = toDate(time_start)
    time_start_t  = toTime(time_start)
  }
  let log_link = `log/${product_id}/${time_start_d}`
  console.log(log_link)

  return (
    <div className='row'>
      <div className='cell'>
        <button type="button"
                className="btn btn_addtask"
                onClick={() => props.add_task(product_id)}>
          + 
        </button>
      </div>
      <div className='cell'>{product_name}</div>
      <div className='cell status' name={task_status}> {task_status} </div>
      <div className='cell'>
        <a className='date_small'> {time_start_d} </a>
        &nbsp;
        <a className='time_large'> {time_start_t} </a>
      </div>
      <div className='cell'>task={task_id}, pid={pid}, {debug}</div>
    </div>
  )
}

export default Product;
