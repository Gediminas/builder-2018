const glob = require('glob')
const path = require('path')
const fs = require('fs')
const merge = require('merge')
const pool = require('./pool.js')
require('colors')
const poolExecImpl = require('./pool-core-exe.js')
require('./pool-core-sys.js')

const db = require('./db_history.js')
require('./pool-history.js')
require('./pool-tty.js')
require('./pool-log.js')
require('./pool-gui.js')

const cfgApp = require('../../_cfg/config.js')
const cfgDef = require('../../_cfg/script_defaults.json')

if (!path.isAbsolute(cfgApp.script_dir)) {
  cfgApp.script_dir  = path.normalize(`${__dirname}/../../${cfgApp.script_dir}`)
}

if (!path.isAbsolute(cfgApp.working_dir)) {
  cfgApp.working_dir  = path.normalize(`${__dirname}/../../${cfgApp.working_dir}`)
}

const load_cfg = (script_dir, product_id) => {
  const cfgPath = path.normalize(script_dir + product_id + '/script.cfg')
  const srvPath = path.normalize(script_dir + product_id + '/server.cfg')
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  const srv = JSON.parse(fs.readFileSync(srvPath, 'utf8'))
  const mrg = merge.recursive(true, cfgDef, cfg, srv)
  if (!mrg.product_name) {
    mrg.product_name = product_id
  }
  return mrg
}

const loadProducts = (script_dir, on_loaded) => {
  glob('*/index.*', { cwd: script_dir, matchBase: 1 }, (err, files) => {
    if (err) {
      return
    }
    let products = files.map((file) => {
      const product_id = path.dirname(file)
      const cfg = load_cfg(script_dir, product_id)
      const script_js   = script_dir + file
      return {
        product_id,
        product_name: cfg.product_name,
        cfg,
        interpreter    : 'node',
        script_path    : script_js,
      }
    })
    on_loaded(products)
  })
}

console.log('')
console.log('')
console.log('----------------------------------------------------------'.bgBlue)
console.log('----------------------------------------------------------'.bgBlue)
console.log('> CONFIG:'.bgBlue, JSON.stringify(cfgApp, null, 2).bgBlue)
console.log('----------------------------------------------------------'.bgBlue)

loadProducts(cfgApp.script_dir, (products) => {
  pool.initialize(poolExecImpl, products, 2, cfgApp)
})
