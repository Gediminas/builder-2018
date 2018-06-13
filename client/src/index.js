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
import Gun from 'gun/gun'

require('./style.css')
const cfg = require('../../_cfg/config.json')
console.log('CFG:', cfg)
console.log(`Socket-Address: ${cfg.server_address}:${cfg.server_port}`)

//const socket = io(`${location.protocol}//${location.hostname}:8090`)
const socket = io(cfg.server_address + ':' + cfg.server_port)

console.log('=========');
var gun = Gun(cfg.server_address + ':' + cfg.gun_port + '/gun')
console.log('Client started on ' + cfg.server_address + ':' + cfg.gun_port + '/gun');
gun.get('key').map().on(data => console.log('key received' + data))

console.log('=========');

const createStoreWithMiddleware = applyMiddleware(
  remoteActionMiddleware(gun)
)(createStore)
const store = createStoreWithMiddleware(reducer)

gun.on('hi', peer => store.dispatch(set_connection_state(`database connected ${peer.id}`, true)))
gun.on('bye', peer => store.dispatch(set_connection_state(`database offline ${peer.id}`, false)))

gun.get('state').map().on((data, key) => {
  switch (key) {
  case 'core':
    let state = JSON.parse(data)
    console.log('on GUN state: ', state)
    state.debug = 'aaaaaaaaaaaaa'
    const actionSetState = set_state(state)
    store.dispatch(actionSetState)
    break
  default:
    console.log('on GUN state: ', key, data)
    break
  }
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
        <Route exact path='/log/:prod_id/:job_uid?' component={LogViewerContainer} />
      </Switch>
    </BrowserRouter>
  </div>
  </Provider>
), document.getElementById('root'))

