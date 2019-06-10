const pool   = require('./pool.js')
const db = require('./loaders/history_loader.js')

//const updateProducts = (db, products, product_id) => {
// for (const product of products) {
//   if (!product_id || product.product_id === product_id) {
//     product.last_task = db.findLast_history({ product_id: product.product_id })
//   }
// }
//}

pool.on('initialized', (param) => {
  const dbPath = `${param.cfg.working_dir}history.json`
  console.log('history db loading')

  db.init(dbPath).then(() => {
    console.log('history db loaded')

    // Update stats for products
    const products = pool.getProducts()
    for (let product of products) {
      let last_task = db.findLast_history({ product_id: product.product_id })
      product.stats = {
        status: last_task ? last_task.data.status : 'N/A',
      }
    }

    console.log('history db stats updated for all products')
  })
})

pool.on('error',            param => {})
pool.on('task-starting',    param => {})
pool.on('task-started',     param => {})

pool.on('task-added',       param => {
  /*
  let product_id = param.task.product_id
  let last_task  = db.findLast_history({"$and": [{ "product_id" : product_id},{"param.status": "OK"}]})
  if (!last_task) {
    last_task = db.findLast_history({"$and": [{ "product_id" : product_id},{"param.status": "WARNING"}]})
  }
  if (!last_task) {
    last_task = db.findLast_history({ "product_id" : product_id})
  }
  */
})

pool.on('task-completed',   param => {
  db.add_history(param.task)

  const products = pool.getProducts()
  for (let product of products) {
    if (product.product_id != param.task.product_id) {
      continue
    }
    product.stats.status = param.task.status
    console.log('history db stats updated for product ' + product.product_id)
    break
  }
})

