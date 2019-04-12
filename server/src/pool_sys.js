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

class PoolExecImpl {

  startTask(param) {
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
          emiter.emit('task-output:error', { task, text })
        })
      }

      child.on('close', (exitCode) => {
        pool.onTaskCompleted({task, exitCode});
      })
  }
  killTask(param) {
    const task = param.task
    const emiter = pool
    kill(task.pid, 'SIGTERM', () => { // SIGKILL
      emiter.emit('task-killed', { task })
    })
  }
}


const pool_impl = new PoolExecImpl()
module.exports = pool_impl
