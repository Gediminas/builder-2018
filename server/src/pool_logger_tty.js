const pool = require('./pool.js')
require('colors')

let sub = 0

pool.on('initialized', (param) => {
  console.log(`initialized: "${param.time}"`.bgMagenta)
})

pool.on('task-starting', (param) => {
  console.log(`Starting: "${param.task.product_id}"`.bgMagenta)
})

pool.on('task-added', (param) => {
  console.log(`Added: "${param.task.product_id}"`.bgMagenta)
})

pool.on('task-removed', (param) => {
  console.log(`Removed: "${param.task.product_id}"`.bgMagenta)
})

pool.on('task-killing', (param) => {
  console.log(`Killing: "${param.task.product_id}"`.bgMagenta)
})

pool.on('task-killed', (param) => {
  console.log(`Killed: "${param.task.product_id}"`.bgMagenta)
})

pool.on('task-completed', (param) => {
  console.log(`Finished: "${param.task.product_id}, ${param.task.status},
    pid=${param.task.exec.pid}, code=${param.task.exec.exitCode}"`.bgGreen)
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
  console.log(`${param.task.product_id}> `.bgMagenta, spaces, param.text.green)
})

pool.on('task-output-error', (param) => {
  console.log(`${param.task.product_id}> `.bgMagenta, param.text.red)
})
