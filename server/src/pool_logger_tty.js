const pool = require('./pool.js')
require('colors')

let sub = 0

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
  console.log(`Finished: "${data.task.product_id}, ${data.task.status},
    pid=${data.task.exec.pid}, code=${data.task.exec.exitCode}"`.bgGreen)
})

pool.on('taskOutput', (data) => {
  const line = data.text
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
  console.log(`${data.task.product_id}> `.bgMagenta, spaces, data.text.green)
})

pool.on('taskOutputError', (data) => {
  console.log(`${data.task.product_id}> `.bgMagenta, data.text.red)
})
