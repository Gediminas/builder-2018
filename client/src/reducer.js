import { Map } from 'immutable'

const setConnectionState = (state, connectionState, connected) => {
    state.set('connection', Map({
        state: connectionState,
        connected,
    }))
}


const setState = (state, newState) => state.merge(newState)
const addTask = state => state
const killTask = state => state

export { addTask, killTask }

export default function (state = Map(), action) {
    switch (action.type) {
    case 'SET_CONNECTION_STATE':
        return setConnectionState(state, action.state, action.connected)
    case 'SET_STATE':
        return setState(state, action.state)
    case 'ADD_TASK':
        return addTask(state, action.product_id)
    case 'KILL_TASK':
        return killTask(state, action.task_uid, action.pid)
    default:
        break
    }
    return state
}

