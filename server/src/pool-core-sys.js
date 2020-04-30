const assert = require('better-assert')
const pool   = require('./pool.js')
const sys = require('./sys_util.js')

pool.on('initialized', (param) => {
  this.working_dir = param.cfg.working_dir
  param.time = sys.getTimeStamp()
})

pool.on('error', (param) => {
  param.time = sys.getTimeStamp()
})

pool.on('task-added', (param) => {
  param.time            = sys.getTimeStamp()
  param.task.status     = 'queued'
  param.task.time_add   = param.time
  param.task.time_start = 0
  param.task.time_end   = 0
  param.task.time_diff  = 0
  param.task.data.project_name = param.task.project_id
  param.task.data.status = 'QUEUED'
  //param.task.data.comment =        'comment',
  //param.task.data.prev_time_diff = last_task ? last_task.time_diff : undefined

  const projects = pool.getProjects()
  for (const project of projects) {
    if (project.project_id === param.task.project_id) {
      param.task.project = project
      break
    }
  }
})

pool.on('task-starting', (param) => {
  param.time = sys.getTimeStamp()
  assert(param.task.status === 'queued')
  param.task.status     = 'starting'
  param.task.time_start = param.time

  const project_dir = this.working_dir + param.task.project_id + '/'
  const shared_dir  = project_dir + '/shared/'
  const working_dir = project_dir + sys.timeToDir(param.task.time_start) + '/'

  console.log(`>> task_uid: ${param.task.uid}`)
  console.log(`>> time_start: ${param.task.time_start}`)
  console.log(`>> project_dir: ${project_dir}`)
  console.log(`>> working_dir: ${working_dir}`)

  sys.ensureDir(this.working_dir)
  sys.ensureDir(project_dir)
  sys.ensureDir(shared_dir)
  sys.ensureDir(working_dir)

  param.task.working_dir = working_dir
})

pool.on('task-started', (param) => {
  param.time          = sys.getTimeStamp()
  param.task.status   = 'started'
})

pool.on('task-removed',  (param) => {
  param.time = sys.getTimeStamp()
})

pool.on('task-killing', (param) => {
  param.time = sys.getTimeStamp()
  param.task.status = 'halting'
})

pool.on('task-killed', (param) => {
  param.time = sys.getTimeStamp()
  param.task.status = 'halted'
})


pool.on('task-completed', (param) => {
  param.time = sys.getTimeStamp()

  if (param.task.status === 'halting') {
    param.task.status = 'halted'
  } else {
    assert(param.task.status === 'started')
    param.task.status = 'finished'
  }
  param.task.data.status = param.task.result
})

pool.on('task-output', (param) => {
  param.time = sys.getTimeStamp()
})
