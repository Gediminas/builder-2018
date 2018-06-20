export default gun => store => next => action => {
  if (action.meta && action.meta.remote) {
    switch(action.type) {
    case 'ADD_JOB':
      console.log('ADD_JOB')
      gun.get('actions').put({
        action:     'job_add',
        product_id: action.product_id,
      })
      break
    case 'KILL_JOB':
      console.log('KILL_JOB')
      gun.get('actions').put({
        action:    'job_kill',
        'job_uid': action.job_uid,
        'pid':     action.pid,
      })
      break
    case 'SERVER_SHUTDOWN':
      console.log('SERVER_SHUTDOWN')
      gun.get('actions').put({
        action:    'server_shutdown',
      })
      break
    default:
      break
    }
  }
  return next(action)
}

/*
 * currying
 * https://en.wikipedia.org/wiki/Currying 
 *
export default function(store) {
  return function(next) {
    return function(action) {
      
      return next(action)

    }
  }
  }

A middleware is a piece of code that is executed after an action is dispatched but before reaching the reducer

*/
