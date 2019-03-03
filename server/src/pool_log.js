const fs = require('fs');
const assert = require('better-assert')
const pool = require('./pool.js')
require('colors')

const namingStack = [];
let lastSubNr = 0;

// let titleRenamed = ''
// const logCombi = []
// let logCombiLastSub = 0
// let sub = 0
// let subNr = 0

const pad = (number, desiredLength) =>
  '0'.repeat(desiredLength - String(number).length) + number

const generateLogName = (rootPath) => {
  if (namingStack.length === 0) {
    return rootPath + '_main.log'
  }
  const name = namingStack.reduce((accumulated, sub) => {
    return (accumulated ? ('.' + accumulated) : '') + pad(sub, 3)
  }, '')
  return rootPath + name + '.log'
}

const flog = (file, text) =>
  fs.appendFileSync(file, text+'\n', {encoding: "utf8"}, (err) => {
    if (err) console.error(err)
  });

pool.on('initialized', (param) => {
})

pool.on('error', (param) => {
  // log(param, `ERROR: ${param.msg}`.bgWhite.red)
})

pool.on('task-completed', (param) => {
  // flog(file, '!! '+param.line+'\n');
})

pool.on('task-output', (param) => {
  let text = param.text
  if (text.indexOf('@title') === 0) {
  //   titleRenamed = text.substr(7)
  }
  else if (text.indexOf('@sub') === 0) {

    let file =  generateLogName(param.task.working_dir);
    flog(file, text)

    namingStack.push(++lastSubNr);

    file = generateLogName(param.task.working_dir);
    flog(file, text)

  //   sub++
  //   let title_orig = text.substr(5)
  //   if (!title_orig) {
  //     title_orig = '<no-name>'
  //   }
  //   let title = titleRenamed !== '' ? titleRenamed : title_orig

  //   let log_name_main = generateLogName()
  //   console.log(log_name_main);
  //   let log_file_main = param.task.working_dir + log_name_main
  //   logCombi.push(logCombiLastSub+1)
  //   logCombiLastSub = 0
  //   let log_name_sub = generateLogName()
  //   let log_file_sub = param.task.working_dir + log_name_sub
  //   console.log(log_file_sub);

  //   flog(log_file_main, `LOGGER> * [${title}] (${log_name_sub})\n`)

  //   if (titleRenamed) {
  //     flog(log_file_sub,  `LOGGER> ${titleRenamed}`)
  //   }
  //   flog(log_file_sub,  `LOGGER> ${title_orig}\n`)
  //   flog(log_file_sub,  `LOGGER> [back] (${log_name_main})\n`)
  //   flog(log_file_sub,  'LOGGER> ----------\n')
  }
  else if (text.indexOf('@end') === 0) {

    file = generateLogName(param.task.working_dir);
    flog(file, text)

    assert(namingStack.length)
    lastSubNr = namingStack.pop()

    // sub--
    // if (logCombi.length) {
    //   logCombiLastSub = logCombi.pop()
    // }
  }
  else {
    // titleRenamed = '';
    // let file = param.task.working_dir + generateLogName()

    file = generateLogName(param.task.working_dir);
    flog(file, text)

    //flog(file, `OUT-> ${text}\n`)
    // //console.log(`>> log: ${file}`)
  }
  // let spaces = ''
  // for (let i=0; i<sub; i++) {
  //   spaces = spaces + '  '
  // }
  ////console.log(`${param.task.product_id}> `.bgBlue, spaces, param.text.blue)
})

pool.on('task-output:error', (param) => {
  // let file = working_dir + generateLogName();
  //flog(file, 'ERROR> '+param.line+'\n');
})
