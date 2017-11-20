import React, { PureComponent } from 'react'
import Product from './Product'

export default class extends PureComponent {
  getProducts() {
    return this.props.products || []
  }
  render() {
    let header = (
      <div className='row_header'>
        <div className='cell_header'></div>
        <div className='cell_header'>Product</div>
        <div className='cell_header'>Status</div>
        <div className='cell_header'>Autotester</div>
        <div className='cell_header'>Cron</div>
        <div className='cell_header'>Prio</div>
        <div className='cell_header'>Span</div>
        <div className='cell_header'>Last</div>
        <div className='cell_header'>Comment</div>
        <div className='cell_header'>debug</div>
      </div>
    )
    let ui_products = this.getProducts().map((product) => {
      let product_id = product.get('product_id')
      return <Product key={product_id} product={product} add_job={this.props.add_job} />
    })
    return (
      <div className='products'>
        <div className='table'>
          <div className='row_header'>
          </div>
          {header}
          {ui_products}
        </div>
      </div>
    )
  }
}

