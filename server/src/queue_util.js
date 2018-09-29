"use strict";

const should   = require('should');
const colors   = require('colors');
const EventEmitter = require('events');
const sys      = require('./sys_util.js');

let waiting = [];
let active  = [];
let g_max_active = undefined;

function _get_time_stamp() {
    return new Date().getTime();
}

function _process_queue(emiter) {
    if (active.length >= g_max_active) {
        return;
    }
    for (let i1 in waiting) {
        let job = waiting[i1];
        if (active.some(e => e.product_id === job.product_id)) {
            continue; //do not alow 2 instances of the same product
        }
        let starting_job = waiting.splice(i1, 1)[0];
        starting_job.should.be.equal(job);
        starting_job.time_start = _get_time_stamp();
        starting_job.status = "starting";
        active.push(starting_job);
        emiter.emit('OnQueueJobStarting', { job: starting_job });
        setImmediate(() => _execute_job(emiter, starting_job));
        return;
    }
}

function _execute_job(emiter, job) {
    switch (job.exec.method) {
    case 'execFile':
        const execFile = require('child_process').execFile;
        const child = execFile(job.exec.file, job.exec.args, job.exec.options, job.exec.callback);
        job.exec.pid = child.pid;
        emiter.emit('OnQueueJobStarted', { job: job })

        var title_renamed = '';
        let log_combi = [];
        let log_combi_last_sub = 0;
        let buf_stdout = {buffer: ''};
        let buf_stderr = {buffer: ''};


        child.stdout.on('data', function(data) {
            // emiter.emit('OnQueueJobLog', { text: data })
            buf_stdout.buffer += data;
            sys.buf_to_full_lines(buf_stdout, (line) => {
                if (0 === line.indexOf('@title')) {
                    // title_renamed = line.substr(7);
                }
                else if (0 === line.indexOf('@sub')) {
                    // let title_orig = line.substr(5);
                    // if (!title_orig) {
                    //     title_orig = '<no-name>';
                    // }
                    // let title = title_renamed !== '' ? title_renamed : title_orig;

                    // let log_name_main = generate_log_name(log_combi);
                    // let log_file_main = working_dir + log_name_main;
                    // log_combi.push(log_combi_last_sub+1);
                    // log_combi_last_sub = 0;
                    // let log_name_sub = generate_log_name(log_combi);
                    // let log_file_sub = working_dir + log_name_sub;

                    // sys.log_file(log_file_main, `* [${title}] (${log_name_sub})\n`);

                    // if (title_renamed) {
                    //     sys.log_file(log_file_sub,  `${title_renamed}`);
                    // }
                    // sys.log_file(log_file_sub,  `${title_orig}\n`);
                    // sys.log_file(log_file_sub,  `[back] (${log_name_main})\n`);
                    // sys.log_file(log_file_sub,  '----------\n');
                }
                else if (0 === line.indexOf('@end')) {
                    // if (log_combi.length) {
                    //     log_combi_last_sub = log_combi.pop();
                    // }
                }
                else {
                    title_renamed = '';
                    // let log_file = working_dir + generate_log_name(log_combi);
                    // sys.log_file(log_file, `${line}\n`);
                    emiter.emit('OnQueueJobLog', { text: line })
                    // update_client(Update_Jobs)
                }
            });
        })

        child.stderr.on('data', function(data) {
            // emiter.emit('OnQueueJobError', { text: data })
            buf_stderr.buffer += data;
            sys.buf_to_full_lines(buf_stderr, (line) => {
                // let log_file = working_dir + generate_log_name(log_combi);
                // sys.log_file(log_file, '!! '+line+'\n');
                emiter.emit('OnQueueJobError', { text: line })
                // update_client(Update_Jobs)
            });
        })

        child.on('close', function(exitCode) {
            for (let i in active) {
                if (active[i].uid === job.uid) {
                    let closed_job = active.splice(i, 1)[0];//FIXME: remove after kill implemented
                    closed_job.should.be.equal(job)
                    closed_job.exec.exitCode = exitCode;
                    emiter.emit('OnQueueJobFinished', { job: closed_job })
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
        this.emit('OnQueueInit', { time: new Date() })
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
        this.emit('OnQueueJobAdded', { job: new_job })
        setImmediate(() => _process_queue(this));
        return new_job;
    }

    remove_job(job_uid) {
        for (let i in waiting) {
            if (waiting[i].uid == job_uid) {
                let removed_job = waiting.splice(i, 1);
                this.emit('OnQueueJobRemoved', { job: removed_job })
                return;
            }
        }
        for (let i in active) {
            if (active[i].uid == job_uid) {
                console.log('Kill, E=1, TODO');
                //FIXME: Remove after Kill implementation
                //let killing_job = active.splice(i, 1);//FIXME: remove after kill implemented
                //this.emit('OnQueueJobKilling', { job: killing_job })
                //setImmediate(() => _process_queue(this));
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

