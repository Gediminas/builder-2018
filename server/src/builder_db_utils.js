"use strict";

const loki = require("lokijs");

var tb_history;

exports.init = function(path) {
  return new Promise(function(resolve, reject){
    let db_history = new loki(path + 'history.json', {
      verbose: true,
      autosave: true,
      autosaveInterval: 5000
    });
    db_history.loadDatabase({}, function(result){
      console.log('load');
        tb_history = db_history.getCollection("history");
        if (!tb_history){
          tb_history = db_history.addCollection("history", {autoupdate: true});
          db_history.saveDatabase();
        }
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

exports.findLast_history = function(data) {
	//return tb_history.chain().find(data).limit(1).data();
	//return tb_history.chain().find(data).limit(1).data()[0];
	return tb_history.findOne(data);
}

