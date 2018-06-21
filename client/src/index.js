import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import {createStore, applyMiddleware} from 'redux'
import {Provider} from 'react-redux'
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

const gun = Gun(cfg.server_address + ':' + cfg.gun_port + '/gun')

console.log('Client started on ' + cfg.server_address + ':' + cfg.gun_port + '/gun');
console.log('=========');

const createStoreWithMiddleware = applyMiddleware(
  remoteActionMiddleware(gun)
)(createStore)
const store = createStoreWithMiddleware(reducer)

gun.on('hi', peer => store.dispatch(set_connection_state(`database connected ${peer.id}`, true)))
gun.on('bye', peer => store.dispatch(set_connection_state(`database offline ${peer.id}`, false)))

gun.get('state').map().on((data, key) => {
  if (!data) {
    console.log('on GUN NULL: ', key)
    return
  }
  switch (key) {
  case 'products':
    {
      let products = JSON.parse(data)
      console.log('on GUN products: ', products)
      let state = { 'products': products }
      let actionSetState = set_state(state)
      store.dispatch(actionSetState)
    }
    break
  case 'jobs':
    {
      let jobs = JSON.parse(data)
      console.log('on GUN jobs: ', jobs)
      let state = { 'jobs': jobs }
      let actionSetState = set_state(state)
      store.dispatch(actionSetState)
    }
    break
  case 'hjobs':
    {
      let hjobs = JSON.parse(data)
      console.log('on GUN hjobs: ', hjobs)
      let state = { 'hjobs': hjobs }
      let actionSetState = set_state(state)
      store.dispatch(actionSetState)
    }
    break
  default:
    console.log('on GUN uncaught: ', key, data)
    break
  }
})

/* function onShutdownClick() {
 *   gun.get('actions').set({'action': 'sys_shutdown'})
 * }
 * */
function server_shutdown() {
  console.log('SERVER_SHUTDOWN')
  gun.get('actions').put({
    action: 'server_shutdown',
  })
}

ReactDOM.render((
  <Provider store={store}>
  <div>
    <ConnectionStateContainer />
    <div id='div_debug'>
      <button id='btn_sys_shutdown' type='button' onClick={server_shutdown}>SHUTDOWN</button>
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

