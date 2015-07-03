var _ = require('lodash');


/**
 * Context = interface
 */



exports['RECONNECT'] = function(message) {
	if (this.irc_con) {
		this.irc_con.connect();
	}

	return false;
};


exports['PASS'] = function(message) {
	var self = this;

	// Matching against 'user/network:pass' which may or may not contain
	// the network
	var parts = message.params[0].match(/([^\/:]+)\/?([^\/:]+)?:?(.+)?/);
	var username = parts[1];
	var network = parts[2];
	var password = parts[3];

	self.client.authUser(username, password).then(function(user) {
		user.addClient(self.client);

		// TODO: If network is undefined, attach an admin console instead of a
		// network here. Admin console is to manage networks via an IRC client

		var con = _.find(self.user.connections, function(con) {
			var connect_info = con.get('connect_info');
			return connect_info.server.toLowerCase() == network.toLowerCase();
		});

		if (con) {
			self.setIrcConnection(con);
			self.syncClient();

		} else {
			con = user.addConnection();
			con.connect({server: network, port: 6667});
			//self.client.write(':*bnc PRIVMSG *status :Connecting to ' + message.params[0] + '..');
			self.say('Connecting to ' + message.params[0] + '..');

			self.setIrcConnection(con);
		}

	}).catch(function(err) {
		if (err === 'invalid_password') {
			//self.client.write('PRIVMSG *status :Invalid password');
			self.say('Invalid password');
		} else {
			//self.client.write('PRIVMSG *status :Could not find user');
			self.say('Could not find user');
		}

		err.stack && console.error(err.stack);
	}).catch(function(err) {
		console.error(err.stack ? err.stack : err);
	});

	return false;
};


exports['PING'] = function(message) {
	this.client.write('PONG :' + message.params[0]);
	return false;
};


exports['QUIT'] = function(message) {
	// TODO: Set client as away if no other clients are connected?
	return false;
};


exports['NICK'] = function(message) {
	this.client.nick = message.params[0];
};


exports['DUMP'] = function(message) {
	this.say(JSON.stringify(this.irc_con.data));
	return false;
};


exports['PRIVMSG'] = exports['NOTICE'] = function(message) {
	this.irc_con.write(message.raw);

	// Don't log or send CTCPs to other connected clients
	if (message.isCtcp()) {
		return;
	}


	message.prefix = this.irc_con.userMask();
	message.raw = message.buildLine();

	var buffer = this.irc_con.getAddBufferByName(message.params[0]);
	buffer.write(message, {from_client: this.client});

	return false;
};
