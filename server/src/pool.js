const events = require('events')
const kill   = require('tree-kill')
const assert = require('better-assert')

const waitingTasks = []
const activeTasks = []
let maxWorkers = 2

function _buf_to_full_lines(ref_buffer, fnDoOnLine) {
    const buffer = ref_buffer.buffer.replace(/\r\n/g, '\n') // normalize EOL to LF
    ref_buffer.buffer = buffer
    let bClosed = (ref_buffer.buffer.slice(-1) === '\n')
    const lines = ref_buffer.buffer.split('\n')
    ref_buffer.buffer = lines.pop()
    assert(!bClosed || ref_buffer.buffer === '')
    for (const line of lines) {
        fnDoOnLine(line);
    }
}

function _get_time_stamp() {
    return new Date().getTime();
}

function _process_queue(emiter) {
    if (activeTasks.length >= maxWorkers) {
        return;
    }
    for (let i1 in waitingTasks) {
        let task = waitingTasks[i1];
        if (activeTasks.some(e => e.product_id === task.product_id)) {
            continue; //do not alow 2 instances of the same product
        }
        let starting_task = waitingTasks.splice(i1, 1)[0];
        assert(starting_task === task);
        starting_task.time_start = _get_time_stamp();
        starting_task.status = "starting";
        activeTasks.push(starting_task);
        emiter.emit('taskStarting', { task: starting_task });
        setImmediate(() => _execute_task(emiter, starting_task));
        return;
    }
}

function _execute_task(emiter, task) {
    switch (task.exec.method) {
    case 'execFile':
        let buf_stdout = {buffer: ''};
        let buf_stderr = {buffer: ''};

        const execFile = require('child_process').execFile;
        const child = execFile(task.exec.file, task.exec.args, task.exec.options, task.exec.callback);
        task.status = 'started';

        task.exec.pid = child.pid;
        emiter.emit('taskStarted', { task: task })

        child.stdout.on('data', function(data) {
            buf_stdout.buffer += data;
            _buf_to_full_lines(buf_stdout, (line) => {
                emiter.emit('taskOutput', { task: task, text: line })
            });
        })

        child.stderr.on('data', function(data) {
            buf_stderr.buffer += data;
            _buf_to_full_lines(buf_stderr, (line) => {
                emiter.emit('taskOutputError', { task: task, text: line })
            });
        })

        child.on('close', function(exitCode) {
            for (let i in activeTasks) {
                if (activeTasks[i].uid === task.uid) {
                    let closed_task = activeTasks.splice(i, 1)[0];
                    if (closed_task.status === 'halting') {
                        closed_task.status = 'halted';
                    } else {
                        closed_task.status = 'finished';
                    }
                    assert(closed_task === task);
                    closed_task.exec.exitCode = exitCode;
                    emiter.emit('taskCompleted', { task: closed_task })
                    setImmediate(() => _process_queue(emiter));
                    return;
                }
            }
        });
        break;
    default:
        console.error(`unknown method ${task.method}`.red);
        //reject(task);
        break;
    }
}

class Pool extends events {
    constructor() {
        super();
    }

    initialize(_maxWorkers) {
        maxWorkers = _maxWorkers;
        this.emit('initialized', { time: new Date() })
    }

    addTask(product_id, task_data) {
        let timestamp = _get_time_stamp();
        let new_task = {
            uid:        timestamp,
            product_id: product_id,
            status:     "queued",
            time_add:   timestamp,
            time_start: 0,
            time_end:   0,
            time_diff:  0,
            exec:       {},
            data:       task_data,
        };
        waitingTasks.push(new_task);
        this.emit('taskAdded', { task: new_task })
        setImmediate(() => _process_queue(this));
        return new_task;
    }

    dropTask(task_uid) {
        let emitter = this
        for (let i in waitingTasks) {
            if (waitingTasks[i].uid == task_uid) {
                let removed_task = waitingTasks.splice(i, 1);
                emitter.emit('taskRemoved', { task: removed_task })
                return;
            }
        }

        for (let task of activeTasks) {
            if (task.uid != task_uid) {
                continue;
            }
            //assert(task.exec.pid && data.exec.pid > 0);

            task.status = "halting";
            this.emit('taskKilling', { task: task })

            kill(task.exec.pid, 'SIGTERM', function() { //SIGKILL
                task.status = "halted";
                emitter.emit('taskKilled', { task: task })
			       });
             return;
        }

        // throw "INTERNAL ERROR: 1750";
    }


    activeTasks() {
        return activeTasks;
    }

    allTasks() {
        return activeTasks.concat(waitingTasks);
    }
}

module.exports = new Pool();

