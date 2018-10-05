const events = require('events');
const kill   = require('tree-kill');
const assert = require('better-assert');

let waitingTasks = [];
let activeTasks  = [];
let maxWorkers   = 2;

function _buf_to_full_lines(ref_buffer, fnDoOnLine) {
    ref_buffer.buffer = ref_buffer.buffer.replace(/\r\n/g, '\n'); //normalize EOL to LF
    let bClosed = (ref_buffer.buffer.slice(-1) === '\n');
    let lines = ref_buffer.buffer.split('\n');
    ref_buffer.buffer = lines.pop();
    assert(!bClosed || ref_buffer.buffer === '');
    for (let line of lines) {
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
        let job = waitingTasks[i1];
        if (activeTasks.some(e => e.product_id === job.product_id)) {
            continue; //do not alow 2 instances of the same product
        }
        let starting_job = waitingTasks.splice(i1, 1)[0];
        assert(starting_job === job);
        starting_job.time_start = _get_time_stamp();
        starting_job.status = "starting";
        activeTasks.push(starting_job);
        emiter.emit('taskStarting', { job: starting_job });
        setImmediate(() => _execute_job(emiter, starting_job));
        return;
    }
}

function _execute_job(emiter, job) {
    switch (job.exec.method) {
    case 'execFile':
        let buf_stdout = {buffer: ''};
        let buf_stderr = {buffer: ''};

        const execFile = require('child_process').execFile;
        const child = execFile(job.exec.file, job.exec.args, job.exec.options, job.exec.callback);
        job.status = 'started';

        job.exec.pid = child.pid;
        emiter.emit('taskStarted', { job: job })

        child.stdout.on('data', function(data) {
            buf_stdout.buffer += data;
            _buf_to_full_lines(buf_stdout, (line) => {
                emiter.emit('taskOutput', { job: job, text: line })
            });
        })

        child.stderr.on('data', function(data) {
            buf_stderr.buffer += data;
            _buf_to_full_lines(buf_stderr, (line) => {
                emiter.emit('taskOutputError', { job: job, text: line })
            });
        })

        child.on('close', function(exitCode) {
            for (let i in activeTasks) {
                if (activeTasks[i].uid === job.uid) {
                    let closed_job = activeTasks.splice(i, 1)[0];
                    if (closed_job.status === 'halting') {
                        closed_job.status = 'halted';
                    } else {
                        closed_job.status = 'finished';
                    }
                    assert(closed_job === job);
                    closed_job.exec.exitCode = exitCode;
                    emiter.emit('taskCompleted', { job: closed_job })
                    setImmediate(() => _process_queue(emiter));
                    return;
                }
            }
        });
        break;
    default:
        console.error(`unknown method ${job.method}`.red);
        //reject(job);
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

    addTask(product_id, job_data) {
        let timestamp = _get_time_stamp();
        let new_job = {
            uid:        timestamp,
            product_id: product_id,
            status:     "queued",
            time_add:   timestamp,
            time_start: 0,
            time_end:   0,
            time_diff:  0,
            exec:       {},
            data:       job_data,
        };
        waitingTasks.push(new_job);
        this.emit('taskAdded', { job: new_job })
        setImmediate(() => _process_queue(this));
        return new_job;
    }

    dropTask(job_uid) {
        let emitter = this
        for (let i in waitingTasks) {
            if (waitingTasks[i].uid == job_uid) {
                let removed_job = waitingTasks.splice(i, 1);
                emitter.emit('taskRemoved', { job: removed_job })
                return;
            }
        }

        for (let job of activeTasks) {
            if (job.uid != job_uid) {
                continue;
            }
            //assert(job.exec.pid && data.exec.pid > 0);

            job.status = "halting";
            this.emit('taskKilling', { job: job })

            kill(job.exec.pid, 'SIGTERM', function() { //SIGKILL
                job.status = "halted";
                emitter.emit('taskKilled', { job: job })
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

