const assert = require('better-assert')
const pool = require('./pool.js')

let socketio = null

const emitTasks = () => socketio.emit('state', { tasks: pool.allTasks() })

pool.on('initialized', (param) => {
  emitTasks()
})

pool.on('initialized',    (param) => {
  emitTasks()
})

pool.on('task-starting',  (param) => {})
pool.on('task-started',   (param) => {})

pool.on('task-added',     (param) => {
  emitTasks()
})

pool.on('task-removed',   (param) => {})
pool.on('task-killing',   (param) => {})
pool.on('task-killed',    (param) => {})

pool.on('task-completed', (param) => {
  emitTasks()
})

pool.on('task-output', () => {
  emitTasks()
})

pool.on('task-output-error', () => {
  emitTasks()
})

module.exports.initialize = (_socketio) => {
  socketio = _socketio
}
