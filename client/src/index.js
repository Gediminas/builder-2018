import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import {createStore, applyMiddleware} from 'redux'
import {Provider} from 'react-redux'
import io from 'socket.io-client'
import reducer from './reducer'
import {set_state, set_connection_state} from './action_creators'
import remoteActionMiddleware from './remote_action_middleware'
import {BuilderContainer} from './components/Main/Builder'
import {LogViewerContainer} from './components/LogViewer/LogViewer'
import {ConnectionStateContainer} from './components/common/ConnectionState'


require('./style.css')
const cfg = require('../../_cfg/config.json')
console.log(cfg)
console.log(cfg.server_address)
console.log(cfg.server_port)


//const socket = io(`${location.protocol}//${location.hostname}:8090`)
const socket = io(cfg.server_address + ':' + cfg.server_port)

const createStoreWithMiddleware = applyMiddleware(
  remoteActionMiddleware(socket)
)(createStore)
const store = createStoreWithMiddleware(reducer)

let connection_events = [
  'connect',
  'connect_error',
  'connect_timeout',
  'reconnect',
  'reconnecting',
  'reconnect_error',
  'reconnect_failed'
]
connection_events.forEach(ev =>
  socket.on(ev, () => store.dispatch(set_connection_state(ev, socket.connected)))
)

socket.on('state', state => {
  const actionSetState = set_state(state)
  store.dispatch(actionSetState)
})

function onShutdownClick() {
  socket.emit('sys_shutdown')
}

ReactDOM.render((
  <Provider store={store}>
  <div>
    <ConnectionStateContainer />
    <div id='div_debug'>
      <button id='btn_sys_shutdown' type='button' onClick={onShutdownClick}>SHUTDOWN</button>
    </div>
    <BrowserRouter> 
      <Switch>
        <Route exact path='/'                       component={BuilderContainer} />
        <Route exact path='/log/:prod_id/:task_uid?' component={LogViewerContainer} />
      </Switch>
    </BrowserRouter>
  </div>
  </Provider>
), document.getElementById('root'))

