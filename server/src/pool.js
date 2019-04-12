const events = require('events')
const assert = require('better-assert')

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

class Pool extends events {
  initialize(_maxWorkers, _impl) {
    this.waitingTasks = []
    this.activeTasks = []
    this.maxWorkers = _maxWorkers
    this.impl = _impl
    const param = {}
    this.emit('initialized', param)
  }

  addTask(productId, taskData) {
    const task = { uid: generateUid(), pid: 0 }
    this.waitingTasks.push(task)
    this.emit('task-added', { task, productId, taskData })
    setImmediate(() => this._processQueue())
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
        this.impl.killTask({ task })
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

  _processQueue() {
    const emiter = this
    if (this.activeTasks.length >= this.maxWorkers) {
      return
    }
    for (const i1 in this.waitingTasks) {
      const check = {task: this.waitingTasks[i1]}
      emiter.emit('task-start-check', check)
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
      emiter.emit('task-start-impl',        { task })
      this.impl.startTask({ task })
      return
    }
    if (!this.activeTasks) {
      emiter.emit('error', {msg: 'Cannot start any task'})
    }
  }

  onTaskCompleted(param) {
    for (const i in pool.activeTasks) {
      if (pool.activeTasks[i].uid === param.task.uid) {
        const closedTask = pool.activeTasks.splice(i, 1)[0]
        assert(closedTask === param.task)
        setImmediate(() => pool._processQueue())
        break
      }
    }
    this.emit('task-completed', param);
  }
}

const pool = new Pool()
module.exports = pool
