"use strict";

const should   = require('should');
const colors   = require('colors');
const EventEmitter = require('events');

let waiting = [];
let active  = [];
let g_max_active       = undefined;

function _get_time_stamp() {
	return new Date().getTime();//toLocaleString();
}

function _emit(emiter, evt, data) {
    // console.log(`queue.emit.${evt}`.bgCyan);
    emiter.emit(evt, data)
}

function _process_queue(emiter) {
    if (active.length >= g_max_active) {
        return;
    }
    loop1: for (let i1 in waiting) {
        let job = waiting[i1];
        loop2: for (let active_job of active) {
            if (active_job.product_id === job.product_id) {
                continue loop1; //do not alow 2 instances of the same product
            }
        }
        let starting_job = waiting.splice(i1, 1)[0];
        starting_job.should.be.equal(job);
        starting_job.time_start = _get_time_stamp();
        starting_job.status = "starting";
        active.push(starting_job);
        _emit(emiter, 'OnQueueJobStarting', { job: starting_job });
        setImmediate(() => _execute_job(emiter, starting_job));
        return;
    }
}

function _execute_job(emiter, job) {
    switch (job.exec.method) {
    case 'execFile':
        // console.log('started execFile...'.bgGreen);
        const execFile = require('child_process').execFile;
        const child = execFile(job.exec.file, job.exec.args, job.exec.options, job.exec.callback);
        job.exec.pid = child.pid;
        _emit(emiter, 'OnQueueJobStarted', { job: job })

        child.stdout.on('data', function(data) {
            _emit(emiter, 'OnQueueJobLog', { text: data })
        })

        child.stderr.on('data', function(data) {
            _emit(emiter, 'OnQueueJobError', { text: data })
        })

        child.on('close', function(exitCode) {
            for (let i in active) {
                if (active[i].uid == job.uid) {
                    active.splice(i, 1);//FIXME: remove after kill implemented
                    _emit(emiter, 'OnQueueJobFinished', { job: job, exitCode: exitCode })
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

class Queue extends EventEmitter {
    constructor() {
        super();
    }

    init(max_active) {
        g_max_active = 2;
        _emit(this, 'OnQueueInit', { time: new Date() })
    }

    add_job(product_id, job_data) {
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
        _emit(this, 'OnQueueJobAdded', { job: new_job })
        setImmediate(() => _process_queue(this));
        return new_job;
    }

    remove_job(job_uid) {
        for (let i in waiting) {
            if (waiting[i].uid == job_uid) {
                let removed_job = waiting.splice(i, 1);
                _emit(this, 'OnQueueJobRemoved', { job: removed_job })
                return;
            }
        }
        for (let i in active) {
            if (active[i].uid == job_uid) {
                console.log('Kill, E=1, TODO');
                //FIXME: Remove after Kill implementation
                let killing_job = active.splice(i, 1);//FIXME: remove after kill implemented
                _emit(this, 'OnQueueJobKilling', { job: killing_job })
                setImmediate(() => _process_queue(this));
                //END FIXME
                return;
            }
        }

        throw "INTERNAL ERROR: 1750";
    }


    get_active() {
        return active;
    }

    get_jobs() {
        return active.concat(waiting);
    }

    get_active() {
        return active;
    }
}

module.exports = new Queue();

