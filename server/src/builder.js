"use strict";

//console.log('process.cwd():', process.cwd());
//console.log('__dirname:', __dirname);


const fs       = require('fs');
const kill     = require('tree-kill');
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

console.log("config:", JSON.stringify(app_cfg, null, 2));
console.log(`Socket server starting on port: ${app_cfg.server_port}\n`);

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
		// if (data.pid && data.pid > 0) {
		// 	kill(data.pid, 'SIGTERM', function(){ //SIGKILL
		// 		let pid = parseInt(data.pid);
		// 		let job = db.findLast_history({"data.pid": pid})
		// 		job.data.status = "HALT";
		// 		sys.log("KILLED", data, pid);
    //     update_client(Update_ALL, socket)
		// 	});
		// } else {
		queue.remove_job(data.job_uid);
    update_client(Update_Products | Update_Jobs, socket)
		// }
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

const execFile = require('child_process').execFile;

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

function queue_on_execute(resolve, reject, job)
{
  update_client(Update_Products | Update_Jobs); //because job was added

  /*
	const script_js   = app_cfg.script_dir + job.product_id + '/index.js';
	const produxt_dir = app_cfg.working_dir + job.product_id + '/';
	const working_dir = produxt_dir + sys.to_fs_time_string(job.time_start) + '/';

  sys.ensure_dir(produxt_dir);
  sys.ensure_dir(working_dir);

  let log_combi = [];
  let log_combi_last_sub = 0;
  let buf_stdout = {buffer: ''};
  let buf_stderr = {buffer: ''};

	//console.log("script:",      script_js);
	//console.log("uid:",         job.uid);
	//console.log("working_dir:", working_dir);

	//spawn
	const child = execFile('node', [script_js], { cwd: working_dir });
  var title_renamed = '';

  child.stdout.on('data', function(data) {
    buf_stdout.buffer += data;
    sys.buf_to_full_lines(buf_stdout, (line) => {
        if (0 === line.indexOf('@title')) {
            title_renamed = line.substr(7);
        }
        else if (0 === line.indexOf('@sub')) {
            let title_orig = line.substr(5);
            if (!title_orig) {
                title_orig = '<no-name>';
            }
            let title = title_renamed !== '' ? title_renamed : title_orig;

            let log_name_main = generate_log_name(log_combi);
            let log_file_main = working_dir + log_name_main;
            log_combi.push(log_combi_last_sub+1);
            log_combi_last_sub = 0;
            let log_name_sub = generate_log_name(log_combi);
            let log_file_sub = working_dir + log_name_sub;

            sys.log_file(log_file_main, `* [${title}] (${log_name_sub})\n`);

            if (title_renamed) {
                sys.log_file(log_file_sub,  `${title_renamed}`);
            }
            sys.log_file(log_file_sub,  `${title_orig}\n`);
            sys.log_file(log_file_sub,  `[back] (${log_name_main})\n`);
            sys.log_file(log_file_sub,  '----------\n');
        }
        else if (0 === line.indexOf('@end')) {
            if (log_combi.length) {
                log_combi_last_sub = log_combi.pop();
            }
        }
        else {
            title_renamed = '';
            let log_file = working_dir + generate_log_name(log_combi);
            sys.log_file(log_file, `${line}\n`);
            update_client(Update_Jobs)
        }
    });
  });

  child.stderr.on('data', function(data) {
    buf_stderr.buffer += data;
    sys.buf_to_full_lines(buf_stderr, (line) => {
        let log_file = working_dir + generate_log_name(log_combi);
        sys.log_file(log_file, '!! '+line+'\n');
        update_client(Update_Jobs)
    });
  });

	child.on('close', function(exitCode) {
		sys.log(`worker exit code: ${exitCode}`);
		switch (exitCode) {
		case 0:	 job.data.status = "OK";      break;
		case 1:	 job.data.status = "WARNING"; break;
		case 2:	 job.data.status = "ERROR";   break;
		case 3:	 job.data.status = "HALT";    break;
		default: job.data.status = "N/A";     break;
		}
		db.add_history(job);
    setImmediate(() => update_client(Update_ALL));

		sys.log(job.product_id, "finished");
		resolve(job);
	});


	job.data.status = "working";
	job.data.pid    = child.pid;
  update_client(Update_ALL)
	sys.log(job.product_id, "started");
  */
  job.status = "OK";
  db.add_history(job);
  setImmediate(() => update_client(Update_ALL));
  resolve(job);
}

db.init(app_cfg.db_dir).then(() => {
    // script.init_all();

    // queue.subscribe(script);
    // queue.subscribe(this);


    // queue.on('done', function(details){
    //     console.log('Queue init at ', details.time)
    //     queue.removeAllListeners()
    // })


    queue.on('OnQueueInit', (data) => {
        console.log(`Init: "${data.time}"`.bgMagenta);
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

        let job_exec = {
            method   : 'execFile',
            file     : 'node',
            args     : [script_js],
            options  : { cwd: working_dir },
            callback : null,
        };
        data.job.exec = job_exec;
        //END FIXME
        update_client(Update_Products | Update_Jobs)
    });

    queue.on('OnQueueJobRemoved', (data) => {
        console.log(`Removed: "${data.job.product_id}"`.bgMagenta);
    });

    queue.on('OnQueueJobKilling', (data) => {
        console.log(`Killing: "${data.job.product_id}"`.bgMagenta);
    });

    queue.on('OnQueueJobStarted', (data) => {
        console.log(`Started: "${data.job.product_id}"`.bgMagenta);
    });

    queue.on('OnQueueJobLog', (data) => {
        console.log('> ', data.text.green);
    });

    queue.on('OnQueueJobError', (data) => {
        console.log('> ', data.text.red);
    });

    queue.on('OnQueueJobFinished', (data) => {
        console.log(`Finished: "${data.job.product_id}"`.bgMagenta);
    });


    // queue.subscribe1(this);
    queue.init(queue_on_execute, 2);
});

// emitter.listeners(eventName)
// emitter.on(eventName, listener)
// emitter.once(eventName, listener)
// emitter.removeListener(eventName, listener)

