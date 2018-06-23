export function set_connection_state(state, connected) {
  console.log('actioncreator: set_connection_state')
  return {
    type: 'SET_CONNECTION_STATE',
    state,
    connected
  }
}
export function set_state(state) {
  console.log('actioncreator: set_state')
  return {
    type: 'SET_STATE',
    state
  }
}

export function add_job(product_id) {
  console.log('actioncreator: add_job')
  return {
    meta: {remote: true},
    type: 'ADD_JOB',
    product_id
  }
}

export function kill_job(job_uid, pid) {
  console.log('actioncreator: kill_job')
  return {
    meta: {remote: true},
    type: 'KILL_JOB',
    job_uid,
    pid
  }
}

export function server_shutdown() {
  console.log('actioncreator: server_shutdown')
  return {
    meta: {remote: true},
    type: 'SERVER_SHUTDOWN',
  }
}
