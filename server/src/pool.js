const events = require('events')
const kill = require('tree-kill')
const assert = require('better-assert')
const { execFile } = require('child_process')

const waitingTasks = []
const activeTasks = []
let maxWorkers = 2

function bufferToFullLines(origBuffer, fnDoOnLine) {
  const lines = origBuffer.split(/\r?\n/)
  const newBuffer = lines.pop()
  lines.forEach(line => fnDoOnLine(line))
  assert(newBuffer === '' || origBuffer.slice(-1) !== '\n')
  return newBuffer
}

function getTimeStamp() {
  return new Date().getTime()
}

function processQueue(emiter) {
  if (activeTasks.length >= maxWorkers) {
    return
  }
  for (const i1 in waitingTasks) {
    const task = waitingTasks[i1]
    if (activeTasks.some(e => e.productId === task.productId)) {
      continue // TEMP: do not alow 2 instances of the same product
    }
    const startingTask = waitingTasks.splice(i1, 1)[0]
    assert(startingTask === task)
    assert(startingTask.status === 'queued')
    startingTask.status = 'starting'
    startingTask.time_start = getTimeStamp()
    activeTasks.push(startingTask)
    emiter.emit('taskStarting', { task: startingTask })
    setImmediate(() => executeTask(emiter, startingTask))
    return
  }
}

function executeTask(emiter, task) {
  const child = execFile(task.exec.file, task.exec.args, task.exec.options, null)
  child.bufOut = '';
  child.bufErr = '';
  task.status = 'started'
  task.exec.pid = child.pid
  emiter.emit('taskStarted', { task })

  child.stdout.on('data', (text) => {
    child.bufOut += text
    child.bufOut = bufferToFullLines(child.bufOut, (line) => {
      emiter.emit('taskOutput', { task, text: line })
    })
  })

  child.stderr.on('data', (text) => {
    child.bufErr += text
    child.bufErr = bufferToFullLines(child.bufErr, (line) => {
      emiter.emit('taskOutputError', { task, text: line })
    })
  })

  child.on('close', (exitCode) => {
    for (const i in activeTasks) {
      if (activeTasks[i].uid !== task.uid) {
        continue
      }
      const closedTask = activeTasks.splice(i, 1)[0]
      if (closedTask.status === 'halting') {
        closedTask.status = 'halted'
      } else {
        closedTask.status = 'finished'
      }
      assert(closedTask === task)
      closedTask.exec.exitCode = exitCode
      emiter.emit('taskCompleted', { task: closedTask })
      setImmediate(() => processQueue(emiter))
      return
    }
  })
}

class Pool extends events {
  initialize(_maxWorkers) {
    maxWorkers = _maxWorkers
    this.emit('initialized', { time: new Date() })
  }

  addTask(productId, taskData) {
    const timestamp = getTimeStamp()
    const newTask = {
      uid: timestamp,
      product_id: productId,
      status: 'queued',
      time_add: timestamp,
      time_start: 0,
      time_end: 0,
      time_diff: 0,
      exec: {},
      data: taskData,
    }
    waitingTasks.push(newTask)
    this.emit('taskAdded', { task: newTask })
    setImmediate(() => processQueue(this))
  }

  dropTask(taskUid) {
    const emitter = this
    for (const i in waitingTasks) {
      if (waitingTasks[i].uid === taskUid) {
        const removedTask = waitingTasks.splice(i, 1)
        emitter.emit('taskRemoved', { task: removedTask })
        return
      }
    }

    for (const task of activeTasks) {
      if (task.uid === taskUid) {
        task.status = 'halting'
        this.emit('taskKilling', { task })

        kill(task.exec.pid, 'SIGTERM', () => { // SIGKILL
          task.status = 'halted'
          emitter.emit('taskKilled', { task })
        })
        return
      }
    }

    // throw "INTERNAL ERROR: 1750"
  }


  activeTasks() {
    return activeTasks
  }

  allTasks() {
    return activeTasks.concat(waitingTasks)
  }
}

module.exports = new Pool()
