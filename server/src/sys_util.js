const fs = require('fs');
const moment = require('moment');

exports.get_time_string = () => moment().format('YYYY-MM-DD hh:mm')
exports.to_time_string = timestamp => moment(timestamp).format('YYYY-MM-DD hh:mm')
exports.to_fs_time_string = timestamp => moment(timestamp).format('YYYY-MM-DD_hh-mm-ss_SSS')


exports.log = () => {
  const args = Array.prototype.slice.call(arguments)
  args.unshift('|')
  args.unshift(exports.get_time_string())
  console.log.apply(console, args)
}

exports.script_log = (context) => {
  const args = Array.prototype.slice.call(arguments)
  args.unshift(':')
  args.unshift(context)
  args.unshift('|')
  args.unshift(exports.get_time_string())
  console.log.apply(console, args)
}

exports.ensure_dir = (dirPath) => {
  try {
    fs.mkdirSync(dirPath)
    console.log(`Folder created: ${dirPath}`)
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err
    }
  }
}
