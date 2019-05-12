const pool = require('./pool.js')
const poolExecImpl = require('./pool-core-exe.js')
require('./pool-core-sys.js')
require('./pool-history.js')
require('./pool-tty.js')
require('./pool-log.js')
require('./pool-gui.js')

const db = require('./db_history.js')
const loadProducts = require('./load-products.js')
const LoadCfg = require('./load-cfg.js')

require('colors')

const cfgApp = LoadCfg.loadAppCfg()


console.log('')
console.log('')
console.log('----------------------------------------------------------'.bgBlue)
console.log('----------------------------------------------------------'.bgBlue)
console.log('> CONFIG:'.bgBlue, JSON.stringify(cfgApp, null, 2).bgBlue)
console.log('----------------------------------------------------------'.bgBlue)

loadProducts(cfgApp.script_dir, (products) => {
  pool.initialize(poolExecImpl, products, 2, cfgApp)
})
