export function set_connection_state(state, connected) {
  return {
    type: 'SET_CONNECTION_STATE',
    state,
    connected,
  }
}
export function set_state(state) {
  return {
    type: 'SET_STATE',
    state,
  }
}

export function add_task(product_id) {
  return {
    meta: {remote: true},
    type: 'ADD_TASK',
    product_id,
  }
}

export function kill_task(task_uid, pid) {
  return {
    meta: {remote: true},
    type: 'KILL_TASK',
    task_uid,
    pid,
  }
}

export function request_log(task_uid) {
  return {
    meta: {remote: true},
    type: 'REQUEST-LOG',
    task_uid,
  }
}
