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
const cfg     = script.load_app_cfg();

console.log('CFG:', app_cfg)

const server = require('http').createServer().listen(cfg.gun_port);
const Gun = require('gun');
let gun = Gun({web: server, file: '../_working/data.json'});

console.log('Server started on ' + cfg.server_address + ':' + cfg.gun_port + '/gun');
console.log('=============================================');


const Update_None     =  0 // 000000
const Update_Products =  1 // 000001
const Update_Jobs     =  2 // 000010
const Update_History  =  4 // 000100
const Update_ALL      = 63 // 111111

//gun.get('state').put(null)
//gun.get('state').get('core').put(null)

var update_client = function(update_flags) {
  if ((update_flags & Update_Products) != 0) {
    script.get_products((products) => {
      gun.get('state').put({'products': JSON.stringify(products)})
      console.log('>> EMIT state->products');
    });
  }
  if ((update_flags & Update_History) != 0) {
    var show_history_limit = app_cfg['show_history_limit'];
    var hjobs = db.get_history(show_history_limit);
    gun.get('state').put({'hjobs': JSON.stringify(hjobs)})
    console.log('>> EMIT state->hjobs');
  }
  if ((update_flags & Update_Jobs) != 0) {
    var jobs = queue.get_jobs();
    gun.get('state').put({'jobs': JSON.stringify(jobs)})
    console.log('>> EMIT state->jobs');
  }
}

gun.on('hi', peer => console.log('>> Client connected:', peer.id, peer.wire.url))
gun.on('bye', peer => console.log('>> Client disconnected:', peer.id))

gun.get('state').on(()=>{
  console.log('* STATE CHANGED')
})

let aaa = 0;
gun.get('actions').on((data, key) => {
  if (!data) {
    return
  }
  console.log('*', ++aaa, key, data.action)
  switch (data.action) {
  case 'job_add':
    sys.log(`  * adding product_id: [${data.product_id}]`)
		//script.add_job(data.product_id, "user comment");
    //update_client(Update_Products | Update_Jobs)
    break
  case 'job_kill':
    sys.log("  * killing job");
    /*
		if (data.pid && data.pid > 0) {
			kill(data.pid, 'SIGTERM', function(){ //SIGKILL
				let pid = parseInt(data.pid);
				let job = db.findLast_history({"data.pid": pid})
				job.data.status = "HALT";
				sys.log("KILLED", data, pid);
        update_client(Update_ALL)
			});
		} else {
			queue.remove_job(data.job_uid);
      update_client(Update_Products | Update_Jobs)
		}
    */
    break
  case 'server_shutdown':
    sys.log("  * Stoping cron jobs...");
    /*
    script.destroy_all();
    setTimeout(function () {
      sys.log("Exit.");
      process.exit(0);
    }, 1000)
    */
    break
  default:
    break
  }
  //gun.get('actions').path().put(null)
  //gun.get('actions').set(null)
}, {
  change: true
})

setInterval(function () {
  //update_client(Update_Jobs)
}, 1000);

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
            let log_file = working_dir + generate_log_name(log_combi);
            sys.log_file(log_file, '----------\n');
            if (log_combi.length) {
                log_combi_last_sub = log_combi.pop();
            }
        }
        else {
            title_renamed = '';
            let log_file = working_dir + generate_log_name(log_combi);
            sys.log_file(log_file, `${line}\n`);
        }
    });
  });
	
  child.stderr.on('data', function(data) {
    buf_stderr.buffer += data;
    sys.buf_to_full_lines(buf_stderr, (line) => {
        let log_file = working_dir + generate_log_name(log_combi);
        sys.log_file(log_file, '!! '+line+'\n');
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
    update_client(Update_ALL)
		sys.log(job.product_id, "finished");
		resolve(job);
	});	
	

	job.data.status = "working";
	job.data.pid    = child.pid;
  update_client(Update_ALL)
	sys.log(job.product_id, "started");
}

console.log(app_cfg['db_dir']);

db.init(app_cfg['db_dir'])
  .then(() => {
    script.init_all();
    queue.start(queue_on_execute, 2);
    update_client(Update_ALL)
  });
