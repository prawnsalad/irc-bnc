exports['001'] = function(connection, message) {
	connection.set('nick', message.params[0]);
	connection.set('server_addr', message.prefix);

	connection.user.irc_bus.emit('connection.connected', connection);

	var connect_info = connection.get('connect_info');
	if (connect_info && connect_info.channels) {
		connect_info.channels.forEach(function(channel_name) {
			connection.write('JOIN ' + channel_name);
		});
	}
};



exports['005'] = function(connection, message) {
	var supported = message.params.splice(1);
	var c = connection.get('isupport') || [];
	c.push(supported.join(' '));
	connection.set('isupport', c);
};


exports['372'] = function(connection, message) {
	var c = connection.get('motd') || [];
	c.push(message.params[1]);
	connection.set('motd', c);
};



exports['PING'] = function(connection, message) {
	connection.write('PONG :' + message.params[0]);

	return false;
};


exports['NICK'] = function(connection, message) {
	// If this is our nick, update the connection data
	var parts = message.prefix.match(/([^!@]+)!?([^!@]+)?@?(.+)?/);
	if (parts[1].toLowerCase() === connection.get('nick').toLowerCase()) {
		connection.set('nick', message.params[0]);
	}
}

exports['USER'] = function(connection, message) {
	return false;
}


exports['JOIN'] = function(connection, message) {
	var parts = message.prefix.match(/([^!@]+)!?([^!@]+)?@?(.+)?/);
	if (parts[1].toLowerCase() === connection.get('nick').toLowerCase()) {
		connection.getAddBufferByName(message.params[0]);
	}
};


exports['PRIVMSG'] = exports['NOTICE'] = function(connection, message) {
	// Let CTCPs pass right through to the client without processing
	if (message.params[1].charCodeAt(0) === 1) {
		return;
	}

	var parts = message.prefix.match(/([^!@]+)!?([^!@]+)?@?(.+)?/);
	var buffer_name = '';

	if (message.params[0].toLowerCase() === connection.get('nick').toLowerCase()) {
		buffer_name = parts[1];
	} else {
		buffer_name = message.params[0];
	}

	var buffer = connection.getAddBufferByName(buffer_name);
	buffer.write(message);

	// The buffer instance sends the privmsg down to clients
	return false;
}