export default socket => store => next => action => {
  if (action.meta && action.meta.remote) {
    //console.log('send action', action)
    //socket.emit('action', action)
    switch(action.type) {
    case 'ADD_JOB':
      socket.emit('job_add', {
        'product_id': action.product_id
      })
      break
    case 'KILL_JOB':
      socket.emit('job_kill', {
        'job_uid': action.job_uid,
        'pid':    action.pid
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
*/
