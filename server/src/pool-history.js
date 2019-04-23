const pool   = require('./pool-core.js')

pool.on('initialized',      param => {})
pool.on('error',            param => {})
pool.on('task-starting',    param => {})
pool.on('task-started',     param => {})
pool.on('task-added',       param => {})
pool.on('task-removed',     param => {})
pool.on('task-killing',     param => {})
pool.on('task-killed',      param => {})
pool.on('task-kill-failed', param => {})
pool.on('task-completed',   param => {})
pool.on('task-output',      param => {})

