const fs = require('fs');
const pool = require('./pool.js')
require('colors')


let titleRenamed = ''
const logCombi = []
let logCombiLastSub = 0
let sub = 0

Number.prototype.pad = (size) => {
  let s = String(this)
  while (s.length < (size || 2)) { s = `0${s}` }
  return s
}

const generateLogName = (_logCombi) => {
  let name = _logCombi.reduce((combinedName, subNr) => {
    const subTxt = subNr.pad(3)
    return combinedName ? `${combinedName}-${subTxt}` : subTxt
  }, false)
  if (name === '' || !name) {
    name = '_main'
  }
  name += '.log'
  return name
}

const logToFile = (file, text) => {
  fs.appendFileSync(file, text, {encoding: "utf8"}, (err) => {
    if (err) {
      console.error(err);
    }
  });
}

pool.on('initialized', (param) => {
})

pool.on('error', (param) => {
  // log(param, `ERROR: ${param.msg}`.bgWhite.red)
})

pool.on('task-completed', (param) => {
  // logToFile(file, '!! '+param.line+'\n');
})

pool.on('task-output', (param) => {
  let file = param.task.working_dir + generateLogName(logCombi);
  let text = param.text
  if (text.indexOf('@title') === 0) {
    titleRenamed = text.substr(7)
  }
  else if (text.indexOf('@sub') === 0) {
    sub++
    let title_orig = text.substr(5)
    if (!title_orig) {
      title_orig = '<no-name>'
    }
    let title = titleRenamed !== '' ? titleRenamed : title_orig

    let log_name_main = generateLogName(logCombi)
    let log_file_main = param.task.working_dir + log_name_main
    logCombi.push(logCombiLastSub+1)
    logCombiLastSub = 0
    let log_name_sub = generateLogName(logCombi)
    let log_file_sub = param.task.working_dir + log_name_sub

    logToFile(log_file_main, `LOGGER> * [${title}] (${log_name_sub})\n`)

    if (titleRenamed) {
      logToFile(log_file_sub,  `LOGGER> ${titleRenamed}`)
    }
    logToFile(log_file_sub,  `LOGGER> ${title_orig}\n`)
    logToFile(log_file_sub,  `LOGGER> [back] (${log_name_main})\n`)
    logToFile(log_file_sub,  'LOGGER> ----------\n')
  }
  else if (text.indexOf('@end') === 0) {
    sub--
    if (logCombi.length) {
      logCombiLastSub = logCombi.pop()
    }
  }
  else {
    titleRenamed = '';
    let file = param.task.working_dir + generateLogName(logCombi)
    logToFile(file, `LOGGER> ${text}\n`)
    //console.log(`>> log: ${file}`)
  }
  let spaces = ''
  for (let i=0; i<sub; i++) {
    spaces = spaces + '  '
  }
  //console.log(`${param.task.product_id}> `.bgBlue, spaces, param.text.blue)
})

pool.on('task-output:error', (param) => {
  // let file = working_dir + generateLogName(logCombi);
  logToFile(file, 'ERROR> '+param.line+'\n');
})
