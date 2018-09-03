"use strict";

var queue    = [];
var workers  = []; 
var g_max_workers       = undefined;
var g_fn_worker_execute = undefined;

function get_time_stamp() {
	return new Date().getTime();//toLocaleString();
}

function on_worker_finished(job) {
	job.time_end  = get_time_stamp();
	job.time_diff = job.time_end - job.time_start;
	for (let i in workers) {
		if (workers[i].uid == job.uid) {
			workers.splice(i, 1);
			setTimeout(function () {
				process_queue();
			}, 0);
			return;
		}
	}
	throw "INTERNAL ERROR: 1749";
}

function process_queue() {
	if (workers.length >= g_max_workers) {
		return;
	}
	for (let i1 in queue) {
		let job_tmp = queue[i1];
		let i2;
		let skip = false;
		for (i2 in workers) {
			if (workers[i2].product_id == job_tmp.product_id) {
				skip = true;
				break; //do not alow 2 instances of the same product
			}
		}
		if (!skip) {
			let job = queue.splice(i1, 1)[0];
      job.time_start = get_time_stamp();
      workers.push(job);
      g_fn_worker_execute(on_worker_finished, on_worker_finished, job);
			return;
		}
	}
}

/////////////////////////////////////////

exports.start = function(fn_execute, max_workers) {
	g_fn_worker_execute = fn_execute;
	g_max_workers       = max_workers ? max_workers : 1;
	//process_queue();
}

exports.add_job = function(product_id, data) {
	let timestamp = get_time_stamp();
	var job = queue.push({
		uid:        timestamp,
		product_id: product_id,
		time_add:   timestamp,
		data:       data
	});
	setTimeout(function () {
		process_queue();
	}, 0);
}

exports.remove_job = function(job_uid) {
	for (let i in queue) {
		if (queue[i].uid == job_uid) {
			queue.splice(i, 1);
			return;
		}
	}
	throw "INTERNAL ERROR: 1750";
}

exports.get_workers = function() {
	return workers;
}

exports.get_jobs = function() {
	return workers.concat(queue);
}
