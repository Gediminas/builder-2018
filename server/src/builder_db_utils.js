"use strict";

const loki = require("lokijs");

var db_history;
var tb_history;

exports.init = function(path) {
  return new Promise(function(resolve, reject){

    let path_history = path + 'history.json';
    console.log('db: Loading ' + path_history);

    db_history = new loki(path_history, {
      verbose: true,
      //autoload: true,//autoupdate: true //use Object.observe to update objects automatically
      autosave: true,
      autosaveInterval: 2000
    });

    db_history.on("error", function(e) {
        console.log('ERROR: ' + e);
    });

    db_history.loadDatabase({}, function(result){
        tb_history = db_history.getCollection("history");
        if (!tb_history){
          console.log('db: Creating ' + path_history);
          tb_history = db_history.addCollection("history", {autoupdate: true});

          console.log('db: database saving...');
          db_history.saveDatabase(function() {
            console.log('db: database saved...');
          });
        }

        tb_history.on("error", function(e) {
            console.log('ERROR: ' + e);
        });

        resolve();
    });
  });
}

exports.add_history = function(data) {
	var job = tb_history.insert(data);
	job.id = job.$loki;
}

exports.get_history = function(limit) {
	if (limit) {
		return tb_history.chain().simplesort("$loki", true).limit(limit).data();
	}
	return tb_history.chain().simplesort("$loki", true).data();
}

exports.findLast_history = function(query) {
	//return tb_history.chain().find(query).limit(1).data();
	//let res = tb_history.chain().find(query).limit(1).data()[0];
	//let res = tb_history.findOne(query);
  //let res = tb_history.chain().simplesort('id', false).find(query, true).data()[0];
	let res = tb_history.chain().find(query).simplesort("$loki",  {desc: true}).limit(1).data()[0];
  //console.log(res)
  return res
}

