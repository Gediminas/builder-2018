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
            continue // do not alow 2 instances of the same product
        }
        const startingTask = waitingTasks.splice(i1, 1)[0]
        assert(startingTask === task)
        startingTask.time_start = getTimeStamp()
        startingTask.status = 'starting'
        activeTasks.push(startingTask)
        emiter.emit('taskStarting', { task: startingTask })
        setImmediate(() => executeTask(emiter, startingTask))
        return
    }
}

function executeTask(emiter, task) {
    switch (task.exec.method) {
    case 'execFile': {
        let bufOut = ''
        let bufErr = ''

        const child = execFile(task.exec.file, task.exec.args, task.exec.options, task.exec.callback)
        task.status = 'started'

        task.exec.pid = child.pid
        emiter.emit('taskStarted', { task: task })

        child.stdout.on('data', (data) => {
            bufOut += data;
            bufOut = bufferToFullLines(bufOut, (line) => {
                emiter.emit('taskOutput', { task: task, text: line })
            })
        })

        child.stderr.on('data', function(data) {
            bufErr += data;
            bufErr = bufferToFullLines(bufErr, (line) => {
                emiter.emit('taskOutputError', { task: task, text: line })
            });
        })

        child.on('close', function(exitCode) {
            for (let i in activeTasks) {
                if (activeTasks[i].uid === task.uid) {
                    let closed_task = activeTasks.splice(i, 1)[0];
                    if (closed_task.status === 'halting') {
                        closed_task.status = 'halted'
                    } else {
                        closed_task.status = 'finished'
                    }
                    assert(closed_task === task)
                    closed_task.exec.exitCode = exitCode
                    emiter.emit('taskCompleted', { task: closed_task })
                    setImmediate(() => processQueue(emiter))
                    return
                }
            }
        })
        break
    }
    default:
        console.error(`unknown method ${task.method}`.red)
        // reject(task);
        break
    }
}

class Pool extends events {
    // constructor() {
    //     super()
    // }

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
        return newTask
    }

    dropTask(taskUid) {
        let emitter = this
        for (let i in waitingTasks) {
            if (waitingTasks[i].uid === taskUid) {
                let removedTask = waitingTasks.splice(i, 1)
                emitter.emit('taskRemoved', { task: removedTask })
                return
            }
        }

        for (const task of activeTasks) {
            if (task.uid === taskUid) {
                task.status = 'halting'
                this.emit('taskKilling', { task: task })

                kill(task.exec.pid, 'SIGTERM', () => { // SIGKILL
                    task.status = 'halted'
                    emitter.emit('taskKilled', { task: task })
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
