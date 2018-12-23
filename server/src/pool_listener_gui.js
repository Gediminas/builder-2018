const socketio = require('socket.io')
const assert = require('better-assert')
const pool = require('./pool.js')

let io = null

const Update_Tasks = 0

const updateClient = () => {
  assert(io)
  // if ((update_flags & Update_Products) != 0) {
  //   getProducts((products) => {
  //     var state = {}
  //     state['products'] = products
  //     emitState(state, client_socket)
  //   });
  // }
  // var state = {}
  // if ((update_flags & Update_History) != 0) {
  //   var show_history_limit = app_cfg.show_history_limit
  //   var htasks = db.get_history(show_history_limit)
  //   state['htasks'] = htasks
  // }
  // if ((update_flags & Update_Tasks) != 0) {
  //   var tasks = pool.allTasks()
  //   state['tasks'] = tasks
  // }
  // if (Object.keys(state).length !== 0) {
  //   //console.log('direct')
  //   emitState(state, client_socket)
  // }

  const state = {
    tasks: pool.allTasks(),
  }
  io.emit('state', state)
}

pool.on('initialized',    (param) => {})
pool.on('task-starting',  (param) => {})
pool.on('task-started',   (param) => {})
pool.on('task-added',     (param) => {})
pool.on('task-removed',   (param) => {})
pool.on('task-killing',   (param) => {})
pool.on('task-killed',    (param) => {})
pool.on('task-completed', (param) => {})

pool.on('task-output', () => {
  updateClient(Update_Tasks)
})

pool.on('task-output-error', () => {
  updateClient(Update_Tasks)
})

module.exports.initialize = (_io) => {
  io = _io
}
