var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var csurf = require('csurf');


exports.start = startModule;
exports.unload = unloadModule;



var app, server;



function startModule() {

	var app = express();
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');

	app.use('/', express.static(__dirname + '/public_http'));
	// parse application/x-www-form-urlencoded
	app.use(bodyParser.urlencoded({ extended: false }))
	// parse application/json
	//app.use(bodyParser.json())

	app.use(session({
	  secret: 'efepifheprf',
	  resave: false,
	  saveUninitialized: true
	}));

	// Don't want the checking here. Just to provide the .csrfToken() function on the request object
	//app.use(csurf({ignoreMethod: ['GET', 'POST']}));

	app.use('/', require('./routes'));

	server = app.listen(3000, function () {
	  var host = server.address().address;
	  var port = server.address().port;
	  console.log('Webadmin listening at http://%s:%s', host, port);
	});
}



function unloadModule() {
	server && server.end();
	server = null;
}