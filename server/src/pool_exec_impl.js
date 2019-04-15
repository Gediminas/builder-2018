const { execFile } = require('child_process')
const kill = require('tree-kill')
const assert = require('better-assert')

const processFullLines = (origBuffer, fnDoOnFullLine) => {
  const lines = origBuffer.split(/\r?\n/)
  const newBuffer = lines.pop()
  lines.forEach(fnDoOnFullLine)
  assert(newBuffer === '' || origBuffer.slice(-1) !== '\n')
  return newBuffer
}

class PoolExecImpl
{
  startTask(task, taskOutput, pool) {
    return new Promise((resolve, reject) => {
      const child = execFile(task.exec.file, task.exec.args, task.exec.options)
      child.bufOut = ''
      child.bufErr = ''
      task.pid = child.pid
      pool.emit('task-started', { task })

      child.stdout.on('data', (data) => {
        child.bufOut += data
        child.bufOut = processFullLines(child.bufOut, (text) => {
          taskOutput(task, text, 'stdout')
        })
      })

      child.stderr.on('data', (data) => {
        child.bufErr += data
        child.bufErr = processFullLines(child.bufErr, (text) => {
          taskOutput(task, text, 'stderr')
        })
      })

      child.on('error', (error) => {
        reject(error)
      })

      child.on('close', (exitCode) => {
        resolve(exitCode)
      })
    })
  }

  killTask(task) {
    return new Promise((resolve, reject) => {
      kill(task.pid, 'SIGTERM', (err) => { // SIGKILL
        if (err) {
          reject(e)
        } else {
          resolve()
        }
      })
    })
  }
}


const pool_impl = new PoolExecImpl()
module.exports = pool_impl
