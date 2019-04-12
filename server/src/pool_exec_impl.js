const { execFile } = require('child_process')
const kill = require('tree-kill')
const assert = require('better-assert')

const bufferToFullLines = (origBuffer, fnDoOnLine) => {
  const lines = origBuffer.split(/\r?\n/)
  const newBuffer = lines.pop()
  lines.forEach(fnDoOnLine)
  assert(newBuffer === '' || origBuffer.slice(-1) !== '\n')
  return newBuffer
}

class PoolExecImpl
{
  initialize(parent) {
    this.parent = parent
  }

  startTask(task) {
    const child = execFile(task.exec.file, task.exec.args, task.exec.options)
    task.pid = child.pid
    child.bufOut = ''
    child.bufErr = ''
    this.parent.taskStarted(task)

    child.stdout.on('data', (data) => {
      child.bufOut += data
      child.bufOut = bufferToFullLines(child.bufOut, (text) => {
        this.parent.taskOutput(task, text)
      })
    })

    child.stderr.on('data', (data) => {
      child.bufErr += data
      child.bufErr = bufferToFullLines(child.bufErr, (text) => {
        this.parent.taskOutputError(task, text)
      })
    })

    child.on('close', (exitCode) => {
      this.parent.taskCompleted(task, exitCode);
    })
  }

  killTask(task) {
    kill(task.pid, 'SIGTERM', () => { // SIGKILL
      this.parent.taskKilled(task)
    })
  }
}


const pool_impl = new PoolExecImpl()
module.exports = pool_impl
