const assert = require('better-assert')
const pool   = require('./pool.js')

const getTimeStamp = () => new Date().valueOf()


pool.on('initialized',   param => {
  param.time = getTimeStamp()
})

pool.on('task-added',    param => {
  param.time            = getTimeStamp()
  param.task.product_id = param.productId,
  param.task.status     = 'queued'
  param.task.time_add   = param.time
  param.task.time_start = 0
  param.task.time_end   = 0
  param.task.time_diff  = 0
  param.task.exec       = {}
  param.task.data       = param.taskData
})

pool.on('task-starting', param => {
  param.time = getTimeStamp()
  assert(param.task.status === 'queued')
  param.task.status     = 'starting'
  param.task.time_start = param.time
})

pool.on('task-started',  param => {
  param.time          = getTimeStamp()
  param.task.exec.pid = param.pid
  param.task.status   = 'started'
})

pool.on('task-removed',  param => {
  param.time = getTimeStamp()
})

pool.on('task-killing',  param => {
  param.time = getTimeStamp()
  param.task.status = 'halting'
})

pool.on('task-killed',   param => {
  param.time = getTimeStamp()
  param.task.status = 'halted'
})


pool.on('task-completed', (param) => {
  param.time = getTimeStamp()
  if (param.task.status === 'halting') {
    param.task.status = 'halted'
  } else {
    param.task.status = 'finished'
  }
  param.task.exec.exitCode = param.exitCode
})

pool.on('task-output', (param) => {
  param.time = getTimeStamp()
})

pool.on('task-output-error', (param) => {
  param.time = getTimeStamp()
})
