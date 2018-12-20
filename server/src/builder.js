const socketio = require('socket.io')
const sys = require('./sys_util.js')
const script = require('./script_util.js')
const db = require('./builder_db_utils.js')
const pool = require('./pool.js')
require('colors')
require('./pool_logger_tty.js')
require('./pool_logger_log.js')

const app_cfg = script.load_app_cfg()
const io = socketio(app_cfg.server_port)


sys.ensure_dir(app_cfg.script_dir)
sys.ensure_dir(app_cfg.working_dir)
sys.ensure_dir(app_cfg.db_dir)

console.log('----------------------------------------------------------'.bgBlue)
console.log('config:'.bgBlue, JSON.stringify(app_cfg, null, 2).bgBlue)
console.log(`Socket server starting on port: ${app_cfg.server_port}`.bgBlue)
console.log('----------------------------------------------------------'.bgBlue)

const Update_Products = 1
const Update_Tasks = 2
const Update_History = 4
const Update_ALL = 63

const emitState = (state, client_socket) => {
  if (!client_socket) {
    io.emit('state', state)
  } else {
    client_socket.emit('state', state)
  }
}

const updateClient = (update_flags, client_socket) => {
  if ((update_flags & Update_Products) != 0) {
    script.get_products((products) => {
      var state = {}
      state['products'] = products
      emitState(state, client_socket)
    });
  }
  var state = {}
  if ((update_flags & Update_History) != 0) {
    var show_history_limit = app_cfg.show_history_limit
    var htasks = db.get_history(show_history_limit)
    state['htasks'] = htasks
  }
  if ((update_flags & Update_Tasks) != 0) {
    var tasks = pool.allTasks()
    state['tasks'] = tasks
  }
  if (Object.keys(state).length !== 0) {
    //console.log('direct')
    emitState(state, client_socket)
  }
}

io.on('connection', function(socket){
  sys.log(`Client connected: ${socket.conn.remoteAddress}`.bgBlue)

  updateClient(Update_ALL, socket)

  socket.on('task_add', function(param){
    //script.addTask(param.product_id, "user comment");
    //updateClient(Update_Products | Update_Tasks, socket)
    pool.addTask(param.product_id, {user_comment: "user comment"})
  });

  socket.on('task_kill', function(param){
    pool.dropTask(param.task_uid)
  });

  socket.on('sys_shutdown', function(param){
    // sys.log("Stoping cron tasks...")
    // script.destroy_all()
    
    setTimeout(() => {
      sys.log("Exit.")
      process.exit(0)
    }, 100)
  });
});

// pool =====================================================

pool.on('initialized', (param) => {
  updateClient(Update_Products | Update_Tasks); //because task was added
})

pool.on('task-added', (param) => {
  let product_id = param.task.product_id
  let cfg      = script.load_cfg(product_id)
  let last_task = db.findLast_history({"$and": [{ "product_id" : product_id},{"param.status": "OK"}]})
  if (!last_task) {
    last_task = db.findLast_history({"$and": [{ "product_id" : product_id},{"param.status": "WARNING"}]})
  }
  if (!last_task) {
    last_task = db.findLast_history({ "product_id" : product_id})
  }
  //console.log(last_task);
  let data1 = {
    product_name:   cfg.product_name,
    comment:        'comment',
    status:         'QUEUED',
    pid:            0,
    prev_time_diff: last_task ? last_task.time_diff : undefined
  };
  param.task.data = data1

  //FIXME: Should be moved to taskStarting() or similar
  let app_cfg     = script.load_app_cfg()
  let script_js   = app_cfg.script_dir + product_id + '/index.js'

  param.task.exec = {
    file    : 'node',
    args    : [script_js],
    options : { cwd: '' },
  }
  // END FIXME
  updateClient(Update_Products | Update_Tasks)
})

pool.on('task-starting', (param) => {
  const app_cfg = script.load_app_cfg()
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

pool.on('task-output', () => {
  updateClient(Update_Tasks)
})

pool.on('task-output-error', () => {
  updateClient(Update_Tasks)
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
  setImmediate(() => updateClient(Update_ALL))
})

db.init(app_cfg.db_dir).then(() => {
  pool.initialize(2)
})
