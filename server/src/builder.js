"use strict";

//console.log('process.cwd():', process.cwd());
//console.log('__dirname:', __dirname);


const fs      = require('fs');
const kill    = require('tree-kill');

const sys     = require('./sys_util.js');
const script  = require('./script_util.js');
const db      = require('./builder_db_utils.js');
const queue   = require('./queue_util.js');

const app_cfg     = script.load_app_cfg();
console.log(app_cfg);

const socket_port = app_cfg['server_port'];
const io          = require('socket.io')(socket_port);

console.log("Socket server starting on port: " + socket_port);

const Update_None     =  0 // 000000
const Update_Products =  1 // 000001
const Update_Jobs     =  2 // 000010
const Update_History  =  4 // 000100
const Update_ALL      = 63 // 111111

var emit_state = function(state, client_socket) {
    if (!client_socket) {
      io.emit('state', state);
    }
    else {
      client_socket.emit('state', state);
    }
}

var update_client = function(update_flags, client_socket) {
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
    var show_history_limit = app_cfg['show_history_limit'];
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
	sys.log("Client connected ****", socket.conn.remoteAddress);

  update_client(Update_ALL, socket);

	socket.on('job_add', function(data){
		script.add_job(data.product_id, "user comment");
    update_client(Update_Products | Update_Jobs, socket)
	});

	socket.on('job_kill', function(data){
		if (data.pid && data.pid > 0) {
			kill(data.pid, 'SIGTERM', function(){ //SIGKILL
				let pid = parseInt(data.pid);
				let job = db.findLast_history({"data.pid": pid})
				job.data.status = "HALT";
				sys.log("KILLED", data, pid);
        update_client(Update_ALL, socket)
			});
		} else {
			queue.remove_job(data.job_uid);
      update_client(Update_Products | Update_Jobs, socket)
		}
	});

	socket.on('sys_shutdown', function(data){
		sys.log("Stoping cron jobs...");
		script.destroy_all();
	
		setTimeout(function () {
			sys.log("Exit.");
			process.exit(0);
        }, 1000)
	});

	setInterval(function () {
    update_client(Update_Jobs, socket)
	}, 1000);
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
	const script_js   = __dirname + '/../../' + app_cfg['script_dir'] + job.product_id + '/index.js';
	const produxt_dir = __dirname + '/../../' + app_cfg['working_dir'] + job.product_id + '/';
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
  var title = false;
	
  child.stdout.on('data', function(data) {
    buf_stdout.buffer += data;
    sys.buf_to_full_lines(buf_stdout, (line) => {
        //console.log('= ' + line);
        if (0 === line.indexOf('@title')) {
            title = line.substr(6);
            return
        }
        else if (0 === line.indexOf('@sub')) {
            if (!title) {
                title = line.substr(4);
                if (!title) {
                    title = '<no-name>';
                }
            }
            let log_file = working_dir + generate_log_name(log_combi);
            fs.appendFileSync(log_file, '==> '+title+'\n', {encoding: "utf8"}, function(){ if (err) { return console.error(err); }});
            log_combi.push(log_combi_last_sub+1);
            log_combi_last_sub = 0;
            log_file = working_dir + generate_log_name(log_combi);
            fs.appendFileSync(log_file, title+'\n----------\n', {encoding: "utf8"}, function(){ if (err) { return console.error(err); }});
            return;
        }
        else if (0 === line.indexOf('@end')) {
            let log_file = working_dir + generate_log_name(log_combi);
            fs.appendFileSync(log_file, '----------\n', {encoding: "utf8"}, function(){ if (err) { return console.error(err); }});
            if (log_combi.length) {
                log_combi_last_sub = log_combi.pop();
            }
            return;
        }
        title = false;
        let log_file = working_dir + generate_log_name(log_combi);
        fs.appendFileSync(log_file, '> '+line+'\n', {encoding: "utf8"}, function(){ if (err) { return console.error(err); }});
    });
  });
	
  child.stderr.on('data', function(data) {
    buf_stderr.buffer += data;
    sys.buf_to_full_lines(buf_stderr, (line) => {
        let log_file = working_dir + generate_log_name(log_combi);
        fs.appendFileSync(log_file, '!! '+line+'\n', {encoding: "utf8"}, function(){ if (err) { return console.error(err); }});
    });
  });
	
	child.on('close', function(exitCode) {
		console.log('closing code: ' + exitCode);
		switch (exitCode) {
		case 0:	 job.data.status = "OK";      break;
		case 1:	 job.data.status = "WARNING"; break;
		case 2:	 job.data.status = "ERROR";   break;
		case 3:	 job.data.status = "HALT";    break;
		default: job.data.status = "N/A";     break;
		}
		db.add_history(job);
		//io.emit('refresh_page');
    update_client(Update_ALL)
		sys.log(job.product_id, "finished");
		resolve(job);
	});	
	

	job.data.status = "working";
	job.data.pid    = child.pid;
	//io.emit('refresh_page');
  update_client(Update_ALL)
	sys.log(job.product_id, "started");
}

console.log(app_cfg['db_dir']);

db.init(app_cfg['db_dir'])
  .then(() => {
    script.init_all();
    queue.start(queue_on_execute, 2);
  });
