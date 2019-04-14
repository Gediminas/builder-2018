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

  initialize(impl, maxWorkers) {
    this.waitingTasks = []
    this.activeTasks = []
    this.maxWorkers = maxWorkers
    this.impl = impl
    this.emit('initialized', {})
  }

  addTask(productId, taskData) {
    const task = { uid: generateUid(), pid: 0 }
    this.waitingTasks.push(task)
    this.emit('task-added', { task, productId, taskData })
    setImmediate(() => this._processQueue())
  }

  dropTask(taskUid) {
    for (const i in this.waitingTasks) {
      if (this.waitingTasks[i].uid === taskUid) {
        const task = this.waitingTasks.splice(i, 1)[0]
        this.emit('task-removed', { task })
        return
      }
    }
    for (const task of this.activeTasks) {
      if (task.uid === taskUid) {
        this.emit('task-killing', { task })
        this.impl.killTask(task).then(() => {
          this.emit('task-killed', { task })
        }).catch((error) => {
          this.emit('error', {task, error, from: 'dropTask'})
        })

        return
      }
    }
    this.emit('task-kill-failed', { taskUid })
  }

  activeTasks() {
    return this.activeTasks
  }

  allTasks() {
    return this.activeTasks.concat(this.waitingTasks)
  }

  _processQueue() {
    if (this.activeTasks.length >= this.maxWorkers) {
      return
    }
    for (const i1 in this.waitingTasks) {
      const check = {task: this.waitingTasks[i1]}
      this.emit('task-start-check', check)
      if (check.skip) {
        continue
      }
      if (check.lambda_skip && this.activeTasks.some(check.lambda_skip)) {
        continue
      }
      const task = this.waitingTasks.splice(i1, 1)[0]
      assert(task === check.task)
      this.activeTasks.push(task)
      this.emit('task-starting', { task })
      this.impl.startTask(task, this._taskOutput.bind({this: this})).then((exitCode) => {
        this._taskCompleted(task, exitCode)
      }).catch((e) => {
        this.emit('error', {task, error, from: '_processQueue'})
      })
      this.emit('task-started', { task })
      return
    }
    if (!this.activeTasks) {
      this.emit('error', {task, error, msg: 'Cannot start any task', from: '_processQueue'})
    }
  }

  _taskCompleted(task, exitCode) {
    for (const i in pool.activeTasks) {
      if (pool.activeTasks[i].uid === task.uid) {
        const closedTask = pool.activeTasks.splice(i, 1)[0]
        assert(closedTask === task)
        setImmediate(() => pool._processQueue())
        break
      }
    }
    this.emit('task-completed', { task });
  }

  _taskOutput(task, text, std) {
    pool.emit('task-output', { task, text, std})
  }

}

const pool = new Pool()
module.exports = pool
