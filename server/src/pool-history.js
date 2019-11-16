const pool   = require('./pool.js')
const db = require('./loaders/history_loader.js')

const emitHistory = (emitter, show_history_limit)  =>
  emitter.emit('state', { htasks: db.get_history(show_history_limit) })

// const updateProducts = (db, products, product_id) => {
//  for (const product of products) {
//    if (!product_id || product.product_id === product_id) {
//      product.last_task = db.findLast_history({ product_id: product.product_id })
//    }
//  }
// }

pool.on('initialized', (param) => {
  console.log('plugin: history: initializing start')
  this.show_history_limit = param.cfg.show_history_limit
  const dbPath = `${param.cfg.working_dir}history.json`
  console.log('plugin: history: DB loading', dbPath)

  db.init(dbPath).then(() => {
    console.log('plugin: history: DB loaded')

    // Update stats for products
    const products = pool.getProducts()
    for (const product of products) {
      const last_task = db.findLast_history({ product_id: product.product_id })
      product.stats = {
        status       : last_task ? last_task.data.status : 'N/A',
        last_task_uid: last_task ? last_task.uid : '',
      }
    }

    console.log('plugin: history: stats updated for all products')
    console.log('plugin: history: initialized')
  })
  console.log('plugin: history: initializing done')
})

pool.on('client-connected', (param) => {
  this.io = param.io
  emitHistory(param.socket, this.show_history_limit)
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

  emitHistory(this.io, this.show_history_limit)

  const products = pool.getProducts()
  for (let product of products) {
    if (product.product_id != param.task.product_id) {
      continue
    }

    product.stats.status = param.task.status
    product.stats.last_task_uid = param.task.uid
    product.stats.last_start_time = param.task.time_start

    console.log('history db stats updated for product ' + product.product_id)
    break
  }
})

