const pool = require('./pool.js')
const poolExecImpl = require('./pool-core-exe.js')
require('./pool-core-sys.js')
require('./pool-history.js')
require('./pool-tty.js')
require('./pool-log.js')
require('./pool-gui.js')
require('colors')

const productLoader = require('./loaders/product_loader.js')
const configLoader = require('./loaders/config_loader.js')

const cfgApp = configLoader.loadAppCfg()

console.log('')
console.log('')
console.log('----------------------------------------------------------'.bgBlue)
console.log('----------------------------------------------------------'.bgBlue)
console.log('> CONFIG:'.bgBlue, JSON.stringify(cfgApp, null, 2).bgBlue)
console.log('----------------------------------------------------------'.bgBlue)

productLoader(cfgApp.script_dir, (products) => {
  pool.initialize(poolExecImpl, products, cfgApp)
})
