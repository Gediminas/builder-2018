import {Map} from 'immutable'

function set_connection_state(state, connectionState, connected) {
  console.log('reducer: set_connection_state')
  return state.set('connection', Map({
    state: connectionState,
    connected
  }))
}

function set_state(state, newState) {
  console.log('reducer: set_state')
  return state.merge(newState)
}

export function add_job(state, entry) {
  console.log('reducer: add_job')
  return state
}

export function kill_job(state, entry) {
  console.log('reducer: kill_job')
  return state
}

export function server_shutdown(state, entry) {
  console.log('reducer: server_shutdown')
  return state
}

export default function(state = Map(), action) {
  console.log('reducer: switch')
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
