export function set_connection_state(state, connected) {
  return {
    type: 'SET_CONNECTION_STATE',
    state,
    connected
  }
}
export function set_state(state) {
  return {
    type: 'SET_STATE',
    state
  }
}

export function add_job(product_id) {
  return {
    meta: {remote: true},
    type: 'ADD_JOB',
    product_id
  }
}

export function kill_job(job_uid, pid) {
  return {
    meta: {remote: true},
    type: 'KILL_JOB',
    job_uid,
    pid
  }
}

export function server_shutdown(job_uid, pid) {
  return {
    meta: {remote: true},
    type: 'SERVER_SHUTDOWN',
  }
}
