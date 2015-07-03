var express = require('express');
var csurf = require('csurf');
var User = require('../../src/user');

var router = module.exports = express.Router();


// AIM: function that calls csrf() middleware and then our own middleware to check for
//      any of the errors
var csrf = csurf();
var csrfCheck = csrf; /*function(req, res, next) {
	csrf(req, res, function(err) {
		if (err.code !== 'EBADCSRFTOKEN') return next(err)

		// handle CSRF token errors here
		res.status(403)
		res.send('form tampered with')
	});
};


function csrfGenToken (req) {
	req.session. =
}
var csrfCheck = function(req, res, next) {
	req.csrfToken = csrfGenToken();
});
*/


function authUser(req, res, next) {
	if (!req.session.user_id) {
		req.session.auth_redirect_to = req.url;
		return res.redirect('/login');
		//throw new Error('Not authorised');
	}

	User.fromId(req.session.user_id).then(function(user) {
		req.user = user;
		next();
	}).catch(next);
}


router.get('/', function(req, res) {
  res.send('Hello World!');
});

router.get('/login', csrfCheck, function(req, res) {
	res.render('login', {csrf: req.csrfToken()});
});

router.post('/login', csrfCheck, function(req, res) {
	//res.send(JSON.stringify(req.query));
	User.fromAuth(req.body.user, req.body.password).then(function(user) {
		req.session.user_id = user.get('id');

		var redirect_to = '/account';

		if (req.session.auth_redirect_to) {
			redirect_to = req.session.auth_redirect_to;
			delete req.session.auth_redirect_to;
		}

		res.redirect(redirect_to);

	}).catch(function(err) {
		console.log('failed to log in via web', err.stack);
		res.redirect('/login?err=invalid_login');
	});
});

router.get('/account', authUser, csrfCheck, function(req, res) {
	var user = req.user;
	var data = {};
	data.csrf = req.csrfToken();
	data.user = {
		username: user.get('name')
	};

	data.connections = [];
	user.connections.map(function(connection) {
		data.connections.push({
			id: connection.get('id'),
			connected: connection.connected,
			connect_info: connection.get('connect_info')
		});
	});

	res.render('account', data);
});

router.post('/account/networks', authUser, csrfCheck, function(req, res) {
	if (!req.body.name || !req.body.server) {
		return res.redirect('/account');
	}

	var user = req.user;

	var con = user.addConnection({
		nick: req.body.nick || 'bncuser',
		server: req.body.server,
		port: parseInt(req.body.port, 10) || 6667,
		channels: req.body.channels.split(',').map(function(chan) { return chan.trim(); })
	});

	global.db.saveUser(user);
	return res.redirect('/account');
});

router.post('/account/network/control', authUser, function(req, res) {
	if (!req.body.connection || !req.body.act) {
		return res.redirect('/account');
	}

	var user = req.user;

	var con = user.getConnection(parseInt(req.body.connection, 10));
	if (!con) {
		return res.redirect('/account?err=invalid_connection');
	}

	if (req.body.act === 'connect') {
		con.connect();
	}

	return res.redirect('/account');
});