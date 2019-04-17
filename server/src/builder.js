const socketio = require('socket.io')
const glob = require('glob')
const path = require('path')
const fs = require('fs')
const merge = require('merge')
const sys = require('./sys_util.js')
const db = require('./builder_db_utils.js')
const pool = require('./pool.js')
require('colors')
const poolExecImpl = require('./pool_exec_impl.js')
require('./pool_times.js')
require('./pool_tty.js')
require('./pool_log.js')
const gui = require('./pool_gui.js')
const cfgApp = require('../../_cfg/config.json')
const cfgDef = require('../../_cfg/script_defaults.json')

const io = socketio(cfgApp.server_port)


cfgApp.script_dir  = path.normalize(__dirname + '/../../' + cfgApp.script_dir)
cfgApp.working_dir = path.normalize(__dirname + '/../../' + cfgApp.working_dir)
cfgApp.db_dir      = path.normalize(__dirname + '/../../' + cfgApp.db_dir)

const load_cfg = (script_dir, product_id) => {
  const cfgPath = path.normalize(script_dir + product_id + '/script.cfg')
  const srvPath = path.normalize(script_dir + product_id + '/server.cfg')
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  const srv = JSON.parse(fs.readFileSync(srvPath, 'utf8'))
  const mrg = merge.recursive(true, cfgDef, cfg, srv)
  if (!mrg.product_name) {
    mrg.product_name = product_id
  }
  return mrg
}

const loadProducts = (script_dir, on_loaded) => {
  glob('*/index.*', { cwd: script_dir, matchBase: 1 }, (err, files) => {
    if (err) {
      return
    }
    let products = files.map((file) => {
      const product_id = path.dirname(file)
      const cfg = load_cfg(script_dir, product_id)
      const script_js   = script_dir + file
      return {
        product_id,
        product_name: cfg.product_name,
        cfg,
        interpreter    : 'node',
        script_path    : script_js,
      }
    })
    on_loaded(products)
  })
}

const emitState = (emitter) => {
  emitter.emit('state', {
    products: pool.getProducts(),
    tasks: pool.allTasks(),
    htasks: db.get_history(cfgApp.show_history_limit),
  })
}

const emitProducts = (emitter) => {
  setImmediate(() => emitter.emit({ products: pool.getProducts() }))
}

const emitHistory = (emitter) => {
  const htasks = db.get_history(cfgApp.show_history_limit)
  setImmediate(() => emitter.emit({ htasks }))
}

const updateProducts = (db, products, product_id) => {
  // for (const product of products) {
  //   if (!product_id || product.product_id === product_id) {
  //     product.last_task = db.findLast_history({ product_id: product.product_id })
  //   }
  // }
}

io.on('connection', function(socket){
  console.log(`Client connected: ${socket.conn.remoteAddress}`.bgBlue)

  // for (const product of products) {
  //   product.last_task = db.findLast_history({ product_id: product.product_id })
  // }
  emitState(socket)

  socket.on('task_add', (param) => {
    pool.addTask(param.product_id, { user_comment: 'user comment' })
  })

  socket.on('task_kill', (param) => {
    pool.dropTask(param.task_uid)
  })

  socket.on('sys_shutdown', (param) => {
    // sys.log("Stoping cron tasks...")
    // script.destroy_all()

    setTimeout(() => {
      console.log("Exit.")
      process.exit(0)
    }, 100)
  });
});

// pool =====================================================

pool.on('initialized', (param) => {
  const products = pool.getProducts()
  updateProducts(db, products)
  emitProducts(io)
})

pool.on('task-added', (param) => {
  let product_id = param.task.product_id
  let product_name = param.task.product_id
  let last_task  = db.findLast_history({"$and": [{ "product_id" : product_id},{"param.status": "OK"}]})
  if (!last_task) {
    last_task = db.findLast_history({"$and": [{ "product_id" : product_id},{"param.status": "WARNING"}]})
  }
  if (!last_task) {
    last_task = db.findLast_history({ "product_id" : product_id})
  }
  //console.log(last_task);
  param.task.data = {
    product_name,
    comment:        'comment',
    status:         'QUEUED',
    pid:            0,
    prev_time_diff: last_task ? last_task.time_diff : undefined
  }

  const products = pool.getProducts()
  for (const product of products) {
    if (product.product_id === param.task.product_id) {
      param.task.product = product
      break
    }
  }
})

pool.on('task-starting', (param) => {
  let product_dir = cfgApp.working_dir + param.task.product_id + '/'
  let working_dir = product_dir + sys.timeToDir(param.task.time_add) + '/' //FIXME: task.time_start

  console.log(`>> product_dir: ${product_dir}`)
  console.log(`>> working_dir: ${working_dir}`)

  sys.ensureDir(cfgApp.working_dir)
  sys.ensureDir(product_dir)
  sys.ensureDir(working_dir)

  param.task.working_dir = working_dir
})

pool.on('task-completed', (param) => {
  db.add_history(param.task)
  const products = pool.getProducts()
  updateProducts(db, products, param.task.product_id)
  emitProducts(io)
  emitHistory(io)
})

sys.ensureDir(cfgApp.script_dir)
sys.ensureDir(cfgApp.working_dir)
sys.ensureDir(cfgApp.db_dir)

console.log('----------------------------------------------------------'.bgBlue)
console.log('config:'.bgBlue, JSON.stringify(cfgApp, null, 2).bgBlue)
console.log(`Socket server starting on port: ${cfgApp.server_port}`.bgBlue)
console.log('----------------------------------------------------------'.bgBlue)

db.init(cfgApp.db_dir).then(() => {
  loadProducts(cfgApp.script_dir, (products) => {
    gui.initialize(io)
    pool.initialize(poolExecImpl, products, 2)
  })
})
