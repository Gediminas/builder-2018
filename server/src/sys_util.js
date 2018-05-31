"use strict";

const fs = require('fs');
const moment = require('moment');

//console.log('sys::__dirname:', __dirname);

exports.get_time_string = function() {
	return new Date().toLocaleString();
}

exports.to_time_string = function(timestamp) {
	return new Date(timestamp).toLocaleString();
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

exports.buf_to_full_lines = function (ref_buffer, fnDoOnLine) {
  let lines = ref_buffer.buffer.split("\n");
  if (ref_buffer.buffer[ref_buffer.buffer.length-1] != '\n') {
    ref_buffer.buffer = lines.pop();
  }else{
    ref_buffer.buffer = '';
  }
  if (fnDoOnLine !== false) {
    for (let line of lines) {
      fnDoOnLine(line)
    }
  }
  return lines;
}

