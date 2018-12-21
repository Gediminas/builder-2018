const pool = require('./pool.js')
const sys = require('./sys_util.js')
const colors = require('colors')

let sub = 0

const worker2ColorFnc = [
  colors.bgWhite.black,
  colors.bgYellow.black,
  colors.bgCyan.black,
  colors.bgMagenta.white,
  colors.bgRed.white,
  colors.bgBlue.white,
]

const log = (param, ...args) => {
  if (param.task) {
    const colorFnc = param.task.worker_nr
      ? worker2ColorFnc[parseInt(param.task.worker_nr, 10)]
      : colors.bgGreen.white
    args.unshift(colorFnc(param.task.uid))
    args.unshift(colorFnc(param.task.product_id))
  }
  console.log(sys.to_time_string(param.time).grey, ...args)
}

pool.on('initialized',   param => log(param, 'Initialized'.bgGreen))
pool.on('task-starting', param => log(param, 'Starting'.bgGreen))
pool.on('task-started',  param => log(param, 'Started'.bgGreen))
pool.on('task-added',    param => log(param, 'Added'.bgGreen))
pool.on('task-removed',  param => log(param, 'Removed'.bgRed))
pool.on('task-killing',  param => log(param, 'Killing'.bgRed))
pool.on('task-killed',   param => log(param, 'Killed'.bgRed))

pool.on('task-completed', (param) => {
  log(param, `Finished: "${param.task.status}, pid=${param.task.exec.pid}, code=${param.task.exec.exitCode}"`.bgGreen.black)
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
  log(param, ' '.repeat(sub), param.text.green)
})

pool.on('task-output-error', (param) => {
  log(param, ' '.repeat(sub), param.text.bgWhite.red)
})
