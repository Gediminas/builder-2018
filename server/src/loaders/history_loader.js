const Loki = require('lokijs')
require('colors')

let db_history
let tb_history

exports.init = dbPath => new Promise((resolve) => {
  console.log('history-loader: Loading '.blue, dbPath)

  db_history = new Loki(dbPath, {
    verbose         : true,
    autosave        : true,
    autosaveInterval: 2000,
    // autoload: true,//autoupdate: true //use Object.observe to update objects automatically
  })

  db_history.on('error', (e) => {
    console.log('history-loader: ERROR: ', e)
  })

  db_history.loadDatabase({}, (result) => {
    tb_history = db_history.getCollection('history')
    if (!tb_history) {
      console.log('history-loader: Creating '.blue, dbPath)
      tb_history = db_history.addCollection('history', { autoupdate: true })

      console.log('history-loader: Database saving...'.blue)
      db_history.saveDatabase(() => {
        console.log('history-loader: Database saved...'.blue)
      })
    }

    tb_history.on('error', (e) => {
      console.log('history-loader: ERROR: ', e)
    })

    resolve()
  })
})

exports.add_history = (data) => {
  const task = tb_history.insert(data)
  task.id = task.$loki
}

exports.get_history = (limit) => {
  if (limit) {
    return tb_history.chain().simplesort('$loki', true).limit(limit).data()
  }
  return tb_history.chain().simplesort('$loki', true).data()
}

exports.findLast_history = (query) => {
  // return tb_history.chain().find(query).limit(1).data()
  // const res = tb_history.chain().find(query).limit(1).data()[0]
  // const res = tb_history.findOne(query)
  // const res = tb_history.chain().simplesort('id', false).find(query, true).data()[0]
  const res = tb_history.chain().find(query).simplesort('$loki', { desc: true })
    .limit(1)
    .data()[0]
  // console.log(res)
  return res
}
