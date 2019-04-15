const Loki = require('lokijs')

let db_history
let tb_history

exports.init = path => new Promise((resolve) => {
  const path_history = `${path}history.json`
  console.log('db: Loading ', path_history)

  db_history = new Loki(path_history, {
    verbose         : true,
    autosave        : true,
    autosaveInterval: 2000,
    // autoload: true,//autoupdate: true //use Object.observe to update objects automatically
  })

  db_history.on('error', (e) => {
    console.log('ERROR: ', e)
  })

  db_history.loadDatabase({}, (result) => {
    tb_history = db_history.getCollection('history')
    if (!tb_history) {
      console.log('db: Creating ', path_history)
      tb_history = db_history.addCollection('history', { autoupdate: true })

      console.log('db: database saving...')
      db_history.saveDatabase(() => {
        console.log('db: database saved...')
      })
    }

    tb_history.on('error', (e) => {
      console.log('ERROR: ', e)
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
