const { execFile } = require('child_process')
const kill = require('tree-kill')
const assert = require('better-assert')
const pool = require('./pool.js')

const bufferToFullLines = (origBuffer, fnDoOnLine) => {
  const lines = origBuffer.split(/\r?\n/)
  const newBuffer = lines.pop()
  lines.forEach(fnDoOnLine)
  assert(newBuffer === '' || origBuffer.slice(-1) !== '\n')
  return newBuffer
}


pool.on('initialized', (param) => {
})

pool.on('error', (param) => {
})

pool.on('task-added', (param) => {
})

pool.on('task-can-start', (param) => {
})

pool.on('task-start', (param) => {
  const task = param.task
  const emiter = pool
  const child = execFile(task.exec.file, task.exec.args, task.exec.options)
  task.pid = child.pid
  child.bufOut = ''
  child.bufErr = ''
  emiter.emit('task-started', { task })

  child.stdout.on('data', (data) => {
    child.bufOut += data
    child.bufOut = bufferToFullLines(child.bufOut, (text) => {
      emiter.emit('task-output', { task, text })
    })
  })

  child.stderr.on('data', (data) => {
    child.bufErr += data
    child.bufErr = bufferToFullLines(child.bufErr, (text) => {
      emiter.emit('task-output-error', { task, text })
    })
  })

  child.on('close', (exitCode) => {
    emiter.emit('task-completed', { task, exitCode })
  })
})

pool.on('task-starting', (param) => {
})

pool.on('task-started', (param) => {
})

pool.on('task-removed',  (param) => {
})

pool.on('task-killing', (param) => {
})

pool.on('task-killed', (param) => {
})


pool.on('task-completed', (param) => {
})

pool.on('task-output', (param) => {
})

pool.on('task-output-error', (param) => {
})
