const colors = require('colors')
const pool   = require('./pool.js')
const sys    = require('./sys_util.js')

let sub = 0

const worker2ColorFnc = [
  colors.bgCyan.black,
  colors.bgGreen.black,
  colors.bgMagenta.black,
  colors.bgRed.black,
  colors.bgCyan.grey,
  colors.bgGreen.grey,
  colors.bgMagenta.grey,
  colors.bgRed.grey,
]

const log = (param, ...args) => {
  if (param.task) {
    // let colorFnc = colors.bgYellow.black
    // if (param.task.worker_nr) {
    //   const colorNr = (param.task.worker_nr - 1) % worker2ColorFnc.length
    //   colorFnc = worker2ColorFnc[colorNr]
    //   args.unshift(colors.bgWhite.black(param.task.worker_nr))
    // }
    const colorFnc = worker2ColorFnc[0]
    args.unshift(colorFnc(param.task.uid))
    args.unshift(colorFnc(param.task.product_id))
  }
  console.log(sys.timeToString(param.time).grey, ...args)
}

pool.on('initialized',   param => log(param, 'Initialized'.bgGreen))
pool.on('error',         param => log(param, `ERROR: ${param.msg}`.bgWhite.red))
pool.on('task-starting', param => log(param, 'Starting'.bgGreen))

pool.on('task-started',  param => log(param,
  `Started: pid=${param.task.pid}`.bgGreen))

pool.on('task-added',      param => log(param, 'Added'.bgGreen))
pool.on('task-removed',    param => log(param, 'Removed'.bgRed))
pool.on('task-killing',       param => log(param, 'Killing'.bgRed))
pool.on('task-killed', param => log(param, 'Killed'.bgRed))

pool.on('task-kill-failed', param => log(param,
  `WARNING: Kill Failed ${param.taskUid}`
    .bgWhite.red))

pool.on('task-completed', param => log(param,
  `Finished: ${param.task.status}, pid=${param.task.pid}, code=${param.task.exec.exitCode}`
    .bgGreen))

pool.on('task-output', (param) => {
  const text = param.text
  // if (text.indexOf('@title') === 0)

  if (param.std == 'stderr') {
    log(param, ' '.repeat(sub), param.text.bgWhite.red)
  }
  else {
    log(param, ' '.repeat(sub), param.text.green)

    if (text.indexOf('@sub') === 0) {
      sub++
    }
    else if (text.indexOf('@end') === 0) {
      sub--
    }
  }
})

