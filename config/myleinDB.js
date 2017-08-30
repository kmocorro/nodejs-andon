var mysql = require('mysql');
var Promise = require('bluebird');


var poolMylein = mysql.createPool({
    connectionLimit: 100,
    host: 'ddolfsb30gea9k.c36ugxkfyi6r.us-west-2.rds.amazonaws.com',
    user    :   'fab4_engineers',
    password:   'Password123',
    database:   'fab4'
});


function getMyleinSqlConnection () {
    return poolMylein.getConnectionAsync().disposer(function(connection){
        connection.release();
    });
}

module.exports = getMyleinSqlConnection;

