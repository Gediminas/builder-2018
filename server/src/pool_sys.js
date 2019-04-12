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

class PoolExecImpl
{
  startTask(task) {
    const child = execFile(task.exec.file, task.exec.args, task.exec.options)
    task.pid = child.pid
    child.bufOut = ''
    child.bufErr = ''
    pool.taskStarted(task)

    child.stdout.on('data', (data) => {
      child.bufOut += data
      child.bufOut = bufferToFullLines(child.bufOut, (text) => {
        pool.taskOutput(task, text)
      })
    })

    child.stderr.on('data', (data) => {
      child.bufErr += data
      child.bufErr = bufferToFullLines(child.bufErr, (text) => {
        pool.taskOutputError(task, text)
      })
    })

    child.on('close', (exitCode) => {
      pool.taskCompleted(task, exitCode);
    })
  }

  killTask(task) {
    kill(task.pid, 'SIGTERM', () => { // SIGKILL
      pool.taskKilled(task)
    })
  }
}


const pool_impl = new PoolExecImpl()
module.exports = pool_impl
