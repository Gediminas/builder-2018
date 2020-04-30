const path = require('path')
const config = require('../../../_data/Config/config.json')

class ConfigLoader {
  init() {
    this.data = {}
    this.data.appConfig = config
  }
}

const configLoader = new ConfigLoader()
configLoader.init()
module.exports = configLoader
