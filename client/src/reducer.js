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

export function add_task(state, entry) {
    return state
}

export function kill_task(state, entry) {
  return state
}

export function request_log(state, entry/*, task_uid*/) {
  return state
  // return state.set('logs', Map({
  //   task_uid: {
  //     fetching: true,
  //   }
  // }))
}

export default function(state = Map(), action) {
    switch (action.type) {
    case 'SET_CONNECTION_STATE':
        return set_connection_state(state, action.state, action.connected)
    case 'SET_STATE':
        return set_state(state, action.state)
    case 'ADD_TASK':
        return add_task(state, action.product_id)
    case 'KILL_TASK':
      return kill_task(state, action.task_uid, action.pid)
    case 'REQUEST-LOG':
      return request_log(state, action.task_uid)
    default:
        break
    }
    return state
}
