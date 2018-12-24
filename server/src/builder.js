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

const getTaskByProduct = (product_id) => {
  const tasks = pool.allTasks()
  for (const task of tasks) {
    if (task.product_id === product_id) {
      return task
    }
  }
  return db.findLast_history({ product_id })
}

const load_app_cfg = (product_id) => {
	const acfg = JSON.parse(fs.readFileSync(__dirname + '/../../_cfg/config.json', 'utf8'))
  acfg.script_dir  = path.normalize(__dirname + '/../../' + acfg.script_dir)
  acfg.working_dir = path.normalize(__dirname + '/../../' + acfg.working_dir)
  acfg.db_dir      = path.normalize(__dirname + '/../../' + acfg.db_dir)
  return acfg
}

const load_cfg = (product_id) => {
  const config = load_app_cfg()
  const def = JSON.parse(fs.readFileSync(__dirname + '/../../_cfg/script_defaults.json', 'utf8'))
  const cfg = JSON.parse(fs.readFileSync(config['script_dir'] + product_id + '/script.cfg', 'utf8'))
  const srv = JSON.parse(fs.readFileSync(config['script_dir'] + product_id + '/server.cfg', 'utf8'))
  // for(var key in json_svr) json_cfg[key]=json_svr[key]; //json merge
  const mrg = merge.recursive(def, cfg, srv)
  if (!mrg.product_name) {
    mrg.product_name = product_id
  }
  return mrg
}

const app_cfg = load_app_cfg()
const io = socketio(app_cfg.server_port)


sys.ensure_dir(app_cfg.script_dir)
sys.ensure_dir(app_cfg.working_dir)
sys.ensure_dir(app_cfg.db_dir)

console.log('----------------------------------------------------------'.bgBlue)
console.log('config:'.bgBlue, JSON.stringify(app_cfg, null, 2).bgBlue)
console.log(`Socket server starting on port: ${app_cfg.server_port}`.bgBlue)
console.log('----------------------------------------------------------'.bgBlue)

const Update_Products = 1
const Update_History = 4


const getProducts = (script_dir, on_loaded) => {
  glob('*/index.*', { cwd: script_dir, matchBase: 1 }, (err, files) => {
    if (err) {
      reject(err)
    }
    const dirNames = files.map(file => path.dirname(file))
    const products = []
    for (const product_id of dirNames) {
      const cfg = load_cfg(product_id)
      const lastTask = getTaskByProduct(product_id)
      const product = {
        product_id,
        product_name: cfg.product_name,
        cfg,
        last_task: lastTask,
      }
      products.push(product)
    }
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

const updateClient = (update_flags, client_socket) => {
  const config = load_app_cfg()
  if ((update_flags & Update_Products) != 0) {
    getProducts(config.script_dir, (products) => {
      emitState({ products }, client_socket)
    });
  }
  if ((update_flags & Update_History) != 0) {
    const htasks = db.get_history(app_cfg.show_history_limit)
    emitState({ htasks }, client_socket)
  }
}

io.on('connection', function(socket){
  console.log(`Client connected: ${socket.conn.remoteAddress}`.bgBlue)

  updateClient(Update_Products |  Update_History, socket)
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
  updateClient(Update_Products) //because task was added
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
  let data1 = {
    product_name,
    comment:        'comment',
    status:         'QUEUED',
    pid:            0,
    prev_time_diff: last_task ? last_task.time_diff : undefined
  };
  param.task.data = data1

  //FIXME: Should be moved to taskStarting() or similar
  let script_js   = app_cfg.script_dir + product_id + '/index.js'

  param.task.exec = {
    file    : 'node',
    args    : [script_js],
    options : { cwd: '' },
  }
  // END FIXME
  updateClient(Update_Products)
})

pool.on('task-starting', (param) => {
  sys.ensure_dir(app_cfg.working_dir)

  let product_dir = app_cfg.working_dir + param.task.product_id + '/'
  console.log(`>> product_dir: ${product_dir}`)
  let working_dir = product_dir + sys.to_fs_time_string(param.task.time_add) + '/' //FIXME: task.time_start

  sys.ensure_dir(product_dir)
  sys.ensure_dir(working_dir)

  param.task.working_dir = working_dir
  param.task.exec.options.cwd = working_dir
})

pool.on('task-started', (param) => {
  param.task.data.pid = param.task.exec.pid
  param.task.data.status = 'WORKING'
})

pool.on('task-completed', (param) => {
  if (param.task.status === 'halted') {
    param.task.data.status = 'HALTED'
  } else if (param.task.status === 'finished') {
    switch (param.task.exec.exitCode) {
    case 0: param.task.data.status = 'OK'; break
    case 1: param.task.data.status = 'WARNING'; break
    case 2: param.task.data.status = 'ERROR'; break
    case 3: param.task.data.status = 'HALT'; break
    default: param.task.data.status = 'N/A'; break
    }
  } else {
    param.task.data.status = `(${param.task.status})`
  }
  db.add_history(param.task)
  setImmediate(() => updateClient(Update_Products | Update_History))
})

db.init(app_cfg.db_dir).then(() => {
  gui.initialize(io)
  pool.initialize(9)
})
