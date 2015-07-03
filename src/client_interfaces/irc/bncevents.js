/**
 * Context = interface
 */


exports['connection.connecting'] = function(connection) {
	this.say('Connecting to ' + connection.get('connect_info').server + '..');
};

exports['connection.connected'] = function(connection) {
	this.say('Connected to ' + connection.get('connect_info').server);
};


exports['connection.message'] = function(connection, message, opts) {
	// If this came from this client, don't send it back
	if (opts && opts.from_client === this.client) {
		return;
	}

	if (message.command.toUpperCase() === 'NICK') {
		this.client.nick = message.params[0];
	}

	if (connection === this.irc_con) {
		this.client.write(message.raw);
	}
};



exports['user.newclient'] = function(client) {
	if (client !== this.client) {
		//this.client.write(':*bnc PRIVMSG *status :Another connection to your account has been made');
		this.say('Another connection to your account has been made');
	}
};