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

pool.on('initialized', (param) => {
})

pool.on('taskAdded', (param) => {
})

pool.on('taskStarting', (param) => {
})

pool.on('taskStarted', (param) => {
})

pool.on('taskRemoved', (param) => {
})

pool.on('taskKilling', (param) => {
})

pool.on('taskKilled', (param) => {
})

pool.on('taskCompleted', (param) => {
  // sys.log_file(log_file, '!! '+param.line+'\n');
})

pool.on('taskOutput', (param) => {
  let log_file = param.task.working_dir + generate_log_name(log_combi);
  sys.log_file(log_file, `${param.line}\n`);
  let line = param.text
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
    let log_file_main = param.task.working_dir + log_name_main
    log_combi.push(log_combi_last_sub+1)
    log_combi_last_sub = 0
    let log_name_sub = generate_log_name(log_combi)
    let log_file_sub = param.task.working_dir + log_name_sub

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
    let log_file = param.task.working_dir + generate_log_name(log_combi)
    sys.log_file(log_file, `${line}\n`)
    //console.log(`>> log: ${log_file}`)
  }
  let spaces = ''
  for (let i=0; i<sub; i++) {
    spaces = spaces + '  '
  }
  //console.log(`${param.task.product_id}> `.bgBlue, spaces, param.text.blue)
})

pool.on('taskOutputError', (param) => {
  // let log_file = working_dir + generate_log_name(log_combi);
  // sys.log_file(log_file, '!! '+param.line+'\n');
})
