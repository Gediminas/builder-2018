const socketio = require('socket.io')
const path = require('path')
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
  this.working_dir        = param.cfg.working_dir

  console.log(`plugin: gui: Socket server starting on port: ${server_port}`.blue)

  this.io = socketio(server_port)
  this.io.on('connection', (socket) => {
    console.log(`plugin: gui: Client connected: ${socket.conn.remoteAddress}`.blue)
    pool.emit('client-connected', { socket, io: this.io })
  });
  console.log('plugin: gui: initializing done')
})

pool.on('client-connected', (param) => {
  emitProducts(param.socket)
  emitTasks(param.socket)

  param.socket.on('task_add', data =>
            pool.addTask(data.product_id, { user_comment: 'user comment' }))

  param.socket.on('task_kill', data =>
            pool.dropTask(data.task_uid))

  param.socket.on('request_log', (data) => {
    console.log('plugin: gui: Request for logs received: ', data.product_id, data.task_uid)

    let task_uid = data.task_uid

    if (!task_uid) {
      const products = pool.getProducts()
      const product = products.find(_product => _product.product_id === data.product_id)
      task_uid = product.stats.last_task_uid
      console.log('plugin: gui: found', task_uid)
    }

    const key = data.task_uid || data.product_id
    const logs = {}
    logs[key] = [
      'Here will be logs of ',
      data.product_id, task_uid,
      this.working_dir,
      this.working_dir + '/' + data.product_id + '/',
    ]

    {
      //console.log(param)
      //console.log(data)

      /*
      const log_dir = generateLogName(this.working_dir)
      glob('* /*.log', { cwd: log_dir, matchBase: 1 }, (err, files) => {
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
      */

    }

    console.log('plugin: gui: Sending logs to client: ', logs)
    param.socket.emit('state', { logs })

    // subscribe the client and send only updates
    // if log is 'active'
  })

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
  emitTasks(this.io)
  emitProducts(this.io)
})

pool.on('task-output', () => {
  emitTasks(this.io)
})
