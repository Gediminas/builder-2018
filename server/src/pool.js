"use strict";

const should   = require('should');
const colors   = require('colors');
const EventEmitter = require('events');
const sys      = require('./sys_util.js');
const kill     = require('tree-kill');

let waiting = [];
let activeTasks  = [];
let g_max_active = undefined;

function _get_time_stamp() {
    return new Date().getTime();
}

function _process_queue(emiter) {
    if (activeTasks.length >= g_max_active) {
        return;
    }
    for (let i1 in waiting) {
        let job = waiting[i1];
        if (activeTasks.some(e => e.product_id === job.product_id)) {
            continue; //do not alow 2 instances of the same product
        }
        let starting_job = waiting.splice(i1, 1)[0];
        starting_job.should.be.equal(job);
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
            sys.buf_to_full_lines(buf_stdout, (line) => {
                emiter.emit('taskLog', { job: job, text: line })
            });
        })

        child.stderr.on('data', function(data) {
            buf_stderr.buffer += data;
            sys.buf_to_full_lines(buf_stderr, (line) => {
                emiter.emit('taskError', { job: job, text: line })
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
                    closed_job.should.be.equal(job)
                    closed_job.exec.exitCode = exitCode;
                    emiter.emit('taskFinished', { job: closed_job })
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

class Pool extends EventEmitter {
    constructor() {
        super();
    }

    init(max_active) {
        g_max_active = 2;
        this.emit('OnInit', { time: new Date() })
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
        waiting.push(new_job);
        this.emit('taskAdded', { job: new_job })
        setImmediate(() => _process_queue(this));
        return new_job;
    }

    dropTask(job_uid) {
        let emitter = this
        for (let i in waiting) {
            if (waiting[i].uid == job_uid) {
                let removed_job = waiting.splice(i, 1);
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
        return activeTasks.concat(waiting);
    }
}

module.exports = new Pool();

