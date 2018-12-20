"use strict";

const CronJob  = require('cron').CronJob;
const fs       = require('fs');
//const execFile = require('child_process').execFile;
const sys      = require('./sys_util.js');
const db       = require('./builder_db_utils.js');
const merge    = require('merge');
const path     = require('path');
const pool    = require('./pool.js');

var cron_tasks = [];

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

// //Init cron:
//
// exports.init = function(product_id)
// {
// 	try {
// 		let gcfg = exports.load_app_cfg();
// 		let scfg = exports.load_cfg(product_id);
// 		let cron_time = scfg["cron"];
// 		//sys.script_log(product_id, JSON.stringify(scfg))
// 		if (cron_time) {
// 			let cron_task = new CronJob(cron_time, function() {
// 				exports.add_task(product_id, scfg["cron_comment"]);
// 			}, null, true, gcfg["time_zone"]);
// 			cron_tasks.push(cron_task);
// 		}
// 	}
// 	catch (e) {
// 		sys.script_log(product_id, 'ERROR: ' + e);
// 	}
// }
//
// exports.init_all = function()
// {
//   get_scripts().then((scripts) => {
//     for (let i in scripts) {
//       exports.init(scripts[i]);
//     }
//   });
// };
// exports.destroy_all = function() {for (let i in cron_tasks) {cron_tasks[i].stop();}}



