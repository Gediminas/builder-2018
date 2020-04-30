const pool = require('./pool.js')
require('./pool-core-sys.js')
require('./pool-tty.js')
require('./pool-socket.js')
require('colors')

const productLoader = require('./loaders/project_loader.js')
const configLoader = require('./loaders/config_loader.js')

const cfgApp = configLoader.data.appConfig

console.log('')
console.log('')
console.log('----------------------------------------------------------'.blue)
console.log('----------------------------------------------------------'.blue)
console.log('> CONFIG:'.blue, JSON.stringify(cfgApp, null, 2).blue)
console.log('----------------------------------------------------------'.blue)

console.log('products loading')
productLoader(cfgApp.script_dir, (products) => {
  console.log('products loaded')
  pool.initialize(products, cfgApp)
})
