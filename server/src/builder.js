const socketio = require('socket.io')
const glob = require('glob')
const path = require('path')
const fs = require('fs')
const merge = require('merge')
const sys = require('./sys_util.js')
const db = require('./builder_db_utils.js')
const pool = require('./pool.js')
require('colors')
require('./pool_listener_tty.js')
require('./pool_listener_log.js')
const gui = require('./pool_listener_gui.js')

let g_products = []

const appCfg = JSON.parse(fs.readFileSync(__dirname + '/../../_cfg/config.json', 'utf8'))
appCfg.script_dir  = path.normalize(__dirname + '/../../' + appCfg.script_dir)
appCfg.working_dir = path.normalize(__dirname + '/../../' + appCfg.working_dir)
appCfg.db_dir      = path.normalize(__dirname + '/../../' + appCfg.db_dir)

const load_cfg = (product_id) => {
  const def = JSON.parse(fs.readFileSync(__dirname + '/../../_cfg/script_defaults.json', 'utf8'))
  const cfg = JSON.parse(fs.readFileSync(appCfg.script_dir + product_id + '/script.cfg', 'utf8'))
  const srv = JSON.parse(fs.readFileSync(appCfg.script_dir + product_id + '/server.cfg', 'utf8'))
  // for(var key in json_svr) json_cfg[key]=json_svr[key]; //json merge
  const mrg = merge.recursive(def, cfg, srv)
  if (!mrg.product_name) {
    mrg.product_name = product_id
  }
  return mrg
}

const io = socketio(appCfg.server_port)


sys.ensure_dir(appCfg.script_dir)
sys.ensure_dir(appCfg.working_dir)
sys.ensure_dir(appCfg.db_dir)

console.log('----------------------------------------------------------'.bgBlue)
console.log('config:'.bgBlue, JSON.stringify(appCfg, null, 2).bgBlue)
console.log(`Socket server starting on port: ${appCfg.server_port}`.bgBlue)
console.log('----------------------------------------------------------'.bgBlue)

const Update_Products = 1
const Update_History = 4

const loadProducts = (script_dir, on_loaded) => {
  glob('*/index.*', { cwd: script_dir, matchBase: 1 }, (err, files) => {
    if (err) {
      return
    }
    const products = files.map((file) => {
      const product_id = path.dirname(file)
      const cfg = load_cfg(product_id)
      const script_js   = script_dir + file

      return {
        product_id,
        product_name: cfg.product_name,
        cfg,
        exec: {
          file    : 'node',
          args    : [script_js],
          options : { cwd: '' },
        },
      }
    })
    on_loaded(products)
  })
}

const emitState = (state, client_socket) => {
  if (!client_socket) {
    io.emit('state', state)
  } else {
    client_socket.emit('state', state)
  }
}

const emitProducts = (client_socket) => {
  setImmediate(() => emitState({ products: g_products }, client_socket))
}

const emitHistory = (client_socket) => {
  const htasks = db.get_history(appCfg.show_history_limit)
  setImmediate(() => emitState({ htasks }, client_socket))
}

io.on('connection', function(socket){
  console.log(`Client connected: ${socket.conn.remoteAddress}`.bgBlue)

  emitProducts(socket)
  emitHistory(socket)
  socket.emit('state', { tasks: pool.allTasks() })

  socket.on('task_add', (param) => {
    pool.addTask(param.product_id, {user_comment: "user comment"})
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
  emitProducts()
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

  for (const product of g_products) {
    if (product.product_id === param.task.product_id) {
      param.task.exec = product.exec
      break
    }
  }

  emitProducts()
})

pool.on('task-starting', (param) => {

  let product_dir = appCfg.working_dir + param.task.product_id + '/'
  let working_dir = product_dir + sys.to_fs_time_string(param.task.time_add) + '/' //FIXME: task.time_start

  console.log(`>> product_dir: ${product_dir}`)

  sys.ensure_dir(appCfg.working_dir)
  sys.ensure_dir(product_dir)
  sys.ensure_dir(working_dir)

  param.task.working_dir = working_dir
  param.task.exec.options.cwd = working_dir
})

pool.on('task-completed', (param) => {
  db.add_history(param.task)
  for (const product of g_products) {
    if (product.product_id === param.task.product_id) {
      product.last_task = db.findLast_history({ product_id: product.product_id })
    }
  }
  emitProducts()
  emitHistory()
})

db.init(appCfg.db_dir).then(() => {
  loadProducts(appCfg.script_dir, (_products) => {
    g_products = _products
    for (const product of g_products) {
      product.last_task = db.findLast_history({ product_id: product.product_id })
    }
    gui.initialize(io)
    pool.initialize(9)
  })
})
