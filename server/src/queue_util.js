"use strict";

const should = require('should');
const colors   = require('colors');
const execFile = require('child_process').execFile;
const EventEmitter = require('events');

let waiting = [];
let active  = [];
let g_max_active       = undefined;
let g_fn_worker_execute = undefined;

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
    for (let i1 in waiting) {
        let job_tmp = waiting[i1];
        let skip = false;
        for (let active_job_tmp of active) {
            if (active_job_tmp.product_id == job_tmp.product_id) {
                skip = true;
                break; //do not alow 2 instances of the same product
            }
        }
        if (skip) {
            continue;
        }
        let job = waiting.splice(i1, 1)[0];
        job.should.equal(job_tmp);
        job.time_start = _get_time_stamp();
        job.status = "starting";
        active.push(job);
        _emit(emiter, 'OnQueueJobStarting', { job: job });
        setImmediate(() => _execute_job(emiter, job));
        return;
    }
}

function _execute_job(emiter, job) {
    switch (job.exec.method) {
    case 'execFile':
        console.log('started execFile...'.bgGreen);
        const child = execFile(job.exec.file, job.exec.args, job.exec.options, job.exec.callback);
        _emit(emiter, 'OnQueueJobStarted', { job: job })
        child.stdout.on('data', function(data) {
            _emit(emiter, 'OnQueueJobLog', { text: data })
        })
        child.stderr.on('data', function(data) {
            _emit(emiter, 'OnQueueJobError', { text: data })
        })
        child.on('close', function(exitCode) {
            console.log(`worker exit code: ${exitCode}`.bgGreen);

            //FIXME: Remove later
            let job_uid = job.uid;
            for (let i in active) {
                if (active[i].uid == job_uid) {
                    active.splice(i, 1);//FIXME: remove after kill implemented

                    switch (exitCode) {
                    case 0:	 job.data.status = "OK";      break;
                    case 1:	 job.data.status = "WARNING"; break;
                    case 2:	 job.data.status = "ERROR";   break;
                    case 3:	 job.data.status = "HALT";    break;
                    default: job.data.status = "N/A";     break;
                    }

                    _emit(emiter, 'OnQueueJobFinished', { job: job })
                    setImmediate(() => _process_queue(emiter));
                    // db.add_history(job);
                    // setImmediate(() => update_client(Update_ALL));
                    // sys.log(job.product_id, "finished");

                    return;
                }
            }
            //END FIXME
            //resolve(job);

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

    init(fn_execute, max_active) {
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

