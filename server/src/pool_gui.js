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

pool.on('error', (param) => {
  emitTasks() // activeTasks refresh if cannot start any
})


pool.on('task-start:after',   (param) => {
  param.task.data.pid = param.task.pid
  param.task.data.status = 'WORKING'
})

pool.on('task-added',     (param) => {
  emitTasks()
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
  emitTasks()
})

pool.on('task-output', () => {
  emitTasks()
})

pool.on('task-output:error', () => {
  emitTasks()
})

module.exports.initialize = (_socketio) => {
  socketio = _socketio
}
