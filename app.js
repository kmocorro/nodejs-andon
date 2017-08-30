var express = require('express');
var app = express();
var apiController = require('./controllers/apiController');

var port = process.env.PORT || 1800;

app.use('/', express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

apiController(app);

app.listen(port);

