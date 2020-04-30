const fs = require('fs')
const glob = require('glob')
const path = require('path')
const merge = require('merge')
const configLoader = require('./config_loader.js')

const cfgDef = configLoader.data.script_defaults

const load_cfg = (script_dir, project_id) => {
  const cfgPath = path.normalize(script_dir + project_id + '/script.cfg')
  const srvPath = path.normalize(script_dir + project_id + '/server.cfg')
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  const srv = JSON.parse(fs.readFileSync(srvPath, 'utf8'))
  const mrg = merge.recursive(true, cfgDef, cfg, srv)
  if (!mrg.project_name) {
    mrg.project_name = project_id
  }
  return mrg
}

const loadProjects = (script_dir, on_loaded) => {
  glob('*.mxk*', { cwd: script_dir, matchBase: 1 }, (err, files) => {
    if (err) {
      return
    }
    const projects = files.map((file) => {
      const full_path   = script_dir + file
      return {
        id: full_path,
        project_name: full_path,
        cfg: {},

        //exe : 'notepad',
        //args: [full_path],

        exe : 'd:\\mx\\m\\bin\\MatrixKozijnD.exe',
        args: ["-m", "-o", full_path, "-e", "d:\\mx\\port.txt"],
      }
    })
    on_loaded(projects)
  })
}

module.exports = loadProjects
