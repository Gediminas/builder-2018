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
    mrg.project_name = id
  }
  return mrg
}

const loadProjects = (cfg, on_loaded) => {
  glob('*.*', { cwd: cfg.project_dir, matchBase: 1 }, (err, files) => {
    if (err) {
      return
    }
    const projects = files.map((fname) => {
      let fpath  = path.resolve(cfg.project_dir + fname)
      let fext   = path.extname(fname)
      let params = cfg.launch[fext];
      if (!params) {
        console.log("ERROR: not supported extension", fext);
        return false;
      }
      let fixed_args = params.args.map((arg) => {
        if (arg === "<prj>")
          return fpath
        return arg
      })
      //console.log(fpath, fixed_args)
      return {
        id:           fpath,
        project_name: fpath,
        exe : params.exe,
        args: fixed_args,
        cfg: {},
      }
    })
    on_loaded(projects)
  })
}

module.exports = loadProjects
