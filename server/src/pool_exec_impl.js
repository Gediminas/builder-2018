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
      this.bufOut = ''
      this.bufErr = ''
      task.pid = child.pid

      child.stdout.on('data', (data) => {
        this.bufOut += data
        this.bufOut = processFullLines(this.bufOut, (text) => {
          taskOutput(task, text, 'stdout')
        })
      })

      child.stderr.on('data', (data) => {
        this.bufErr += data
        this.bufErr = processFullLines(this.bufErr, (text) => {
          taskOutput(task, text, 'stderr')
        })
      })

      child.on('error', (error) => {
        reject(error)
      })

      child.on('close', (exitCode) => {
        assert(this.bufOut === '') //TODO send \n
        assert(this.bufErr === '') //TODO send \n
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
}


const pool_impl = new PoolExecImpl()
module.exports = pool_impl
