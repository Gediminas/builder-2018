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

      const args    = [ task.product.script_path ]
      const options = { cwd: task.working_dir }

      const child = execFile(task.product.interpreter, args, options)
      task.pid = child.pid

      child.stdout.on('data', (data) => {
        this._outputStd(taskOutput, task, data)
      })

      child.stderr.on('data', (data) => {
        this._outputErr(taskOutput, task, data)
      })

      child.on('error', (error) => {
        reject(error)
      })

      child.on('close', (exitCode) => {
        this._outputStd(taskOutput, task)
        this._outputErr(taskOutput, task)
        delete task.pid
        resolve(exitCode)
      })
    })
  }

  killTask(task) {
    return new Promise((resolve, reject) => {
      kill(task.pid, 'SIGTERM', (error) => { // SIGKILL
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  _outputStd(taskOutput, task, data) {
    if (!data) {
      if (!this.bufOut || this.bufOut === '') {
        return
      }
      data = '\n'
    }
    if (this.bufOut === '') {
      this.bufOut = data
    } else {
      this.bufOut += data
    }
    this.bufOut = processFullLines(this.bufOut, (text) => {
      taskOutput(task, text, 'stdout')
    })
  }

  _outputErr(taskOutput, task, data) {
    if (!data) {
      if (!this.bufErr || this.bufErr === '') {
        return
      }
      data = '\n'
    }
    if (this.bufErr === '') {
      this.bufErr = data
    } else {
      this.bufErr += data
    }
    this.bufErr = processFullLines(this.bufErr, (text) => {
      taskOutput(task, text, 'stderr')
    })
  }
}


const pool_impl = new PoolExecImpl()
module.exports = pool_impl
