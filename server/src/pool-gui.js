const socketio = require('socket.io')
const assert = require('better-assert')
const pool = require('./pool.js')
require('colors')

const emitProducts = emitter =>
  emitter.emit('state', { products: pool.getProducts() })

const emitTasks = emitter =>
  emitter.emit('state', { tasks: pool.allTasks() })


pool.on('initialized', (param) => {
  console.log('plugin: gui: initializing start')
  const server_port       = param.cfg.server_port

  console.log(`plugin: gui: Socket server starting on port: ${server_port}`.blue)

  this.io = socketio(server_port)
  this.io.on('connection', (socket) => {
    console.log(`plugin: gui: Client connected: ${socket.conn.remoteAddress}`.blue)
    pool.emit('client-connected', { socket })
  });
  console.log('plugin: gui: initializing done')
})

pool.on('client-connected', (param) => {
  this.socket = param.socket
  let socket = this.socket

  emitProducts(socket)
  emitTasks(socket)

  socket.on('task_add', data =>
            pool.addTask(data.product_id, { user_comment: 'user comment' }))

  socket.on('task_kill', data =>
            pool.dropTask(data.task_uid))

  socket.on('request_log', data => {
    console.log('plugin: gui: Request for logs received', data)

    let task_uid = data.task_uid

    if (!task_uid) {
      let products = pool.getProducts()
      let product = products.find(_product => _product.product_id === data.product_id)
      task_uid = product.stats.last_task_uid
      console.log('plugin: gui: found', task_uid)
    }

    // if (!product) {
    //   return;
    // }
    // let task_uid = product.getIn(['stats', 'last_task_uid'])
    // if (!task_uid) {
    //   return;
    // }
    // props.request_log(product_id, task_uid)


    // for (let product of products) {
    //   if (product.id === data.product_id) {
    //     socket.emit('state', { logs: ['here will be', 'logs'] })
    //   }

    // }

    let key = data.task_uid || data.product_id
    let logs = {}
    logs[key] = ['Here will be logs of ', data.product_id, task_uid]
    socket.emit('state', { logs })

    console.log('>> Logs sent back: ', logs)
  })

  socket.on('sys_shutdown', (param) => {
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
  emitTasks(this.io)
  emitProducts(this.io)
})

pool.on('task-output', () => {
  emitTasks(this.io)
})
