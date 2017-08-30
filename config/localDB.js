var mysql = require('mysql');
var Promise = require('bluebird');

var poolLocal = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password:   '2qhls34r',
    database:   'dbtarget'
});

function getLocalSqlConnection () {
    return poolLocal.getConnectionAsync().disposer(function(connection) {
        connection.release();
    });
}

module.exports = getLocalSqlConnection;
