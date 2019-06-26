import React from 'react'
import Product from './Product'

function Products(props) {
  let products = props.products || []
  return (
    <div className='products'>
      <div className='table'>
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
        {
          products.map((product) => {
            let product_id = product.get('product_id')
            return <Product key={product_id} product={product} add_task={props.add_task} />
          })
        }
      </div>
    </div>
  )
}

export default Products;
