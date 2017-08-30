var bodyParser = require('body-parser');
var fs = require('fs');
var json2csv = require('json2csv');
var moment = require('moment');

var mysql = require('mysql');
var Promise = require('bluebird');
Promise.promisifyAll(mysql);
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);
var getLocalSqlConnection = require('../config/localDB');
var getMyleinSqlConnection = require('../config/myleinDB');
var using = Promise.using;

module.exports = function(app) {

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true}));

    Date.prototype.toJSON = function() {
        return moment(this).format("YYYY-MM-DD");
    }
        //  today today today
        var today = new Date();
        var todayPlus = moment();
        var todayMinus = moment();
        var dateAndtime = new Date();
        var hh = today.getHours();
        var min = today.getMinutes();
        var sec = today.getSeconds();
    
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();
    
            if(dd<10) {
                dd = '0'+dd
            } 
    
            if(mm<10) {
                mm = '0'+mm
            } 

    //  for am shift, and pm to midnight and midnight to am
        today = yyyy + '-' + mm + '-' + dd;
        todayPlusOne = moment(todayPlus).add(1, 'days').format('YYYY-MM-DD');
        todayMinusOne = moment(todayMinus).subtract(1, 'days').format('YYYY-MM-DD');

        dateAndtime = yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + min + ':' + sec;
            
        //  var use for checking AM and PM
        //  using momentjs 
        var checker = moment(dateAndtime, "YYYY-MM-DD h:mm:ss");
        var check_am_start = moment(today + " " + "06:30:00", "YYYY-MM-DD h:mm:ss");
        var check_am_end = moment(today + " " + "18:29:59", "YYYY-MM-DD h:mm:ss");    
            
        var check_pm_start = moment(today + " " + "18:30:00", "YYYY-MM-DD h:mm:ss");
        var check_notyet_midnight = moment(today + " " + "23:59:59", "YYYY-MM-DD h:mm:ss");   
        var check_exact_midnight = moment(today + " " + "00:00:00", "YYYY-MM-DD h:mm:ss");    
        var check_pm_end = moment(today + " " + "06:29:59", "YYYY-MM-DD h:mm:ss" );


    
    app.get('/target', function(req, res){
       
        var targetGG =  new Promise(function(resolve, reject) {
            
            using(getLocalSqlConnection(), function(connection){

                connection.queryAsync({
                    sql: 'SELECT process_id, process_name, SUM(CASE WHEN today_date = CURDATE() AND stime >= "06:30:00" && stime < CURTIME() - INTERVAL 10 MINUTE THEN total_target ELSE 0 END) AS t_target FROM  view_target WHERE process_name = "DAMAGE" UNION ALL SELECT process_id, process_name, SUM(CASE WHEN today_date = CURDATE() AND stime >= "06:30:00" && stime < CURTIME() - INTERVAL 10 MINUTE THEN total_target ELSE 0 END) AS t_target FROM  view_target WHERE process_name = "POLY" '
                }, function(err, results, field) {
                    if (err) return reject(err);

                    var obj = [];

                        for(i = 0; i<results.length; i++) {
                            obj.push({
                                process_id: results[i].process_id,
                                process_name: results[i].process_name,
                                t_target: results[i].t_target
                            });
                        }

                        var GG = {process: obj};

                        resolve(GG);

                    });

                });

        }).catch(function(err){
            return Promise.reject(err);         
        });

        var otherGG = targetGG.then(function(targetGG_results) {

            return new Promise(function(resolve, reject) {

                using(getMyleinSqlConnection(), function(connection){

                    connection.queryAsync({
                        sql: 'SELECT process_id, SUM(out_qty) AS totalOuts FROM MES_OUT_DETAILS WHERE process_id = "DAMAGE" AND	date_time >= CONCAT("' + today + ' "," 06:30:00") AND date_time <= CONCAT("' + today + ' "," 18:29:59")'
                    }, function(err, results, field) {
                        if (err) return reject(err);

                        var processOuts = [];

                            processOuts.push(
                                results[0].totalOuts
                            );

                        var otherGG = {process: processOuts};
                        
                        resolve(otherGG);

                    });

                });

            });

        }).catch(function(err){
            return Promise.reject(err);         
        });
        
        return Promise.join(targetGG, otherGG, function(targetGG_results, otherGG_results){
            var jointArr = [targetGG_results, otherGG_results];

            res.send(jointArr);
        });

    });


}
