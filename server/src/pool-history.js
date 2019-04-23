const db = require('./db_history.js')
const pool   = require('./pool.js')

//const updateProducts = (db, products, product_id) => {
// for (const product of products) {
//   if (!product_id || product.product_id === product_id) {
//     product.last_task = db.findLast_history({ product_id: product.product_id })
//   }
// }
//}

let emitter = null
let limit = null

const emitHistory = (emitter) => {
  const htasks = db.get_history(limit)
  emitter.emit('state', { htasks })
}

pool.on('initialized', (param) => {
  db.init(param.pluginOptions.history.db_dir).then(() => {})
  emitter = param.pluginOptions.history.emitter
  limit = param.pluginOptions.history.show_history_limit
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

pool.on('task-removed',     param => {})
pool.on('task-killing',     param => {})
pool.on('task-killed',      param => {})
pool.on('task-kill-failed', param => {})

pool.on('task-completed',   param => {
  db.add_history(param.task)
  emitHistory(emitter)
})

pool.on('task-output',      param => {})


