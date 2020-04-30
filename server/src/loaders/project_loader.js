const fs = require('fs')
const glob = require('glob')
const path = require('path')
const merge = require('merge')
const configLoader = require('./config_loader.js')

const cfgDef = configLoader.data.script_defaults

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
  glob('*.mxk', { cwd: script_dir, matchBase: 1 }, (err, files) => {
    if (err) {
      return
    }
    const products = files.map((file) => {
      const full_path   = script_dir + file
      return {
        product_id: file,
        product_name: file,
        cfg: {},
        interpreter : 'notepad',
        script_path : full_path,
      }
    })
    on_loaded(products)
  })
}

module.exports = loadProducts
