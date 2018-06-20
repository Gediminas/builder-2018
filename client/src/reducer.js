import {Map} from 'immutable'

function set_connection_state(state, connectionState, connected) {
  return state.set('connection', Map({
    state: connectionState,
    connected
  }))
}

function set_state(state, newState) {
  return state.merge(newState)
}

export function add_job(state, entry) {
    return state
}

export function kill_job(state, entry) {
  return state
}

export function server_shutdown(state, entry) {
    return state
}

export default function(state = Map(), action) {
  switch (action.type) {
  case 'SET_CONNECTION_STATE':
    return set_connection_state(state, action.state, action.connected)
  case 'SET_STATE':
    return set_state(state, action.state)
  case 'ADD_JOB':
    return add_job(state, action.product_id)
  case 'KILL_JOB':
    return kill_job(state)
  case 'SERVER_SHUTDOWN':
    return server_shutdown(state)
  default:
    break
  }
  return state
}
