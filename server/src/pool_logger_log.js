const pool = require('./pool.js')
const sys = require('./sys_util.js')
const script = require('./script_util.js')
require('colors')


function generate_log_name(log_combi) {
  let name = log_combi.reduce((cobined_name, sub_nr) => {
    let sub_txt = sub_nr.pad(3)
    if (!cobined_name) {
      cobined_name = sub_txt
    }
    else {
      cobined_name = cobined_name + '-' + sub_txt
    }
    return cobined_name
  }, false)
  if (name == '') {
    name = '_main'
  }
  name = name + '.log'
  return name
}

let title_renamed = ''
let log_combi = []
let log_combi_last_sub = 0
let sub = 0

pool.on('initialized', (data) => {
})

pool.on('taskAdded', (data) => {
})

pool.on('taskStarting', (data) => {
})

pool.on('taskStarted', (data) => {
})

pool.on('taskRemoved', (data) => {
})

pool.on('taskKilling', (data) => {
})

pool.on('taskKilled', (data) => {
})

pool.on('taskCompleted', (data) => {
  // sys.log_file(log_file, '!! '+data.line+'\n');
})

pool.on('taskOutput', (data) => {
  let log_file = data.task.wworking_dir + generate_log_name(log_combi);
  sys.log_file(log_file, `${data.line}\n`);
  let line = data.text
  if (line.indexOf('@title') === 0) {
    title_renamed = line.substr(7)
  }
  else if (line.indexOf('@sub') === 0) {
    sub++
    let title_orig = line.substr(5)
    if (!title_orig) {
      title_orig = '<no-name>'
    }
    let title = title_renamed !== '' ? title_renamed : title_orig

    let log_name_main = generate_log_name(log_combi)
    let log_file_main = data.task.working_dir + log_name_main
    log_combi.push(log_combi_last_sub+1)
    log_combi_last_sub = 0
    let log_name_sub = generate_log_name(log_combi)
    let log_file_sub = data.task.working_dir + log_name_sub

    sys.log_file(log_file_main, `* [${title}] (${log_name_sub})\n`)

    if (title_renamed) {
      sys.log_file(log_file_sub,  `${title_renamed}`)
    }
    sys.log_file(log_file_sub,  `${title_orig}\n`)
    sys.log_file(log_file_sub,  `[back] (${log_name_main})\n`)
    sys.log_file(log_file_sub,  '----------\n')
  }
  else if (line.indexOf('@end') === 0) {
    sub--
    if (log_combi.length) {
      log_combi_last_sub = log_combi.pop()
    }
  }
  else {
    title_renamed = '';
    let log_file = data.task.working_dir + generate_log_name(log_combi)
    sys.log_file(log_file, `${line}\n`)
    //console.log(`>> log: ${log_file}`)
  }
  let spaces = ''
  for (let i=0; i<sub; i++) {
    spaces = spaces + '  '
  }
  //console.log(`${data.task.product_id}> `.bgBlue, spaces, data.text.blue)
})

pool.on('taskOutputError', (data) => {
  // let log_file = working_dir + generate_log_name(log_combi);
  // sys.log_file(log_file, '!! '+data.line+'\n');
})
