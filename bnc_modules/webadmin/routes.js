var _ = require('lodash');
var express = require('express');
var csurf = require('csurf');
var User = require('../../src/user');

var router = module.exports = express.Router();
var csrfCheck = csurf();

// User auth middleware
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


function authUserAdmin(req, res, next) {
	// TODO: Actually check for an admin role here
	return authUser(req, res, next);
}



router.get('/', function(req, res) {
  res.send('Hello World!');
});



router.get('/login', csrfCheck, function(req, res) {
	res.render('login', {csrf: req.csrfToken()});
});



router.post('/login', csrfCheck, function(req, res) {
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



router.post('/logout', authUser, csrfCheck, function(req, res) {
	delete req.session.user_id;
	res.redirect('/login');
});



/**
* Admin related routes
*/

router.get('/admin', authUserAdmin, csrfCheck, function(req, res) {
	global.storage.get('users').then(function(users) {
		var data = {};
		data.csrf = req.csrfToken();
		data.user = {
			username: req.user.get('name')
		};
		data.users = [];

		_.each(users, function(user_id, username) {
			data.users.push({username: username, id: user_id});
		});

		return res.render('admin', data);
	});
});



router.post('/admin/users', authUserAdmin, csrfCheck, function(req, res) {
	var new_user = new User({
		name: req.body.username,
		password: req.body.password
	});

	global.db.saveUser(new_user).then(function() {
		res.redirect('/admin');
	});
});



/**
* Account related routes
*/
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
			connect_info: connection.get('connect_info'),
			state: connection.state,
			connection: connection
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



router.post('/account/network/control', authUser, csrfCheck, function(req, res) {
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