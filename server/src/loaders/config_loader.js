const path = require('path')
const config = require('../../../_data/Config/config.json')

class ConfigLoader {
  init() {
    this.data = {}
    this.data.appConfig = config

    if (!path.isAbsolute(this.data.appConfig.script_dir)) {
      this.data.appConfig.script_dir =
        path.normalize(__dirname + '/../../' + this.data.appConfig.script_dir)
    }
    if (!path.isAbsolute(this.data.appConfig.working_dir)) {
      this.data.appConfig.working_dir =
        path.normalize(__dirname + '/../../' + this.data.appConfig.working_dir)
    }
  }
}

const configLoader = new ConfigLoader()
configLoader.init()
module.exports = configLoader
