const socketio = require('socket.io')
const assert = require('better-assert')
const pool = require('./pool.js')
const db = require('./db_history.js')
require('colors')

const emitProducts = emitter =>
  emitter.emit('state', { products: pool.getProducts() })

const emitTasks = emitter =>
  emitter.emit('state', { tasks: pool.allTasks() })

const emitHistory = (emitter, show_history_limit)  =>
  emitter.emit('state', { htasks: db.get_history(show_history_limit) })


pool.on('initialized', (param) => {
  // const dbPath             = param.pluginOptions.gui.dbPath
  const show_history_limit = param.pluginOptions.gui.show_history_limit
  this.io                  = socketio(param.pluginOptions.gui.server_port)

  console.log(`Socket server starting on port: ${param.pluginOptions.gui.server_port}`.bgBlue)

  this.io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.conn.remoteAddress}`.bgBlue)

    emitProducts(this.io)
    emitTasks(this.io)
    emitHistory(this.io, show_history_limit)

    socket.on('task_add', param =>
              pool.addTask(param.product_id, { user_comment: 'user comment' }))

    socket.on('task_kill', param =>
              pool.dropTask(param.task_uid))

    socket.on('sys_shutdown', (param) => {
      // sys.log("Stoping cron tasks...")
      // script.destroy_all()

      setTimeout(() => {
        console.log("Exit.")
        process.exit(0)
      }, 100)
    });
  });
})

pool.on('error', (param) => {
  emitTasks(this.io) // activeTasks refresh if cannot start any
})

pool.on('task-added', (param) => {
  emitTasks(this.io)
})

pool.on('task-started', (param) => {
  param.task.data.status = 'WORKING'
})

pool.on('task-completed', (param) => {
  emitTasks(this.io)
  emitHistory(this.io)
})

pool.on('task-output', () => {
  emitTasks(this.io)
})
