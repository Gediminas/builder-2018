const fs = require('fs');
const moment = require('moment');

exports.get_time_string = () => moment().format('YYYY-MM-DD HH:mm:ss')
exports.to_time_string = timestamp => moment(timestamp).format('YYYY-MM-DD HH:mm:ss')
exports.to_fs_time_string = timestamp => moment(timestamp).format('YYYY-MM-DD_HH-mm-ss_SSS')


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
