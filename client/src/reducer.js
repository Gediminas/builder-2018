import { Map } from 'immutable'

const set_connection_state(state, connectionState, connected) =>
    state.set('connection', Map({
        state: connectionState,
        connected
    }))


const set_state = (state, newState) => state.merge(newState)
const add_task = (state, entry) => state
const kill_task = (state, entry) => state

export add_task
export kill_task

export default function (state = Map(), action) {
    switch (action.type) {
    case 'SET_CONNECTION_STATE':
        return set_connection_state(state, action.state, action.connected)
    case 'SET_STATE':
        return set_state(state, action.state)
    case 'ADD_TASK':
        return add_task(state, action.product_id)
    case 'KILL_TASK':
        return kill_task(state, action.task_uid, action.pid)
    default:
        break
    }
    return state
}
