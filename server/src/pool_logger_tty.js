const pool = require('./pool.js')
require('colors')

let sub = 0

pool.on('initialized', (param) => {
  console.log(`initialized: "${param.time}"`.bgMagenta)
})

pool.on('taskStarting', (param) => {
  console.log(`Starting: "${param.task.product_id}"`.bgMagenta)
})

pool.on('taskAdded', (param) => {
  console.log(`Added: "${param.task.product_id}"`.bgMagenta)
})

pool.on('taskRemoved', (param) => {
  console.log(`Removed: "${param.task.product_id}"`.bgMagenta)
})

pool.on('taskKilling', (param) => {
  console.log(`Killing: "${param.task.product_id}"`.bgMagenta)
})

pool.on('taskKilled', (param) => {
  console.log(`Killed: "${param.task.product_id}"`.bgMagenta)
})

pool.on('taskCompleted', (param) => {
  console.log(`Finished: "${param.task.product_id}, ${param.task.status},
    pid=${param.task.exec.pid}, code=${param.task.exec.exitCode}"`.bgGreen)
})

pool.on('taskOutput', (param) => {
  const line = param.text
  // if (line.indexOf('@title') === 0)
  if (line.indexOf('@sub') === 0) {
    sub++
  } else if (line.indexOf('@end') === 0) {
    sub--
  }
  let spaces = ''
  for (let i = 0; i < sub; i++) {
    spaces += '  '
  }
  console.log(`${param.task.product_id}> `.bgMagenta, spaces, param.text.green)
})

pool.on('taskOutputError', (param) => {
  console.log(`${param.task.product_id}> `.bgMagenta, param.text.red)
})
