"use strict";

//console.log('process.cwd():', process.cwd());
//console.log('__dirname:', __dirname);


const fs       = require('fs');
const path     = require('path');
const colors   = require('colors');
const socketio = require('socket.io');

const sys      = require('./sys_util.js');
const script   = require('./script_util.js');
const db       = require('./builder_db_utils.js');
const queue    = require('./queue_util.js');

const app_cfg = script.load_app_cfg();
const io  = socketio(app_cfg.server_port);


sys.ensure_dir(app_cfg.script_dir);
sys.ensure_dir(app_cfg.working_dir);
sys.ensure_dir(app_cfg.db_dir);

console.log("------------------------------------------------------------".bgBlue);
console.log("config:".bgBlue, JSON.stringify(app_cfg, null, 2).bgBlue);
console.log(`Socket server starting on port: ${app_cfg.server_port}`.bgBlue);
console.log("------------------------------------------------------------".bgBlue);

const Update_None     =  0 // 000000
const Update_Products =  1 // 000001
const Update_Jobs     =  2 // 000010
const Update_History  =  4 // 000100
const Update_ALL      = 63 // 111111

let emit_state = function(state, client_socket) {
    if (!client_socket) {
      io.emit('state', state);
    }
    else {
      client_socket.emit('state', state);
    }
}

let update_client = function(update_flags, client_socket) {
  if ((update_flags & Update_Products) != 0) {
    script.get_products((products) => {
      var state = {}
      state['products'] = products;
      //console.log('delayed');
      emit_state(state, client_socket)
    });
  }
  var state = {}
  if ((update_flags & Update_History) != 0) {
    var show_history_limit = app_cfg.show_history_limit;
    var hjobs = db.get_history(show_history_limit);
    state['hjobs'] = hjobs;
  }
  if ((update_flags & Update_Jobs) != 0) {
    var jobs = queue.get_jobs();
    state['jobs'] = jobs; 
  }
  if (Object.keys(state).length !== 0) {
    //console.log('direct');
    emit_state(state, client_socket);
  }
}

io.on('connection', function(socket){
  sys.log(`Client connected: ${socket.conn.remoteAddress}`.bgBlue);

  update_client(Update_ALL, socket);

	socket.on('job_add', function(data){
		//script.add_job(data.product_id, "user comment");
    //update_client(Update_Products | Update_Jobs, socket)
    queue.add_job(data.product_id, "user comment");
	});

	socket.on('job_kill', function(data){
      queue.remove_job(data.job_uid);
});

	socket.on('sys_shutdown', function(data){
		sys.log("Stoping cron jobs...");
		script.destroy_all();
	
		setTimeout(function () {
			sys.log("Exit.");
			process.exit(0);
        }, 100)
	});
});

// QUEUE =====================================================

function generate_log_name(log_combi) {
  let name = log_combi.reduce((cobined_name, sub_nr) => {
    let sub_txt = sub_nr.pad(3);
    if (!cobined_name) {
      cobined_name = sub_txt;
    }
    else {
      cobined_name = cobined_name + '-' + sub_txt;
    }
    return cobined_name;
  }, false);
  if (name == '') {
    name = '_main';
  }
  name = name + '.log';
  return name;
}

db.init(app_cfg.db_dir).then(() => {

    queue.on('OnQueueInit', (data) => {
        console.log(`Init: "${data.time}"`.bgMagenta);
        update_client(Update_Products | Update_Jobs); //because job was added
    });

    queue.on('OnQueueJobStarting', (data) => {
        console.log(`Starting: "${data.job.product_id}"`.bgMagenta);
    });

    queue.on('OnQueueJobAdded', (data) => {
        console.log(`Added: "${data.job.product_id}"`.bgMagenta);
        let product_id = data.job.product_id;
	      let cfg      = script.load_cfg(product_id);
	      let last_job = db.findLast_history({"$and": [{ "product_id" : product_id},{"data.status": "OK"}]});
	      if (!last_job) {
		        last_job = db.findLast_history({"$and": [{ "product_id" : product_id},{"data.status": "WARNING"}]});
	      }
	      if (!last_job) {
		        last_job = db.findLast_history({ "product_id" : product_id});
	      }
	      //console.log(last_job);
	      let data1 = {
		        product_name:   cfg.product_name,
		        comment:        'comment',
            status:         'QUEUED',
		        pid:            0,
		        prev_time_diff: last_job ? last_job.time_diff : undefined
	      };
        data.job.data = data1;

        //FIXME: Should be moved to OnJobStarting() or similar
        let app_cfg     = script.load_app_cfg();
        let script_js   = app_cfg.script_dir + product_id + '/index.js';
        let product_dir = app_cfg.working_dir + product_id + '/';
        console.log(product_dir);
        let working_dir = product_dir + sys.to_fs_time_string(data.job.time_add) + '/'; //FIXME: job.time_start

        sys.ensure_dir(product_dir);
        sys.ensure_dir(working_dir);

        data.job.exec = {
            method   : 'execFile',
            file     : 'node',
            args     : [script_js],
            options  : { cwd: working_dir },
            callback : null,
        };
        //END FIXME
        update_client(Update_Products | Update_Jobs)
    });

    queue.on('OnQueueJobRemoved', (data) => {
        console.log(`Removed: "${data.job.product_id}"`.bgMagenta);
    });

    queue.on('OnQueueJobKilling', (data) => {
        console.log(`Killing: "${data.job.product_id}"`.bgMagenta);
    });

    queue.on('OnQueueJobKilled', (data) => {
        console.log(`Killed: "${data.job.product_id}"`.bgMagenta);
    });

    queue.on('OnQueueJobStarted', (data) => {
	      // sys.log(job.product_id, "started");
        console.log(`Started: "${data.job.product_id}, pid=${data.job.exec.pid}"`.bgGreen);
        data.job.data.pid    = data.job.exec.pid;
        data.job.data.status = 'WORKING';
    });

    var title_renamed = '';
    let log_combi = [];
    let log_combi_last_sub = 0;

    queue.on('OnQueueJobLog', (data) => {
        console.log(`${data.job.product_id}> `.bgMagenta, data.text.green);
        // let log_file = working_dir + generate_log_name(log_combi);
        // sys.log_file(log_file, `${data.line}\n`);
        let line = data.text;
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
                    //emiter.emit('OnQueueJobLog', { text: line })
                    // update_client(Update_Jobs)
                }
        update_client(Update_Jobs)
    });

    queue.on('OnQueueJobError', (data) => {
        console.log(`${data.job.product_id}> `.bgMagenta, data.text.red);
         // let log_file = working_dir + generate_log_name(log_combi);
         // sys.log_file(log_file, '!! '+data.line+'\n');
        update_client(Update_Jobs)
    });

    queue.on('OnQueueJobFinished', (data) => {
        // sys.log(job.product_id, "finished");
        console.log(`Finished: "${data.job.product_id}, ${data.job.status}, pid=${data.job.exec.pid}, code=${data.job.exec.exitCode}"`.bgGreen);

        if (data.job.status == 'halted') {
            data.job.data.status = 'HALTED';
        }
        else if (data.job.status == 'finished') {
            switch (data.job.exec.exitCode) {
            case 0:	 data.job.data.status = "OK";      break;
            case 1:	 data.job.data.status = "WARNING"; break;
            case 2:	 data.job.data.status = "ERROR";   break;
            case 3:	 data.job.data.status = "HALT";    break;
            default: data.job.data.status = "N/A";     break;
            }
        }
        else {
            data.job.data.status = `(${data.job.status})`;
        }
        db.add_history(data.job);
        setImmediate(() => update_client(Update_ALL));

    });


    queue.init(2);
});


