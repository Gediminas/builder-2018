"use strict";

const CronJob  = require('cron').CronJob;
const fs       = require('fs');
const queue    = require('./queue_util.js');
//const execFile = require('child_process').execFile;
const glob     = require("glob")
const sys      = require('./sys_util.js');
const db       = require('./builder_db_utils.js');
const merge    = require('merge');
const path     = require('path');


var cron_jobs = [];

exports.load_app_cfg = function(product_id) {
	let app_cfg = JSON.parse(fs.readFileSync(__dirname + "/../../_cfg/config.json", 'utf8'));
  app_cfg.script_dir  = path.normalize(__dirname + '/../../' + app_cfg.script_dir);
  app_cfg.working_dir = path.normalize(__dirname + '/../../' + app_cfg.working_dir);
  app_cfg.db_dir      = path.normalize(__dirname + '/../../' + app_cfg.db_dir);
  return app_cfg;
}

exports.load_cfg = function(product_id) {
	//sys.log(product_id);
	let config = exports.load_app_cfg();
	let def = JSON.parse(fs.readFileSync(__dirname + "/../../_cfg/script_defaults.json", 'utf8'));
	let cfg = JSON.parse(fs.readFileSync(config['script_dir'] + product_id + '/script.cfg', 'utf8'));
	let srv = JSON.parse(fs.readFileSync(config['script_dir'] + product_id + '/server.cfg', 'utf8'));
	//for(var key in json_svr) json_cfg[key]=json_svr[key]; //json merge
	let mrg = merge.recursive(def, cfg, srv);
	if (!mrg.product_name) {
		mrg.product_name = product_id;
	}
	return mrg;
}

exports.add_job = function(product_id, comment) {
	let cfg      = exports.load_cfg(product_id);
	let last_job = db.findLast_history({"$and": [{ "product_id" : product_id},{"data.status": "OK"}]});
	if (!last_job) {
		last_job = db.findLast_history({"$and": [{ "product_id" : product_id},{"data.status": "WARNING"}]});
	}
	if (!last_job) {
		last_job = db.findLast_history({ "product_id" : product_id});
	}
	//console.log(last_job);
	let data = {
		product_name:   cfg.product_name,
		comment:        comment,
		pid:            0,
		prev_time_diff: last_job ? last_job.time_diff : undefined
	};



	  let job = queue.add_job(product_id, data);

    //FIXME: Should be moved to OnJobStarting() or similar
    let app_cfg     = exports.load_app_cfg();
    let script_js   = app_cfg.script_dir + product_id + '/index.js';
    let product_dir = app_cfg.working_dir + product_id + '/';
    console.log(product_dir);
    let working_dir = product_dir + sys.to_fs_time_string(job.time_add) + '/'; //FIXME: job.time_start

    sys.ensure_dir(product_dir);
    sys.ensure_dir(working_dir);

    let job_exec = {
        file     : 'node',
        args     : [script_js],
        options  : { cwd: working_dir },
        callback : false,
    };
    job.exec = job_exec;
    //END FIXME
}

exports.get_job_by_product = function(product_id) {
	let jobs = queue.get_jobs();
	for (let i in jobs) {
		if (jobs[i].product_id == product_id) {
			return jobs[i];
		}
	}
	return db.findLast_history({"product_id": product_id});
}

exports.init = function(product_id)
{
	try {
		let gcfg = exports.load_app_cfg();
		let scfg = exports.load_cfg(product_id);
		let cron_time = scfg["cron"];
		//sys.script_log(product_id, JSON.stringify(scfg))
		if (cron_time) {
			let cron_job = new CronJob(cron_time, function() {
				exports.add_job(product_id, scfg["cron_comment"]);
			}, null, true, gcfg["time_zone"]);
			cron_jobs.push(cron_job);
		}
	}
	catch (e) {
		sys.script_log(product_id, 'ERROR: ' + e);
	}
}

function get_scripts() {
	let config = exports.load_app_cfg();
	return new Promise(function(resolve, reject) {
    //console.log("reading from: " + __dirname + '/../../' + config['script_dir']);
    glob("*/index.*", {'cwd': config['script_dir'], 'matchBase': 1 }, (err, files) => {
      if (err) {
        reject(err);
      }
      let scripts = files.map(file => {
        //console.log(file);
        return path.dirname(file);
      });
      resolve(scripts);
    });
  });
}

exports.init_all = function()
{
  get_scripts().then((scripts) => {
    for (let i in scripts) {
      exports.init(scripts[i]);
    }
  });
};

exports.destroy_all = function()
{
	for (let i in cron_jobs) {
		cron_jobs[i].stop();
	}
}

exports.get_products = function(on_loaded) {
	let products =  [];
  get_scripts()
    .then((files) => {
      //console.log('scripts', files);
      for (let i in files) {
        let product_id = files[i];
        let cfg = exports.load_cfg(product_id);
        let last_job = exports.get_job_by_product(product_id);
        let product = { 
          product_id:   product_id,
          product_name: cfg.product_name,
          cfg:          cfg,
          last_job:     last_job
         };
        products.push(product);
      }
      on_loaded(products);
    })
}
