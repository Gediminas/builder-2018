const events = require('events')
const assert = require('better-assert')
const sys = require('./sys_util')

const { execFile } = require('child_process')
const kill = require('tree-kill')

const processFullLines = (origBuffer, fnDoOnFullLine) => {
  const lines = origBuffer.split(/\r?\n/)
  const newBuffer = lines.pop()
  lines.forEach(fnDoOnFullLine)
  assert(newBuffer === '' || origBuffer.slice(-1) !== '\n')
  assert(newBuffer === '')
  return newBuffer
}

const startTask = (task, taskOutput) => {
  return new Promise((resolve, reject) => {
    const args    = task.project.args
    const options = { cwd: task.working_dir }

    const child = execFile(task.project.interpreter, args, options)
    child.bufOut = ''
    child.bufErr = ''
    task.pid = child.pid

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
        assert(child.bufOut === '') // TODO send \n
        assert(child.bufErr === '') // TODO send \n
        delete task.pid

        switch (exitCode) {
          case 0:  task.result = 'OK'; break
          case 1:  task.result = 'WARNING'; break
          case 2:  task.result = 'ERROR'; break
          default: task.result = 'N/A'; break
        }
        resolve()
      })
  })
}

const killTask = (task) => {
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

const CanRun = (task, activeTasks) => {
  const found_active = activeTasks.find(_task => _task.project_id === task.project_id)
  return found_active ? true : false
}

class Pool extends events {
  initialize(projects, cfg) {
    this.projects = projects
    this.waitingTasks = []
    this.activeTasks = []
    this.maxWorkers = cfg.maxWorkers
    console.log('init started')
    this.emit('initialized', { cfg })
    console.log('init finished')
  }

  addTask(projectId, taskData) {
    const task = {
      uid       : sys.generateUid(),
      project_id: projectId,
      data      : taskData,
    }
    this.waitingTasks.push(task)
    this.emit('task-added', { task, taskData })
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
        killTask(task).then(() => {
          this.emit('task-killed', { task })
        }).catch((error) => {
          this.emit('error', { task, error, from: 'dropTask' })
        })

        return
      }
    }
    this.emit('task-kill-failed', { taskUid })
  }

  getProjects() {
    return this.projects
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
      const check_task = this.waitingTasks[i1]
      if (CanRun(check_task, this.activeTasks)) {
        continue
      }
      const task = this.waitingTasks.splice(i1, 1)[0]
      assert(task === check_task)
      this.activeTasks.push(task)
      this.emit('task-starting', { task })
      startTask(task, this._taskOutput.bind(this))
        .then(() => {
          this._taskCompleted(task)
        })
        .catch((error) => {
          this.emit('error', { task, error, from: '_processQueue' })
        })
      this.emit('task-started', { task })
      return
    }
    if (!this.activeTasks) {
      this.emit('error', {
        task : false,
        error: false,
        msg  : 'Cannot start any task',
        from : '_processQueue',
      })
    }
  }

  _taskCompleted(task) {
    const i = this.activeTasks.indexOf(task)
    assert(i !== -1)
    const closedTask = this.activeTasks.splice(i, 1)[0]
    assert(closedTask === task)
    setImmediate(() => this._processQueue())
    this.emit('task-completed', { task })
  }

  _taskOutput(task, text, std) {
    this.emit('task-output', { task, text, std })
  }
}

const pool = new Pool()
module.exports = pool
