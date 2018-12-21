const pool = require('./pool.js')
const sys = require('./sys_util.js')
require('colors')

let sub = 0

const log = (...args) => {
  //args.unshift('|')
  args.unshift(sys.get_time_string().grey)
  console.log(...args)
}

// const script_log = (context) => {
//   const args = Array.prototype.slice.call(arguments)
//   args.unshift(':')
//   args.unshift(context)
//   args.unshift('|')
//   args.unshift(sys.get_time_string())
//   console.log.apply(console, args)
// }

pool.on('initialized', (param) => {
  log(`initialized: "${param.time}"`.bgMagenta)
})

pool.on('task-starting', (param) => {
  log(`Starting: "${param.task.product_id}"`.bgMagenta)
})

pool.on('task-added', (param) => {
  log(`Added: "${param.task.product_id}"`.bgMagenta)
})

pool.on('task-removed', (param) => {
  log(`Removed: "${param.task.product_id}"`.bgMagenta)
})

pool.on('task-killing', (param) => {
  log(`Killing: "${param.task.product_id}"`.bgMagenta)
})

pool.on('task-killed', (param) => {
  log(`Killed: "${param.task.product_id}"`.bgMagenta)
})

pool.on('task-completed', (param) => {
  log(`Finished: "${param.task.product_id}, ${param.task.status}, pid=${param.task.exec.pid}, code=${param.task.exec.exitCode}"`.bgGreen)
})

pool.on('task-output', (param) => {
  const text = param.text
  // if (text.indexOf('@title') === 0)
  if (text.indexOf('@sub') === 0) {
    sub++
  } else if (text.indexOf('@end') === 0) {
    sub--
  }
  let spaces = ''
  for (let i = 0; i < sub; i++) {
    spaces += '  '
  }
  log(`${param.task.product_id}> `.bgMagenta, spaces, param.text.green)
})

pool.on('task-output-error', (param) => {
  log(`${param.task.product_id}> `.bgMagenta, param.text.bkRed.yellow)
})
