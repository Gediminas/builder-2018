const socketio = require('socket.io')
const path = require('path')
const assert = require('better-assert')
const pool = require('./pool.js')
require('colors')

//???
const sys = require('./sys_util');
const fs = require('fs')


const emitProducts = emitter =>
  emitter.emit('state', { products: pool.getProducts() })

const emitTasks = emitter =>
  emitter.emit('state', { tasks: pool.allTasks() })


pool.on('initialized', (param) => {
  console.log('>> gui: Init start')

  const dbPath            = `${param.cfg.working_dir}history.json`
  const server_port       = param.cfg.server_port
  this.working_dir        = param.cfg.working_dir

  console.log(`>> gui: Socket server starting on port: ${server_port}`.magenta)
  this.io = socketio(server_port)
  this.io.on('connection', (socket) => {
    console.log(`>>>> gui: Client connected: ${socket.conn.remoteAddress}`.yellow)
    pool.emit('client-connected', { socket, io: this.io })
  });
  console.log('>> gui: Init end')
})

pool.on('client-connected', (param) => {
  this.io = param.io
  emitProducts(param.socket)
  emitTasks(param.socket)

  param.socket.on('task_add', data =>
    pool.addTask(data.product_id, { user_comment: 'user comment' }))

  param.socket.on('task_kill', data =>
    pool.dropTask(data.task_uid))

  param.socket.on('sys_shutdown', (param) => {
    // sys.log("Stoping cron tasks...")
    // script.destroy_all()

    setTimeout(() => {
      console.log("Exit.")
      process.exit(0)
    }, 100)
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
  const products = pool.getProducts()
  for (let product of products) {
    if (product.product_id != param.task.product_id) {
      continue
    }

    //product.stats.status = param.task.status
    //product.stats.last_task_uid = param.task.uid
    //product.stats.last_start_time = param.task.time_start
    break
  }

  emitTasks(this.io)
  emitProducts(this.io)
})

pool.on('task-output', () => {
  emitTasks(this.io)
})