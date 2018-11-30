const pool = require('./pool.js')
require('colors')

var title_renamed = ''
let log_combi = []
let log_combi_last_sub = 0
let sub = 0;

pool.on('initialized', (data) => {
  console.log(`initialized: "${data.time}"`.bgMagenta)
})

pool.on('taskStarting', (data) => {
  console.log(`Starting: "${data.task.product_id}"`.bgMagenta)
})

pool.on('taskAdded', (data) => {
  console.log(`Added: "${data.task.product_id}"`.bgMagenta)
})

pool.on('taskRemoved', (data) => {
  console.log(`Removed: "${data.task.product_id}"`.bgMagenta)
})

pool.on('taskKilling', (data) => {
  console.log(`Killing: "${data.task.product_id}"`.bgMagenta)
})

pool.on('taskKilled', (data) => {
  console.log(`Killed: "${data.task.product_id}"`.bgMagenta)
})

pool.on('taskCompleted', (data) => {
  // sys.log(task.product_id, "finished");
  console.log(`Finished: "${data.task.product_id}, ${data.task.status}, pid=${data.task.exec.pid}, code=${data.task.exec.exitCode}"`.bgGreen)
})

pool.on('taskOutput', (data) => {
    // let log_file = working_dir + generate_log_name(log_combi);
    // sys.log_file(log_file, `${data.line}\n`);
    let line = data.text
    if (0 === line.indexOf('@title')) {
        // title_renamed = line.substr(7);
    }
    else if (0 === line.indexOf('@sub')) {
      sub++;
        // let title_orig = line.substr(5);
        // if (!title_orig) {
        //     title_orig = '<no-name>';
        // }
        // let title = title_renamed !== '' ? title_renamed : title_orig;

        // let log_name_main = generate_log_name(log_combi);
        // let log_file_main = working_dir + log_name_main;
        // log_combi.push(log_combi_last_sub+1);
        // log_combi_last_sub = 0;
        // let log_name_sub = generate_log_name(log_combi);
        // let log_file_sub = working_dir + log_name_sub;

        // sys.log_file(log_file_main, `* [${title}] (${log_name_sub})\n`);

        // if (title_renamed) {
        //     sys.log_file(log_file_sub,  `${title_renamed}`);
        // }
        // sys.log_file(log_file_sub,  `${title_orig}\n`);
        // sys.log_file(log_file_sub,  `[back] (${log_name_main})\n`);
        // sys.log_file(log_file_sub,  '----------\n');
    }
    else if (0 === line.indexOf('@end')) {
      sub--;
        // if (log_combi.length) {
        //     log_combi_last_sub = log_combi.pop();
        // }
    }
    else {
        title_renamed = '';
        // let log_file = working_dir + generate_log_name(log_combi);
        // sys.log_file(log_file, `${line}\n`);
        //emiter.emit('taskLog', { text: line })
        // update_client(Update_Tasks)
    }
  let spaces = '';
  for (let i=0; i<sub; i++) {
    spaces = spaces + '  ';
  }
  console.log(`${data.task.product_id}> `.bgMagenta, spaces, data.text.green)
})

pool.on('taskOutputError', (data) => {
    console.log(`${data.task.product_id}> `.bgMagenta, data.text.red)
    // let log_file = working_dir + generate_log_name(log_combi);
    // sys.log_file(log_file, '!! '+data.line+'\n');
})

