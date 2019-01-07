const events = require('events')
const kill = require('tree-kill')
const assert = require('better-assert')
const { execFile } = require('child_process')

let prevUid = 0
const generateUid = () => {
  let uid = 0
  do {
    assert(uid === 0) // temp check
    uid = new Date().valueOf()
  }
  while (prevUid === uid)
  prevUid = uid
  return uid
}

const bufferToFullLines = (origBuffer, fnDoOnLine) => {
  const lines = origBuffer.split(/\r?\n/)
  const newBuffer = lines.pop()
  lines.forEach(fnDoOnLine)
  assert(newBuffer === '' || origBuffer.slice(-1) !== '\n')
  return newBuffer
}

class Pool extends events {
  initialize(_maxWorkers) {
    this.waitingTasks = []
    this.activeTasks = []
    this.maxWorkers = _maxWorkers
    const param = {}
    this.emit('initialized', param)
  }

  addTask(productId, taskData) {
    const task = { uid: generateUid(), pid: 0 }
    this.waitingTasks.push(task)
    this.emit('task-added', { task, productId, taskData })
    setImmediate(() => this._processQueue(this))
  }

  dropTask(taskUid) {
    const emitter = this
    for (const i in this.waitingTasks) {
      if (this.waitingTasks[i].uid === taskUid) {
        const task = this.waitingTasks.splice(i, 1)[0]
        emitter.emit('task-removed', { task })
        return
      }
    }
    for (const task of this.activeTasks) {
      if (task.uid === taskUid) {
        emitter.emit('task-killing', { task })
        kill(task.pid, 'SIGTERM', () => { // SIGKILL
          emitter.emit('task-killed', { task })
        })
        return
      }
    }
    emitter.emit('task-kill-failed', { taskUid })
  }

  activeTasks() {
    return this.activeTasks
  }

  allTasks() {
    return this.activeTasks.concat(this.waitingTasks)
  }

  _executeTask(emiter, task) {
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
      for (const i in this.activeTasks) {
        if (this.activeTasks[i].uid !== task.uid) {
          continue
        }
        const closedTask = this.activeTasks.splice(i, 1)[0]
        assert(closedTask === task)
        emiter.emit('task-completed', { task, exitCode })
        setImmediate(() => this._processQueue(emiter))
        return
      }
    })
  }

  _processQueue(emiter) {
    if (this.activeTasks.length >= this.maxWorkers) {
      return
    }
    for (const i1 in this.waitingTasks) {
      const check = {task: this.waitingTasks[i1]}
      emiter.emit('task-can-start', check)
      if (check.skip) {
        continue
      }
      if (check.lambda_skip && this.activeTasks.some(check.lambda_skip)) {
        continue
      }
      const task = this.waitingTasks.splice(i1, 1)[0]
      assert(task === check.task)
      this.activeTasks.push(task)
      emiter.emit('task-starting', { task })
      setImmediate(() => this._executeTask(emiter, task))
      return
    }
    if (!this.activeTasks) {
      emiter.emit('error', {msg: 'Cannot start any task'})
    }
  }
}

module.exports = new Pool()
