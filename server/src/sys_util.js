const fs = require('fs');
const moment = require('moment');

exports.timeToString = timestamp => moment(timestamp)
  .format('YYYY-MM-DD HH:mm:ss')

exports.timeToDir = timestamp => moment(timestamp)
  .format('YYYY-MM-DD_HH-mm-ss_SSS')


exports.ensureDir = (dirPath) => {
  try {
    fs.mkdirSync(dirPath)
    console.log(`Folder created: ${dirPath}`)
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err
    }
  }
}
