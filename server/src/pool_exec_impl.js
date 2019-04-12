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
  initialize(parent) {
    this.parent = parent
  }

  startTask(task) {
    return new Promise((resolve, reject) => {
      const child = execFile(task.exec.file, task.exec.args, task.exec.options)
      child.bufOut = ''
      child.bufErr = ''
      task.pid = child.pid

      child.stdout.on('data', (data) => {
        child.bufOut += data
        child.bufOut = processFullLines(child.bufOut, (text) => {
          this.parent.taskOutput(task, text)
        })
      })

      child.stderr.on('data', (data) => {
        child.bufErr += data
        child.bufErr = processFullLines(child.bufErr, (text) => {
          this.parent.taskOutputError(task, text)
        })
      })

      child.on('close', (exitCode) => {
        resolve(exitCode)
      })
    })
  }

  killTask(task) {
    return new Promise((resolve, reject) => {
      kill(task.pid, 'SIGTERM', () => { // SIGKILL
        resolve()
      })
    })
  }
}


const pool_impl = new PoolExecImpl()
module.exports = pool_impl
