const path = require('path')
const cfg = require('../../cfg/config.json')
const cfgDef = require('../../cfg/script_defaults.json')

class LoadCfg {

  loadAppCfg() {
    if (!path.isAbsolute(cfg.script_dir)) {
      cfg.script_dir  = path.normalize(__dirname + '/../' + cfg.script_dir)
    }
    if (!path.isAbsolute(cfg.working_dir)) {
      cfg.working_dir = path.normalize(__dirname + '/../' + cfg.working_dir)
    }
    return cfg
  }

  loadDefCfg() {
    return cfgDef
  }

}

const loadCfg = new LoadCfg()
module.exports = loadCfg
