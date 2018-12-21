const events = require('events')
const kill = require('tree-kill')
const assert = require('better-assert')
const { execFile } = require('child_process')

function bufferToFullLines(origBuffer, fnDoOnLine) {
  const lines = origBuffer.split(/\r?\n/)
  const newBuffer = lines.pop()
  lines.forEach(line => fnDoOnLine(line))
  assert(newBuffer === '' || origBuffer.slice(-1) !== '\n')
  assert(newBuffer === '')
  return newBuffer
}

function getTimeStamp() {
  return new Date().valueOf()
}

class Pool extends events {
  initialize(_maxWorkers) {
    const time = getTimeStamp()
    this.waitingTasks = []
    this.activeTasks = []
    this.maxWorkers = _maxWorkers
    this.emit('initialized', { time })
  }

  addTask(productId, taskData) {
    const time = getTimeStamp()
    const task = {
      uid       : time,
      product_id: productId,
      status    : 'queued',
      time_add  : time,
      time_start: 0,
      time_end  : 0,
      time_diff : 0,
      exec      : {},
      data      : taskData,
    }
    this.waitingTasks.push(task)
    this.emit('task-added', { time, task })
    setImmediate(() => this._processQueue(this))
  }

  dropTask(taskUid) {
    const time = getTimeStamp()
    const emitter = this
    for (const i in this.waitingTasks) {
      if (this.waitingTasks[i].uid === taskUid) {
        const task = this.waitingTasks.splice(i, 1)
        emitter.emit('task-removed', { time, task })
        return
      }
    }

    for (const task of this.activeTasks) {
      if (task.uid === taskUid) {
        task.status = 'halting'
        this.emit('task-killing', { time, task })

        kill(task.exec.pid, 'SIGTERM', () => { // SIGKILL
          task.status = 'halted'
          emitter.emit('task-killed', { time, task })
        })
        return
      }
    }

    // throw "INTERNAL ERROR: 1750"
  }


  activeTasks() {
    return this.activeTasks
  }

  allTasks() {
    return this.activeTasks.concat(this.waitingTasks)
  }

  _processQueue(emiter) {
    if (this.activeTasks.length >= this.maxWorkers) {
      return
    }
    for (const i1 in this.waitingTasks) {
      const task = this.waitingTasks[i1]
      if (this.activeTasks.some(e => e.product_id === task.product_id)) {
        continue // TEMP: do not alow 2 instances of the same product
      }
      const time = getTimeStamp()
      const taskWaiting = this.waitingTasks.splice(i1, 1)[0]
      assert(task === taskWaiting)
      assert(task.status === 'queued')
      task.status = 'starting'
      task.time_start = time
      this.activeTasks.push(task)
      emiter.emit('task-starting', { time, task })
      setImmediate(() => this._executeTask(emiter, task))
      return
    }
  }

  _executeTask(emiter, task) {
    const child = execFile(task.exec.file, task.exec.args, task.exec.options, null)
    child.bufOut = ''
    child.bufErr = ''
    task.status = 'started'
    task.exec.pid = child.pid
    {
      const time = getTimeStamp()
      emiter.emit('task-started', { time, task })
    }

    child.stdout.on('data', (data) => {
      child.bufOut += data
      child.bufOut = bufferToFullLines(child.bufOut, (text) => {
        const time = getTimeStamp()
        emiter.emit('task-output', { time, task, text })
      })
    })

    child.stderr.on('data', (data) => {
      child.bufErr += data
      child.bufErr = bufferToFullLines(child.bufErr, (text) => {
        const time = getTimeStamp()
        emiter.emit('task-output-error', { time, task, text })
      })
    })

    child.on('close', (exitCode) => {
      for (const i in this.activeTasks) {
        if (this.activeTasks[i].uid !== task.uid) {
          continue
        }
        const time = getTimeStamp()
        const closedTask = this.activeTasks.splice(i, 1)[0]
        assert(closedTask === task)
        if (closedTask.status === 'halting') {
          task.status = 'halted'
        } else {
          task.status = 'finished'
        }
        task.exec.exitCode = exitCode
        emiter.emit('task-completed', { time, task })
        setImmediate(() => this._processQueue(emiter))
        return
      }
    })
  }

}

module.exports = new Pool()
