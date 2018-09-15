"use strict";

const should = require('should');

var waiting = [];
var active  = [];
var g_max_active       = undefined;
var g_fn_worker_execute = undefined;

function get_time_stamp() {
	return new Date().getTime();//toLocaleString();
}

exports.init = function(fn_execute, max_active) {
    g_max_active = 2;
    //OnInit
}

exports.add_job = function(product_id, job_data) {
	  let timestamp = get_time_stamp();
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
    console.log('event.OnJobAdded');
	  setImmediate(() => process_queue());
    return new_job;
}

exports.remove_job = function(job_uid) {
	  for (let i in waiting) {
		    if (waiting[i].uid == job_uid) {
			      waiting.splice(i, 1);
            console.log('event.OnJobRemoved');
			      return;
		    }
	  }
	  for (let i in active) {
		    if (active[i].uid == job_uid) {
            console.log('Kill, E=1, TODO');
			      active.splice(i, 1);//FIXME: remove after kill implemented
			      return;
		    }
	  }

	  throw "INTERNAL ERROR: 1750";
}

function process_queue() {
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
        job.time_start = get_time_stamp();
        job.status = "starting";
        active.push(job);
        console.log('event.OnJobStarting');
        //g_fn_worker_execute(on_worker_finished, on_worker_finished, job);
	      setImmediate(() => _execute_job(job));
        return;
	  }
}

function _execute_job(job) {
  console.log('job', job);
  // const child = execFile(job.exec);
}

/*
function on_worker_finished(job) {
	job.time_end  = get_time_stamp();
	job.time_diff = job.time_end - job.time_start;
	for (let i in active) {
		if (active[i].uid == job.uid) {
			active.splice(i, 1);
			setTimeout(function () {
				process_queue();
			}, 0);
			return;
		}
	}
	throw "INTERNAL ERROR: 1749";
}

/////////////////////////////////////////

exports.init = function(fn_execute, max_active) {
	g_fn_worker_execute = fn_execute;
	g_max_active       = max_active ? max_active : 1;
}

exports.add_job = function(product_id, data) {
	let timestamp = get_time_stamp();
	var job = waiting.push({
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
	for (let i in waiting) {
		if (waiting[i].uid == job_uid) {
			waiting.splice(i, 1);
			return;
		}
	}
	throw "INTERNAL ERROR: 1750";
}
*/

exports.get_active = function() {
	return active;
}

exports.get_jobs = function() {
	return active.concat(waiting);
}
