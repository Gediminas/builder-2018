const pool = require('./pool.js')
require('./pool-core-sys.js')
require('./pool-tty.js')
require('./pool-socket.js')
require('colors')

const projectLoader = require('./loaders/project_loader.js')
const configLoader = require('./loaders/config_loader.js')

const cfgApp = configLoader.data.appConfig

console.log('')
console.log('')
console.log('----------------------------------------------------------'.blue)
console.log('----------------------------------------------------------'.blue)
console.log('> CONFIG:'.blue, JSON.stringify(cfgApp, null, 2).blue)
console.log('----------------------------------------------------------'.blue)

console.log('projects loading')
projectLoader(cfgApp, (projects) => {
  console.log('projects loaded')
  pool.initialize(projects, cfgApp)
})
