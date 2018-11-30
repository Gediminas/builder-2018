const socketio = require('socket.io')
const sys = require('./sys_util.js')
const script = require('./script_util.js')
const db = require('./builder_db_utils.js')
const pool = require('./pool.js')
require('colors')
require('./pool_logger_tty.js')

const app_cfg = script.load_app_cfg()
const io = socketio(app_cfg.server_port)


sys.ensure_dir(app_cfg.script_dir)
sys.ensure_dir(app_cfg.working_dir)
sys.ensure_dir(app_cfg.db_dir)

console.log('------------------------------------------------------------'.bgBlue)
console.log('config:'.bgBlue, JSON.stringify(app_cfg, null, 2).bgBlue)
console.log(`Socket server starting on port: ${app_cfg.server_port}`.bgBlue)
console.log('------------------------------------------------------------'.bgBlue)

const Update_Products =  1 // 000001
const Update_Tasks =  2 // 000010
const Update_History =  4 // 000100
const Update_ALL = 63 // 111111

let emit_state = function(state, client_socket) {
    if (!client_socket) {
        io.emit('state', state)
    }
    else {
        client_socket.emit('state', state)
    }
}

let update_client = function(update_flags, client_socket) {
    if ((update_flags & Update_Products) != 0) {
        script.get_products((products) => {
            var state = {}
            state['products'] = products
            emit_state(state, client_socket)
        });
    }
    var state = {}
    if ((update_flags & Update_History) != 0) {
        var show_history_limit = app_cfg.show_history_limit
        var htasks = db.get_history(show_history_limit)
        state['htasks'] = htasks
    }
    if ((update_flags & Update_Tasks) != 0) {
        var tasks = pool.allTasks()
        state['tasks'] = tasks
    }
    if (Object.keys(state).length !== 0) {
        //console.log('direct')
        emit_state(state, client_socket)
    }
}

io.on('connection', function(socket){
    sys.log(`Client connected: ${socket.conn.remoteAddress}`.bgBlue)

    update_client(Update_ALL, socket)

    socket.on('task_add', function(data){
        //script.addTask(data.product_id, "user comment");
        //update_client(Update_Products | Update_Tasks, socket)
        pool.addTask(data.product_id, "user comment")
    });

    socket.on('task_kill', function(data){
        pool.dropTask(data.task_uid)
    });

    socket.on('sys_shutdown', function(data){
        sys.log("Stoping cron tasks...")
        script.destroy_all()
        
        setTimeout(() => {
            sys.log("Exit.")
            process.exit(0)
        }, 100)
    });
});

// pool =====================================================

function generate_log_name(log_combi) {
    let name = log_combi.reduce((cobined_name, sub_nr) => {
        let sub_txt = sub_nr.pad(3)
        if (!cobined_name) {
            cobined_name = sub_txt
        }
        else {
            cobined_name = cobined_name + '-' + sub_txt
        }
        return cobined_name
    }, false)
    if (name == '') {
        name = '_main'
    }
    name = name + '.log'
    return name
}

db.init(app_cfg.db_dir).then(() => {

    pool.on('initialized', (data) => {
        update_client(Update_Products | Update_Tasks); //because task was added
    })

    pool.on('taskAdded', (data) => {
        let product_id = data.task.product_id
        let cfg      = script.load_cfg(product_id)
        let last_task = db.findLast_history({"$and": [{ "product_id" : product_id},{"data.status": "OK"}]})
        if (!last_task) {
            last_task = db.findLast_history({"$and": [{ "product_id" : product_id},{"data.status": "WARNING"}]})
        }
        if (!last_task) {
            last_task = db.findLast_history({ "product_id" : product_id})
        }
        //console.log(last_task);
        let data1 = {
            product_name:   cfg.product_name,
            comment:        'comment',
            status:         'QUEUED',
            pid:            0,
            prev_time_diff: last_task ? last_task.time_diff : undefined
        };
        data.task.data = data1

        //FIXME: Should be moved to taskStarting() or similar
        let app_cfg     = script.load_app_cfg()
        let script_js   = app_cfg.script_dir + product_id + '/index.js'
        let product_dir = app_cfg.working_dir + product_id + '/'
        // console.log(product_dir.bgGray);
        let working_dir = product_dir + sys.to_fs_time_string(data.task.time_add) + '/' //FIXME: task.time_start

        sys.ensure_dir(product_dir)
        sys.ensure_dir(working_dir)

        data.task.exec = {
            method   : 'execFile',
            file     : 'node',
            args     : [script_js],
            options  : { cwd: working_dir },
            callback : null,
        }
        //END FIXME
        update_client(Update_Products | Update_Tasks)
    })

    pool.on('taskStarted', (data) => {
        data.task.data.pid    = data.task.exec.pid
        data.task.data.status = 'WORKING'
    });

    var title_renamed = ''
    let log_combi = []
    let log_combi_last_sub = 0
    let sub = 0;

    pool.on('taskOutput', (data) => {
        update_client(Update_Tasks)
    })

    pool.on('taskOutputError', (data) => {
        update_client(Update_Tasks)
    })

    pool.on('taskCompleted', (data) => {
        if (data.task.status == 'halted') {
            data.task.data.status = 'HALTED';
        }
        else if (data.task.status == 'finished') {
            switch (data.task.exec.exitCode) {
            case 0:	 data.task.data.status = "OK";      break;
            case 1:	 data.task.data.status = "WARNING"; break;
            case 2:	 data.task.data.status = "ERROR";   break;
            case 3:	 data.task.data.status = "HALT";    break;
            default: data.task.data.status = "N/A";     break;
            }
        }
        else {
            data.task.data.status = `(${data.task.status})`
        }
        db.add_history(data.task)
        setImmediate(() => update_client(Update_ALL))

    })

    pool.initialize(2)
})

