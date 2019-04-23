const assert = require('better-assert')
const pool = require('./pool.js')

let io = null

const emitProducts = emitter =>
  setImmediate(() =>
    emitter.emit('state', { products: pool.getProducts() }))

const emitTasks = emitter =>
  emitter.emit('state', { tasks: pool.allTasks() })

pool.on('initialized', (param) => {
  io = param.pluginOptions.gui.emitter
  emitProducts(io)
  emitTasks(io)
})

pool.on('error', (param) => {
  emitTasks(io) // activeTasks refresh if cannot start any
})

pool.on('task-added', (param) => {
  emitTasks(io)
})

pool.on('task-started', (param) => {
  param.task.data.status = 'WORKING'
})

pool.on('task-completed', (param) => {
  emitTasks(io)
})

pool.on('task-output', () => {
  emitTasks(io)
})
