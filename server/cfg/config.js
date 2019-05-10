const cfg = {
  "server_address":     "http://localhost",
  "server_port":        "1234",
  "server_access":      "127.0.0.1",
  "show_history_limit": "5",
  "script_dir":         "../_scripts/",
  "working_dir":        "../_working/"
}

if (!path.isAbsolute(cfgApp.script_dir))
  cfg.script_dir  = path.normalize(__dirname + '/' + cfg.script_dir)

if (!path.isAbsolute(cfgApp.working_dir))
  cfg.working_dir = path.normalize(__dirname + '/' + cfg.working_dir)

module.exports = cfg
