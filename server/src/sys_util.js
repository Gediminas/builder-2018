"use strict";

const fs = require('fs');
const moment = require('moment');

//console.log('sys::__dirname:', __dirname);

exports.get_time_string = function() {
	// return new Date().toLocaleString();
  return moment().format('YYYY-MM-DD hh:mm')
}

exports.to_time_string = function(timestamp) {
	// return new Date(timestamp).toLocaleString();
  return moment(timestamp).format('YYYY-MM-DD hh:mm')
}

exports.to_fs_time_string = function(timestamp) {
  var date = new Date();
  var formattedDate = moment(date).format('YYYY-MM-DD_hh-mm-ss_SSS');
  return formattedDate;
}

exports.log = function() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift("|");
	args.unshift(exports.get_time_string());
    console.log.apply(console, args);
}

exports.script_log = function(context) {
	//console.log(exports.get_time_string(), "|", context, ":",  arguments);
	var args = Array.prototype.slice.call(arguments);
	args.unshift(":");
	args.unshift(context);
	args.unshift("|");
	args.unshift(exports.get_time_string());
    console.log.apply(console, args);
}

/*
exports.log2 = (function () {
    return {
        log: function() {
            var args = Array.prototype.slice.call(arguments);
            console.log.apply(console, args);
        },
        warn: function() {
            var args = Array.prototype.slice.call(arguments);
			args.unshift("WARNING:");
            console.log.apply(console, args);
        },
        error: function() {
            var args = Array.prototype.slice.call(arguments);
			args.unshift("ERROR:");
            console.log.apply(console, args);
        }
    }
}());
*/

exports.ensure_dir = function (dirPath) {
  try {
    fs.mkdirSync(dirPath);
    console.log('Folder created: ' + dirPath);
  }
  catch (err) {
    if (err.code !== 'EEXIST') {
      throw err
    }
  }
}

Number.prototype.pad = function(size) {
  var s = String(this);
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
}

exports.log_file = function (log_file, text) {
    fs.appendFileSync(log_file, text, {encoding: "utf8"}, function(){
        if (err) {
            console.error(err);
        }
    });
}
